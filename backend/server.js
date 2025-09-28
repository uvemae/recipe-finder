const express = require('express');
const cors = require('cors');
require('dotenv').config();

const RecipeServiceFactory = require('./services/RecipeServiceFactory');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize recipe service
const recipeServiceFactory = new RecipeServiceFactory();
const recipeProvider = recipeServiceFactory.createProvider(); // Uses default provider (TheMealDB)

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
            available: recipeServiceFactory.getAvailableProviders(),
            current: recipeProvider.getProviderName(),
            default: recipeServiceFactory.getDefaultProvider()
        }
    });
});

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