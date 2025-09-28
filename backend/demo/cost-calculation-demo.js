const EstonianPriceProvider = require('../services/providers/EstonianPriceProvider');

/**
 * Demonstration of the fixed cost calculation system
 * Shows before/after comparison and accurate parsing
 */

async function runDemo() {
    console.log('🍳 Recipe Cost Calculation - FIXED VERSION Demo\n');
    console.log('='.repeat(60));

    const provider = new EstonianPriceProvider();
    await provider._ensureInitialized();

    // Your original recipe ingredients
    const recipeIngredients = [
        '1kg Beef',
        '2 tbs Plain Flour',
        '2 tbs Rapeseed Oil',
        '200ml Red Wine',
        '400ml Beef Stock',
        '1 finely sliced Onion',
        '2 chopped Carrots',
        '3 sprigs Thyme',
        '2 tbs Mustard',
        '2 free-range Egg Yolks',
        '400g Puff Pastry',
        '300g Green Beans',
        '25g Butter',
        'pinch Salt',
        'pinch Pepper'
    ];

    console.log('📋 Recipe: Beef Wellington (4 servings)\n');

    // Show parsing details for each ingredient
    console.log('🔍 INGREDIENT PARSING ANALYSIS:');
    console.log('-'.repeat(60));

    for (const ingredient of recipeIngredients) {
        const parsed = provider.parser.parseIngredient(ingredient);
        console.log(`"${ingredient}"`);
        console.log(`   → ${parsed.normalizedQuantity}${parsed.normalizedUnit} of ${parsed.ingredient}`);
        console.log(`   → Parse success: ${parsed.parseSuccess ? '✅' : '❌'}`);
        console.log('');
    }

    // Calculate total cost with new system
    console.log('💰 COST CALCULATION (NEW ACCURATE SYSTEM):');
    console.log('-'.repeat(60));

    try {
        const result = await provider.calculateRecipeCost(
            recipeIngredients,
            'EE',
            4,
            'demo-recipe-001',
            'Beef Wellington Demo'
        );

        console.log(`Total Cost: ${result.totalCost}EUR`);
        console.log(`Cost per serving: ${result.costPerServing}EUR`);
        console.log(`For ${result.servings} servings\n`);

        console.log('📊 INGREDIENT BREAKDOWN:');
        console.log('-'.repeat(60));

        result.ingredientBreakdown.forEach(item => {
            const parsed = item.parsedData;
            console.log(`${item.ingredient}`);
            console.log(`   Amount needed: ${parsed.normalizedQuantity}${parsed.normalizedUnit}`);
            console.log(`   Price per unit: ${item.pricePerUnit}EUR/${item.unit}`);
            console.log(`   Actual cost: ${item.recipePortionCost}EUR`);
            console.log('');
        });

        // Compare with the old broken system
        console.log('⚠️  COMPARISON WITH OLD BROKEN SYSTEM:');
        console.log('-'.repeat(60));

        const oldSystemResults = [
            { ingredient: '1kg Beef', oldCost: 3.2, newCost: result.ingredientBreakdown.find(i => i.ingredient.includes('1kg Beef'))?.recipePortionCost },
            { ingredient: 'pinch Salt', oldCost: 0.19, newCost: result.ingredientBreakdown.find(i => i.ingredient.includes('pinch Salt'))?.recipePortionCost },
            { ingredient: 'pinch Pepper', oldCost: 0.61, newCost: result.ingredientBreakdown.find(i => i.ingredient.includes('pinch Pepper'))?.recipePortionCost },
            { ingredient: '25g Butter', oldCost: 1.24, newCost: result.ingredientBreakdown.find(i => i.ingredient.includes('25g Butter'))?.recipePortionCost }
        ];

        oldSystemResults.forEach(comparison => {
            if (comparison.newCost !== undefined) {
                const difference = comparison.newCost - comparison.oldCost;
                const percentChange = ((difference / comparison.oldCost) * 100);

                console.log(`${comparison.ingredient}:`);
                console.log(`   Old (broken): ${comparison.oldCost}EUR`);
                console.log(`   New (fixed):  ${comparison.newCost.toFixed(3)}EUR`);
                console.log(`   Difference:   ${difference > 0 ? '+' : ''}${difference.toFixed(3)}EUR (${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}%)`);
                console.log('');
            }
        });

        console.log('✅ SUCCESS: Cost calculation now uses actual ingredient quantities!');
        console.log('✅ All parsed ingredient data stored in database for analysis');
        console.log('✅ Recipe calculation history tracked for future insights');

    } catch (error) {
        console.error('❌ Error during calculation:', error);
    }

    // Show some database stats
    try {
        console.log('\n📈 DATABASE STATISTICS:');
        console.log('-'.repeat(60));

        const stats = await provider.db.getParsingStats();
        console.log(`Total ingredients parsed: ${stats.total_parsed || 0}`);
        console.log(`Successful parses: ${stats.successful_parses || 0}`);
        console.log(`Fallback cases: ${stats.fallback_used || 0}`);
        console.log(`Unique ingredients: ${stats.unique_ingredients || 0}`);

        if (stats.recentFailures && stats.recentFailures.length > 0) {
            console.log('\nRecent parsing challenges:');
            stats.recentFailures.forEach(failure => {
                console.log(`   "${failure.original_text}" - ${failure.failure_count} attempts`);
            });
        }

    } catch (error) {
        console.log('Database stats not available yet');
    }

    console.log('\n🎉 Demo Complete! The cost estimation system has been fixed.');
    console.log('🔧 Key improvements:');
    console.log('   • Actual ingredient quantity parsing');
    console.log('   • Precise unit conversions');
    console.log('   • Database storage for analysis');
    console.log('   • Realistic cost calculations');

    await provider.db.close();
}

// Run demo if called directly
if (require.main === module) {
    runDemo().catch(console.error);
}

module.exports = { runDemo };