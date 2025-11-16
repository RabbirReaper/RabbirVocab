<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
        歡迎回來，{{ authStore.currentUser?.displayName }}！
      </h1>
    </div>

    <!-- 統計卡片 -->
    <div class="grid md:grid-cols-4 gap-6">
      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">總卡組數</p>
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
            <p class="text-sm text-gray-600 dark:text-gray-400">總卡片數</p>
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
            <p class="text-sm text-gray-600 dark:text-gray-400">待複習</p>
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
            <p class="text-sm text-gray-600 dark:text-gray-400">連續學習</p>
            <p class="text-3xl font-bold text-success-600 dark:text-success-400 mt-1">7天</p>
          </div>
          <div class="text-4xl">🔥</div>
        </div>
      </div>
    </div>

    <!-- 今日學習進度 -->
    <div class="card">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">今日學習進度</h2>
      <div class="space-y-4">
        <div>
          <div class="flex justify-between text-sm mb-2">
            <span class="text-gray-600 dark:text-gray-400">複習卡片</span>
            <span class="text-gray-900 dark:text-white font-medium">15 / 50</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div class="bg-primary-600 dark:bg-primary-500 h-2 rounded-full" style="width: 30%"></div>
          </div>
        </div>

        <div>
          <div class="flex justify-between text-sm mb-2">
            <span class="text-gray-600 dark:text-gray-400">新卡片</span>
            <span class="text-gray-900 dark:text-white font-medium">8 / 20</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div class="bg-secondary-600 dark:bg-secondary-500 h-2 rounded-full" style="width: 40%"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 最近的卡組 -->
    <div class="card">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">我的卡組</h2>
        <RouterLink to="/app/decks" class="btn btn-primary btn-sm">查看全部</RouterLink>
      </div>

      <div class="grid md:grid-cols-3 gap-4">
        <RouterLink
          v-for="deck in deckStore.decks"
          :key="deck.id"
          :to="`/app/decks/${deck.id}`"
          class="study-card group"
        >
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {{ deck.name }}
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">{{ deck.description }}</p>

          <div class="grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <div class="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {{ deck.newCount }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-500">新卡</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-warning-600 dark:text-warning-400">
                {{ deck.reviewCount }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-500">複習</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-success-600 dark:text-success-400">
                {{ deck.masteredCount }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-500">已掌握</div>
            </div>
          </div>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDeckStore } from '@/stores/deck'

const authStore = useAuthStore()
const deckStore = useDeckStore()
</script>
