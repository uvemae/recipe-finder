/**
 * Extract all unique ingredients from TheMealDB recipes and prepare for Estonian translation
 */
const RecipeServiceFactory = require('../services/RecipeServiceFactory');
const IngredientParser = require('../services/IngredientParser');

async function extractAllIngredients() {
    try {
        // Initialize services
        const recipeServiceFactory = new RecipeServiceFactory();
        const recipeProvider = recipeServiceFactory.createProvider();
        const parser = new IngredientParser();

        console.log('📋 Extracting ingredients from TheMealDB recipes...');

        // Get all recipes
        const recipes = await recipeProvider.getAllRecipes();
        console.log(`Found ${recipes.length} recipes`);

        // Extract and normalize all ingredients
        const allIngredients = new Set();
        const rawIngredients = new Set();

        recipes.forEach(recipe => {
            recipe.ingredients.forEach(ingredient => {
                // Store raw ingredient
                rawIngredients.add(ingredient);

                // Parse and clean ingredient
                const parsed = parser.parseIngredient(ingredient);
                if (parsed.parseSuccess && parsed.ingredient) {
                    // Clean the ingredient name
                    const cleaned = parsed.ingredient.toLowerCase()
                        .replace(/\b(fresh|dried|chopped|diced|minced|crushed|peeled|large|medium|small|red|white|green|yellow|cooked|raw|whole|ground|sliced|grated|shredded)\b/gi, '')
                        .replace(/\s+/g, ' ')
                        .trim();

                    if (cleaned && cleaned.length > 1) {
                        allIngredients.add(cleaned);
                    }
                }
            });
        });

        console.log(`\n📊 Statistics:`);
        console.log(`Raw ingredients: ${rawIngredients.size}`);
        console.log(`Cleaned unique ingredients: ${allIngredients.size}`);

        // Convert to sorted arrays
        const sortedIngredients = Array.from(allIngredients).sort();
        const sortedRawIngredients = Array.from(rawIngredients).sort();

        console.log(`\n🔤 Top 50 cleaned ingredients:`);
        sortedIngredients.slice(0, 50).forEach((ingredient, index) => {
            console.log(`${index + 1}. ${ingredient}`);
        });

        // Return structured data
        return {
            cleanedIngredients: sortedIngredients,
            rawIngredients: sortedRawIngredients,
            totalRecipes: recipes.length,
            statistics: {
                rawCount: rawIngredients.size,
                cleanedCount: allIngredients.size
            }
        };

    } catch (error) {
        console.error('❌ Error extracting ingredients:', error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    extractAllIngredients()
        .then(result => {
            console.log('\n✅ Ingredient extraction complete!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Failed:', error);
            process.exit(1);
        });
}

module.exports = extractAllIngredients;