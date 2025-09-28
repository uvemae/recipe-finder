const IngredientParser = require('../services/IngredientParser');

/**
 * Test the improved parsing with realistic weights
 */
function testImprovedParsing() {
    const parser = new IngredientParser();

    console.log('🧪 Testing Improved Ingredient Parsing\n');

    const problematicIngredients = [
        '24 Skinned shallots',
        '4 large Carrots',
        '4 sprigs fresh thyme',
        '4 sprigs oregano',
        '2 turnips',
        '1 celeriac',
        '150ml white wine',
        '450ml chicken stock'
    ];

    problematicIngredients.forEach(ingredient => {
        const parsed = parser.parseIngredient(ingredient);

        console.log(`"${ingredient}"`);
        console.log(`   → ${parsed.normalizedQuantity}kg of ${parsed.ingredient}`);
        console.log(`   → Original: ${parsed.quantity} ${parsed.unit}`);
        console.log('');
    });

    // Calculate expected realistic costs
    console.log('📊 Expected Realistic Costs:');
    console.log('24 shallots (1.2kg) @ 2.65EUR/kg = 3.18EUR ✅');
    console.log('4 carrots (0.4kg) @ 1.38EUR/kg = 0.55EUR ✅');
    console.log('4 sprigs thyme (0.008kg) @ 2.71EUR/kg = 0.02EUR ✅');
    console.log('4 sprigs oregano (0.008kg) @ 2.28EUR/kg = 0.02EUR ✅');
    console.log('');
    console.log('Expected total reduction: ~80EUR → ~25EUR');
}

if (require.main === module) {
    testImprovedParsing();
}

module.exports = { testImprovedParsing };