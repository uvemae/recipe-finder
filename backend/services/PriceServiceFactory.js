const NumbeoProvider = require('./providers/NumbeoProvider');

/**
 * Factory for creating price service providers
 * Supports future addition of multiple price providers
 */
class PriceServiceFactory {
    constructor() {
        this.providers = new Map();
        this.defaultProvider = 'numbeo';
        this.defaultCountry = 'DE'; // Germany as default

        // Register available providers
        this._registerProviders();
    }

    /**
     * Register all available price providers
     * @private
     */
    _registerProviders() {
        this.providers.set('numbeo', NumbeoProvider);
        // Future providers can be added here:
        // this.providers.set('eurostat', EurostatProvider);
        // this.providers.set('supermarket', SupermarketProvider);
    }

    /**
     * Create a price provider instance
     * @param {string} providerName - Name of the provider to create
     * @returns {IPriceProvider} Provider instance
     */
    createProvider(providerName = this.defaultProvider) {
        const ProviderClass = this.providers.get(providerName.toLowerCase());

        if (!ProviderClass) {
            throw new Error(`Unknown price provider: ${providerName}. Available providers: ${this.getAvailableProviders().join(', ')}`);
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

    /**
     * Get the default country
     * @returns {string} Default country code
     */
    getDefaultCountry() {
        return this.defaultCountry;
    }

    /**
     * Set the default country
     * @param {string} countryCode - Country code to set as default
     */
    setDefaultCountry(countryCode) {
        // Validate country code format (2 letters)
        if (!countryCode || typeof countryCode !== 'string' || countryCode.length !== 2) {
            throw new Error('Country code must be a 2-letter string (e.g., "DE", "FR")');
        }
        this.defaultCountry = countryCode.toUpperCase();
    }
}

module.exports = PriceServiceFactory;