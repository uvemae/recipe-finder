<template>
  <div class="database-stats">
    <h3>Price Data Storage</h3>

    <div v-if="loading" class="loading">
      Loading database statistics...
    </div>

    <div v-else-if="stats" class="stats-grid">
      <div class="stat-card">
        <div class="stat-number">{{ stats.totalPricesStored }}</div>
        <div class="stat-label">Total Prices Stored</div>
      </div>

      <div class="stat-card">
        <div class="stat-number">{{ stats.uniqueIngredients }}</div>
        <div class="stat-label">Unique Ingredients</div>
      </div>

      <div class="scraping-stats" v-if="stats.scrapingStats.length > 0">
        <h4>Scraping Performance (24h)</h4>
        <div class="scraping-grid">
          <div
            v-for="store in stats.scrapingStats"
            :key="store.store_name"
            class="scraping-card"
          >
            <div class="store-name">{{ store.store_name }}</div>
            <div class="success-rate">
              {{ Math.round((store.successful / store.total_attempts) * 100) }}% success
            </div>
            <div class="attempts">{{ store.successful }}/{{ store.total_attempts }} attempts</div>
            <div class="response-time" v-if="store.avg_response_time">
              {{ Math.round(store.avg_response_time) }}ms avg
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ApiService } from '@/services/api'

const stats = ref<any>(null)
const loading = ref(false)

const loadStats = async () => {
  try {
    loading.value = true
    const response = await fetch('http://localhost:3001/api/database/stats')
    const result = await response.json()
    if (result.success) {
      stats.value = result.data
    }
  } catch (error) {
    console.error('Error loading database stats:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadStats()
})

// Refresh stats every 30 seconds
setInterval(loadStats, 30000)
</script>

<style scoped>
.database-stats {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.database-stats h3 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 18px;
}

.loading {
  text-align: center;
  color: #666;
  padding: 20px;
}

.stats-grid {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.stat-card {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 15px;
  text-align: center;
  flex: 1;
  border-left: 4px solid #42b883;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.scraping-stats h4 {
  margin: 20px 0 10px 0;
  color: #2c3e50;
  font-size: 16px;
}

.scraping-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}

.scraping-card {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 12px;
  text-align: center;
  border: 1px solid #e9ecef;
}

.store-name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
  text-transform: capitalize;
}

.success-rate {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.attempts {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.response-time {
  font-size: 11px;
  color: #888;
}

/* Color success rate based on percentage */
.success-rate {
  color: #28a745; /* Green for good success rate */
}
</style>
