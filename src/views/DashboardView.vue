<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-3xl font-bold text-primary-color">
        歡迎回來，{{ authStore.currentUser?.username }}！
      </h1>
    </div>

    <!-- 統計卡片 -->
    <div class="grid md:grid-cols-4 gap-6">
      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-secondary-color">總卡組數</p>
            <p class="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-1">
              {{ deckStore.totalDecks }}
            </p>
          </div>
          <div class="text-4xl">📚</div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-secondary-color">總卡片數</p>
            <p class="text-3xl font-bold text-secondary-600 dark:text-secondary-400 mt-1">
              {{ deckStore.totalCards }}
            </p>
          </div>
          <div class="text-4xl">🎴</div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-secondary-color">待複習</p>
            <p class="text-3xl font-bold text-warning-600 dark:text-warning-400 mt-1">
              {{ deckStore.totalReviews }}
            </p>
          </div>
          <div class="text-4xl">⏰</div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-secondary-color">連續學習</p>
            <p class="text-3xl font-bold text-success-600 dark:text-success-400 mt-1">7天</p>
          </div>
          <div class="text-4xl">🔥</div>
        </div>
      </div>
    </div>

    <!-- 今日學習進度 -->
    <div class="card">
      <h2 class="text-xl font-bold text-primary-color mb-4">今日學習進度</h2>
      <div class="space-y-4">
        <div>
          <div class="flex justify-between text-sm mb-2">
            <span class="text-secondary-color">複習卡片</span>
            <span class="text-primary-color font-medium">15 / 50</span>
          </div>
          <div class="w-full bg-progress rounded-full h-2">
            <div
              class="bg-primary-600 dark:bg-primary-500 h-2 rounded-full"
              style="width: 30%"
            ></div>
          </div>
        </div>

        <div>
          <div class="flex justify-between text-sm mb-2">
            <span class="text-secondary-color">新卡片</span>
            <span class="text-primary-color font-medium">8 / 20</span>
          </div>
          <div class="w-full bg-progress rounded-full h-2">
            <div
              class="bg-secondary-600 dark:bg-secondary-500 h-2 rounded-full"
              style="width: 40%"
            ></div>
          </div>
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

      <!-- 卡組列表 -->
      <div v-else class="grid md:grid-cols-3 gap-4">
        <RouterLink
          v-for="deck in deckStore.decks"
          :key="deck.id"
          :to="`/app/decks/${deck.id}`"
          class="study-card group"
        >
          <h3 class="text-lg font-semibold text-primary-color mb-2">
            {{ deck.name }}
          </h3>
          <p class="text-sm text-secondary-color mb-4">{{ deck.description }}</p>

          <div class="grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <div class="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {{ deck.newCount }}
              </div>
              <div class="text-xs text-tertiary-color">新卡</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-warning-600 dark:text-warning-400">
                {{ deck.reviewCount }}
              </div>
              <div class="text-xs text-tertiary-color">複習</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-success-600 dark:text-success-400">
                {{ deck.masteredCount }}
              </div>
              <div class="text-xs text-tertiary-color">已掌握</div>
            </div>
          </div>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDeckStore } from '@/stores/deck'

const authStore = useAuthStore()
const deckStore = useDeckStore()

onMounted(async () => {
  await deckStore.fetchDecks()
})
</script>
