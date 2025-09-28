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
      )`
        ];

        for (const query of queries) {
            await this.runQuery(query);
        }

        // Insert default stores
        await this.insertDefaultStores();

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