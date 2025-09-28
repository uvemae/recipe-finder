/**
 * Ingredient Parser Service
 * Parses recipe ingredient strings into structured data with quantities and units
 */
class IngredientParser {
    constructor() {
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
                'touch': 0.0005      // ~0.5g
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

            // "pinch Salt", "dash Pepper", "3 sprigs Thyme"
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

        // Determine unit type and normalize
        const unitType = this._getUnitType(unit);
        const normalized = this._normalizeToStandardUnit(quantity, unit, unitType);

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