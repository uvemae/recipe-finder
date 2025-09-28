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

      <!-- Recipe Picture -->
      <div class="recipe-picture" v-if="recipe.image">
        <img :src="recipe.image" :alt="recipe.name" class="recipe-image" />
      </div>

      <!-- Cooking Instructions -->
      <div class="instructions-section" v-if="recipe.instructions && recipe.instructions.length > 0">
        <h2>Cooking Instructions</h2>
        <ol class="instructions-list">
          <li v-for="(instruction, index) in recipe.instructions" :key="index" class="instruction-step">
            {{ instruction }}
          </li>
        </ol>
      </div>

      <div class="recipe-body">
        <div class="ingredients-section">
          <h2>🛒 Ingredients</h2>
          <ul class="ingredients-list">
            <li v-for="ingredient in recipe.ingredients" :key="ingredient">
              <span class="ingredient-bullet">•</span>
              {{ ingredient }}
            </li>
          </ul>
        </div>

        <div class="cost-section">
          <h2>💰 Cost Estimation (Estonia)</h2>
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
      'EE' // Estonia
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

/* Recipe Picture */
.recipe-picture {
  margin: 30px 0;
  text-align: center;
}

.recipe-image {
  max-width: 100%;
  height: auto;
  max-height: 400px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.recipe-image:hover {
  transform: scale(1.02);
}

/* Cooking Instructions */
.instructions-section {
  margin: 40px 0;
}

.instructions-section h2 {
  color: #2c3e50;
  border-bottom: 2px solid #42b883;
  padding-bottom: 8px;
  margin-bottom: 20px;
  font-size: 24px;
}

.instructions-list {
  background: #f8f9fa;
  padding: 25px 30px;
  border-radius: 12px;
  border-left: 4px solid #42b883;
  list-style: none;
  counter-reset: step-counter;
}

.instruction-step {
  counter-increment: step-counter;
  position: relative;
  padding: 15px 0 15px 50px;
  margin-bottom: 15px;
  line-height: 1.6;
  font-size: 16px;
  border-bottom: 1px solid #e9ecef;
}

.instruction-step:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.instruction-step::before {
  content: counter(step-counter);
  position: absolute;
  left: 0;
  top: 15px;
  width: 30px;
  height: 30px;
  background: #42b883;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
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

  .recipe-meta {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .recipe-header h1 {
    font-size: 2em;
  }

  .instructions-list {
    padding: 20px 25px;
  }

  .instruction-step {
    padding: 12px 0 12px 45px;
    font-size: 15px;
  }

  .instruction-step::before {
    width: 25px;
    height: 25px;
    font-size: 12px;
    top: 12px;
  }

  .instructions-section h2 {
    font-size: 20px;
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
  padding: 12px 0;
  border-bottom: 1px solid #eee;
  font-size: 16px;
  display: flex;
  align-items: center;
  line-height: 1.5;
}

.ingredient-bullet {
  color: #42b883;
  font-weight: bold;
  font-size: 18px;
  margin-right: 12px;
  min-width: 20px;
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
