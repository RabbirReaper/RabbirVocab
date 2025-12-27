<template>
  <div class="space-y-6">
    <h1 class="text-3xl font-bold text-primary-color">學習統計</h1>

    <!-- 總覽統計 -->
    <div class="grid md:grid-cols-4 gap-6">
      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-secondary-color">近 7 天總複習</p>
            <p
              v-if="loading"
              class="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-1 animate-pulse"
            >
              --
            </p>
            <p v-else class="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-1">
              {{ totalReviews }}
            </p>
          </div>
          <div class="text-4xl">🔄</div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-secondary-color">正確率</p>
            <p
              v-if="loading"
              class="text-3xl font-bold text-success-600 dark:text-success-400 mt-1 animate-pulse"
            >
              --
            </p>
            <p v-else class="text-3xl font-bold text-success-600 dark:text-success-400 mt-1">
              {{ accuracy }}%
            </p>
          </div>
          <div class="text-4xl">🎯</div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-secondary-color">學習時間</p>
            <p
              v-if="loading"
              class="text-3xl font-bold text-warning-600 dark:text-warning-400 mt-1 animate-pulse"
            >
              --
            </p>
            <p v-else class="text-3xl font-bold text-warning-600 dark:text-warning-400 mt-1">
              {{ totalTimeFormatted }}
            </p>
          </div>
          <div class="text-4xl">⏱️</div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-secondary-color">平均評分</p>
            <p
              v-if="loading"
              class="text-3xl font-bold text-secondary-600 dark:text-secondary-400 mt-1 animate-pulse"
            >
              --
            </p>
            <p v-else class="text-3xl font-bold text-secondary-600 dark:text-secondary-400 mt-1">
              {{ avgQuality.toFixed(1) }}
            </p>
          </div>
          <div class="text-4xl">⭐</div>
        </div>
      </div>
    </div>

    <!-- 近 7 天學習活動 -->
    <div class="card">
      <h2 class="text-xl font-bold text-primary-color mb-4">近 7 天學習活動</h2>

      <!-- Loading 狀態 -->
      <div v-if="loading" class="grid grid-cols-7 gap-2">
        <div v-for="i in 7" :key="i" class="text-center p-4 bg-secondary-color rounded-lg animate-pulse">
          <div class="h-3 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
          <div class="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-1"></div>
          <div class="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
      </div>

      <!-- 真實數據 -->
      <div v-else-if="weekActivity.length > 0" class="grid grid-cols-7 gap-2">
        <div
          v-for="day in weekActivity"
          :key="day.date"
          class="text-center p-4 bg-secondary-color rounded-lg"
        >
          <div class="text-xs text-tertiary-color mb-2">{{ day.dayName }}</div>
          <div class="text-2xl font-bold text-primary-600 dark:text-primary-400">
            {{ day.totalReviews }}
          </div>
          <div class="text-xs text-secondary-color mt-1">{{ day.timeFormatted }}</div>
        </div>
      </div>

      <!-- 空狀態 -->
      <div v-else class="text-center py-12 text-tertiary-color">
        近 7 天沒有學習記錄
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/api/modules'
import type { ActivityStats } from '@/api/types'

const loading = ref(false)
const activityData = ref<ActivityStats[]>([])

// 總覽統計
const totalReviews = computed(() => {
  return activityData.value.reduce((sum, day) => sum + day.totalReviews, 0)
})

const accuracy = computed(() => {
  const total = activityData.value.reduce((sum, day) => sum + day.totalReviews, 0)
  const correct = activityData.value.reduce((sum, day) => sum + day.correctReviews, 0)
  return total > 0 ? Math.round((correct / total) * 100) : 0
})

const totalTimeFormatted = computed(() => {
  const totalSeconds = activityData.value.reduce((sum, day) => sum + day.totalTime, 0)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
})

const avgQuality = computed(() => {
  if (activityData.value.length === 0) return 0
  const sum = activityData.value.reduce((acc, day) => acc + (day.avgQuality || 0), 0)
  return sum / activityData.value.length
})

// 近 7 天活動
const weekActivity = computed(() => {
  // 生成最近 7 天的日期數組
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return date.toISOString().split('T')[0] // YYYY-MM-DD 格式
  })

  // 將 API 數據映射到對應日期
  return last7Days.map((date) => {
    const dayData = activityData.value.find((d) => d._id === date)
    const dateObj = new Date(date)
    const dayNames = ['日', '一', '二', '三', '四', '五', '六']
    const dayName = '週' + dayNames[dateObj.getDay()]

    const totalTime = dayData?.totalTime || 0
    const minutes = Math.floor(totalTime / 60)
    const timeFormatted = minutes > 0 ? `${minutes}分` : '0分'

    return {
      date,
      dayName,
      totalReviews: dayData?.totalReviews || 0,
      totalTime,
      timeFormatted,
    }
  })
})

onMounted(async () => {
  loading.value = true
  try {
    const response = await api.stats.getRecentActivity({ days: 7 })
    activityData.value = response.stats
  } catch (error) {
    console.error('載入統計失敗:', error)
  } finally {
    loading.value = false
  }
})
</script>
