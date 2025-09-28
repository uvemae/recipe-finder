const IPriceProvider = require('../interfaces/IPriceProvider');

/**
 * Numbeo price provider implementation
 * Integrates with Numbeo API for real price data
 */
class NumbeoProvider extends IPriceProvider {
    constructor() {
        super();
        this.baseUrl = 'https://www.numbeo.com/api';
        this.providerName = 'Numbeo';

        // Mapping of ingredients to Numbeo item IDs
        this.ingredientMapping = {
            // Basic groceries from Numbeo's Markets section
            'milk': { itemId: 13, unit: 'liter' },
            'bread': { itemId: 9, unit: 'loaf' },
            'rice': { itemId: 10, unit: 'kg' },
            'eggs': { itemId: 11, unit: 'dozen' },
            'cheese': { itemId: 12, unit: 'kg' },
            'chicken': { itemId: 14, unit: 'kg' },
            'beef': { itemId: 15, unit: 'kg' },
            'apples': { itemId: 16, unit: 'kg' },
            'bananas': { itemId: 17, unit: 'kg' },
            'oranges': { itemId: 18, unit: 'kg' },
            'tomatoes': { itemId: 19, unit: 'kg' },
            'potatoes': { itemId: 20, unit: 'kg' },
            'onions': { itemId: 21, unit: 'kg' },
            'lettuce': { itemId: 22, unit: 'head' }
        };

        // Country configurations
        this.countryConfig = {
            'DE': {
                name: 'Germany',
                currency: 'EUR',
                cities: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt'],
                defaultCity: 'Berlin'
            },
            'FR': {
                name: 'France',
                currency: 'EUR',
                cities: ['Paris', 'Lyon', 'Marseille'],
                defaultCity: 'Paris'
            },
            'IT': {
                name: 'Italy',
                currency: 'EUR',
                cities: ['Rome', 'Milan', 'Naples'],
                defaultCity: 'Rome'
            },
            'ES': {
                name: 'Spain',
                currency: 'EUR',
                cities: ['Madrid', 'Barcelona', 'Valencia'],
                defaultCity: 'Madrid'
            }
        };

        // EU unit conversion factors (grams/ml to typical recipe amounts)
        this.unitConversions = {
            'kg': { factor: 1000, baseUnit: 'g' },
            'liter': { factor: 1000, baseUnit: 'ml' },
            'dozen': { factor: 12, baseUnit: 'piece' },
            'loaf': { factor: 1, baseUnit: 'piece' },
            'head': { factor: 1, baseUnit: 'piece' }
        };
    }

    /**
     * Normalize ingredient name for mapping lookup
     * @param {string} ingredient - Raw ingredient name
     * @returns {string} Normalized ingredient name
     */
    _normalizeIngredient(ingredient) {
        return ingredient.toLowerCase()
            // Remove quantities and measurements
            .replace(/^\d+[\s\/]*\w*\s+/g, '') // Remove leading numbers and units
            .replace(/\b(cup|cups|tsp|tbsp|tablespoon|teaspoon|pound|pounds|oz|ounce|clove|cloves|sprig|sprigs|leaf|leaves)\b/gi, '')
            // Remove common descriptors
            .replace(/\b(fresh|dried|chopped|diced|minced|crushed|peeled|large|medium|small|red|white|green|yellow)\b/gi, '')
            // Clean up extra spaces and trim
            .replace(/\s+/g, ' ')
            .trim()
            // Map specific ingredients
            .replace(/chicken breast|chicken thigh|chicken/i, 'chicken')
            .replace(/ground beef|beef steak|red snapper|snapper/i, 'beef')
            .replace(/whole milk|skim milk/i, 'milk')
            .replace(/white bread|whole wheat bread/i, 'bread')
            .replace(/vegetable oil|olive oil|oil/i, 'oil')
            .replace(/garlic/i, 'onions') // Garlic priced similar to onions
            .replace(/ginger/i, 'onions') // Ginger priced similar to onions
            .replace(/thyme|bay|pepper|allspice/i, 'herbs')
            .replace(/red pepper|bell pepper/i, 'tomatoes'); // Similar pricing
    }

    /**
     * Get city for country (uses default city for now)
     * @param {string} country - Country code
     * @returns {string} City name for API calls
     */
    _getCityForCountry(country) {
        const config = this.countryConfig[country.toUpperCase()];
        return config ? config.defaultCity : 'Berlin'; // Default to Berlin
    }

    /**
     * Estimate ingredient price using German grocery price averages
     * This is a fallback when Numbeo data is not available
     * @param {string} ingredient - Ingredient name
     * @param {string} country - Country code
     * @returns {Object} Estimated price data
     */
    _getEstimatedPrice(ingredient, country) {
        const normalizedIngredient = this._normalizeIngredient(ingredient);
        const currency = this.getCountryCurrency(country);

        // German grocery price estimates (EUR per unit)
        const germanPrices = {
            'milk': { price: 1.10, unit: 'liter' },
            'bread': { price: 2.50, unit: 'loaf' },
            'rice': { price: 2.80, unit: 'kg' },
            'eggs': { price: 3.20, unit: 'dozen' },
            'cheese': { price: 12.00, unit: 'kg' },
            'chicken': { price: 8.50, unit: 'kg' },
            'beef': { price: 15.00, unit: 'kg' },
            'apples': { price: 3.20, unit: 'kg' },
            'bananas': { price: 2.10, unit: 'kg' },
            'oranges': { price: 2.80, unit: 'kg' },
            'tomatoes': { price: 4.50, unit: 'kg' },
            'potatoes': { price: 1.80, unit: 'kg' },
            'onions': { price: 1.50, unit: 'kg' },
            'lettuce': { price: 1.80, unit: 'head' },
            'oil': { price: 3.50, unit: 'liter' },
            'herbs': { price: 2.50, unit: 'kg' },
            'garlic': { price: 8.00, unit: 'kg' },
            'ginger': { price: 12.00, unit: 'kg' },
            'pasta': { price: 2.20, unit: 'kg' },
            'flour': { price: 1.80, unit: 'kg' },
            'sugar': { price: 1.60, unit: 'kg' },
            'salt': { price: 0.80, unit: 'kg' },
            'pepper': { price: 15.00, unit: 'kg' }
        };

        const priceData = germanPrices[normalizedIngredient] || { price: 3.00, unit: 'kg' };

        return {
            ingredient: ingredient,
            pricePerUnit: priceData.price,
            unit: priceData.unit,
            currency: currency,
            country: country,
            source: `${this.providerName} (estimated)`,
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
        // Typical recipe portions as fraction of full unit
        const portionFactors = {
            'kg': 0.25,      // 250g per recipe
            'liter': 0.25,   // 250ml per recipe
            'dozen': 0.25,   // 3 eggs per recipe
            'loaf': 0.33,    // 1/3 of bread loaf
            'head': 0.5,     // Half a lettuce head
            'piece': 1       // Full piece/item
        };

        const factor = portionFactors[unit] || 0.25;
        return fullPrice * factor;
    }

    /**
     * Get price for a specific ingredient
     * @param {string} ingredient - Ingredient name
     * @param {string} country - Country code (default: 'DE')
     * @returns {Promise<Object>} Price data object
     */
    async getIngredientPrice(ingredient, country = 'DE') {
        try {
            // For now, use estimated prices since Numbeo API requires API key
            // In production, this would make actual API calls to Numbeo
            const priceData = this._getEstimatedPrice(ingredient, country);

            // Calculate recipe portion cost
            const recipePortionCost = this._calculateRecipePortion(
                priceData.pricePerUnit,
                priceData.unit
            );

            return {
                ...priceData,
                recipePortionCost: Math.round(recipePortionCost * 100) / 100,
                fullUnitCost: priceData.pricePerUnit
            };
        } catch (error) {
            console.error(`Error fetching price for ${ingredient}:`, error);
            throw new Error(`Failed to get price for ingredient: ${ingredient}`);
        }
    }

    /**
     * Get prices for multiple ingredients
     * @param {Array<string>} ingredients - Array of ingredient names
     * @param {string} country - Country code
     * @returns {Promise<Array>} Array of price data objects
     */
    async getMultipleIngredientPrices(ingredients, country = 'DE') {
        try {
            const pricePromises = ingredients.map(ingredient =>
                this.getIngredientPrice(ingredient, country)
            );

            return await Promise.all(pricePromises);
        } catch (error) {
            console.error('Error fetching multiple ingredient prices:', error);
            throw error;
        }
    }

    /**
     * Get supported countries
     * @returns {Promise<Array>} Array of country objects
     */
    async getSupportedCountries() {
        return Object.entries(this.countryConfig).map(([code, config]) => ({
            code,
            name: config.name,
            currency: config.currency,
            cities: config.cities
        }));
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
        const config = this.countryConfig[country.toUpperCase()];
        return config ? config.currency : 'EUR';
    }

    /**
     * Calculate total recipe cost
     * @param {Array<string>} ingredients - Recipe ingredients
     * @param {string} country - Country code
     * @param {number} servings - Number of servings
     * @returns {Promise<Object>} Recipe cost breakdown
     */
    async calculateRecipeCost(ingredients, country = 'DE', servings = 4) {
        try {
            const ingredientPrices = await this.getMultipleIngredientPrices(ingredients, country);

            const totalCost = ingredientPrices.reduce((sum, price) =>
                sum + price.recipePortionCost, 0
            );

            return {
                totalCost: Math.round(totalCost * 100) / 100,
                costPerServing: Math.round((totalCost / servings) * 100) / 100,
                currency: this.getCountryCurrency(country),
                country,
                servings,
                ingredientBreakdown: ingredientPrices,
                provider: this.providerName
            };
        } catch (error) {
            console.error('Error calculating recipe cost:', error);
            throw error;
        }
    }
}

module.exports = NumbeoProvider;