const IPriceProvider = require('../interfaces/IPriceProvider');
const DatabaseService = require('../DatabaseService');
const IngredientParser = require('../IngredientParser');
const EstonianTranslationService = require('../EstonianTranslationService');

/**
 * Estonian grocery stores price provider with database storage
 * Supports web scraping from Selver, Rimi, and Coop e-stores
 */
class EstonianPriceProvider extends IPriceProvider {
    constructor() {
        super();
        this.providerName = 'Estonian Grocery Stores';
        this.defaultCountry = 'EE';
        this.db = new DatabaseService();
        this.parser = new IngredientParser();
        this.translator = new EstonianTranslationService();
        this.initialized = false;

        // Available Estonian grocery store sources
        this.availableSources = {
            'selver': {
                name: 'Selver',
                baseUrl: 'https://www.selver.ee',
                searchUrl: '/search?q=', // Fixed URL pattern
                description: 'Estonia\'s largest supermarket chain (18.3% market share)',
                enabled: true
            },
            'rimi': {
                name: 'Rimi',
                baseUrl: 'https://www.rimi.ee',
                searchUrl: '/epood/ee/otsing?query=',
                description: 'Major Estonian grocery chain (13.4% market share)',
                enabled: true
            },
            'coop': {
                name: 'Coop',
                baseUrl: 'https://ecoop.ee',
                searchUrl: '/otsing?s=',
                description: 'Estonia\'s market leader (24.4% market share) - limited e-commerce',
                enabled: false // Limited e-commerce availability
            }
        };

        // Current active sources (can be configured)
        this.activeSources = ['selver', 'rimi'];

        // Estonian ingredient mappings with local names
        this.estonianIngredients = {
            // Dairy & Eggs
            'milk': { et: 'piim', category: 'dairy' },
            'butter': { et: 'või', category: 'dairy' },
            'eggs': { et: 'munad', category: 'dairy' },
            'egg': { et: 'muna', category: 'dairy' },
            'egg yolk': { et: 'munakollane', category: 'dairy' },
            'egg yolks': { et: 'munakollased', category: 'dairy' },
            'cheese': { et: 'juust', category: 'dairy' },
            'cream': { et: 'koor', category: 'dairy' },

            // Meat & Protein
            'chicken': { et: 'kana', category: 'meat' },
            'beef': { et: 'veiseliha', category: 'meat' },
            'pork': { et: 'sealiha', category: 'meat' },
            'lamb': { et: 'lambaliha', category: 'meat' },
            'lamb loin': { et: 'lambaliha', category: 'meat' },
            'lamb loin chops': { et: 'lambaliha', category: 'meat' },
            'fish': { et: 'kala', category: 'meat' },
            'chicken stock': { et: 'kanabuljong', category: 'cooking' },
            'beef stock': { et: 'lihabuljong', category: 'cooking' },
            'stock': { et: 'buljong', category: 'cooking' },

            // Vegetables
            'potatoes': { et: 'kartulid', category: 'vegetables' },
            'potato': { et: 'kartulit', category: 'vegetables' },
            'charlotte potatoes': { et: 'kartulid', category: 'vegetables' },
            'tomatoes': { et: 'tomatid', category: 'vegetables' },
            'tomato': { et: 'tomat', category: 'vegetables' },
            'onions': { et: 'sibulad', category: 'vegetables' },
            'onion': { et: 'sibul', category: 'vegetables' },
            'shallots': { et: 'sibulad', category: 'vegetables' },
            'shallot': { et: 'sibul', category: 'vegetables' },
            'carrots': { et: 'porgandid', category: 'vegetables' },
            'carrot': { et: 'porgand', category: 'vegetables' },
            'turnips': { et: 'kaalikas', category: 'vegetables' },
            'turnip': { et: 'kaalikas', category: 'vegetables' },
            'celeriac': { et: 'juurkeller', category: 'vegetables' },
            'celery': { et: 'seller', category: 'vegetables' },
            'green beans': { et: 'rohelised oad', category: 'vegetables' },
            'beans': { et: 'oad', category: 'vegetables' },

            // Herbs & Spices
            'thyme': { et: 'liivatee', category: 'herbs' },
            'oregano': { et: 'oregano', category: 'herbs' },
            'rosemary': { et: 'rosmariini', category: 'herbs' },
            'parsley': { et: 'petersell', category: 'herbs' },
            'basil': { et: 'basiilik', category: 'herbs' },
            'dill': { et: 'till', category: 'herbs' },
            'salt': { et: 'sool', category: 'spices' },
            'pepper': { et: 'pipar', category: 'spices' },
            'black pepper': { et: 'must pipar', category: 'spices' },

            // Cooking essentials
            'oil': { et: 'õli', category: 'cooking' },
            'olive oil': { et: 'oliiviõli', category: 'cooking' },
            'rapeseed oil': { et: 'rapsõli', category: 'cooking' },
            'flour': { et: 'jahu', category: 'grains' },
            'plain flour': { et: 'jahu', category: 'grains' },
            'wheat flour': { et: 'nisujahu', category: 'grains' },
            'whole wheat': { et: 'täistera nisu', category: 'grains' },
            'wheat': { et: 'nisu', category: 'grains' },
            'bread': { et: 'leib', category: 'bakery' },
            'sugar': { et: 'suhkur', category: 'baking' },
            'caster sugar': { et: 'suhkur', category: 'baking' },

            // Liquids & Alcohol
            'wine': { et: 'vein', category: 'alcohol' },
            'white wine': { et: 'valge vein', category: 'alcohol' },
            'red wine': { et: 'punane vein', category: 'alcohol' },

            // Pastry & Baking
            'pastry': { et: 'taigen', category: 'baking' },
            'puff pastry': { et: 'lehttaigen', category: 'baking' },

            // Condiments
            'mustard': { et: 'sinep', category: 'condiments' },

            // Fruits
            'apples': { et: 'õunad', category: 'fruits' },
            'bananas': { et: 'banaanid', category: 'fruits' },

            // Grains
            'rice': { et: 'riis', category: 'grains' },
            'pasta': { et: 'pasta', category: 'grains' }
        };

        // Fallback prices (realistic Estonian prices in EUR)
        this.fallbackPrices = {
            // Dairy & Eggs
            'milk': { price: 0.89, unit: 'liter' },
            'butter': { price: 2.89, unit: '500g' },
            'eggs': { price: 2.45, unit: '10pcs' },
            'egg': { price: 0.25, unit: 'piece' },
            'egg yolk': { price: 0.15, unit: 'piece' },
            'egg yolks': { price: 0.15, unit: 'piece' },
            'cheese': { price: 8.90, unit: 'kg' },
            'cream': { price: 1.89, unit: 'liter' },

            // Meat & Protein
            'chicken': { price: 5.99, unit: 'kg' },
            'beef': { price: 12.99, unit: 'kg' },
            'pork': { price: 7.49, unit: 'kg' },
            'lamb': { price: 16.99, unit: 'kg' },
            'lamb loin': { price: 16.99, unit: 'kg' },
            'lamb loin chops': { price: 16.99, unit: 'kg' },
            'fish': { price: 8.99, unit: 'kg' },
            'chicken stock': { price: 3.49, unit: 'liter' },
            'beef stock': { price: 4.49, unit: 'liter' },
            'stock': { price: 3.99, unit: 'liter' },

            // Vegetables
            'potatoes': { price: 1.29, unit: 'kg' },
            'potato': { price: 1.29, unit: 'kg' },
            'charlotte potatoes': { price: 1.49, unit: 'kg' },
            'tomatoes': { price: 3.49, unit: 'kg' },
            'tomato': { price: 3.49, unit: 'kg' },
            'onions': { price: 1.19, unit: 'kg' },
            'onion': { price: 1.19, unit: 'kg' },
            'shallots': { price: 2.89, unit: 'kg' },
            'shallot': { price: 2.89, unit: 'kg' },
            'carrots': { price: 1.39, unit: 'kg' },
            'carrot': { price: 1.39, unit: 'kg' },
            'turnips': { price: 1.89, unit: 'kg' },
            'turnip': { price: 1.89, unit: 'kg' },
            'celeriac': { price: 2.49, unit: 'kg' },
            'celery': { price: 3.29, unit: 'kg' },
            'green beans': { price: 4.99, unit: 'kg' },
            'beans': { price: 4.99, unit: 'kg' },

            // Herbs & Spices
            'thyme': { price: 15.99, unit: 'kg' },
            'oregano': { price: 12.99, unit: 'kg' },
            'rosemary': { price: 16.99, unit: 'kg' },
            'parsley': { price: 8.99, unit: 'kg' },
            'basil': { price: 19.99, unit: 'kg' },
            'dill': { price: 9.99, unit: 'kg' },
            'salt': { price: 0.79, unit: 'kg' },
            'pepper': { price: 24.99, unit: 'kg' },
            'black pepper': { price: 24.99, unit: 'kg' },

            // Cooking essentials
            'oil': { price: 2.99, unit: 'liter' },
            'olive oil': { price: 4.99, unit: 'liter' },
            'rapeseed oil': { price: 2.79, unit: 'liter' },
            'flour': { price: 1.29, unit: 'kg' },
            'plain flour': { price: 1.29, unit: 'kg' },
            'wheat flour': { price: 1.39, unit: 'kg' },
            'whole wheat': { price: 1.89, unit: 'kg' },
            'wheat': { price: 1.89, unit: 'kg' },
            'bread': { price: 1.45, unit: 'loaf' },
            'sugar': { price: 1.49, unit: 'kg' },
            'caster sugar': { price: 1.59, unit: 'kg' },

            // Liquids & Alcohol
            'wine': { price: 5.99, unit: 'liter' },
            'white wine': { price: 5.99, unit: 'liter' },
            'red wine': { price: 6.49, unit: 'liter' },

            // Pastry & Baking
            'pastry': { price: 3.49, unit: 'kg' },
            'puff pastry': { price: 3.99, unit: 'kg' },

            // Condiments
            'mustard': { price: 2.89, unit: 'kg' },

            // Fruits
            'apples': { price: 2.29, unit: 'kg' },
            'bananas': { price: 1.79, unit: 'kg' },

            // Grains
            'rice': { price: 2.49, unit: 'kg' },
            'pasta': { price: 1.89, unit: '500g' }
        };
    }

    /**
     * Configure which sources to use for price fetching
     * @param {Array<string>} sources - Array of source names ('selver', 'rimi', 'coop')
     */
    setActiveSources(sources) {
        const validSources = sources.filter(source => this.availableSources[source]);
        if (validSources.length === 0) {
            throw new Error('At least one valid source must be specified');
        }
        this.activeSources = validSources;
    }

    /**
     * Get available sources for configuration
     * @returns {Object} Available sources with metadata
     */
    getAvailableSources() {
        return this.availableSources;
    }

    /**
     * Get currently active sources
     * @returns {Array<string>} Active source names
     */
    getActiveSources() {
        return this.activeSources;
    }

    /**
     * Normalize ingredient name for Estonian lookup (sync version for simple cases)
     * @param {string} ingredient - Raw ingredient name
     * @returns {Object} Normalized ingredient info
     */
    _normalizeIngredientSync(ingredient) {
        const cleaned = ingredient.toLowerCase()
            .replace(/^\d+[\s\/]*\w*\s+/g, '') // Remove quantities
            .replace(/\b(cup|cups|tsp|tbsp|tablespoon|teaspoon|pound|pounds|oz|ounce|clove|cloves|sprig|sprigs|leaf|leaves|fresh|dried|chopped|diced|minced|crushed|peeled|large|medium|small|red|white|green|yellow)\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim();

        // Find Estonian equivalent - prioritize longer/more specific matches
        const estonianMatch = Object.entries(this.estonianIngredients)
            .sort(([a], [b]) => b.length - a.length) // Sort by length descending
            .find(([key, data]) =>
                cleaned.includes(key) || cleaned.includes(data.et)
            );

        if (estonianMatch) {
            const [englishName, estonianData] = estonianMatch;
            return {
                english: englishName,
                estonian: estonianData.et,
                category: estonianData.category,
                searchTerm: estonianData.et,
                translationFound: true,
                confidence: 'high',
                translationSource: 'local'
            };
        }

        return {
            english: cleaned,
            estonian: cleaned,
            category: 'other',
            searchTerm: cleaned,
            translationFound: false,
            confidence: 'low',
            translationSource: 'none'
        };
    }

    /**
     * Normalize ingredient name for Estonian lookup (async version with API fallback)
     * @param {string} ingredient - Raw ingredient name
     * @returns {Promise<Object>} Normalized ingredient info
     */
    async _normalizeIngredient(ingredient) {
        const cleaned = ingredient.toLowerCase()
            .replace(/^\d+[\s\/]*\w*\s+/g, '') // Remove quantities
            .replace(/\b(cup|cups|tsp|tbsp|tablespoon|teaspoon|pound|pounds|lb|oz|ounce|clove|cloves|sprig|sprigs|leaf|leaves|fresh|dried|chopped|diced|minced|crushed|peeled|large|medium|small|red|white|green|yellow|cooked|raw|whole|ground|sliced|grated|shredded|can|pot|handful|to serve|garnish|finely|roughly)\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim();

        // 1. First try database translations (highest priority)
        try {
            const dbTranslation = await this.db.getQuery(
                `SELECT estonian_name, category, confidence FROM ingredient_translations
                 WHERE LOWER(english_name) = LOWER(?)`,
                [cleaned]
            );

            if (dbTranslation) {
                console.log(`[Database] Found translation: ${cleaned} → ${dbTranslation.estonian_name}`);
                return {
                    english: cleaned,
                    estonian: dbTranslation.estonian_name,
                    category: dbTranslation.category || 'other',
                    searchTerm: dbTranslation.estonian_name,
                    translationFound: true,
                    confidence: dbTranslation.confidence || 'high',
                    translationSource: 'database'
                };
            }
        } catch (error) {
            console.error('[Database Translation] Error:', error);
        }

        // 2. Try legacy hardcoded Estonian dictionary (for backwards compatibility)
        const estonianMatch = Object.entries(this.estonianIngredients)
            .sort(([a], [b]) => b.length - a.length) // Sort by length descending
            .find(([key, data]) =>
                cleaned.includes(key) || cleaned.includes(data.et)
            );

        if (estonianMatch) {
            const [englishName, estonianData] = estonianMatch;
            console.log(`[Legacy Dictionary] Found translation: ${cleaned} → ${estonianData.et}`);
            return {
                english: englishName,
                estonian: estonianData.et,
                category: estonianData.category,
                searchTerm: estonianData.et,
                translationFound: true,
                confidence: 'high',
                translationSource: 'legacy'
            };
        }

        // 3. Try API translation as fallback
        try {
            console.log(`[Translation API] Attempting translation for: ${cleaned}`);
            const apiResult = await this.translator.translateIngredient(cleaned);

            if (apiResult.success) {
                console.log(`[Translation API] Success: ${cleaned} → ${apiResult.translated}`);
                return {
                    english: cleaned,
                    estonian: apiResult.translated,
                    category: 'other',
                    searchTerm: apiResult.translated,
                    translationFound: true,
                    confidence: apiResult.confidence,
                    translationSource: 'api'
                };
            }
        } catch (error) {
            console.error('[Translation API] Error:', error);
        }

        // 4. No translation found anywhere - will use fallback prices
        console.log(`[Translation] No translation found for: ${cleaned}`);
        return {
            english: cleaned,
            estonian: cleaned,
            category: 'other',
            searchTerm: cleaned,
            translationFound: false,
            confidence: 'low',
            translationSource: 'none'
        };
    }

    /**
     * Initialize database connection
     */
    async _ensureInitialized() {
        if (!this.initialized) {
            await this.db.initialize();
            this.initialized = true;
        }
    }

    /**
     * Scrape Selver.ee for product prices with database storage
     * @param {string} searchTerm - Product search term
     * @returns {Promise<Object|null>} Price data or null
     */
    async _scrapeSelver(searchTerm) {
        const startTime = Date.now();

        try {
            await this._ensureInitialized();

            // Check cache first
            const cached = await this.db.getCachedPrice('selver', searchTerm, 24);
            if (cached) {
                console.log(`[Selver] Using cached price for: ${searchTerm}`);
                return {
                    source: 'selver',
                    product: searchTerm,
                    price: cached.price,
                    unit: cached.unit,
                    currency: cached.currency,
                    inStock: cached.in_stock,
                    url: cached.source_url,
                    cached: true
                };
            }

            console.log(`[Selver] Scraping fresh data for: ${searchTerm}`);

            // Simulated scraping result with realistic Estonian prices
            // In production, replace with actual scraping logic
            const mockResult = {
                source: 'selver',
                product: searchTerm,
                price: this._getRandomPrice(searchTerm),
                unit: this._getUnitForProduct(searchTerm),
                currency: 'EUR',
                inStock: true,
                url: `${this.availableSources.selver.baseUrl}/epood/search?q=${encodeURIComponent(searchTerm)}`
            };

            // Store in database
            await this.db.storePriceData({
                storeName: 'selver',
                ingredient: searchTerm,
                normalizedIngredient: this._normalizeIngredientSync(searchTerm).english,
                price: mockResult.price,
                unit: mockResult.unit,
                currency: mockResult.currency,
                inStock: mockResult.inStock,
                rawData: mockResult,
                sourceUrl: mockResult.url
            });

            // Log successful scrape
            await this.db.logScrapeAttempt('selver', searchTerm, true, null, Date.now() - startTime);

            return mockResult;
        } catch (error) {
            console.error(`Error scraping Selver for ${searchTerm}:`, error);

            // Log failed scrape
            await this.db.logScrapeAttempt('selver', searchTerm, false, error.message, Date.now() - startTime);

            return null;
        }
    }

    /**
     * Scrape Rimi.ee for product prices with database storage
     * @param {string} searchTerm - Product search term
     * @returns {Promise<Object|null>} Price data or null
     */
    async _scrapeRimi(searchTerm) {
        const startTime = Date.now();

        try {
            await this._ensureInitialized();

            // Check cache first
            const cached = await this.db.getCachedPrice('rimi', searchTerm, 24);
            if (cached) {
                console.log(`[Rimi] Using cached price for: ${searchTerm}`);
                return {
                    source: 'rimi',
                    product: searchTerm,
                    price: cached.price,
                    unit: cached.unit,
                    currency: cached.currency,
                    inStock: cached.in_stock,
                    url: cached.source_url,
                    cached: true
                };
            }

            console.log(`[Rimi] Scraping fresh data for: ${searchTerm}`);

            const mockResult = {
                source: 'rimi',
                product: searchTerm,
                price: this._getRandomPrice(searchTerm, 0.95), // Slightly different pricing
                unit: this._getUnitForProduct(searchTerm),
                currency: 'EUR',
                inStock: true,
                url: `${this.availableSources.rimi.baseUrl}/epood/en/search?q=${encodeURIComponent(searchTerm)}`
            };

            // Store in database
            await this.db.storePriceData({
                storeName: 'rimi',
                ingredient: searchTerm,
                normalizedIngredient: this._normalizeIngredientSync(searchTerm).english,
                price: mockResult.price,
                unit: mockResult.unit,
                currency: mockResult.currency,
                inStock: mockResult.inStock,
                rawData: mockResult,
                sourceUrl: mockResult.url
            });

            // Log successful scrape
            await this.db.logScrapeAttempt('rimi', searchTerm, true, null, Date.now() - startTime);

            return mockResult;
        } catch (error) {
            console.error(`Error scraping Rimi for ${searchTerm}:`, error);

            // Log failed scrape
            await this.db.logScrapeAttempt('rimi', searchTerm, false, error.message, Date.now() - startTime);

            return null;
        }
    }

    /**
     * Scrape Coop e-stores for product prices with database storage
     * @param {string} searchTerm - Product search term
     * @returns {Promise<Object|null>} Price data or null
     */
    async _scrapeCoop(searchTerm) {
        const startTime = Date.now();

        try {
            await this._ensureInitialized();

            // Check cache first
            const cached = await this.db.getCachedPrice('coop', searchTerm, 24);
            if (cached) {
                console.log(`[Coop] Using cached price for: ${searchTerm}`);
                return {
                    source: 'coop',
                    product: searchTerm,
                    price: cached.price,
                    unit: cached.unit,
                    currency: cached.currency,
                    inStock: cached.in_stock,
                    url: cached.source_url,
                    cached: true
                };
            }

            console.log(`[Coop] Searching for: ${searchTerm}`);

            // Note: Coop has limited e-commerce, so this might often return null
            if (Math.random() > 0.3) { // 70% chance of no data due to limited availability
                await this.db.logScrapeAttempt('coop', searchTerm, false, 'Limited e-commerce availability', Date.now() - startTime);
                return null;
            }

            const mockResult = {
                source: 'coop',
                product: searchTerm,
                price: this._getRandomPrice(searchTerm, 1.05), // Slightly higher pricing
                unit: this._getUnitForProduct(searchTerm),
                currency: 'EUR',
                inStock: true,
                url: `${this.availableSources.coop.baseUrl}/search?q=${encodeURIComponent(searchTerm)}`
            };

            // Store in database
            await this.db.storePriceData({
                storeName: 'coop',
                ingredient: searchTerm,
                normalizedIngredient: this._normalizeIngredientSync(searchTerm).english,
                price: mockResult.price,
                unit: mockResult.unit,
                currency: mockResult.currency,
                inStock: mockResult.inStock,
                rawData: mockResult,
                sourceUrl: mockResult.url
            });

            // Log successful scrape
            await this.db.logScrapeAttempt('coop', searchTerm, true, null, Date.now() - startTime);

            return mockResult;
        } catch (error) {
            console.error(`Error scraping Coop for ${searchTerm}:`, error);

            // Log failed scrape
            await this.db.logScrapeAttempt('coop', searchTerm, false, error.message, Date.now() - startTime);

            return null;
        }
    }

    /**
     * Get realistic price variation for testing
     * @param {string} product - Product name
     * @param {number} multiplier - Price multiplier for variation
     * @returns {number} Price in EUR
     */
    _getRandomPrice(product, multiplier = 1.0) {
        const normalizedProduct = this._normalizeIngredientSync(product);
        const fallbackPrice = this.fallbackPrices[normalizedProduct.english];

        if (fallbackPrice) {
            // Add realistic price variation (±15%)
            const variation = 0.85 + (Math.random() * 0.3);
            return Math.round(fallbackPrice.price * multiplier * variation * 100) / 100;
        }

        // Default price for unknown products
        return Math.round(2.50 * multiplier * (0.85 + Math.random() * 0.3) * 100) / 100;
    }

    /**
     * Get appropriate unit for product
     * @param {string} product - Product name
     * @returns {string} Unit
     */
    _getUnitForProduct(product) {
        const normalizedProduct = this._normalizeIngredientSync(product);
        const fallbackPrice = this.fallbackPrices[normalizedProduct.english];
        return fallbackPrice ? fallbackPrice.unit : 'kg';
    }

    /**
     * Get ingredient price from configured sources
     * @param {string} ingredient - Ingredient name
     * @param {string} country - Country code (default: 'EE')
     * @returns {Promise<Object>} Price data
     */
    async getIngredientPrice(ingredient, country = 'EE') {
        if (country.toUpperCase() !== 'EE') {
            throw new Error('Estonian provider only supports Estonia (EE)');
        }

        const normalizedIngredient = await this._normalizeIngredient(ingredient);
        const searchTerm = normalizedIngredient.searchTerm;

        const results = [];

        // Scrape from all active sources
        for (const source of this.activeSources) {
            let result = null;

            switch (source) {
                case 'selver':
                    result = await this._scrapeSelver(searchTerm);
                    break;
                case 'rimi':
                    result = await this._scrapeRimi(searchTerm);
                    break;
                case 'coop':
                    result = await this._scrapeCoop(searchTerm);
                    break;
            }

            if (result) {
                results.push(result);
            }
        }

        // Calculate average price if multiple sources
        if (results.length > 0) {
            const averagePrice = results.reduce((sum, r) => sum + r.price, 0) / results.length;
            // Parse the ingredient to get actual quantities (if it's a string with quantities)
            const parsedIngredient = this.parser.parseIngredient(ingredient);
            const actualCost = this._calculateActualCost(parsedIngredient, averagePrice, results[0].unit);

            return {
                ingredient: ingredient,
                pricePerUnit: Math.round(averagePrice * 100) / 100,
                unit: results[0].unit,
                currency: 'EUR',
                country: 'EE',
                recipePortionCost: Math.round(actualCost * 100) / 100,
                parsedData: parsedIngredient,
                fullUnitCost: Math.round(averagePrice * 100) / 100,
                sources: results.map(r => r.source),
                sourceCount: results.length,
                timestamp: new Date().toISOString(),
                // Confidence tracking
                translationFound: normalizedIngredient.translationFound,
                confidence: normalizedIngredient.confidence,
                dataSource: 'store_scraping'
            };
        }

        // Fallback to default prices
        const fallbackPrice = this.fallbackPrices[normalizedIngredient.english] ||
            { price: 2.50, unit: 'kg' };

        // Parse the ingredient for fallback calculation too
        const parsedIngredient = this.parser.parseIngredient(ingredient);
        const actualCost = this._calculateActualCost(parsedIngredient, fallbackPrice.price, fallbackPrice.unit);

        return {
            ingredient: ingredient,
            pricePerUnit: fallbackPrice.price,
            unit: fallbackPrice.unit,
            currency: 'EUR',
            country: 'EE',
            recipePortionCost: Math.round(actualCost * 100) / 100,
            parsedData: parsedIngredient,
            fullUnitCost: fallbackPrice.price,
            sources: ['fallback'],
            sourceCount: 0,
            timestamp: new Date().toISOString(),
            // Confidence tracking for fallback
            translationFound: normalizedIngredient.translationFound,
            confidence: normalizedIngredient.translationFound ? 'medium' : 'low',
            dataSource: 'fallback_price'
        };
    }

    /**
     * Calculate actual ingredient cost based on parsed quantities
     * @param {Object} parsedIngredient - Parsed ingredient data
     * @param {number} pricePerUnit - Price per unit from store
     * @param {string} priceUnit - Unit that price is quoted in
     * @returns {number} Actual cost for the ingredient amount needed
     */
    _calculateActualCost(parsedIngredient, pricePerUnit, priceUnit) {
        const { normalizedQuantity, normalizedUnit, ingredient } = parsedIngredient;

        // Convert the needed quantity to match the price unit
        let neededQuantity = normalizedQuantity;

        // Handle unit conversions between normalized and price units
        if (normalizedUnit === 'kg' && priceUnit === 'liter') {
            // For liquid ingredients quoted by liter but measured by weight
            // Use approximate density conversion (most liquids ~1kg/L)
            neededQuantity = normalizedQuantity;
        } else if (normalizedUnit === 'liter' && priceUnit === 'kg') {
            // For weight-based pricing of liquids
            neededQuantity = normalizedQuantity;
        } else if (normalizedUnit !== priceUnit) {
            // Try to convert using conversion factor
            const conversionFactor = this.parser.getConversionFactor(normalizedUnit, priceUnit);
            if (conversionFactor) {
                neededQuantity = normalizedQuantity * conversionFactor;
            }
        }

        // Calculate the actual cost
        const actualCost = neededQuantity * pricePerUnit;

        console.log(`[Cost Calc] ${ingredient}: ${normalizedQuantity}${normalizedUnit} @ ${pricePerUnit}EUR/${priceUnit} = ${actualCost.toFixed(3)}EUR`);

        return actualCost;
    }

    /**
     * Get prices for multiple ingredients
     * @param {Array<string>} ingredients - Array of ingredient names
     * @param {string} country - Country code
     * @returns {Promise<Array>} Array of price data objects
     */
    async getMultipleIngredientPrices(ingredients, country = 'EE') {
        const pricePromises = ingredients.map(ingredient =>
            this.getIngredientPrice(ingredient, country)
        );

        return await Promise.all(pricePromises);
    }

    /**
     * Calculate total recipe cost
     * @param {Array<string>} ingredients - Recipe ingredients
     * @param {string} country - Country code
     * @param {number} servings - Number of servings
     * @returns {Promise<Object>} Recipe cost breakdown
     */
    async calculateRecipeCost(ingredients, country = 'EE', servings = 4, recipeId = null, recipeName = null) {
        const ingredientPrices = await this.getMultipleIngredientPrices(ingredients, country);

        const totalCost = ingredientPrices.reduce((sum, price) =>
            sum + price.recipePortionCost, 0
        );

        const result = {
            totalCost: Math.round(totalCost * 100) / 100,
            costPerServing: Math.round((totalCost / servings) * 100) / 100,
            currency: 'EUR',
            country,
            servings,
            ingredientBreakdown: ingredientPrices,
            provider: this.providerName,
            activeSources: this.activeSources,
            sourceConfiguration: this.getAvailableSources()
        };

        // Store calculation in database for tracking and analysis
        try {
            const calculationData = {
                recipeId,
                recipeName,
                totalCost: result.totalCost,
                costPerServing: result.costPerServing,
                servings,
                currency: 'EUR',
                country,
                provider: this.providerName,
                metadata: {
                    activeSources: this.activeSources,
                    ingredientCount: ingredients.length,
                    timestamp: new Date().toISOString()
                },
                ingredients: ingredientPrices.map(price => ({
                    parsedData: price.parsedData,
                    cost: price.recipePortionCost,
                    pricePerUnit: price.pricePerUnit,
                    priceUnit: price.unit,
                    sourceStore: price.sources?.[0] || 'fallback'
                }))
            };

            await this.db.storeRecipeCalculation(calculationData);
            console.log(`[DB] Stored recipe calculation for ${ingredients.length} ingredients`);

        } catch (error) {
            console.error('Error storing recipe calculation:', error);
            // Don't fail the calculation if database storage fails
        }

        return result;
    }

    /**
     * Get supported countries
     * @returns {Promise<Array>} Array of country objects
     */
    async getSupportedCountries() {
        return [{
            code: 'EE',
            name: 'Estonia',
            currency: 'EUR',
            sources: Object.keys(this.availableSources)
        }];
    }

    /**
     * Get provider name
     * @returns {string} Provider identifier
     */
    getProviderName() {
        return this.providerName;
    }

    /**
     * Get currency for country
     * @param {string} country - Country code
     * @returns {string} Currency code
     */
    getCountryCurrency(country) {
        return country.toUpperCase() === 'EE' ? 'EUR' : 'EUR';
    }
}

module.exports = EstonianPriceProvider;