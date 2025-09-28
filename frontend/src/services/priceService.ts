import type { Recipe, RecipeCost, IngredientPrice } from '@/types/recipe'

// Mock price database - in real app would come from API like Numbeo
export const INGREDIENT_PRICES: Record<string, IngredientPrice> = {
  // Proteins
  'chicken breast': { ingredient: 'chicken breast', pricePerUnit: 5.99, unit: 'lb', currency: 'USD' },
  'bacon': { ingredient: 'bacon', pricePerUnit: 6.50, unit: 'lb', currency: 'USD' },
  'eggs': { ingredient: 'eggs', pricePerUnit: 3.00, unit: 'dozen', currency: 'USD' },

  // Grains & Pasta
  'spaghetti': { ingredient: 'spaghetti', pricePerUnit: 2.50, unit: 'lb', currency: 'USD' },
  'rice': { ingredient: 'rice', pricePerUnit: 3.50, unit: 'lb', currency: 'USD' },

  // Vegetables
  'bell peppers': { ingredient: 'bell peppers', pricePerUnit: 1.50, unit: 'each', currency: 'USD' },
  'onion': { ingredient: 'onion', pricePerUnit: 1.20, unit: 'lb', currency: 'USD' },
  'carrots': { ingredient: 'carrots', pricePerUnit: 1.80, unit: 'lb', currency: 'USD' },
  'celery': { ingredient: 'celery', pricePerUnit: 2.00, unit: 'bunch', currency: 'USD' },
  'tomatoes': { ingredient: 'tomatoes', pricePerUnit: 2.99, unit: 'lb', currency: 'USD' },

  // Dairy & Cheese
  'parmesan cheese': { ingredient: 'parmesan cheese', pricePerUnit: 8.00, unit: 'lb', currency: 'USD' },

  // Condiments & Spices
  'soy sauce': { ingredient: 'soy sauce', pricePerUnit: 2.80, unit: 'bottle', currency: 'USD' },
  'black pepper': { ingredient: 'black pepper', pricePerUnit: 4.00, unit: 'oz', currency: 'USD' },

  // Liquids & Broths
  'vegetable broth': { ingredient: 'vegetable broth', pricePerUnit: 2.50, unit: 'carton', currency: 'USD' },
}

// Estimated quantities per recipe (this would be more sophisticated in a real app)
const INGREDIENT_QUANTITIES: Record<string, number> = {
  'chicken breast': 0.75, // lbs per recipe
  'bacon': 0.25,
  'eggs': 0.25, // of a dozen
  'spaghetti': 0.5,
  'rice': 0.33,
  'bell peppers': 2, // pieces
  'onion': 0.5,
  'carrots': 0.33,
  'celery': 0.5,
  'tomatoes': 0.5,
  'parmesan cheese': 0.125,
  'soy sauce': 0.1, // of a bottle
  'black pepper': 0.02, // oz
  'vegetable broth': 0.5, // of a carton
}

export class PriceService {
  /**
   * Calculate the total cost of a recipe based on ingredient prices
   */
  static calculateRecipeCost(recipe: Recipe): RecipeCost {
    const ingredientCosts: IngredientPrice[] = []
    let totalCost = 0

    recipe.ingredients.forEach(ingredient => {
      const normalizedIngredient = ingredient.toLowerCase().trim()

      // Get price from database or use default
      const priceData = INGREDIENT_PRICES[normalizedIngredient] || {
        ingredient: normalizedIngredient,
        pricePerUnit: 2.00, // Default price
        unit: 'item',
        currency: 'USD'
      }

      // Get estimated quantity needed for this recipe
      const quantity = INGREDIENT_QUANTITIES[normalizedIngredient] || 0.25

      // Calculate cost for this ingredient
      const ingredientTotalCost = priceData.pricePerUnit * quantity
      totalCost += ingredientTotalCost

      ingredientCosts.push({
        ...priceData,
        pricePerUnit: ingredientTotalCost // Store total cost for this ingredient in recipe
      })
    })

    return {
      recipeId: recipe.id,
      totalCost: Math.round(totalCost * 100) / 100, // Round to 2 decimal places
      costPerServing: Math.round((totalCost / recipe.servings) * 100) / 100,
      currency: 'USD',
      ingredientCosts
    }
  }

  /**
   * Get price per unit for a specific ingredient
   */
  static getIngredientPrice(ingredient: string): IngredientPrice | null {
    const normalized = ingredient.toLowerCase().trim()
    return INGREDIENT_PRICES[normalized] || null
  }

  /**
   * Add or update ingredient price in the database
   */
  static updateIngredientPrice(ingredient: string, price: number, unit: string): void {
    const normalized = ingredient.toLowerCase().trim()
    INGREDIENT_PRICES[normalized] = {
      ingredient: normalized,
      pricePerUnit: price,
      unit,
      currency: 'USD'
    }
  }

  /**
   * Get all available ingredient prices
   */
  static getAllPrices(): IngredientPrice[] {
    return Object.values(INGREDIENT_PRICES)
  }

  /**
   * Calculate cost comparison between multiple recipes
   */
  static compareRecipeCosts(recipes: Recipe[]): RecipeCost[] {
    return recipes
      .map(recipe => this.calculateRecipeCost(recipe))
      .sort((a, b) => a.totalCost - b.totalCost)
  }
}
