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
   * Get available API providers (for future use)
   */
  static async getProviders(): Promise<{available: string[], current: string, default: string}> {
    try {
      const response = await fetch(`${API_BASE_URL}/providers`)
      return await this.handleResponse<{available: string[], current: string, default: string}>(response)
    } catch (error) {
      console.error('Error fetching providers:', error)
      throw error
    }
  }
}
