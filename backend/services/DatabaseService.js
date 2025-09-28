const sqlite3 = require('sqlite3').verbose();
const fs = require('fs').promises;
const path = require('path');

/**
 * Database service for storing price data and scraping logs
 * Uses SQLite for structured data and JSON files for backups
 */
class DatabaseService {
    constructor() {
        this.dbPath = path.join(__dirname, '../../data/prices.db');
        this.dataDir = path.join(__dirname, '../../data');
        this.cacheDir = path.join(__dirname, '../../data/cache');
        this.historyDir = path.join(__dirname, '../../data/history');
        this.db = null;

        this.initializeDirectories();
    }

    /**
     * Translate ingredient from English to local language
     */
    async translateIngredient(englishName, country = 'EE') {
        const result = await this.getQuery(
            `SELECT local_name, local_name_alt FROM product_catalog 
       WHERE LOWER(english_name) = LOWER(?) AND country = ?`,
            [englishName, country]
        );

        return result ? result.local_name : null;
    }

    /**
     * Log translation gap when ingredient can't be translated
     */
    async logTranslationGap(englishIngredient, country = 'EE') {
        await this.runQuery(
            `INSERT OR REPLACE INTO translation_gaps 
       (english_ingredient, country, search_attempts, last_attempted)
       VALUES (?, ?, 
         COALESCE((SELECT search_attempts + 1 FROM translation_gaps WHERE english_ingredient = ? AND country = ?), 1),
         CURRENT_TIMESTAMP)`,
            [englishIngredient, country, englishIngredient, country]
        );
    }

    /**
     * Get translation gaps for frontend display
     */
    async getTranslationGaps(limit = 20) {
        return await this.getAllQuery(
            `SELECT english_ingredient, search_attempts, last_attempted 
       FROM translation_gaps 
       ORDER BY search_attempts DESC, last_attempted DESC 
       LIMIT ?`,
            [limit]
        );
    }

    /**
     * Create necessary directories
     */
    async initializeDirectories() {
        try {
            await fs.mkdir(this.dataDir, { recursive: true });
            await fs.mkdir(this.cacheDir, { recursive: true });
            await fs.mkdir(this.historyDir, { recursive: true });
        } catch (error) {
            console.error('Error creating directories:', error);
        }
    }

    /**
     * Initialize database connection and create tables
     */
    async initialize() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error connecting to SQLite database:', err);
                    reject(err);
                    return;
                }

                console.log('Connected to SQLite database');
                this.createTables()
                    .then(() => resolve())
                    .catch(reject);
            });
        });
    }

    /**
     * Create database tables
     */
    async createTables() {
        const queries = [
            // Store information table
            `CREATE TABLE IF NOT EXISTS stores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        country TEXT NOT NULL,
        base_url TEXT,
        enabled BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

            // Price snapshots table
            `CREATE TABLE IF NOT EXISTS price_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_name TEXT NOT NULL,
        ingredient TEXT NOT NULL,
        normalized_ingredient TEXT,
        price REAL NOT NULL,
        unit TEXT NOT NULL,
        currency TEXT DEFAULT 'EUR',
        country TEXT DEFAULT 'EE',
        in_stock BOOLEAN DEFAULT 1,
        scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        raw_data TEXT,
        source_url TEXT,
        FOREIGN KEY (store_name) REFERENCES stores(name)
      )`,

            // Scraping logs table
            `CREATE TABLE IF NOT EXISTS scrape_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_name TEXT NOT NULL,
        ingredient TEXT,
        success BOOLEAN NOT NULL,
        error_message TEXT,
        response_time_ms INTEGER,
        scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

            // Recipe cache table
            `CREATE TABLE IF NOT EXISTS recipe_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipe_id INTEGER NOT NULL,
        recipe_name TEXT,
        ingredients_json TEXT NOT NULL,
        cost_calculation_json TEXT,
        calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME
      )`,

            // Product catalog for multi-language ingredient translations
            `CREATE TABLE IF NOT EXISTS product_catalog (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        country TEXT NOT NULL DEFAULT 'EE',
        english_name TEXT NOT NULL,
        local_name TEXT,
        local_name_alt TEXT,
        category TEXT,
        typical_weight_g INTEGER,
        avg_price_eur DECIMAL(10,2),
        unit_type TEXT,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

            // Translation gaps tracking
            `CREATE TABLE IF NOT EXISTS translation_gaps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        english_ingredient TEXT NOT NULL,
        country TEXT DEFAULT 'EE',
        search_attempts INTEGER DEFAULT 1,
        last_attempted DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(english_ingredient, country)
      )`,

            // Parsed ingredients table - stores parsed recipe ingredient data
            `CREATE TABLE IF NOT EXISTS parsed_ingredients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        original_text TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        unit_type TEXT NOT NULL,
        ingredient_name TEXT NOT NULL,
        normalized_quantity REAL NOT NULL,
        normalized_unit TEXT NOT NULL,
        parse_success BOOLEAN DEFAULT 1,
        fallback_used BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

            // Recipe calculations table - stores cost calculations with parsed ingredients
            `CREATE TABLE IF NOT EXISTS recipe_calculations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipe_id TEXT,
        recipe_name TEXT,
        total_cost REAL NOT NULL,
        cost_per_serving REAL NOT NULL,
        servings INTEGER DEFAULT 4,
        currency TEXT DEFAULT 'EUR',
        country TEXT DEFAULT 'EE',
        provider_name TEXT,
        calculation_metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

            // Recipe ingredients mapping table
            `CREATE TABLE IF NOT EXISTS recipe_ingredients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        calculation_id INTEGER NOT NULL,
        parsed_ingredient_id INTEGER NOT NULL,
        ingredient_cost REAL NOT NULL,
        price_per_unit REAL NOT NULL,
        price_unit TEXT NOT NULL,
        source_store TEXT,
        FOREIGN KEY (calculation_id) REFERENCES recipe_calculations(id),
        FOREIGN KEY (parsed_ingredient_id) REFERENCES parsed_ingredients(id)
      )`
        ];

        for (const query of queries) {
            await this.runQuery(query);
        }

        // Insert default stores
        await this.insertDefaultStores();

        // Insert seed product translations
        await this.insertSeedProducts();

        console.log('Database tables created successfully');
    }

    /**
     * Insert default Estonian stores
     */
    async insertDefaultStores() {
        const stores = [
            { name: 'selver', country: 'EE', base_url: 'https://www.selver.ee' },
            { name: 'rimi', country: 'EE', base_url: 'https://www.rimi.ee' },
            { name: 'coop', country: 'EE', base_url: 'https://ecoop.ee' }
        ];

        for (const store of stores) {
            await this.runQuery(
                `INSERT OR IGNORE INTO stores (name, country, base_url) VALUES (?, ?, ?)`,
                [store.name, store.country, store.base_url]
            );
        }
    }

    /**
     * Insert seed product data for Estonian translations
     */
    async insertSeedProducts() {
        const products = [
            { english: 'beef', estonian: 'veiseliha', category: 'meat', weight: 1000, price: 12.99, unit: 'kg' },
            { english: 'chicken', estonian: 'kana', category: 'meat', weight: 1000, price: 6.99, unit: 'kg' },
            { english: 'pork', estonian: 'sealiha', category: 'meat', weight: 1000, price: 8.49, unit: 'kg' },
            { english: 'milk', estonian: 'piim', category: 'dairy', weight: 1000, price: 1.29, unit: 'liter' },
            { english: 'bread', estonian: 'leib', category: 'bakery', weight: 500, price: 1.89, unit: 'loaf' },
            { english: 'butter', estonian: 'või', category: 'dairy', weight: 500, price: 3.49, unit: '500g' },
            { english: 'cheese', estonian: 'juust', category: 'dairy', weight: 1000, price: 9.99, unit: 'kg' },
            { english: 'eggs', estonian: 'munad', category: 'dairy', weight: 600, price: 2.79, unit: '10pcs' },
            { english: 'potatoes', estonian: 'kartulid', category: 'vegetables', weight: 1000, price: 1.49, unit: 'kg' },
            { english: 'tomatoes', estonian: 'tomatid', category: 'vegetables', weight: 1000, price: 3.99, unit: 'kg' },
            { english: 'onions', estonian: 'sibulad', category: 'vegetables', weight: 1000, price: 1.39, unit: 'kg' },
            { english: 'carrots', estonian: 'porgandid', category: 'vegetables', weight: 1000, price: 1.59, unit: 'kg' },
            { english: 'apples', estonian: 'õunad', category: 'fruits', weight: 1000, price: 2.49, unit: 'kg' },
            { english: 'bananas', estonian: 'banaanid', category: 'fruits', weight: 1000, price: 1.99, unit: 'kg' },
            { english: 'flour', estonian: 'jahu', category: 'baking', weight: 1000, price: 1.79, unit: 'kg' },
            { english: 'sugar', estonian: 'suhkur', category: 'baking', weight: 1000, price: 1.69, unit: 'kg' },
            { english: 'rice', estonian: 'riis', category: 'grains', weight: 1000, price: 2.99, unit: 'kg' },
            { english: 'pasta', estonian: 'pasta', category: 'grains', weight: 500, price: 1.99, unit: '500g' },
            { english: 'oil', estonian: 'õli', category: 'cooking', weight: 1000, price: 3.49, unit: 'liter' },
            { english: 'salt', estonian: 'sool', category: 'spices', weight: 1000, price: 0.99, unit: 'kg' }
        ];

        for (const product of products) {
            await this.runQuery(
                `INSERT OR IGNORE INTO product_catalog 
         (english_name, local_name, category, typical_weight_g, avg_price_eur, unit_type)
         VALUES (?, ?, ?, ?, ?, ?)`,
                [product.english, product.estonian, product.category, product.weight, product.price, product.unit]
            );
        }
    }

    /**
     * Run a database query with parameters
     */
    runQuery(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(query, params, function(err) {
                if (err) {
                    console.error('Database query error:', err);
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    /**
     * Get data from database
     */
    getQuery(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(query, params, (err, row) => {
                if (err) {
                    console.error('Database get error:', err);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    /**
     * Get multiple rows from database
     */
    getAllQuery(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(query, params, (err, rows) => {
                if (err) {
                    console.error('Database getAll error:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Store price data from scraping
     */
    async storePriceData(priceData) {
        const {
            storeName,
            ingredient,
            normalizedIngredient,
            price,
            unit,
            currency = 'EUR',
            country = 'EE',
            inStock = true,
            rawData = {},
            sourceUrl = ''
        } = priceData;

        try {
            // Store in database
            const result = await this.runQuery(
                `INSERT INTO price_snapshots 
         (store_name, ingredient, normalized_ingredient, price, unit, currency, country, in_stock, raw_data, source_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    storeName,
                    ingredient,
                    normalizedIngredient,
                    price,
                    unit,
                    currency,
                    country,
                    inStock,
                    JSON.stringify(rawData),
                    sourceUrl
                ]
            );

            // Also save to JSON cache for backup
            await this.saveToCacheFile(storeName, priceData);

            return result;
        } catch (error) {
            console.error('Error storing price data:', error);
            throw error;
        }
    }

    /**
     * Get cached price data for ingredient from specific store
     */
    async getCachedPrice(storeName, ingredient, maxAgeHours = 24) {
        const query = `
      SELECT * FROM price_snapshots 
      WHERE store_name = ? AND (ingredient = ? OR normalized_ingredient = ?)
      AND datetime(scraped_at, '+${maxAgeHours} hours') > datetime('now')
      ORDER BY scraped_at DESC 
      LIMIT 1
    `;

        return await this.getQuery(query, [storeName, ingredient, ingredient]);
    }

    /**
     * Get price history for ingredient
     */
    async getPriceHistory(ingredient, days = 30) {
        const query = `
      SELECT store_name, price, unit, currency, scraped_at
      FROM price_snapshots 
      WHERE ingredient = ? OR normalized_ingredient = ?
      AND datetime(scraped_at) > datetime('now', '-${days} days')
      ORDER BY scraped_at DESC
    `;

        return await this.getAllQuery(query, [ingredient, ingredient]);
    }

    /**
     * Log scraping attempt
     */
    async logScrapeAttempt(storeName, ingredient, success, errorMessage = null, responseTime = null) {
        await this.runQuery(
            `INSERT INTO scrape_logs (store_name, ingredient, success, error_message, response_time_ms)
             VALUES (?, ?, ?, ?, ?)`,
            [storeName, ingredient, success, errorMessage, responseTime]
        );
    }

    /**
     * Get scraping statistics
     */
    async getScrapingStats(hours = 24) {
        const query = `
      SELECT 
        store_name,
        COUNT(*) as total_attempts,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
        AVG(response_time_ms) as avg_response_time
      FROM scrape_logs 
      WHERE datetime(scraped_at) > datetime('now', '-${hours} hours')
      GROUP BY store_name
    `;

        return await this.getAllQuery(query);
    }

    /**
     * Save data to JSON cache file
     */
    async saveToCacheFile(storeName, data) {
        const today = new Date().toISOString().split('T')[0];
        const filename = `${storeName}_${today}.json`;
        const filepath = path.join(this.cacheDir, filename);

        try {
            // Read existing file or create new array
            let existingData = [];
            try {
                const fileContent = await fs.readFile(filepath, 'utf8');
                existingData = JSON.parse(fileContent);
            } catch (err) {
                // File doesn't exist, start with empty array
            }

            // Add new data
            existingData.push({
                ...data,
                timestamp: new Date().toISOString()
            });

            // Write back to file
            await fs.writeFile(filepath, JSON.stringify(existingData, null, 2));
        } catch (error) {
            console.error('Error saving to cache file:', error);
        }
    }

    /**
     * Save daily summary to history
     */
    async saveDailySummary() {
        const today = new Date().toISOString().split('T')[0];

        const summary = await this.getAllQuery(`
      SELECT 
        ingredient,
        store_name,
        AVG(price) as avg_price,
        MIN(price) as min_price,
        MAX(price) as max_price,
        unit,
        currency,
        COUNT(*) as data_points
      FROM price_snapshots 
      WHERE DATE(scraped_at) = ?
      GROUP BY ingredient, store_name, unit, currency
    `, [today]);

        if (summary.length > 0) {
            const filename = `prices_${today}.json`;
            const filepath = path.join(this.historyDir, filename);

            await fs.writeFile(filepath, JSON.stringify({
                date: today,
                summary: summary,
                generated_at: new Date().toISOString()
            }, null, 2));
        }
    }

    /**
     * Store parsed ingredient data
     */
    async storeParsedIngredient(parsedData) {
        return await this.runQuery(
            `INSERT INTO parsed_ingredients (
                original_text, quantity, unit, unit_type, ingredient_name,
                normalized_quantity, normalized_unit, parse_success, fallback_used
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                parsedData.original,
                parsedData.quantity,
                parsedData.unit,
                parsedData.unitType,
                parsedData.ingredient,
                parsedData.normalizedQuantity,
                parsedData.normalizedUnit,
                parsedData.parseSuccess ? 1 : 0,
                parsedData.fallbackUsed ? 1 : 0
            ]
        );
    }

    /**
     * Store recipe calculation with all ingredient data
     */
    async storeRecipeCalculation(calculationData) {
        // Start transaction for data consistency
        await this.runQuery('BEGIN TRANSACTION');

        try {
            // 1. Store main calculation
            const calculationResult = await this.runQuery(
                `INSERT INTO recipe_calculations (
                    recipe_id, recipe_name, total_cost, cost_per_serving,
                    servings, currency, country, provider_name, calculation_metadata
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    calculationData.recipeId || null,
                    calculationData.recipeName || null,
                    calculationData.totalCost,
                    calculationData.costPerServing,
                    calculationData.servings,
                    calculationData.currency,
                    calculationData.country,
                    calculationData.provider,
                    JSON.stringify(calculationData.metadata || {})
                ]
            );

            const calculationId = calculationResult.lastID;

            // 2. Store each ingredient
            for (const ingredient of calculationData.ingredients) {
                // Store parsed ingredient first
                const parsedResult = await this.storeParsedIngredient(ingredient.parsedData);
                const parsedIngredientId = parsedResult.lastID;

                // Store ingredient cost details
                await this.runQuery(
                    `INSERT INTO recipe_ingredients (
                        calculation_id, parsed_ingredient_id, ingredient_cost,
                        price_per_unit, price_unit, source_store
                    ) VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        calculationId,
                        parsedIngredientId,
                        ingredient.cost,
                        ingredient.pricePerUnit,
                        ingredient.priceUnit,
                        ingredient.sourceStore || null
                    ]
                );
            }

            await this.runQuery('COMMIT');
            return calculationId;

        } catch (error) {
            await this.runQuery('ROLLBACK');
            throw error;
        }
    }

    /**
     * Get recipe calculation history
     */
    async getRecipeCalculations(limit = 50) {
        return await this.getAllQuery(
            `SELECT rc.*,
                COUNT(ri.id) as ingredient_count,
                GROUP_CONCAT(pi.ingredient_name) as ingredients
            FROM recipe_calculations rc
            LEFT JOIN recipe_ingredients ri ON rc.id = ri.calculation_id
            LEFT JOIN parsed_ingredients pi ON ri.parsed_ingredient_id = pi.id
            GROUP BY rc.id
            ORDER BY rc.created_at DESC
            LIMIT ?`,
            [limit]
        );
    }

    /**
     * Get detailed calculation by ID
     */
    async getRecipeCalculationDetails(calculationId) {
        const calculation = await this.getQuery(
            `SELECT * FROM recipe_calculations WHERE id = ?`,
            [calculationId]
        );

        if (!calculation) return null;

        const ingredients = await this.getAllQuery(
            `SELECT ri.*, pi.*
            FROM recipe_ingredients ri
            JOIN parsed_ingredients pi ON ri.parsed_ingredient_id = pi.id
            WHERE ri.calculation_id = ?`,
            [calculationId]
        );

        return {
            ...calculation,
            ingredients
        };
    }

    /**
     * Get parsing statistics
     */
    async getParsingStats() {
        const stats = await this.getQuery(
            `SELECT
                COUNT(*) as total_parsed,
                SUM(CASE WHEN parse_success = 1 THEN 1 ELSE 0 END) as successful_parses,
                SUM(CASE WHEN fallback_used = 1 THEN 1 ELSE 0 END) as fallback_used,
                COUNT(DISTINCT ingredient_name) as unique_ingredients
            FROM parsed_ingredients`
        );

        const recentFailures = await this.getAllQuery(
            `SELECT original_text, COUNT(*) as failure_count
            FROM parsed_ingredients
            WHERE parse_success = 0
            GROUP BY original_text
            ORDER BY failure_count DESC
            LIMIT 10`
        );

        return {
            ...stats,
            recentFailures
        };
    }

    /**
     * Clean old cache data
     */
    async cleanOldData(daysToKeep = 30) {
        // Clean database
        await this.runQuery(
            `DELETE FROM price_snapshots WHERE datetime(scraped_at) < datetime('now', '-${daysToKeep} days')`
        );

        await this.runQuery(
            `DELETE FROM scrape_logs WHERE datetime(scraped_at) < datetime('now', '-${daysToKeep} days')`
        );

        // Clean cache files older than daysToKeep
        try {
            const files = await fs.readdir(this.cacheDir);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

            for (const file of files) {
                const filePath = path.join(this.cacheDir, file);
                const stats = await fs.stat(filePath);

                if (stats.mtime < cutoffDate) {
                    await fs.unlink(filePath);
                    console.log(`Deleted old cache file: ${file}`);
                }
            }
        } catch (error) {
            console.error('Error cleaning cache files:', error);
        }
    }

    /**
     * Close database connection
     */
    async close() {
        return new Promise((resolve) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err);
                    } else {
                        console.log('Database connection closed');
                    }
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}

module.exports = DatabaseService;