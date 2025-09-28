<template>
  <div class="recipe-detail">
    <div v-if="loading" class="loading">
      Loading recipe...
    </div>

    <div v-else-if="error" class="error">
      {{ error }}
      <router-link to="/" class="back-link">← Back to recipes</router-link>
    </div>

    <div v-else-if="recipe" class="recipe-content">
      <div class="recipe-header">
        <router-link to="/" class="back-link">← Back to recipes</router-link>
        <h1>{{ recipe.name }}</h1>
        <div class="recipe-meta">
          <span class="prep-time">⏱️ {{ recipe.prepTime }} minutes</span>
          <span class="difficulty" :class="recipe.difficulty">
            {{ recipe.difficulty }}
          </span>
          <span class="servings">👥 {{ recipe.servings }} servings</span>
        </div>
      </div>

      <div class="recipe-body">
        <div class="ingredients-section">
          <h2>Ingredients</h2>
          <ul class="ingredients-list">
            <li v-for="ingredient in recipe.ingredients" :key="ingredient">
              {{ ingredient }}
            </li>
          </ul>
        </div>

        <div class="cost-section">
          <h2>Cost Estimation (Germany)</h2>
          <div v-if="costLoading" class="calculating">
            Calculating costs...
          </div>
          <div v-else-if="costCalculation" class="cost-display">
            <div class="total-cost">
              <strong>Total Cost: {{ costCalculation.totalCost }}{{ costCalculation.currency }}</strong>
            </div>
            <div class="cost-per-serving">
              Cost per serving: {{ costCalculation.costPerServing }}{{ costCalculation.currency }}
            </div>
            <div class="serving-info">
              For {{ costCalculation.servings }} servings
            </div>
            <div class="ingredient-costs">
              <h3>Ingredient Breakdown:</h3>
              <div v-for="ingredient in costCalculation.ingredientBreakdown" :key="ingredient.ingredient" class="ingredient-cost">
                <span class="ingredient-name">{{ ingredient.ingredient }}</span>
                <span class="ingredient-price">
                  {{ ingredient.recipePortionCost }}{{ ingredient.currency }}
                  <small>({{ ingredient.fullUnitCost }}{{ ingredient.currency }}/{{ ingredient.unit }})</small>
                </span>
              </div>
            </div>
          </div>
          <div v-else class="cost-error">
            Unable to calculate costs. Please try again later.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ApiService } from '@/services/api'
import type { Recipe } from '@/types/recipe'

const route = useRoute()
const recipe = ref<Recipe | null>(null)
const costCalculation = ref<any | null>(null)
const loading = ref(true)
const error = ref('')
const costLoading = ref(false)

const fetchRecipe = async () => {
  try {
    const recipeId = parseInt(route.params.id as string)
    if (isNaN(recipeId)) {
      throw new Error('Invalid recipe ID')
    }

    recipe.value = await ApiService.fetchRecipeById(recipeId)

    // Calculate cost after recipe is loaded
    if (recipe.value) {
      await calculateCost()
    }
  } catch (err) {
    error.value = 'Failed to load recipe. Please try again.'
    console.error('Error fetching recipe:', err)
  } finally {
    loading.value = false
  }
}

const calculateCost = async () => {
  if (!recipe.value) return

  try {
    costLoading.value = true
    costCalculation.value = await ApiService.calculateRecipeCost(
      recipe.value.ingredients,
      recipe.value.servings,
      'DE' // Germany as default
    )
  } catch (err) {
    console.error('Error calculating cost:', err)
    costCalculation.value = null
  } finally {
    costLoading.value = false
  }
}

onMounted(() => {
  fetchRecipe()
})
</script>

<style scoped>
.recipe-detail {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.loading, .error {
  text-align: center;
  padding: 40px;
  font-size: 18px;
}

.error {
  color: #dc3545;
  background-color: #f8d7da;
  border-radius: 8px;
}

.back-link {
  color: #42b883;
  text-decoration: none;
  font-weight: 500;
  margin-bottom: 20px;
  display: inline-block;
}

.back-link:hover {
  text-decoration: underline;
}

.recipe-header h1 {
  font-size: 2.5em;
  color: #2c3e50;
  margin: 10px 0;
}

.recipe-meta {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  font-size: 16px;
}

.prep-time, .servings {
  color: #666;
}

.difficulty {
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: bold;
  text-transform: uppercase;
  font-size: 14px;
}

.difficulty.easy {
  background-color: #d4edda;
  color: #155724;
}

.difficulty.medium {
  background-color: #fff3cd;
  color: #856404;
}

.difficulty.hard {
  background-color: #f8d7da;
  color: #721c24;
}

.recipe-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
}

@media (max-width: 768px) {
  .recipe-body {
    grid-template-columns: 1fr;
    gap: 30px;
  }
}

.ingredients-section h2,
.cost-section h2 {
  color: #2c3e50;
  border-bottom: 2px solid #42b883;
  padding-bottom: 8px;
  margin-bottom: 20px;
}

.ingredients-list {
  list-style: none;
  padding: 0;
}

.ingredients-list li {
  padding: 8px 0;
  border-bottom: 1px solid #eee;
  font-size: 16px;
}

.cost-display {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid #42b883;
}

.total-cost {
  font-size: 24px;
  color: #2c3e50;
  margin-bottom: 10px;
}

.cost-per-serving {
  color: #666;
  margin-bottom: 20px;
  font-size: 16px;
}

.ingredient-costs h3 {
  margin: 20px 0 15px 0;
  color: #2c3e50;
  font-size: 18px;
}

.ingredient-cost {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #ddd;
}

.ingredient-name {
  text-transform: capitalize;
}

.ingredient-price {
  font-weight: 500;
  color: #42b883;
}

.calculating, .cost-error {
  color: #666;
  font-style: italic;
  text-align: center;
  padding: 20px;
}

.cost-error {
  color: #dc3545;
  background-color: #f8d7da;
  border-radius: 8px;
}

.serving-info {
  color: #666;
  font-size: 14px;
  margin-bottom: 20px;
}

.ingredient-price small {
  color: #888;
  font-size: 12px;
}
</style>
