const express = require('express');
const cors = require('cors');
require('dotenv').config();

const RecipeServiceFactory = require('./services/RecipeServiceFactory');
const PriceServiceFactory = require('./services/PriceServiceFactory');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
const recipeServiceFactory = new RecipeServiceFactory();
const priceServiceFactory = new PriceServiceFactory();
const recipeProvider = recipeServiceFactory.createProvider(); // Uses default provider (TheMealDB)
const priceProvider = priceServiceFactory.createProvider(); // Uses default provider (Numbeo)

// Error handling middleware
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Validation helpers
const validateQueryParam = (param, paramName) => {
    if (!param || typeof param !== 'string' || param.trim().length === 0) {
        throw new Error(`${paramName} is required and must be a non-empty string`);
    }
    return param.trim();
};

const validateIdParam = (id) => {
    const numericId = parseInt(id);
    if (isNaN(numericId) || numericId <= 0) {
        throw new Error('Invalid ID parameter');
    }
    return numericId;
};

// Routes

/**
 * Health check endpoint
 */
app.get('/', (req, res) => {
    res.json({
        message: 'Recipe Finder API is running!',
        provider: recipeProvider.getProviderName(),
        availableProviders: recipeServiceFactory.getAvailableProviders(),
        version: '2.0.0'
    });
});

/**
 * Get all recipes
 */
app.get('/api/recipes', asyncHandler(async (req, res) => {
    try {
        const recipes = await recipeProvider.getAllRecipes();
        res.json({
            success: true,
            data: recipes,
            count: recipes.length,
            provider: recipeProvider.getProviderName()
        });
    } catch (error) {
        console.error('Error fetching recipes:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch recipes',
            message: error.message
        });
    }
}));

/**
 * Search recipes by ingredient or name
 */
app.get('/api/recipes/search', asyncHandler(async (req, res) => {
    try {
        const query = validateQueryParam(req.query.q, 'Search query');

        const recipes = await recipeProvider.searchRecipes(query);
        res.json({
            success: true,
            data: recipes,
            count: recipes.length,
            query,
            provider: recipeProvider.getProviderName()
        });
    } catch (error) {
        console.error('Error searching recipes:', error);
        const statusCode = error.message.includes('required') ? 400 : 500;
        res.status(statusCode).json({
            success: false,
            error: 'Failed to search recipes',
            message: error.message
        });
    }
}));

/**
 * Get recipe by ID
 */
app.get('/api/recipes/:id', asyncHandler(async (req, res) => {
    try {
        const recipeId = validateIdParam(req.params.id);

        const recipe = await recipeProvider.getRecipeById(recipeId);
        res.json({
            success: true,
            data: recipe,
            provider: recipeProvider.getProviderName()
        });
    } catch (error) {
        console.error(`Error fetching recipe ${req.params.id}:`, error);
        const statusCode = error.message.includes('not found') || error.message.includes('Invalid ID') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            error: 'Failed to fetch recipe',
            message: error.message
        });
    }
}));

/**
 * Get available recipe providers (for future provider switching)
 */
app.get('/api/providers', (req, res) => {
    res.json({
        success: true,
        data: {
            recipe: {
                available: recipeServiceFactory.getAvailableProviders(),
                current: recipeProvider.getProviderName(),
                default: recipeServiceFactory.getDefaultProvider()
            },
            price: {
                available: priceServiceFactory.getAvailableProviders(),
                current: priceProvider.getProviderName(),
                default: priceServiceFactory.getDefaultProvider()
            }
        }
    });
});

/**
 * Get price for a single ingredient
 */
app.get('/api/prices/ingredient', asyncHandler(async (req, res) => {
    try {
        const ingredient = validateQueryParam(req.query.ingredient, 'Ingredient');
        const country = req.query.country || priceServiceFactory.getDefaultCountry();

        const priceData = await priceProvider.getIngredientPrice(ingredient, country);
        res.json({
            success: true,
            data: priceData,
            provider: priceProvider.getProviderName()
        });
    } catch (error) {
        console.error('Error fetching ingredient price:', error);
        const statusCode = error.message.includes('required') ? 400 : 500;
        res.status(statusCode).json({
            success: false,
            error: 'Failed to fetch ingredient price',
            message: error.message
        });
    }
}));

/**
 * Calculate recipe cost
 */
app.post('/api/prices/recipe', asyncHandler(async (req, res) => {
    try {
        const { ingredients, servings, country } = req.body;

        if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
            throw new Error('Ingredients array is required and must not be empty');
        }

        const targetCountry = country || priceServiceFactory.getDefaultCountry();
        const targetServings = servings || 4;

        const costData = await priceProvider.calculateRecipeCost(ingredients, targetCountry, targetServings);
        res.json({
            success: true,
            data: costData,
            provider: priceProvider.getProviderName()
        });
    } catch (error) {
        console.error('Error calculating recipe cost:', error);
        const statusCode = error.message.includes('required') || error.message.includes('must') ? 400 : 500;
        res.status(statusCode).json({
            success: false,
            error: 'Failed to calculate recipe cost',
            message: error.message
        });
    }
}));

/**
 * Get supported countries for pricing
 */
app.get('/api/prices/countries', asyncHandler(async (req, res) => {
    try {
        const countries = await priceProvider.getSupportedCountries();
        res.json({
            success: true,
            data: {
                countries,
                default: priceServiceFactory.getDefaultCountry()
            },
            provider: priceProvider.getProviderName()
        });
    } catch (error) {
        console.error('Error fetching supported countries:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch supported countries',
            message: error.message
        });
    }
}));

/**
 * Get available price sources for Estonian provider
 */
app.get('/api/prices/sources', asyncHandler(async (req, res) => {
    try {
        if (priceProvider.getProviderName() === 'Estonian Grocery Stores') {
            const availableSources = priceProvider.getAvailableSources();
            const activeSources = priceProvider.getActiveSources();

            res.json({
                success: true,
                data: {
                    available: availableSources,
                    active: activeSources
                },
                provider: priceProvider.getProviderName()
            });
        } else {
            res.json({
                success: true,
                data: {
                    available: {},
                    active: [],
                    message: 'Source configuration only available for Estonian provider'
                },
                provider: priceProvider.getProviderName()
            });
        }
    } catch (error) {
        console.error('Error fetching price sources:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch price sources',
            message: error.message
        });
    }
}));

/**
 * Configure active price sources for Estonian provider
 */
app.post('/api/prices/sources', asyncHandler(async (req, res) => {
    try {
        const { sources } = req.body;

        if (!Array.isArray(sources) || sources.length === 0) {
            throw new Error('Sources array is required and must not be empty');
        }

        if (priceProvider.getProviderName() === 'Estonian Grocery Stores') {
            priceProvider.setActiveSources(sources);

            res.json({
                success: true,
                data: {
                    activeSources: priceProvider.getActiveSources(),
                    message: 'Price sources updated successfully'
                },
                provider: priceProvider.getProviderName()
            });
        } else {
            res.status(400).json({
                success: false,
                error: 'Source configuration only available for Estonian provider',
                message: 'Current provider does not support source configuration'
            });
        }
    } catch (error) {
        console.error('Error configuring price sources:', error);
        const statusCode = error.message.includes('required') || error.message.includes('must') ? 400 : 500;
        res.status(statusCode).json({
            success: false,
            error: 'Failed to configure price sources',
            message: error.message
        });
    }
}));

// Global error handler
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        message: `The requested route ${req.originalUrl} does not exist`
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Using recipe provider: ${recipeProvider.getProviderName()}`);
    console.log(`Available providers: ${recipeServiceFactory.getAvailableProviders().join(', ')}`);
});

module.exports = app;