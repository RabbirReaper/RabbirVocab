<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-3xl font-bold text-primary-color">
        歡迎回來，{{ authStore.currentUser?.username }}！
      </h1>
    </div>

    <!-- 統計卡片 - 使用真實 API -->
    <div class="grid md:grid-cols-4 gap-6">
      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-secondary-color">總卡組數</p>
            <p
              v-if="loading"
              class="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-1 animate-pulse"
            >
              --
            </p>
            <p v-else class="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-1">
              {{ stats.totalDecks }}
            </p>
          </div>
          <div class="text-4xl">📚</div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-secondary-color">總卡片數</p>
            <p
              v-if="loading"
              class="text-3xl font-bold text-secondary-600 dark:text-secondary-400 mt-1 animate-pulse"
            >
              --
            </p>
            <p v-else class="text-3xl font-bold text-secondary-600 dark:text-secondary-400 mt-1">
              {{ stats.totalCards }}
            </p>
          </div>
          <div class="text-4xl">🎴</div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-secondary-color">待複習</p>
            <p
              v-if="loading"
              class="text-3xl font-bold text-warning-600 dark:text-warning-400 mt-1 animate-pulse"
            >
              --
            </p>
            <p v-else class="text-3xl font-bold text-warning-600 dark:text-warning-400 mt-1">
              {{ stats.dueCards }}
            </p>
          </div>
          <div class="text-4xl">⏰</div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-secondary-color">今日已複習</p>
            <p
              v-if="loading"
              class="text-3xl font-bold text-success-600 dark:text-success-400 mt-1 animate-pulse"
            >
              --
            </p>
            <p v-else class="text-3xl font-bold text-success-600 dark:text-success-400 mt-1">
              {{ stats.reviewsToday }}
            </p>
          </div>
          <div class="text-4xl">✅</div>
        </div>
      </div>
    </div>

    <!-- 最近的卡組 -->
    <div class="card">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-primary-color">我的卡組</h2>
        <RouterLink to="/app/decks" class="btn btn-primary btn-sm">查看全部</RouterLink>
      </div>

      <!-- Loading 狀態 -->
      <div v-if="deckStore.loading" class="grid md:grid-cols-3 gap-4">
        <div v-for="i in 3" :key="i" class="card animate-pulse">
          <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div class="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>

      <!-- Error 狀態 -->
      <div v-else-if="deckStore.error" class="card bg-red-50 dark:bg-red-900/20">
        <p class="text-red-600 dark:text-red-400">{{ deckStore.error }}</p>
        <button @click="deckStore.fetchDecks()" class="btn btn-primary mt-4">重試</button>
      </div>

      <!-- 空狀態 -->
      <div v-else-if="deckStore.decks.length === 0" class="text-center py-12">
        <p class="text-secondary-color mb-4">還沒有任何卡組</p>
        <RouterLink to="/app/decks" class="btn btn-primary">建立第一個卡組</RouterLink>
      </div>

      <!-- 卡組列表 - 簡化版，不顯示統計 -->
      <div v-else class="grid md:grid-cols-3 gap-4">
        <RouterLink
          v-for="deck in deckStore.decks.slice(0, 6)"
          :key="deck.id"
          :to="`/app/decks/${deck.id}`"
          class="study-card group"
        >
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold text-primary-color">
              {{ deck.name }}
            </h3>
            <span class="text-2xl">📚</span>
          </div>
          <p class="text-sm text-secondary-color line-clamp-2">{{ deck.description }}</p>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDeckStore } from '@/stores/deck'
import { api } from '@/api/modules'

const authStore = useAuthStore()
const deckStore = useDeckStore()

const stats = ref({
  totalDecks: 0,
  totalCards: 0,
  dueCards: 0,
  reviewsToday: 0,
})
const loading = ref(false)

onMounted(async () => {
  // 並行載入統計和卡組列表
  loading.value = true
  try {
    const [statsData] = await Promise.all([api.stats.getOverview(), deckStore.fetchDecks()])
    stats.value = statsData
  } catch (error) {
    console.error('載入統計失敗:', error)
  } finally {
    loading.value = false
  }
})
</script>
