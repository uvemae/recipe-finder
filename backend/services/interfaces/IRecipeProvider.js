/**
 * Interface for recipe data providers
 * Defines the contract that all recipe API providers must implement
 */
class IRecipeProvider {
    /**
     * Get all available recipes
     * @returns {Promise<Array>} Array of recipe objects
     */
    async getAllRecipes() {
        throw new Error('getAllRecipes() must be implemented');
    }

    /**
     * Search recipes by query string
     * @param {string} query - Search query (ingredient or recipe name)
     * @returns {Promise<Array>} Array of matching recipes
     */
    async searchRecipes(query) {
        throw new Error('searchRecipes() must be implemented');
    }

    /**
     * Get recipe by ID
     * @param {number|string} id - Recipe identifier
     * @returns {Promise<Object>} Recipe object
     */
    async getRecipeById(id) {
        throw new Error('getRecipeById() must be implemented');
    }

    /**
     * Get provider name
     * @returns {string} Provider identifier
     */
    getProviderName() {
        throw new Error('getProviderName() must be implemented');
    }
}

module.exports = IRecipeProvider;