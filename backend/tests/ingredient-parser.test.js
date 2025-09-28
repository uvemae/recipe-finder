const IngredientParser = require('../services/IngredientParser');

/**
 * Simple test suite for IngredientParser
 * Run with: node backend/tests/ingredient-parser.test.js
 */

function runTests() {
    const parser = new IngredientParser();

    console.log('🧪 Running Ingredient Parser Tests\n');

    const testCases = [
        // Your exact recipe ingredients
        { input: '1kg Beef', expected: { quantity: 1, unit: 'kg', ingredient: 'Beef' } },
        { input: '2 tbs Plain Flour', expected: { quantity: 2, unit: 'tbsp', ingredient: 'Plain Flour' } },
        { input: '2 tbs Rapeseed Oil', expected: { quantity: 2, unit: 'tbsp', ingredient: 'Rapeseed Oil' } },
        { input: '200ml Red Wine', expected: { quantity: 0.2, unit: 'liter', ingredient: 'Red Wine' } },
        { input: '400ml Beef Stock', expected: { quantity: 0.4, unit: 'liter', ingredient: 'Beef Stock' } },
        { input: '1 finely sliced Onion', expected: { quantity: 1, unit: 'piece', ingredient: 'Onion' } },
        { input: '2 chopped Carrots', expected: { quantity: 2, unit: 'piece', ingredient: 'Carrots' } },
        { input: '3 sprigs Thyme', expected: { quantity: 3, unit: 'kg', ingredient: 'Thyme' } },
        { input: '2 tbs Mustard', expected: { quantity: 2, unit: 'tbsp', ingredient: 'Mustard' } },
        { input: '2 free-range Egg Yolks', expected: { quantity: 2, unit: 'piece', ingredient: 'Egg Yolks' } },
        { input: '400g Puff Pastry', expected: { quantity: 0.4, unit: 'kg', ingredient: 'Puff Pastry' } },
        { input: '300g Green Beans', expected: { quantity: 0.3, unit: 'kg', ingredient: 'Green Beans' } },
        { input: '25g Butter', expected: { quantity: 0.025, unit: 'kg', ingredient: 'Butter' } },
        { input: 'pinch Salt', expected: { quantity: 0.001, unit: 'kg', ingredient: 'Salt' } },
        { input: 'pinch Pepper', expected: { quantity: 0.001, unit: 'kg', ingredient: 'Pepper' } },

        // Additional edge cases
        { input: '1.5 cups Milk', expected: { quantity: 1.5 * 0.237, unit: 'liter', ingredient: 'Milk' } },
        { input: 'dash Vanilla', expected: { quantity: 0.006, unit: 'kg', ingredient: 'Vanilla' } },
        { input: '1 lb Ground Beef', expected: { quantity: 0.454, unit: 'kg', ingredient: 'Ground Beef' } }
    ];

    let passed = 0;
    let failed = 0;

    testCases.forEach((testCase, index) => {
        const result = parser.parseIngredient(testCase.input);

        console.log(`\n📋 Test ${index + 1}: "${testCase.input}"`);
        console.log(`   Expected: ${testCase.expected.quantity} ${testCase.expected.unit} of ${testCase.expected.ingredient}`);
        console.log(`   Got:      ${result.normalizedQuantity} ${result.normalizedUnit} of ${result.ingredient}`);

        const quantityMatch = Math.abs(result.normalizedQuantity - testCase.expected.quantity) < 0.001;
        const unitMatch = result.normalizedUnit === testCase.expected.unit;
        const ingredientMatch = result.ingredient.includes(testCase.expected.ingredient);

        if (quantityMatch && unitMatch && ingredientMatch) {
            console.log(`   ✅ PASS`);
            passed++;
        } else {
            console.log(`   ❌ FAIL`);
            if (!quantityMatch) console.log(`      Quantity mismatch: expected ${testCase.expected.quantity}, got ${result.normalizedQuantity}`);
            if (!unitMatch) console.log(`      Unit mismatch: expected ${testCase.expected.unit}, got ${result.normalizedUnit}`);
            if (!ingredientMatch) console.log(`      Ingredient mismatch: expected to contain "${testCase.expected.ingredient}", got "${result.ingredient}"`);
            failed++;
        }
    });

    console.log(`\n📊 Test Results:`);
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    // Test cost calculation scenarios
    console.log(`\n💰 Cost Calculation Examples:`);

    const costTests = [
        { ingredient: '1kg Beef', pricePerKg: 12.79 },
        { ingredient: '2 tbs Plain Flour', pricePerKg: 1.15 },
        { ingredient: 'pinch Salt', pricePerKg: 0.77 },
        { ingredient: '200ml Red Wine', pricePerLiter: 2.31 }
    ];

    costTests.forEach(test => {
        const parsed = parser.parseIngredient(test.ingredient);
        let expectedCost;

        if (test.pricePerKg) {
            expectedCost = parsed.normalizedQuantity * test.pricePerKg;
        } else if (test.pricePerLiter) {
            expectedCost = parsed.normalizedQuantity * test.pricePerLiter;
        }

        console.log(`   ${test.ingredient}: ${parsed.normalizedQuantity}${parsed.normalizedUnit} × ${test.pricePerKg || test.pricePerLiter}EUR = ${expectedCost.toFixed(3)}EUR`);
    });
}

// Run tests if called directly
if (require.main === module) {
    runTests();
}

module.exports = { runTests };