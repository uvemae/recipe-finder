/**
 * Estonian Translation Service
 * Handles translation of food ingredients from English to Estonian
 * Ready for integration with Estonian Language Institute API
 */
class EstonianTranslationService {
    constructor() {
        this.apiEndpoint = process.env.ESTONIAN_API_ENDPOINT || null;
        this.apiKey = process.env.ESTONIAN_API_KEY || null;
        this.rateLimitDelay = 1000; // 1 second between API calls
        this.lastApiCall = 0;

        // Cache for API translations to avoid repeated calls
        this.translationCache = new Map();

        // Common food translation patterns for better results
        this.contextualHints = {
            'stock': 'buljong',
            'broth': 'puljong',
            'sauce': 'kaste',
            'paste': 'pasta',
            'powder': 'pulber',
            'fresh': 'värske',
            'dried': 'kuivatatud',
            'ground': 'jahvatatud',
            'chopped': 'hakitud',
            'sliced': 'viilutatud'
        };
    }

    /**
     * Translate ingredient from English to Estonian
     * @param {string} englishIngredient - English ingredient name
     * @returns {Promise<Object>} Translation result with confidence
     */
    async translateIngredient(englishIngredient) {
        const cacheKey = englishIngredient.toLowerCase().trim();

        // Check cache first
        if (this.translationCache.has(cacheKey)) {
            const cached = this.translationCache.get(cacheKey);
            return {
                ...cached,
                cached: true
            };
        }

        try {
            // For now, use mock translation until real API is configured
            const result = await this._mockTranslateAPI(englishIngredient);

            // Cache the result
            this.translationCache.set(cacheKey, result);

            return {
                ...result,
                cached: false
            };

        } catch (error) {
            console.error('Translation API error:', error);
            return {
                original: englishIngredient,
                translated: englishIngredient,
                confidence: 'failed',
                source: 'error',
                success: false
            };
        }
    }

    /**
     * Mock translation API - replace with real Estonian Language Institute API
     * @private
     */
    async _mockTranslateAPI(englishIngredient) {
        // Simulate API delay
        await this._respectRateLimit();

        const ingredient = englishIngredient.toLowerCase().trim();

        // Mock translations for testing - these would come from real API
        const mockTranslations = {
            'exotic spice': { et: 'eksootilised vürtsid', confidence: 'medium' },
            'sumac': { et: 'sumaki', confidence: 'low' },
            'turmeric': { et: 'kurkum', confidence: 'high' },
            'cardamom': { et: 'kardemon', confidence: 'high' },
            'star anise': { et: 'tähtkaniis', confidence: 'medium' },
            'fennel seeds': { et: 'aedrohu seemned', confidence: 'medium' },
            'bay leaves': { et: 'loorberilehed', confidence: 'high' },
            'lime juice': { et: 'laimimahl', confidence: 'high' },
            'coconut milk': { et: 'kookospiim', confidence: 'high' },
            'fish sauce': { et: 'kalakaste', confidence: 'medium' },
            'sesame oil': { et: 'seesamiõli', confidence: 'high' }
        };

        if (mockTranslations[ingredient]) {
            const translation = mockTranslations[ingredient];
            return {
                original: englishIngredient,
                translated: translation.et,
                confidence: translation.confidence,
                source: 'api_translation',
                success: true
            };
        }

        // Try contextual translation
        const contextual = this._tryContextualTranslation(ingredient);
        if (contextual) {
            return {
                original: englishIngredient,
                translated: contextual,
                confidence: 'medium',
                source: 'contextual_translation',
                success: true
            };
        }

        // No translation found
        return {
            original: englishIngredient,
            translated: englishIngredient,
            confidence: 'failed',
            source: 'no_translation',
            success: false
        };
    }

    /**
     * Try to build translation using context hints
     * @private
     */
    _tryContextualTranslation(ingredient) {
        for (const [englishPart, estonianPart] of Object.entries(this.contextualHints)) {
            if (ingredient.includes(englishPart)) {
                // Simple replacement - real API would be more sophisticated
                return ingredient.replace(englishPart, estonianPart);
            }
        }
        return null;
    }

    /**
     * Respect API rate limits
     * @private
     */
    async _respectRateLimit() {
        const now = Date.now();
        const timeSinceLastCall = now - this.lastApiCall;

        if (timeSinceLastCall < this.rateLimitDelay) {
            const delay = this.rateLimitDelay - timeSinceLastCall;
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        this.lastApiCall = Date.now();
    }

    /**
     * Real Estonian Language Institute API integration (placeholder)
     * @private
     */
    async _callEstonianAPI(englishText) {
        if (!this.apiEndpoint || !this.apiKey) {
            throw new Error('Estonian API not configured');
        }

        // Placeholder for real API call
        // const response = await fetch(this.apiEndpoint, {
        //     method: 'POST',
        //     headers: {
        //         'Authorization': `Bearer ${this.apiKey}`,
        //         'Content-Type': 'application/json'
        //     },
        //     body: JSON.stringify({
        //         text: englishText,
        //         source_lang: 'en',
        //         target_lang: 'et',
        //         domain: 'food_cooking'
        //     })
        // });

        throw new Error('Real API not implemented yet');
    }

    /**
     * Get translation cache statistics
     */
    getCacheStats() {
        return {
            cacheSize: this.translationCache.size,
            cachedTranslations: Array.from(this.translationCache.keys())
        };
    }

    /**
     * Clear translation cache
     */
    clearCache() {
        this.translationCache.clear();
    }
}

module.exports = EstonianTranslationService;