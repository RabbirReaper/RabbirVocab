<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-3xl font-bold text-primary-color">所有卡片</h1>
      <div class="flex items-center space-x-4">
        <select
          v-model="selectedDeck"
          class="px-4 py-2 border border-primary-color rounded-lg text-primary-color"
        >
          <option value="">所有卡組</option>
          <option v-for="deck in deckStore.decks" :key="deck.id" :value="deck.id">
            {{ deck.name }}
          </option>
        </select>
      </div>
    </div>

    <!-- 統計 -->
    <div class="grid md:grid-cols-4 gap-6">
      <div class="card">
        <p class="text-sm text-secondary-color">總卡片數</p>
        <p class="text-3xl font-bold text-primary-color mt-1">{{ filteredCards.length }}</p>
      </div>
      <div class="card">
        <p class="text-sm text-secondary-color">新卡片</p>
        <p class="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-1">
          {{ filteredCards.filter(c => c.status === 'new').length }}
        </p>
      </div>
      <div class="card">
        <p class="text-sm text-secondary-color">學習中</p>
        <p class="text-3xl font-bold text-warning-600 dark:text-warning-400 mt-1">
          {{ filteredCards.filter(c => c.status === 'learning').length }}
        </p>
      </div>
      <div class="card">
        <p class="text-sm text-secondary-color">已掌握</p>
        <p class="text-3xl font-bold text-success-600 dark:text-success-400 mt-1">
          {{ filteredCards.filter(c => c.status === 'mastered').length }}
        </p>
      </div>
    </div>

    <!-- 卡片列表 -->
    <div class="card">
      <div class="space-y-3">
        <div
          v-for="card in filteredCards"
          :key="card.id"
          class="flex items-center justify-between p-4 bg-secondary-color rounded-lg bg-hover-color transition-colors"
        >
          <div class="flex-1">
            <div class="flex items-center space-x-3 mb-2">
              <span class="font-semibold text-primary-color">{{ card.front }}</span>
              <span :class="getStatusBadgeClass(card.status)" class="badge">
                {{ getStatusText(card.status) }}
              </span>
            </div>
            <div class="text-sm text-secondary-color">{{ card.back }}</div>
            <div class="flex items-center space-x-4 mt-2">
              <span class="text-xs text-tertiary-color">
                卡組: {{ getDeckName(card.deck) }}
              </span>
              <span class="text-xs text-tertiary-color">
                間隔: {{ card.interval }}天
              </span>
              <span class="text-xs text-tertiary-color">
                難度: {{ card.easeFactor.toFixed(2) }}
              </span>
            </div>
          </div>

          <div class="flex items-center space-x-2">
            <button class="btn btn-sm btn-secondary">編輯</button>
            <button
              @click="handleDeleteCard(card.id)"
              class="btn btn-sm bg-red-500 hover:bg-red-600 text-white border-0"
            >
              刪除
            </button>
          </div>
        </div>
      </div>

      <div v-if="filteredCards.length === 0" class="text-center py-12 text-tertiary-color">
        沒有找到卡片
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDeckStore } from '@/stores/deck'
import { useCardStore } from '@/stores/card'

const deckStore = useDeckStore()
const cardStore = useCardStore()

const selectedDeck = ref('')

const filteredCards = computed(() => {
  if (!selectedDeck.value) {
    return cardStore.cards
  }
  return cardStore.getCardsByDeck(selectedDeck.value)
})

const getDeckName = (deckId: string) => {
  const deck = deckStore.getDeckById(deckId)
  return deck?.name || '未知卡組'
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

const handleDeleteCard = (cardId: string) => {
  if (confirm('確定要刪除這張卡片嗎？')) {
    cardStore.deleteCard(cardId)
  }
}
</script>
