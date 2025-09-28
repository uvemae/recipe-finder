import type { Recipe } from '@/types/recipe'

const API_BASE_URL = 'http://localhost:3001/api'

interface ApiResponse<T> {
  success: boolean
  data: T
  count?: number
  query?: string
  provider?: string
  error?: string
  message?: string
}

export class ApiService {
  /**
   * Handle API response and extract data
   */
  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result: ApiResponse<T> = await response.json()

    if (!result.success) {
      throw new Error(result.message || result.error || 'API request failed')
    }

    return result.data
  }

  static async fetchRecipes(): Promise<Recipe[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/recipes`)
      return await this.handleResponse<Recipe[]>(response)
    } catch (error) {
      console.error('Error fetching recipes:', error)
      throw error
    }
  }

  static async searchRecipes(query: string): Promise<Recipe[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/recipes/search?q=${encodeURIComponent(query)}`)
      return await this.handleResponse<Recipe[]>(response)
    } catch (error) {
      console.error('Error searching recipes:', error)
      throw error
    }
  }

  static async fetchRecipeById(id: number): Promise<Recipe> {
    try {
      const response = await fetch(`${API_BASE_URL}/recipes/${id}`)
      return await this.handleResponse<Recipe>(response)
    } catch (error) {
      console.error('Error fetching recipe:', error)
      throw error
    }
  }

  /**
   * Calculate recipe cost using backend price API
   * @param ingredients - Array of ingredient names
   * @param servings - Number of servings (default 4)
   * @param country - Country code (default 'DE' for Germany)
   */
  static async calculateRecipeCost(ingredients: string[], servings: number = 4, country: string = 'DE'): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/prices/recipe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ingredients,
          servings,
          country
        })
      })
      return await this.handleResponse<any>(response)
    } catch (error) {
      console.error('Error calculating recipe cost:', error)
      throw error
    }
  }

  /**
   * Get supported countries for pricing
   */
  static async getSupportedCountries(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/prices/countries`)
      return await this.handleResponse<any>(response)
    } catch (error) {
      console.error('Error fetching supported countries:', error)
      throw error
    }
  }
}
