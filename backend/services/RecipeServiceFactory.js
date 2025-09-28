const TheMealDBProvider = require('./providers/TheMealDBProvider');

/**
 * Factory for creating recipe service providers
 * Supports future addition of multiple providers (Spoonacular, etc.)
 */
class RecipeServiceFactory {
    constructor() {
        this.providers = new Map();
        this.defaultProvider = 'themealdb';

        // Register available providers
        this._registerProviders();
    }

    /**
     * Register all available recipe providers
     * @private
     */
    _registerProviders() {
        this.providers.set('themealdb', TheMealDBProvider);
        // Future providers can be added here:
        // this.providers.set('spoonacular', SpoonacularProvider);
        // this.providers.set('edamam', EdamamProvider);
    }

    /**
     * Create a recipe provider instance
     * @param {string} providerName - Name of the provider to create
     * @returns {IRecipeProvider} Provider instance
     */
    createProvider(providerName = this.defaultProvider) {
        const ProviderClass = this.providers.get(providerName.toLowerCase());

        if (!ProviderClass) {
            throw new Error(`Unknown recipe provider: ${providerName}. Available providers: ${this.getAvailableProviders().join(', ')}`);
        }

        return new ProviderClass();
    }

    /**
     * Get list of available provider names
     * @returns {Array<string>} Array of provider names
     */
    getAvailableProviders() {
        return Array.from(this.providers.keys());
    }

    /**
     * Get the default provider name
     * @returns {string} Default provider name
     */
    getDefaultProvider() {
        return this.defaultProvider;
    }

    /**
     * Set the default provider
     * @param {string} providerName - Name of the provider to set as default
     */
    setDefaultProvider(providerName) {
        if (!this.providers.has(providerName.toLowerCase())) {
            throw new Error(`Cannot set unknown provider as default: ${providerName}`);
        }
        this.defaultProvider = providerName.toLowerCase();
    }
}

module.exports = RecipeServiceFactory;