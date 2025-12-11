<template>
  <div class="space-y-6">
    <!-- Loading 狀態 -->
    <div v-if="deckStore.loading || cardStore.loading" class="space-y-6">
      <div class="animate-pulse">
        <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
      <div class="grid md:grid-cols-4 gap-6">
        <div v-for="i in 4" :key="i" class="card animate-pulse">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    </div>

    <!-- Error 狀態 -->
    <div
      v-else-if="deckStore.error || cardStore.error"
      class="card bg-red-50 dark:bg-red-900/20"
    >
      <p class="text-red-600 dark:text-red-400">
        {{ deckStore.error || cardStore.error }}
      </p>
      <button @click="loadData" class="btn btn-primary mt-4">重試</button>
    </div>

    <!-- 主要內容 -->
    <div v-else-if="deck" class="space-y-6">
      <!-- 卡組標題 -->
      <div class="flex justify-between items-start">
        <div>
          <RouterLink
            to="/app/decks"
            class="text-primary-600 dark:text-primary-400 hover:underline mb-2 inline-block"
          >
            ← 返回卡組列表
          </RouterLink>
          <h1 class="text-3xl font-bold text-primary-color">{{ deck.name }}</h1>
          <p class="text-secondary-color mt-2">{{ deck.description }}</p>
        </div>
        <RouterLink :to="`/app/study/${deck.id}`" class="btn btn-primary">
          🎯 開始學習
        </RouterLink>
      </div>

      <!-- 統計卡片 -->
      <div class="grid md:grid-cols-4 gap-6">
        <div class="card">
          <p class="text-sm text-secondary-color">總卡片數</p>
          <p class="text-3xl font-bold text-primary-color mt-1">{{ deck.cardCount }}</p>
        </div>
        <div class="card">
          <p class="text-sm text-secondary-color">新卡片</p>
          <p class="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-1">
            {{ deck.newCount }}
          </p>
        </div>
        <div class="card">
          <p class="text-sm text-secondary-color">待複習</p>
          <p class="text-3xl font-bold text-warning-600 dark:text-warning-400 mt-1">
            {{ deck.reviewCount }}
          </p>
        </div>
        <div class="card">
          <p class="text-sm text-secondary-color">已掌握</p>
          <p class="text-3xl font-bold text-success-600 dark:text-success-400 mt-1">
            {{ deck.masteredCount }}
          </p>
        </div>
      </div>

      <!-- 卡片列表 -->
      <div class="card">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold text-primary-color">卡片列表</h2>
          <RouterLink
            :to="`/app/cards/create?deck=${deckId}`"
            class="btn btn-primary btn-sm"
          >
            ➕ 新增卡片
          </RouterLink>
        </div>

        <div v-if="cards.length > 0" class="space-y-2">
          <div
            v-for="card in cards"
            :key="card.id"
            class="flex items-center justify-between p-4 bg-secondary-color rounded-lg bg-hover-color transition-colors"
          >
            <div class="flex-1">
              <div class="font-semibold text-primary-color">{{ card.front }}</div>
            </div>
            <div class="flex items-center space-x-4">
              <span :class="getStatusBadgeClass(card.status)" class="badge">
                {{ getStatusText(card.status) }}
              </span>
              <span class="text-sm text-tertiary-color"> 間隔: {{ card.interval }}天 </span>
              <!-- 操作按鈕 -->
              <div class="flex items-center space-x-2">
                <button @click="handleEditCard(card.id)" class="btn btn-sm btn-secondary">
                  編輯
                </button>
                <button
                  @click="openDeleteModal(card)"
                  class="btn btn-sm bg-red-500 hover:bg-red-600 text-white border-0"
                >
                  刪除
                </button>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-12 text-tertiary-color">
          還沒有卡片，點擊「新增卡片」開始建立吧！
        </div>
      </div>

      <!-- SRS 設定 -->
      <div class="card">
        <h2 class="text-xl font-bold text-primary-color mb-4">學習設定</h2>
        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-secondary-color mb-1">
              每日新卡片數
            </label>
            <input
              type="number"
              :value="deck.srsConfig.newCardsPerDay"
              class="w-full px-4 py-2 border border-primary-color rounded-lg bg-disabled text-primary-color"
              disabled
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-secondary-color mb-1">
              每日複習數
            </label>
            <input
              type="number"
              :value="deck.srsConfig.reviewsPerDay"
              class="w-full px-4 py-2 border border-primary-color rounded-lg bg-disabled text-primary-color"
              disabled
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 刪除確認 Modal -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click="closeDeleteModal"
    >
      <div class="card max-w-md w-full mx-4 animate-slide-up" @click.stop>
        <h2 class="text-2xl font-bold text-primary-color mb-4">確認刪除卡片</h2>

        <div class="mb-6">
          <p class="text-secondary-color mb-2">確定要刪除以下卡片嗎？</p>
          <div class="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p class="font-semibold text-primary-color">{{ cardToDelete?.front }}</p>
          </div>
          <p class="text-sm text-tertiary-color mt-2">此操作無法復原</p>
        </div>

        <div class="flex space-x-3">
          <button
            type="button"
            @click="closeDeleteModal"
            class="btn btn-outline flex-1"
            :disabled="cardStore.loading"
          >
            取消
          </button>
          <button
            @click="confirmDelete"
            class="btn flex-1 bg-red-500 hover:bg-red-600 text-white border-0"
            :disabled="cardStore.loading"
          >
            {{ cardStore.loading ? '刪除中...' : '確認刪除' }}
          </button>
        </div>

        <div v-if="cardStore.error" class="mt-4 text-sm text-red-600 dark:text-red-400">
          {{ cardStore.error }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import type { Card } from '@/stores/card'
import { useDeckStore } from '@/stores/deck'
import { useCardStore } from '@/stores/card'

const route = useRoute()
const router = useRouter()
const deckStore = useDeckStore()
const cardStore = useCardStore()

const deckId = route.params.deckId as string
const deck = computed(() => deckStore.getDeckById(deckId))
const cards = computed(() => cardStore.getCardsByDeck(deckId))

// 刪除 modal 狀態
const showDeleteModal = ref(false)
const cardToDelete = ref<Card | null>(null)

// 載入數據
const loadData = async () => {
  await Promise.all([deckStore.fetchDeck(deckId), cardStore.fetchCardsByDeck(deckId)])
}

onMounted(() => {
  loadData()
})

// 處理編輯
const handleEditCard = (cardId: string) => {
  router.push(`/app/cards/create?edit=${cardId}`)
}

// 打開刪除 modal
const openDeleteModal = (card: Card) => {
  cardToDelete.value = card
  showDeleteModal.value = true
}

// 關閉刪除 modal
const closeDeleteModal = () => {
  showDeleteModal.value = false
  cardToDelete.value = null
}

// 確認刪除
const confirmDelete = async () => {
  if (!cardToDelete.value) return

  try {
    await cardStore.deleteCard(cardToDelete.value.id)
    closeDeleteModal()
  } catch (error) {
    console.error('Failed to delete card:', error)
  }
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    new: '新卡',
    learning: '學習中',
    review: '複習',
    mastered: '已掌握',
  }
  return statusMap[status] || status
}

const getStatusBadgeClass = (status: string) => {
  const classMap: Record<string, string> = {
    new: 'badge-primary',
    learning: 'badge-warning',
    review: 'badge-info',
    mastered: 'badge-success',
  }
  return classMap[status] || ''
}
</script>
