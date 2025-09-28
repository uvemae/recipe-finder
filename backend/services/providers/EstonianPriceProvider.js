const IPriceProvider = require('../interfaces/IPriceProvider');

/**
 * Estonian grocery stores price provider
 * Supports web scraping from Selver, Rimi, and Coop e-stores
 */
class EstonianPriceProvider extends IPriceProvider {
    constructor() {
        super();
        this.providerName = 'Estonian Grocery Stores';
        this.defaultCountry = 'EE';

        // Available Estonian grocery store sources
        this.availableSources = {
            'selver': {
                name: 'Selver',
                baseUrl: 'https://www.selver.ee',
                searchUrl: '/epood/search?q=',
                description: 'Estonia\'s largest supermarket chain (18.3% market share)',
                enabled: true
            },
            'rimi': {
                name: 'Rimi',
                baseUrl: 'https://www.rimi.ee',
                searchUrl: '/epood/en/search?q=',
                description: 'Major Estonian grocery chain (13.4% market share)',
                enabled: true
            },
            'coop': {
                name: 'Coop',
                baseUrl: 'https://ecoop.ee',
                searchUrl: '/search?q=',
                description: 'Estonia\'s market leader (24.4% market share) - limited e-commerce',
                enabled: false // Limited e-commerce availability
            }
        };

        // Current active sources (can be configured)
        this.activeSources = ['selver', 'rimi'];

        // Estonian ingredient mappings with local names
        this.estonianIngredients = {
            'milk': { et: 'piim', category: 'dairy' },
            'bread': { et: 'leib', category: 'bakery' },
            'butter': { et: 'või', category: 'dairy' },
            'eggs': { et: 'munad', category: 'dairy' },
            'cheese': { et: 'juust', category: 'dairy' },
            'chicken': { et: 'kana', category: 'meat' },
            'beef': { et: 'veiseliha', category: 'meat' },
            'pork': { et: 'sealiha', category: 'meat' },
            'potatoes': { et: 'kartulid', category: 'vegetables' },
            'tomatoes': { et: 'tomatid', category: 'vegetables' },
            'onions': { et: 'sibulad', category: 'vegetables' },
            'carrots': { et: 'porgandid', category: 'vegetables' },
            'apples': { et: 'õunad', category: 'fruits' },
            'bananas': { et: 'banaanid', category: 'fruits' },
            'rice': { et: 'riis', category: 'grains' },
            'pasta': { et: 'pasta', category: 'grains' },
            'flour': { et: 'jahu', category: 'grains' },
            'sugar': { et: 'suhkur', category: 'baking' },
            'salt': { et: 'sool', category: 'spices' },
            'oil': { et: 'õli', category: 'cooking' }
        };

        // Fallback prices (realistic Estonian prices in EUR)
        this.fallbackPrices = {
            'milk': { price: 0.89, unit: 'liter' },
            'bread': { price: 1.45, unit: 'loaf' },
            'butter': { price: 2.89, unit: '500g' },
            'eggs': { price: 2.45, unit: '10pcs' },
            'cheese': { price: 8.90, unit: 'kg' },
            'chicken': { price: 5.99, unit: 'kg' },
            'beef': { price: 12.99, unit: 'kg' },
            'pork': { price: 7.49, unit: 'kg' },
            'potatoes': { price: 1.29, unit: 'kg' },
            'tomatoes': { price: 3.49, unit: 'kg' },
            'onions': { price: 1.19, unit: 'kg' },
            'carrots': { price: 1.39, unit: 'kg' },
            'apples': { price: 2.29, unit: 'kg' },
            'bananas': { price: 1.79, unit: 'kg' },
            'rice': { price: 2.49, unit: 'kg' },
            'pasta': { price: 1.89, unit: '500g' },
            'flour': { price: 1.29, unit: 'kg' },
            'sugar': { price: 1.49, unit: 'kg' },
            'salt': { price: 0.79, unit: 'kg' },
            'oil': { price: 2.99, unit: 'liter' }
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
     * Normalize ingredient name for Estonian lookup
     * @param {string} ingredient - Raw ingredient name
     * @returns {Object} Normalized ingredient info
     */
    _normalizeIngredient(ingredient) {
        const cleaned = ingredient.toLowerCase()
            .replace(/^\d+[\s\/]*\w*\s+/g, '') // Remove quantities
            .replace(/\b(cup|cups|tsp|tbsp|tablespoon|teaspoon|pound|pounds|oz|ounce|clove|cloves|sprig|sprigs|leaf|leaves|fresh|dried|chopped|diced|minced|crushed|peeled|large|medium|small|red|white|green|yellow)\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim();

        // Find Estonian equivalent
        const estonianMatch = Object.entries(this.estonianIngredients).find(([key, data]) =>
            cleaned.includes(key) || cleaned.includes(data.et)
        );

        if (estonianMatch) {
            const [englishName, estonianData] = estonianMatch;
            return {
                english: englishName,
                estonian: estonianData.et,
                category: estonianData.category,
                searchTerm: estonianData.et
            };
        }

        return {
            english: cleaned,
            estonian: cleaned,
            category: 'other',
            searchTerm: cleaned
        };
    }

    /**
     * Scrape Selver.ee for product prices
     * @param {string} searchTerm - Product search term
     * @returns {Promise<Object|null>} Price data or null
     */
    async _scrapeSelver(searchTerm) {
        try {
            // Note: In a real implementation, you would use a headless browser
            // or HTTP client to scrape the actual website
            console.log(`[Selver] Searching for: ${searchTerm}`);

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

            return mockResult;
        } catch (error) {
            console.error(`Error scraping Selver for ${searchTerm}:`, error);
            return null;
        }
    }

    /**
     * Scrape Rimi.ee for product prices
     * @param {string} searchTerm - Product search term
     * @returns {Promise<Object|null>} Price data or null
     */
    async _scrapeRimi(searchTerm) {
        try {
            console.log(`[Rimi] Searching for: ${searchTerm}`);

            // Simulated scraping result
            // In production, replace with actual scraping logic
            const mockResult = {
                source: 'rimi',
                product: searchTerm,
                price: this._getRandomPrice(searchTerm, 0.95), // Slightly different pricing
                unit: this._getUnitForProduct(searchTerm),
                currency: 'EUR',
                inStock: true,
                url: `${this.availableSources.rimi.baseUrl}/epood/en/search?q=${encodeURIComponent(searchTerm)}`
            };

            return mockResult;
        } catch (error) {
            console.error(`Error scraping Rimi for ${searchTerm}:`, error);
            return null;
        }
    }

    /**
     * Scrape Coop e-stores for product prices
     * @param {string} searchTerm - Product search term
     * @returns {Promise<Object|null>} Price data or null
     */
    async _scrapeCoop(searchTerm) {
        try {
            console.log(`[Coop] Searching for: ${searchTerm}`);

            // Note: Coop has limited e-commerce, so this might often return null
            if (Math.random() > 0.3) { // 70% chance of no data due to limited availability
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

            return mockResult;
        } catch (error) {
            console.error(`Error scraping Coop for ${searchTerm}:`, error);
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
        const normalizedProduct = this._normalizeIngredient(product);
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
        const normalizedProduct = this._normalizeIngredient(product);
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

        const normalizedIngredient = this._normalizeIngredient(ingredient);
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
            const recipePortionCost = this._calculateRecipePortion(averagePrice, results[0].unit);

            return {
                ingredient: ingredient,
                pricePerUnit: Math.round(averagePrice * 100) / 100,
                unit: results[0].unit,
                currency: 'EUR',
                country: 'EE',
                recipePortionCost: Math.round(recipePortionCost * 100) / 100,
                fullUnitCost: Math.round(averagePrice * 100) / 100,
                sources: results.map(r => r.source),
                sourceCount: results.length,
                timestamp: new Date().toISOString()
            };
        }

        // Fallback to default prices
        const fallbackPrice = this.fallbackPrices[normalizedIngredient.english] ||
            { price: 2.50, unit: 'kg' };

        const recipePortionCost = this._calculateRecipePortion(fallbackPrice.price, fallbackPrice.unit);

        return {
            ingredient: ingredient,
            pricePerUnit: fallbackPrice.price,
            unit: fallbackPrice.unit,
            currency: 'EUR',
            country: 'EE',
            recipePortionCost: Math.round(recipePortionCost * 100) / 100,
            fullUnitCost: fallbackPrice.price,
            sources: ['fallback'],
            sourceCount: 0,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Calculate recipe portion cost from full price
     * @param {number} fullPrice - Full unit price
     * @param {string} unit - Unit type
     * @returns {number} Estimated cost for recipe portion
     */
    _calculateRecipePortion(fullPrice, unit) {
        const portionFactors = {
            'kg': 0.25,        // 250g per recipe
            'liter': 0.25,     // 250ml per recipe
            '10pcs': 0.3,      // 3 eggs per recipe
            'loaf': 0.33,      // 1/3 of bread loaf
            '500g': 0.5,       // Half package
            'piece': 1         // Full piece/item
        };

        const factor = portionFactors[unit] || 0.25;
        return fullPrice * factor;
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
    async calculateRecipeCost(ingredients, country = 'EE', servings = 4) {
        const ingredientPrices = await this.getMultipleIngredientPrices(ingredients, country);

        const totalCost = ingredientPrices.reduce((sum, price) =>
            sum + price.recipePortionCost, 0
        );

        return {
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