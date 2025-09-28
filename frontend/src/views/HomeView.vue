<template>
  <main>
    <div class="hero-section">
      <h1>Recipe Finder</h1>
      <p>Find delicious recipes and calculate ingredient costs</p>
    </div>
    <RecipeList />
  </main>
</template>

<script setup lang="ts">
import RecipeList from '@/components/RecipeList.vue'
</script>

<style scoped>
.hero-section {
  text-align: center;
  padding: 40px 20px;
  background: linear-gradient(135deg, #42b883 0%, #369870 100%);
  color: white;
  margin-bottom: 0;
}

.hero-section h1 {
  font-size: 3em;
  margin: 0;
  font-weight: 300;
}

.hero-section p {
  font-size: 1.2em;
  margin: 10px 0 0;
  opacity: 0.9;
}

main {
  min-height: 100vh;
  background-color: #f8f9fa;
}
</style>
