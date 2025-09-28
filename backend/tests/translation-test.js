const EstonianPriceProvider = require('../services/providers/EstonianPriceProvider');

/**
 * Test Estonian ingredient translation system
 */
async function testTranslation() {
    console.log('🔤 Testing Estonian Ingredient Translation\n');

    const provider = new EstonianPriceProvider();

    const testIngredients = [
        '2kg cut into 3cm cubes lamb loin chops',
        '24 Skinned shallots',
        '4 large Carrots',
        '2 turnips',
        '1 celeriac',
        '350g charlotte potatoes',
        '150ml white wine',
        '1 tsp caster sugar',
        '4 sprigs fresh thyme',
        '4 sprigs oregano',
        '450ml chicken stock',
        '300g whole wheat'
    ];

    console.log('🧪 Translation Results:');
    console.log('-'.repeat(60));

    testIngredients.forEach(ingredient => {
        const normalized = provider._normalizeIngredient(ingredient);

        console.log(`"${ingredient}"`);
        console.log(`   English: ${normalized.english}`);
        console.log(`   Estonian: ${normalized.estonian}`);
        console.log(`   Search term: ${normalized.searchTerm}`);
        console.log(`   Category: ${normalized.category}`);

        const hasTranslation = normalized.estonian !== normalized.english;
        console.log(`   ✅ Has translation: ${hasTranslation ? 'YES' : 'NO'}`);
        console.log('');
    });

    console.log('📊 Expected Results:');
    console.log('- lamb loin chops → lambaliha ✅');
    console.log('- shallots → sibulad ✅');
    console.log('- carrots → porgandid ✅');
    console.log('- white wine → valge vein ✅');
    console.log('- thyme → liivatee ✅');
    console.log('- chicken stock → kanabuljong ✅');
}

if (require.main === module) {
    testTranslation().catch(console.error);
}

module.exports = { testTranslation };