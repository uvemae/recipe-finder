<template>
  <div class="recipe-list">
    <div class="search-section">
      <input
        v-model="searchQuery"
        @input="handleSearch"
        type="text"
        placeholder="Search recipes or ingredients..."
        class="search-input"
      />
    </div>

    <div v-if="loading" class="loading">
      Loading recipes...
    </div>

    <div v-else-if="error" class="error">
      {{ error }}
    </div>

    <div v-else class="recipes-grid">
      <div
        v-for="recipe in filteredRecipes"
        :key="recipe.id"
        class="recipe-card"
        @click="viewRecipe(recipe.id)"
      >
        <h3>{{ recipe.name }}</h3>
        <div class="recipe-meta">
          <span class="prep-time">⏱️ {{ recipe.prepTime }} min</span>
          <span class="difficulty" :class="recipe.difficulty">
            {{ recipe.difficulty }}
          </span>
          <span class="servings">👥 {{ recipe.servings }} servings</span>
        </div>
        <div class="ingredients">
          <strong>Ingredients:</strong>
          <span>{{ recipe.ingredients.slice(0, 3).join(', ') }}</span>
          <span v-if="recipe.ingredients.length > 3">...</span>
        </div>
      </div>
    </div>

    <div v-if="!loading && filteredRecipes.length === 0" class="no-results">
      No recipes found matching your search.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ApiService } from '@/services/api'
import type { Recipe } from '@/types/recipe'

const router = useRouter()
const recipes = ref<Recipe[]>([])
const searchQuery = ref('')
const loading = ref(true)
const error = ref('')

const filteredRecipes = computed(() => {
  if (!searchQuery.value) {
    return recipes.value
  }

  const query = searchQuery.value.toLowerCase()
  return recipes.value.filter(recipe =>
    recipe.name.toLowerCase().includes(query) ||
    recipe.ingredients.some(ingredient =>
      ingredient.toLowerCase().includes(query)
    )
  )
})

const fetchRecipes = async () => {
  try {
    loading.value = true
    error.value = ''
    recipes.value = await ApiService.fetchRecipes()
  } catch (err) {
    error.value = 'Failed to load recipes. Make sure the backend server is running.'
    console.error('Error fetching recipes:', err)
  } finally {
    loading.value = false
  }
}

const handleSearch = async () => {
  if (searchQuery.value.trim()) {
    try {
      error.value = ''
      const results = await ApiService.searchRecipes(searchQuery.value)
      recipes.value = results
    } catch (err) {
      error.value = 'Search failed. Please try again.'
    }
  } else {
    await fetchRecipes()
  }
}

const viewRecipe = (id: number) => {
  router.push(`/recipe/${id}`)
}

onMounted(() => {
  fetchRecipes()
})
</script>

<style scoped>
.recipe-list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.search-section {
  margin-bottom: 30px;
}

.search-input {
  width: 100%;
  max-width: 500px;
  padding: 12px 16px;
  font-size: 16px;
  border: 2px solid #ddd;
  border-radius: 8px;
  outline: none;
  transition: border-color 0.3s;
}

.search-input:focus {
  border-color: #42b883;
}

.loading, .error, .no-results {
  text-align: center;
  padding: 40px;
  font-size: 18px;
}

.error {
  color: #dc3545;
  background-color: #f8d7da;
  border-radius: 8px;
}

.recipes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.recipe-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.recipe-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  border-color: #42b883;
}

.recipe-card h3 {
  margin: 0 0 12px 0;
  color: #2c3e50;
  font-size: 20px;
}

.recipe-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 14px;
}

.prep-time, .servings {
  color: #666;
}

.difficulty {
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: bold;
  text-transform: uppercase;
  font-size: 12px;
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

.ingredients {
  color: #666;
  font-size: 14px;
  line-height: 1.4;
}

.ingredients strong {
  color: #2c3e50;
}
</style>
