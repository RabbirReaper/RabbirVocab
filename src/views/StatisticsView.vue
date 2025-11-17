<template>
  <div class="space-y-6">
    <h1 class="text-3xl font-bold text-primary-color">學習統計</h1>

    <!-- 總覽統計 -->
    <div class="grid md:grid-cols-4 gap-6">
      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-secondary-color">學習天數</p>
            <p class="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-1">45</p>
          </div>
          <div class="text-4xl">📅</div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-secondary-color">總複習次數</p>
            <p class="text-3xl font-bold text-secondary-600 dark:text-secondary-400 mt-1">1,234</p>
          </div>
          <div class="text-4xl">🔄</div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-secondary-color">平均準確率</p>
            <p class="text-3xl font-bold text-success-600 dark:text-success-400 mt-1">87%</p>
          </div>
          <div class="text-4xl">🎯</div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-secondary-color">學習時間</p>
            <p class="text-3xl font-bold text-warning-600 dark:text-warning-400 mt-1">42h</p>
          </div>
          <div class="text-4xl">⏱️</div>
        </div>
      </div>
    </div>

    <!-- 本週學習活動 -->
    <div class="card">
      <h2 class="text-xl font-bold text-primary-color mb-4">本週學習活動</h2>
      <div class="grid grid-cols-7 gap-2">
        <div
          v-for="day in weekDays"
          :key="day.name"
          class="text-center p-4 bg-secondary-color rounded-lg"
        >
          <div class="text-xs text-tertiary-color mb-2">{{ day.name }}</div>
          <div class="text-2xl font-bold text-primary-600 dark:text-primary-400">{{ day.count }}</div>
          <div class="text-xs text-secondary-color mt-1">{{ day.minutes }}分</div>
        </div>
      </div>
    </div>

    <!-- 卡片狀態分佈 -->
    <div class="card">
      <h2 class="text-xl font-bold text-primary-color mb-4">卡片狀態分佈</h2>
      <div class="space-y-4">
        <div>
          <div class="flex justify-between text-sm mb-2">
            <span class="text-secondary-color">新卡片</span>
            <span class="text-primary-color font-medium">{{ cardStats.new }}張 ({{ cardStats.newPercent }}%)</span>
          </div>
          <div class="w-full bg-progress rounded-full h-3">
            <div
              class="bg-primary-600 dark:bg-primary-500 h-3 rounded-full"
              :style="{ width: cardStats.newPercent + '%' }"
            ></div>
          </div>
        </div>

        <div>
          <div class="flex justify-between text-sm mb-2">
            <span class="text-secondary-color">學習中</span>
            <span class="text-primary-color font-medium">{{ cardStats.learning }}張 ({{ cardStats.learningPercent }}%)</span>
          </div>
          <div class="w-full bg-progress rounded-full h-3">
            <div
              class="bg-warning-600 dark:bg-warning-500 h-3 rounded-full"
              :style="{ width: cardStats.learningPercent + '%' }"
            ></div>
          </div>
        </div>

        <div>
          <div class="flex justify-between text-sm mb-2">
            <span class="text-secondary-color">複習中</span>
            <span class="text-primary-color font-medium">{{ cardStats.review }}張 ({{ cardStats.reviewPercent }}%)</span>
          </div>
          <div class="w-full bg-progress rounded-full h-3">
            <div
              class="bg-secondary-600 dark:bg-secondary-500 h-3 rounded-full"
              :style="{ width: cardStats.reviewPercent + '%' }"
            ></div>
          </div>
        </div>

        <div>
          <div class="flex justify-between text-sm mb-2">
            <span class="text-secondary-color">已掌握</span>
            <span class="text-primary-color font-medium">{{ cardStats.mastered }}張 ({{ cardStats.masteredPercent }}%)</span>
          </div>
          <div class="w-full bg-progress rounded-full h-3">
            <div
              class="bg-success-600 dark:bg-success-500 h-3 rounded-full"
              :style="{ width: cardStats.masteredPercent + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 最近複習記錄 -->
    <div class="card">
      <h2 class="text-xl font-bold text-primary-color mb-4">最近複習記錄</h2>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <th class="text-left py-3 px-4 text-sm font-semibold text-secondary-color">卡組</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-secondary-color">複習數</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-secondary-color">準確率</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-secondary-color">時間</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-secondary-color">日期</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="record in recentRecords"
              :key="record.id"
              class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <td class="py-3 px-4 text-sm text-primary-color">{{ record.deckName }}</td>
              <td class="py-3 px-4 text-sm text-secondary-color">{{ record.reviewCount }}</td>
              <td class="py-3 px-4 text-sm">
                <span :class="getAccuracyClass(record.accuracy)">{{ record.accuracy }}%</span>
              </td>
              <td class="py-3 px-4 text-sm text-secondary-color">{{ record.duration }}分</td>
              <td class="py-3 px-4 text-sm text-secondary-color">{{ record.date }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCardStore } from '@/stores/card'

const cardStore = useCardStore()

const weekDays = [
  { name: '週一', count: 45, minutes: 28 },
  { name: '週二', count: 52, minutes: 35 },
  { name: '週三', count: 38, minutes: 22 },
  { name: '週四', count: 61, minutes: 42 },
  { name: '週五', count: 44, minutes: 30 },
  { name: '週六', count: 70, minutes: 55 },
  { name: '週日', count: 65, minutes: 48 }
]

const cardStats = computed(() => {
  const cards = cardStore.cards
  const total = cards.length
  const newCards = cards.filter(c => c.status === 'new').length
  const learning = cards.filter(c => c.status === 'learning').length
  const review = cards.filter(c => c.status === 'review').length
  const mastered = cards.filter(c => c.status === 'mastered').length

  return {
    new: newCards,
    newPercent: total > 0 ? Math.round((newCards / total) * 100) : 0,
    learning,
    learningPercent: total > 0 ? Math.round((learning / total) * 100) : 0,
    review,
    reviewPercent: total > 0 ? Math.round((review / total) * 100) : 0,
    mastered,
    masteredPercent: total > 0 ? Math.round((mastered / total) * 100) : 0
  }
})

const recentRecords = [
  { id: 1, deckName: '日常英語單字', reviewCount: 25, accuracy: 92, duration: 18, date: '2024-01-15' },
  { id: 2, deckName: 'TOEFL 核心詞彙', reviewCount: 40, accuracy: 85, duration: 32, date: '2024-01-15' },
  { id: 3, deckName: '商業英文', reviewCount: 15, accuracy: 95, duration: 12, date: '2024-01-14' },
  { id: 4, deckName: '日常英語單字', reviewCount: 30, accuracy: 88, duration: 22, date: '2024-01-14' },
  { id: 5, deckName: 'TOEFL 核心詞彙', reviewCount: 35, accuracy: 90, duration: 28, date: '2024-01-13' }
]

const getAccuracyClass = (accuracy: number) => {
  if (accuracy >= 90) return 'text-success-600 dark:text-success-400 font-semibold'
  if (accuracy >= 75) return 'text-warning-600 dark:text-warning-400 font-semibold'
  return 'text-error-600 dark:text-error-400 font-semibold'
}
</script>
