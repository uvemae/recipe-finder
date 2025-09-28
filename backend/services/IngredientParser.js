/**
 * Ingredient Parser Service
 * Parses recipe ingredient strings into structured data with quantities and units
 */
class IngredientParser {
    constructor() {
        // Realistic weights for common ingredients (in kg)
        this.ingredientWeights = {
            // Vegetables
            'onion': 0.15,
            'onions': 0.15,
            'shallot': 0.05,
            'shallots': 0.05,
            'carrot': 0.1,
            'carrots': 0.1,
            'turnip': 0.25,
            'turnips': 0.25,
            'celeriac': 0.8,
            'potato': 0.15,
            'potatoes': 0.15,

            // Herbs (very small weights)
            'sprig': 0.002,
            'sprigs': 0.002,
            'thyme': 0.002,
            'oregano': 0.002,
            'rosemary': 0.002,
            'parsley': 0.002,
            'basil': 0.002,

            // Proteins
            'egg': 0.06,
            'eggs': 0.06,
            'egg yolk': 0.02,
            'egg yolks': 0.02,
            'egg white': 0.04,
            'egg whites': 0.04,

            // Fruits
            'lemon': 0.1,
            'lemons': 0.1,
            'lime': 0.05,
            'limes': 0.05,
            'apple': 0.18,
            'apples': 0.18,

            // Default fallback for unknown pieces
            'piece': 0.1,
            'pieces': 0.1
        };

        this.unitConversions = {
            // Volume conversions to liters
            volume: {
                'ml': 0.001,
                'milliliter': 0.001,
                'millilitre': 0.001,
                'l': 1,
                'liter': 1,
                'litre': 1,
                'cup': 0.237,
                'cups': 0.237,
                'tbsp': 0.0148,
                'tablespoon': 0.0148,
                'tablespoons': 0.0148,
                'tbs': 0.0148,
                'tsp': 0.00493,
                'teaspoon': 0.00493,
                'teaspoons': 0.00493,
                'fl oz': 0.0296,
                'fluid ounce': 0.0296,
                'pint': 0.473,
                'quart': 0.946
            },

            // Weight conversions to kg
            weight: {
                'g': 0.001,
                'gram': 0.001,
                'grams': 0.001,
                'kg': 1,
                'kilogram': 1,
                'kilograms': 1,
                'oz': 0.0283,
                'ounce': 0.0283,
                'ounces': 0.0283,
                'lb': 0.454,
                'pound': 0.454,
                'pounds': 0.454,
                'lbs': 0.454
            },

            // Special small quantities (converted to weight in kg)
            special: {
                'pinch': 0.001,      // ~1g
                'dash': 0.006,       // ~6g
                'sprinkle': 0.002,   // ~2g
                'hint': 0.0005,      // ~0.5g
                'touch': 0.0005,     // ~0.5g
                'sprig': 0.002,      // ~2g per sprig
                'sprigs': 0.002      // ~2g per sprig
            },

            // Count-based items
            count: {
                'piece': 1,
                'pieces': 1,
                'item': 1,
                'items': 1,
                'whole': 1,
                'each': 1,
                'pc': 1,
                'pcs': 1
            }
        };

        // Regex patterns for parsing different ingredient formats
        this.patterns = [
            // "1kg Beef", "2.5 cups Flour", "200ml Wine"
            /^(\d+(?:\.\d+)?)\s*(kg|g|l|ml|cup|cups|tbsp|tbs|tablespoon|tablespoons|tsp|teaspoon|teaspoons|oz|ounce|ounces|lb|pound|pounds|lbs|fl\s*oz|fluid\s*ounce|pint|quart|liter|litre|milliliter|millilitre|gram|grams|kilogram|kilograms)\s+(.+)$/i,

            // "pinch Salt", "dash Pepper", "3 sprigs Thyme" - special small units
            /^(\d+(?:\.\d+)?)?\s*(pinch|dash|sprinkle|hint|touch|sprig|sprigs)\s+(.+)$/i,

            // "2 chopped Carrots", "1 finely sliced Onion"
            /^(\d+(?:\.\d+)?)\s+(.+)$/i,

            // "Salt", "Pepper" (no quantity specified)
            /^(.+)$/
        ];
    }

    /**
     * Parse ingredient string into structured data
     * @param {string} ingredientString - Raw ingredient string from recipe
     * @returns {Object} Parsed ingredient data
     */
    parseIngredient(ingredientString) {
        const trimmed = ingredientString.trim();

        for (const pattern of this.patterns) {
            const match = trimmed.match(pattern);
            if (match) {
                return this._processMatch(match, trimmed);
            }
        }

        // Fallback for unparseable ingredients
        return {
            original: trimmed,
            quantity: 1,
            unit: 'piece',
            unitType: 'count',
            ingredient: trimmed,
            normalizedQuantity: 1,
            normalizedUnit: 'piece',
            parseSuccess: false,
            fallbackUsed: true
        };
    }

    /**
     * Process regex match and extract ingredient data
     * @private
     */
    _processMatch(match, original) {
        let quantity, unit, ingredient;

        if (match.length === 4) {
            // Pattern with quantity, unit, and ingredient
            quantity = parseFloat(match[1]) || 1;
            unit = match[2].toLowerCase().trim();
            ingredient = match[3].trim();
        } else if (match.length === 3) {
            // Pattern with quantity and ingredient (no explicit unit)
            quantity = parseFloat(match[1]) || 1;
            unit = 'piece';
            ingredient = match[2].trim();
        } else {
            // Just ingredient name
            quantity = 1;
            unit = 'piece';
            ingredient = match[1].trim();
        }

        // Determine unit type and normalize with ingredient context
        const unitType = this._getUnitType(unit);
        const normalized = this._normalizeWithContext(quantity, unit, unitType, ingredient);

        return {
            original,
            quantity,
            unit,
            unitType,
            ingredient: this._cleanIngredientName(ingredient),
            normalizedQuantity: normalized.quantity,
            normalizedUnit: normalized.unit,
            parseSuccess: true,
            fallbackUsed: false
        };
    }

    /**
     * Determine the type of unit (weight, volume, count, special)
     * @private
     */
    _getUnitType(unit) {
        const cleanUnit = unit.toLowerCase().replace(/\s+/g, ' ').trim();

        if (this.unitConversions.weight[cleanUnit]) return 'weight';
        if (this.unitConversions.volume[cleanUnit]) return 'volume';
        if (this.unitConversions.special[cleanUnit]) return 'special';
        if (this.unitConversions.count[cleanUnit]) return 'count';

        return 'unknown';
    }

    /**
     * Normalize quantity to standard units (kg for weight, L for volume)
     * @private
     */
    _normalizeToStandardUnit(quantity, unit, unitType) {
        const cleanUnit = unit.toLowerCase().replace(/\s+/g, ' ').trim();

        switch (unitType) {
            case 'weight':
                return {
                    quantity: quantity * this.unitConversions.weight[cleanUnit],
                    unit: 'kg'
                };

            case 'volume':
                return {
                    quantity: quantity * this.unitConversions.volume[cleanUnit],
                    unit: 'liter'
                };

            case 'special':
                // Convert special units to weight in kg
                return {
                    quantity: quantity * this.unitConversions.special[cleanUnit],
                    unit: 'kg'
                };

            case 'count':
                return {
                    quantity: quantity * this.unitConversions.count[cleanUnit],
                    unit: 'piece'
                };

            default:
                // Unknown unit, treat as piece
                return {
                    quantity: quantity,
                    unit: 'piece'
                };
        }
    }

    /**
     * Clean ingredient name by removing descriptive words
     * @private
     */
    _cleanIngredientName(ingredient) {
        const descriptiveWords = [
            'finely', 'chopped', 'diced', 'sliced', 'minced', 'grated',
            'fresh', 'dried', 'frozen', 'canned', 'cooked', 'raw',
            'free-range', 'organic', 'large', 'small', 'medium',
            'peeled', 'skinless', 'boneless', 'whole', 'ground'
        ];

        let cleaned = ingredient;
        for (const word of descriptiveWords) {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            cleaned = cleaned.replace(regex, '').trim();
        }

        // Clean up extra spaces
        return cleaned.replace(/\s+/g, ' ').trim();
    }

    /**
     * Parse multiple ingredients
     * @param {Array<string>} ingredients - Array of ingredient strings
     * @returns {Array<Object>} Array of parsed ingredient objects
     */
    parseMultipleIngredients(ingredients) {
        return ingredients.map(ingredient => this.parseIngredient(ingredient));
    }

    /**
     * Get realistic weight for an ingredient based on its name
     * @param {string} ingredientName - Name of the ingredient
     * @returns {number} Weight in kg
     * @private
     */
    _getRealisticWeight(ingredientName) {
        const name = ingredientName.toLowerCase().trim();

        // Check for exact matches first
        if (this.ingredientWeights[name]) {
            return this.ingredientWeights[name];
        }

        // Check for partial matches
        for (const [key, weight] of Object.entries(this.ingredientWeights)) {
            if (name.includes(key) || key.includes(name)) {
                return weight;
            }
        }

        // Default fallback weight for unknown ingredients
        return this.ingredientWeights['piece'];
    }

    /**
     * Extract main ingredient name from a complex string
     * @param {string} ingredientText - Full ingredient text
     * @returns {string} Main ingredient name
     * @private
     */
    _getMainIngredient(ingredientText) {
        // For unit-based ingredients, return the unit itself (like "sprig", "piece")
        const cleanText = ingredientText.toLowerCase().trim();

        // If it's a known unit, return it
        if (this.ingredientWeights[cleanText]) {
            return cleanText;
        }

        // Otherwise return the full text for matching
        return cleanText;
    }

    /**
     * Enhanced normalization that considers ingredient context
     * @param {number} quantity
     * @param {string} unit
     * @param {string} unitType
     * @param {string} ingredient - The ingredient name for context
     * @returns {Object} Normalized quantity and unit
     * @private
     */
    _normalizeWithContext(quantity, unit, unitType, ingredient) {
        if (unitType === 'count') {
            // Use ingredient-specific realistic weight
            const realWeight = this._getRealisticWeight(ingredient);
            return {
                quantity: quantity * realWeight,
                unit: 'kg'
            };
        }

        // Use existing logic for other types
        return this._normalizeToStandardUnit(quantity, unit, unitType);
    }

    /**
     * Convert parsed ingredient quantity to match price unit
     * @param {Object} parsedIngredient - Parsed ingredient data
     * @param {string} priceUnit - Unit that price is quoted in
     * @returns {number} Adjusted quantity for cost calculation
     */
    convertToFinalUnit(parsedIngredient, priceUnit) {
        const { normalizedQuantity, normalizedUnit } = parsedIngredient;
        const cleanPriceUnit = priceUnit.toLowerCase().trim();

        // If units match, return as-is
        if (normalizedUnit === cleanPriceUnit) {
            return normalizedQuantity;
        }

        // Convert between compatible units
        if (normalizedUnit === 'kg' && cleanPriceUnit === 'g') {
            return normalizedQuantity * 1000;
        }

        if (normalizedUnit === 'liter' && cleanPriceUnit === 'ml') {
            return normalizedQuantity * 1000;
        }

        if (normalizedUnit === 'kg' && cleanPriceUnit === 'liter') {
            // Rough density approximation for liquids vs solids
            return normalizedQuantity;
        }

        // If no conversion possible, return normalized quantity
        return normalizedQuantity;
    }

    /**
     * Get unit conversion factor between two units
     * @param {string} fromUnit - Source unit
     * @param {string} toUnit - Target unit
     * @returns {number|null} Conversion factor or null if not possible
     */
    getConversionFactor(fromUnit, toUnit) {
        const fromType = this._getUnitType(fromUnit);
        const toType = this._getUnitType(toUnit);

        if (fromType !== toType) return null;

        const fromClean = fromUnit.toLowerCase().replace(/\s+/g, ' ').trim();
        const toClean = toUnit.toLowerCase().replace(/\s+/g, ' ').trim();

        const conversions = this.unitConversions[fromType];
        if (!conversions || !conversions[fromClean] || !conversions[toClean]) {
            return null;
        }

        return conversions[fromClean] / conversions[toClean];
    }
}

module.exports = IngredientParser;