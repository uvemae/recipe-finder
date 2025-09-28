export interface Recipe {
  id: number
  name: string
  ingredients: string[]
  instructions?: string[]
  prepTime: number
  difficulty: 'easy' | 'medium' | 'hard'
  servings: number
  cuisine?: string
  category?: string
  image?: string
  tags?: string[]
  videoUrl?: string
  source?: string
}

export interface IngredientPrice {
  ingredient: string
  pricePerUnit: number
  unit: string
  currency: string
  recipePortionCost: number
  confidence?: 'high' | 'medium' | 'low' | 'failed'
  translationFound?: boolean
  dataSource?: 'store_scraping' | 'fallback_price' | 'api_translation'
  sources?: string[]
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
