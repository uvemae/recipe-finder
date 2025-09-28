const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Sample recipe data (we'll start with this)
const sampleRecipes = [
    {
        id: 1,
        name: "Spaghetti Carbonara",
        ingredients: ["spaghetti", "eggs", "bacon", "parmesan cheese", "black pepper"],
        prepTime: 20,
        difficulty: "medium",
        servings: 4
    },
    {
        id: 2,
        name: "Chicken Stir Fry",
        ingredients: ["chicken breast", "bell peppers", "onion", "soy sauce", "rice"],
        prepTime: 15,
        difficulty: "easy",
        servings: 3
    },
    {
        id: 3,
        name: "Vegetable Soup",
        ingredients: ["carrots", "celery", "onion", "vegetable broth", "tomatoes"],
        prepTime: 30,
        difficulty: "easy",
        servings: 6
    }
];

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Recipe Finder API is running!' });
});

// Get all recipes
app.get('/api/recipes', (req, res) => {
    res.json(sampleRecipes);
});

// Search recipes by ingredient or name
app.get('/api/recipes/search', (req, res) => {
    const { q } = req.query;

    if (!q) {
        return res.json(sampleRecipes);
    }

    const filtered = sampleRecipes.filter(recipe =>
        recipe.name.toLowerCase().includes(q.toLowerCase()) ||
        recipe.ingredients.some(ingredient =>
            ingredient.toLowerCase().includes(q.toLowerCase())
        )
    );

    res.json(filtered);
});

// Get recipe by ID
app.get('/api/recipes/:id', (req, res) => {
    const recipe = sampleRecipes.find(r => r.id === parseInt(req.params.id));

    if (!recipe) {
        return res.status(404).json({ error: 'Recipe not found' });
    }

    res.json(recipe);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});