/**
 * Interface for price data providers
 * Defines the contract that all price providers must implement
 */
class IPriceProvider {
    /**
     * Get price for a specific ingredient in a given country
     * @param {string} ingredient - Ingredient name
     * @param {string} country - Country code (e.g., 'DE', 'FR', 'IT')
     * @returns {Promise<Object>} Price data object
     */
    async getIngredientPrice(ingredient, country) {
        throw new Error('getIngredientPrice() must be implemented');
    }

    /**
     * Get prices for multiple ingredients in a given country
     * @param {Array<string>} ingredients - Array of ingredient names
     * @param {string} country - Country code
     * @returns {Promise<Array>} Array of price data objects
     */
    async getMultipleIngredientPrices(ingredients, country) {
        throw new Error('getMultipleIngredientPrices() must be implemented');
    }

    /**
     * Get available countries for pricing data
     * @returns {Promise<Array>} Array of supported country codes
     */
    async getSupportedCountries() {
        throw new Error('getSupportedCountries() must be implemented');
    }

    /**
     * Get provider name
     * @returns {string} Provider identifier
     */
    getProviderName() {
        throw new Error('getProviderName() must be implemented');
    }

    /**
     * Get default currency for a country
     * @param {string} country - Country code
     * @returns {string} Currency code (e.g., 'EUR', 'USD')
     */
    getCountryCurrency(country) {
        throw new Error('getCountryCurrency() must be implemented');
    }
}

module.exports = IPriceProvider;