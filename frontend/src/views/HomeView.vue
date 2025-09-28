<template>
  <div class="home">
    <div class="hero-section">
      <div class="hero-content">
        <h1>Recipe Finder</h1>
        <p>Discover delicious recipes and calculate ingredient costs across Europe</p>
        <div class="hero-stats">
          <div class="stat">
            <span class="stat-number">1000+</span>
            <span class="stat-label">Recipes</span>
          </div>
          <div class="stat">
            <span class="stat-number">EU</span>
            <span class="stat-label">Pricing</span>
          </div>
          <div class="stat">
            <span class="stat-number">€</span>
            <span class="stat-label">Cost Calculator</span>
          </div>
        </div>
      </div>
    </div>

    <div class="content-section">
      <DatabaseStats />
      <RecipeList />
    </div>
  </div>
</template>

<script setup lang="ts">
import RecipeList from '@/components/RecipeList.vue'
import DatabaseStats from '@/components/DatabaseStats.vue'
</script>

<style scoped>
.home {
  min-height: 100vh;
}

.hero-section {
  background: linear-gradient(135deg, #42b883 0%, #369870 100%);
  color: white;
  padding: 4rem 2rem;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="2" fill="rgba(255,255,255,0.1)"/></svg>') repeat;
  animation: float 20s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.hero-section h1 {
  font-size: 3.5rem;
  margin: 0 0 1rem 0;
  font-weight: 300;
  letter-spacing: 2px;
}

.hero-section p {
  font-size: 1.3rem;
  margin: 0 0 3rem 0;
  opacity: 0.95;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.hero-stats {
  display: flex;
  justify-content: center;
  gap: 3rem;
  margin-top: 2rem;
}

.stat {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 1rem;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.content-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

@media (max-width: 768px) {
  .hero-section {
    padding: 3rem 1rem;
  }

  .hero-section h1 {
    font-size: 2.5rem;
  }

  .hero-section p {
    font-size: 1.1rem;
  }

  .hero-stats {
    flex-direction: column;
    gap: 1.5rem;
  }

  .stat-number {
    font-size: 2rem;
  }
}
</style>
