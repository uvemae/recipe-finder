const IRecipeProvider = require('../interfaces/IRecipeProvider');

/**
 * TheMealDB API provider implementation
 * Integrates with TheMealDB free recipe API
 */
class TheMealDBProvider extends IRecipeProvider {
    constructor() {
        super();
        this.baseUrl = 'https://www.themealdb.com/api/json/v1/1';
        this.providerName = 'TheMealDB';
    }

    /**
     * Transform TheMealDB recipe format to our standardized format
     * @param {Object} mealData - Raw meal data from TheMealDB
     * @returns {Object} Standardized recipe object
     */
    _transformRecipe(mealData) {
        if (!mealData) return null;

        // Extract ingredients and measurements
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
            const ingredient = mealData[`strIngredient${i}`];
            const measure = mealData[`strMeasure${i}`];

            if (ingredient && ingredient.trim()) {
                const formattedIngredient = measure && measure.trim()
                    ? `${measure.trim()} ${ingredient.trim()}`
                    : ingredient.trim();
                ingredients.push(formattedIngredient);
            }
        }

        // Convert instructions to array
        const instructions = mealData.strInstructions
            ? mealData.strInstructions.split('\r\n').filter(step => step.trim())
            : [];

        return {
            id: parseInt(mealData.idMeal),
            name: mealData.strMeal,
            ingredients,
            instructions,
            prepTime: this._estimatePrepTime(instructions.length),
            difficulty: this._estimateDifficulty(ingredients.length, instructions.length),
            servings: 4, // Default serving size
            cuisine: mealData.strArea || 'International',
            category: mealData.strCategory || 'Main Course',
            image: mealData.strMealThumb,
            tags: mealData.strTags ? mealData.strTags.split(',').map(tag => tag.trim()) : [],
            videoUrl: mealData.strYoutube || null,
            source: this.providerName
        };
    }

    /**
     * Estimate preparation time based on instruction complexity
     * @param {number} instructionCount - Number of instruction steps
     * @returns {number} Estimated prep time in minutes
     */
    _estimatePrepTime(instructionCount) {
        if (instructionCount <= 3) return 15;
        if (instructionCount <= 6) return 30;
        if (instructionCount <= 10) return 45;
        return 60;
    }

    /**
     * Estimate difficulty based on ingredients and instructions
     * @param {number} ingredientCount - Number of ingredients
     * @param {number} instructionCount - Number of instruction steps
     * @returns {string} Difficulty level
     */
    _estimateDifficulty(ingredientCount, instructionCount) {
        const complexity = ingredientCount + instructionCount;
        if (complexity <= 8) return 'easy';
        if (complexity <= 15) return 'medium';
        return 'hard';
    }

    /**
     * Make HTTP request to TheMealDB API
     * @param {string} endpoint - API endpoint
     * @returns {Promise<Object>} API response data
     */
    async _makeRequest(endpoint) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`);
            if (!response.ok) {
                throw new Error(`TheMealDB API error: ${response.status} ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`TheMealDB API request failed:`, error);
            throw new Error(`Failed to fetch data from TheMealDB: ${error.message}`);
        }
    }

    /**
     * Get all available recipes (random selection since TheMealDB doesn't have "get all")
     * @returns {Promise<Array>} Array of recipe objects
     */
    async getAllRecipes() {
        try {
            // Get recipes from different categories to provide variety
            const categories = ['Beef', 'Chicken', 'Seafood', 'Vegetarian', 'Pasta', 'Dessert'];
            const allRecipes = [];

            for (const category of categories) {
                const data = await this._makeRequest(`/filter.php?c=${category}`);
                if (data.meals) {
                    // Get detailed info for first few recipes from each category
                    const categoryRecipes = data.meals.slice(0, 3);
                    for (const meal of categoryRecipes) {
                        const detailData = await this._makeRequest(`/lookup.php?i=${meal.idMeal}`);
                        if (detailData.meals && detailData.meals[0]) {
                            allRecipes.push(this._transformRecipe(detailData.meals[0]));
                        }
                    }
                }
            }

            return allRecipes;
        } catch (error) {
            console.error('Error fetching all recipes:', error);
            throw error;
        }
    }

    /**
     * Search recipes by ingredient or name
     * @param {string} query - Search query
     * @returns {Promise<Array>} Array of matching recipes
     */
    async searchRecipes(query) {
        if (!query || typeof query !== 'string') {
            throw new Error('Search query is required and must be a string');
        }

        try {
            const searchResults = [];

            // Search by meal name
            const nameData = await this._makeRequest(`/search.php?s=${encodeURIComponent(query)}`);
            if (nameData.meals) {
                searchResults.push(...nameData.meals.map(meal => this._transformRecipe(meal)));
            }

            // Search by ingredient
            const ingredientData = await this._makeRequest(`/filter.php?i=${encodeURIComponent(query)}`);
            if (ingredientData.meals) {
                // Get detailed info for ingredient-based results
                for (const meal of ingredientData.meals.slice(0, 5)) { // Limit to avoid too many API calls
                    const detailData = await this._makeRequest(`/lookup.php?i=${meal.idMeal}`);
                    if (detailData.meals && detailData.meals[0]) {
                        const recipe = this._transformRecipe(detailData.meals[0]);
                        // Avoid duplicates
                        if (!searchResults.find(r => r.id === recipe.id)) {
                            searchResults.push(recipe);
                        }
                    }
                }
            }

            return searchResults;
        } catch (error) {
            console.error('Error searching recipes:', error);
            throw error;
        }
    }

    /**
     * Get recipe by ID
     * @param {number|string} id - Recipe ID
     * @returns {Promise<Object>} Recipe object
     */
    async getRecipeById(id) {
        if (!id) {
            throw new Error('Recipe ID is required');
        }

        try {
            const data = await this._makeRequest(`/lookup.php?i=${id}`);
            if (!data.meals || !data.meals[0]) {
                throw new Error(`Recipe with ID ${id} not found`);
            }

            return this._transformRecipe(data.meals[0]);
        } catch (error) {
            console.error(`Error fetching recipe ${id}:`, error);
            throw error;
        }
    }

    /**
     * Get provider name
     * @returns {string} Provider identifier
     */
    getProviderName() {
        return this.providerName;
    }
}

module.exports = TheMealDBProvider;