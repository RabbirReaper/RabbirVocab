<template>
  <div v-if="deck" class="space-y-6">
    <!-- 卡組標題 -->
    <div class="flex justify-between items-start">
      <div>
        <RouterLink to="/app/decks" class="text-primary-600 dark:text-primary-400 hover:underline mb-2 inline-block">
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
        <p class="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-1">{{ deck.newCount }}</p>
      </div>
      <div class="card">
        <p class="text-sm text-secondary-color">待複習</p>
        <p class="text-3xl font-bold text-warning-600 dark:text-warning-400 mt-1">{{ deck.reviewCount }}</p>
      </div>
      <div class="card">
        <p class="text-sm text-secondary-color">已掌握</p>
        <p class="text-3xl font-bold text-success-600 dark:text-success-400 mt-1">{{ deck.masteredCount }}</p>
      </div>
    </div>

    <!-- 卡片列表 -->
    <div class="card">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-primary-color">卡片列表</h2>
        <button @click="showAddCardModal = true" class="btn btn-primary btn-sm">➕ 新增卡片</button>
      </div>

      <div v-if="cards.length > 0" class="space-y-2">
        <div
          v-for="card in cards"
          :key="card.id"
          class="flex items-center justify-between p-4 bg-secondary-color rounded-lg bg-hover-color transition-colors"
        >
          <div class="flex-1">
            <div class="font-semibold text-primary-color">{{ card.front }}</div>
            <div class="text-sm text-secondary-color">{{ card.back }}</div>
          </div>
          <div class="flex items-center space-x-4">
            <span :class="getStatusBadgeClass(card.status)" class="badge">
              {{ getStatusText(card.status) }}
            </span>
            <span class="text-sm text-tertiary-color">
              間隔: {{ card.interval }}天
            </span>
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
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-primary-color"
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
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-primary-color"
            disabled
          />
        </div>
      </div>
    </div>

    <!-- 新增卡片 Modal -->
    <div
      v-if="showAddCardModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click="showAddCardModal = false"
    >
      <div class="card max-w-md w-full mx-4" @click.stop>
        <h2 class="text-2xl font-bold text-primary-color mb-4">新增卡片</h2>

        <form @submit.prevent="handleAddCard" class="space-y-4">
          <div>
            <label for="cardFront" class="block text-sm font-medium text-secondary-color mb-1">
              正面（問題）
            </label>
            <input
              id="cardFront"
              v-model="newCardFront"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-primary-color"
              placeholder="例如：hello"
            />
          </div>

          <div>
            <label for="cardBack" class="block text-sm font-medium text-secondary-color mb-1">
              背面（答案）
            </label>
            <textarea
              id="cardBack"
              v-model="newCardBack"
              rows="3"
              required
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-primary-color"
              placeholder="例如：哈囉、你好"
            ></textarea>
          </div>

          <div class="flex space-x-3">
            <button type="button" @click="showAddCardModal = false" class="btn btn-secondary flex-1">
              取消
            </button>
            <button type="submit" class="btn btn-primary flex-1">新增</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useDeckStore } from '@/stores/deck'
import { useCardStore } from '@/stores/card'

const route = useRoute()
const deckStore = useDeckStore()
const cardStore = useCardStore()

const deckId = route.params.deckId as string
const deck = computed(() => deckStore.getDeckById(deckId))
const cards = computed(() => cardStore.getCardsByDeck(deckId))

const showAddCardModal = ref(false)
const newCardFront = ref('')
const newCardBack = ref('')

const handleAddCard = () => {
  cardStore.createCard(deckId, newCardFront.value, newCardBack.value)
  newCardFront.value = ''
  newCardBack.value = ''
  showAddCardModal.value = false

  // 更新卡組的卡片統計
  if (deck.value) {
    deckStore.updateDeck(deckId, {
      cardCount: deck.value.cardCount + 1,
      newCount: deck.value.newCount + 1
    })
  }
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    new: '新卡',
    learning: '學習中',
    review: '複習',
    mastered: '已掌握'
  }
  return statusMap[status] || status
}

const getStatusBadgeClass = (status: string) => {
  const classMap: Record<string, string> = {
    new: 'badge-primary',
    learning: 'badge-warning',
    review: 'badge-info',
    mastered: 'badge-success'
  }
  return classMap[status] || ''
}
</script>
