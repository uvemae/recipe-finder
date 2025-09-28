/**
 * Create Estonian translations for extracted ingredients
 */
const extractAllIngredients = require('./extractIngredients');
const DatabaseService = require('../services/DatabaseService');

// Comprehensive Estonian translations for common ingredients
const estonianTranslations = {
    // Proteins & Meat
    'beef': { et: 'veiseliha', category: 'meat' },
    'chicken': { et: 'kana', category: 'meat' },
    'chicken breast': { et: 'kanafilee', category: 'meat' },
    'chicken thigh': { et: 'kanakõnt', category: 'meat' },
    'pork': { et: 'sealiha', category: 'meat' },
    'lamb': { et: 'lambaliha', category: 'meat' },
    'fish': { et: 'kala', category: 'seafood' },
    'salmon': { et: 'lõhe', category: 'seafood' },
    'prawns': { et: 'krevetid', category: 'seafood' },
    'bacon': { et: 'peekon', category: 'meat' },
    'eggs': { et: 'munad', category: 'dairy' },
    'egg': { et: 'muna', category: 'dairy' },
    'oysters': { et: 'austrid', category: 'seafood' },

    // Dairy
    'butter': { et: 'või', category: 'dairy' },
    'milk': { et: 'piim', category: 'dairy' },
    'cream': { et: 'koor', category: 'dairy' },
    'heavy cream': { et: 'raskekoor', category: 'dairy' },
    'sour cream': { et: 'hapukoor', category: 'dairy' },
    'cheese': { et: 'juust', category: 'dairy' },
    'parmesan': { et: 'parmesani juust', category: 'dairy' },
    'yogurt': { et: 'jogurt', category: 'dairy' },

    // Vegetables
    'onion': { et: 'sibul', category: 'vegetables' },
    'onions': { et: 'sibulad', category: 'vegetables' },
    'garlic': { et: 'küüslauk', category: 'vegetables' },
    'carrot': { et: 'porgand', category: 'vegetables' },
    'carrots': { et: 'porgandid', category: 'vegetables' },
    'tomato': { et: 'tomat', category: 'vegetables' },
    'tomatoes': { et: 'tomatid', category: 'vegetables' },
    'cherry tomatoes': { et: 'kirsitomatid', category: 'vegetables' },
    'potato': { et: 'kartul', category: 'vegetables' },
    'potatoes': { et: 'kartulid', category: 'vegetables' },
    'cabbage': { et: 'kapsas', category: 'vegetables' },
    'lettuce': { et: 'salat', category: 'vegetables' },
    'celery': { et: 'seller', category: 'vegetables' },
    'beetroot': { et: 'peet', category: 'vegetables' },
    'fennel': { et: 'aedrõi', category: 'vegetables' },
    'aubergine': { et: 'baklažaan', category: 'vegetables' },
    'peppers': { et: 'paprikad', category: 'vegetables' },
    'pepper': { et: 'paprika', category: 'vegetables' },
    'red pepper': { et: 'punane paprika', category: 'vegetables' },
    'yellow pepper': { et: 'kollane paprika', category: 'vegetables' },
    'green pepper': { et: 'roheline paprika', category: 'vegetables' },
    'chilli': { et: 'tšilli', category: 'vegetables' },
    'avocado': { et: 'avokaado', category: 'vegetables' },
    'beans': { et: 'oad', category: 'vegetables' },
    'cannellini beans': { et: 'valged oad', category: 'vegetables' },
    'peas': { et: 'herneid', category: 'vegetables' },
    'sugar snap peas': { et: 'suhkruherneid', category: 'vegetables' },
    'shallots': { et: 'šalottsibulad', category: 'vegetables' },
    'challots': { et: 'šalottsibulad', category: 'vegetables' }, // Common misspelling
    'spring onions': { et: 'roheline sibul', category: 'vegetables' },
    'corn': { et: 'mais', category: 'vegetables' },

    // Fruits
    'apple': { et: 'õun', category: 'fruits' },
    'apples': { et: 'õunad', category: 'fruits' },
    'lemon': { et: 'sidrun', category: 'fruits' },
    'lime': { et: 'laim', category: 'fruits' },
    'blackberries': { et: 'mustad marjad', category: 'fruits' },
    'olives': { et: 'oliivid', category: 'fruits' },

    // Grains & Starches
    'flour': { et: 'jahu', category: 'grains' },
    'plain flour': { et: 'nisujahu', category: 'grains' },
    'bread': { et: 'leib', category: 'grains' },
    'pasta': { et: 'pasta', category: 'grains' },
    'fettuccine': { et: 'fettuccine pasta', category: 'grains' },
    'linguine': { et: 'linguine pasta', category: 'grains' },
    'rice': { et: 'riis', category: 'grains' },
    'buns': { et: 'saiakesed', category: 'grains' },
    'tortilla': { et: 'tortilla', category: 'grains' },
    'pastry': { et: 'tainas', category: 'grains' },
    'puff pastry': { et: 'lehttainas', category: 'grains' },
    'biscuits': { et: 'küpsised', category: 'grains' },

    // Oils & Condiments
    'oil': { et: 'õli', category: 'oils' },
    'olive oil': { et: 'oliiviõli', category: 'oils' },
    'vegetable oil': { et: 'taimne õli', category: 'oils' },
    'rapeseed oil': { et: 'rapsõli', category: 'oils' },
    'vinegar': { et: 'äädikas', category: 'condiments' },
    'wine vinegar': { et: 'veinidikaat', category: 'condiments' },
    'malt vinegar': { et: 'linnaseseäädikas', category: 'condiments' },
    'soy sauce': { et: 'sojakaste', category: 'condiments' },
    'worcestershire sauce': { et: 'worcestershire kaste', category: 'condiments' },
    'mustard': { et: 'sinep', category: 'condiments' },
    'mayonnaise': { et: 'majonees', category: 'condiments' },
    'hotsauce': { et: 'tulisekaste', category: 'condiments' },
    'salsa': { et: 'salsa', category: 'condiments' },
    'tomato sauce': { et: 'tomatikaste', category: 'condiments' },
    'tomato puree': { et: 'tomatipüree', category: 'condiments' },

    // Spices & Herbs
    'salt': { et: 'sool', category: 'spices' },
    'pepper': { et: 'pipar', category: 'spices' },
    'black pepper': { et: 'must pipar', category: 'spices' },
    'white pepper': { et: 'valge pipar', category: 'spices' },
    'cayenne pepper': { et: 'cayenne pipar', category: 'spices' },
    'paprika': { et: 'paprikapulber', category: 'spices' },
    'cumin': { et: 'köömen', category: 'spices' },
    'coriander': { et: 'koriander', category: 'spices' },
    'turmeric': { et: 'kurkum', category: 'spices' },
    'ginger': { et: 'ingver', category: 'spices' },
    'thyme': { et: 'liivatee', category: 'herbs' },
    'parsley': { et: 'petersell', category: 'herbs' },
    'basil': { et: 'basiilik', category: 'herbs' },
    'dill': { et: 'till', category: 'herbs' },
    'bay leaf': { et: 'loorberileht', category: 'herbs' },
    'cinnamon': { et: 'kaneel', category: 'spices' },
    'nutmeg': { et: 'muskaatpähkel', category: 'spices' },
    'allspice': { et: 'nelgipipar', category: 'spices' },
    'cajun': { et: 'cajun vürtsisegu', category: 'spices' },
    'fennel': { et: 'aedrohi', category: 'spices' },

    // Nuts & Seeds
    'almonds': { et: 'mandlid', category: 'nuts' },
    'ground almonds': { et: 'jahvatatud mandlid', category: 'nuts' },
    'flaked almonds': { et: 'mandlilaastud', category: 'nuts' },
    'peanut butter': { et: 'maapähklivõi', category: 'nuts' },

    // Sugars & Sweeteners
    'sugar': { et: 'suhkur', category: 'sweeteners' },
    'caster sugar': { et: 'peensuhkur', category: 'sweeteners' },
    'brown sugar': { et: 'pruun suhkur', category: 'sweeteners' },
    'demerara sugar': { et: 'demerara suhkur', category: 'sweeteners' },
    'honey': { et: 'mesi', category: 'sweeteners' },

    // Liquids
    'water': { et: 'vesi', category: 'liquids' },
    'wine': { et: 'vein', category: 'liquids' },
    'red wine': { et: 'punane vein', category: 'liquids' },
    'beer': { et: 'õlu', category: 'liquids' },
    'stout': { et: 'tume õlu', category: 'liquids' },
    'stock': { et: 'puljong', category: 'liquids' },
    'beef stock': { et: 'veisepuljong', category: 'liquids' },
    'chicken stock': { et: 'kanapuljong', category: 'liquids' },
    'vegetable stock': { et: 'köögiviljapuljong', category: 'liquids' },
    'coconut milk': { et: 'kookospiim', category: 'liquids' },

    // Baking
    'baking powder': { et: 'küpsetuspulber', category: 'baking' },
    'cornstarch': { et: 'maisitärklis', category: 'baking' },
    'corn flour': { et: 'maisijahu', category: 'baking' },
    'yeast': { et: 'pärm', category: 'baking' },
    'vanilla': { et: 'vanilje', category: 'baking' },
    'almond extract': { et: 'mandliessents', category: 'baking' },

    // Specialty Items
    'tamarind paste': { et: 'tamarindipasta', category: 'specialty' },
    'scotch bonnet': { et: 'scotch bonnet tšilli', category: 'specialty' },
    'halloumi': { et: 'halloumi juust', category: 'specialty' },
    'fromage frais': { et: 'fromage frais', category: 'specialty' },
    'ice cream': { et: 'jäätis', category: 'desserts' }
};

async function createEstonianTranslations() {
    try {
        console.log('🔄 Creating Estonian translations for ingredients...');

        // Extract ingredients from recipes
        const extractedData = await extractAllIngredients();
        console.log(`Found ${extractedData.cleanedIngredients.length} unique ingredients`);

        // Initialize database
        const db = new DatabaseService();
        await db.initialize();

        // Create translation records
        const translations = [];
        let translatedCount = 0;
        let missingCount = 0;

        for (const ingredient of extractedData.cleanedIngredients) {
            // Clean ingredient further
            const cleaned = ingredient
                .replace(/^\d+[\s\/]*\w*\s+/g, '') // Remove quantities like "1/2", "2 tbs"
                .replace(/\b(cup|cups|tsp|tbsp|tablespoon|teaspoon|pound|pounds|lb|oz|ounce|clove|cloves|sprig|sprigs|can|pot|handful|leaves|pinch|to serve|garnish|grated|chopped|diced|minced|crushed|peeled|large|medium|small|finely|roughly)\b/gi, '')
                .replace(/\s+/g, ' ')
                .trim()
                .toLowerCase();

            if (!cleaned || cleaned.length < 2) continue;

            // Check if we have Estonian translation
            const estonianData = estonianTranslations[cleaned];

            if (estonianData) {
                translations.push({
                    english: cleaned,
                    estonian: estonianData.et,
                    category: estonianData.category,
                    confidence: 'high',
                    source: 'manual_translation'
                });
                translatedCount++;
            } else {
                translations.push({
                    english: cleaned,
                    estonian: null,
                    category: 'unknown',
                    confidence: 'none',
                    source: 'missing'
                });
                missingCount++;
                console.log(`❌ Missing translation: ${cleaned}`);
            }
        }

        console.log(`\n📊 Translation Statistics:`);
        console.log(`✅ Translated: ${translatedCount}`);
        console.log(`❌ Missing: ${missingCount}`);
        console.log(`📈 Coverage: ${Math.round(translatedCount / (translatedCount + missingCount) * 100)}%`);

        // Store in database
        console.log('\n💾 Storing translations in database...');

        for (const translation of translations) {
            if (translation.estonian) {
                // Store successful translations
                await db.runQuery(`
                    INSERT OR REPLACE INTO ingredient_translations
                    (english_name, estonian_name, category, confidence, source, created_at)
                    VALUES (?, ?, ?, ?, ?, datetime('now'))
                `, [
                    translation.english,
                    translation.estonian,
                    translation.category,
                    translation.confidence,
                    translation.source
                ]);
            }
        }

        console.log('✅ Estonian translations created and stored successfully!');

        return {
            total: extractedData.cleanedIngredients.length,
            translated: translatedCount,
            missing: missingCount,
            coverage: Math.round(translatedCount / (translatedCount + missingCount) * 100),
            translations: translations.filter(t => t.estonian)
        };

    } catch (error) {
        console.error('❌ Error creating Estonian translations:', error);
        throw error;
    }
}

// Create ingredient_translations table if it doesn't exist
async function createTranslationTable() {
    const db = new DatabaseService();
    await db.initialize();

    await db.runQuery(`
        CREATE TABLE IF NOT EXISTS ingredient_translations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            english_name TEXT UNIQUE NOT NULL,
            estonian_name TEXT NOT NULL,
            category TEXT,
            confidence TEXT DEFAULT 'medium',
            source TEXT DEFAULT 'manual',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    console.log('✅ Translation table created/verified');
}

// Run if called directly
if (require.main === module) {
    createTranslationTable()
        .then(() => createEstonianTranslations())
        .then(result => {
            console.log(`\n🎉 Complete! ${result.coverage}% translation coverage achieved.`);
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Failed:', error);
            process.exit(1);
        });
}

module.exports = { createEstonianTranslations, createTranslationTable };