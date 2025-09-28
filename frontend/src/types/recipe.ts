export interface Recipe {
  id: number
  name: string
  ingredients: string[]
  prepTime: number
  difficulty: 'easy' | 'medium' | 'hard'
  servings: number
}

export interface IngredientPrice {
  ingredient: string
  pricePerUnit: number
  unit: string
  currency: string
}

export interface RecipeCost {
  recipeId: number
  totalCost: number
  costPerServing: number
  currency: string
  ingredientCosts: IngredientPrice[]
}

export interface SearchFilters {
  query: string
  difficulty?: 'easy' | 'medium' | 'hard'
  maxPrepTime?: number
}
