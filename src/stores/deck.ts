import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/api/modules'
import type { DeckDto, UpdateDeckRequest, ApiError, DeckSettings, SRSConfig } from '@/api/types'

export interface DeckStats {
  cardCount: number
  newCount: number
  reviewCount: number
  masteredCount: number
}

export interface Deck {
  id: string
  name: string
  description: string
  user: string
  // 統計數據（需要額外查詢）
  cardCount?: number
  newCount?: number
  reviewCount?: number
  learningCount?: number
  masteredCount?: number
  // 設定
  newCardsPerDay: number
  reviewCardsPerDay: number
  srsConfig: SRSConfig
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export const useDeckStore = defineStore('deck', () => {
  // 狀態
  const decks = ref<Deck[]>([])
  const currentDeck = ref<Deck | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 計算屬性
  const totalDecks = computed(() => decks.value.length)

  // ❌ 已移除：totalCards 和 totalReviews（改用統計 API 獲取）
  // 這些計算屬性會觸發不必要的卡片查詢，影響效能

  // 轉換函數：將 API 返回的 DeckDto 轉換為前端 Deck
  function transformDeckDto(dto: DeckDto, stats?: DeckStats): Deck {
    return {
      id: dto._id,
      name: dto.name,
      description: dto.description,
      user: dto.user,
      // 統計數據（可選，需要額外查詢）
      cardCount: stats?.cardCount,
      newCount: stats?.newCount,
      reviewCount: stats?.reviewCount,
      learningCount: undefined, // 暫時未使用
      masteredCount: stats?.masteredCount,
      // 設定
      newCardsPerDay: dto.settings.newCardsPerDay || 20,
      reviewCardsPerDay: dto.settings.reviewCardsPerDay || 200,
      srsConfig: {
        weights: dto.settings.srsConfig.weights || [],
        desiredRetention: dto.settings.srsConfig.desiredRetention || 0.9,
        learningSteps: dto.settings.srsConfig.learningSteps || [1, 10],
        relearningSteps: dto.settings.srsConfig.relearningSteps || [10],
        maximumInterval: dto.settings.srsConfig.maximumInterval || 36500,
        leechThreshold: dto.settings.srsConfig.leechThreshold || 8,
      },
      isPublic: dto.settings.isPublic,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    }
  }

  // API Actions
  async function fetchDecks() {
    loading.value = true
    error.value = null
    try {
      const response = await api.deck.getDecks()
      decks.value = response.decks.map((dto) => transformDeckDto(dto))
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || '獲取卡組失敗'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchDeck(id: string) {
    loading.value = true
    error.value = null
    try {
      const response = await api.deck.getDeck(id)
      const deck = transformDeckDto(response.deck)
      const index = decks.value.findIndex((d) => d.id === id)
      if (index !== -1) {
        decks.value[index] = deck
      } else {
        decks.value.push(deck)
      }
      currentDeck.value = deck
      return deck
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || '獲取卡組失敗'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createDeck(name: string, description?: string) {
    loading.value = true
    error.value = null
    try {
      const response = await api.deck.createDeck({ name, description })
      const newDeck = transformDeckDto(response.deck)
      decks.value.push(newDeck)
      return newDeck
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || '建立卡組失敗'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateDeck(
    id: string,
    updates: {
      name?: string
      description?: string
      settings?: Partial<DeckSettings>
    },
  ) {
    loading.value = true
    error.value = null
    try {
      const response = await api.deck.updateDeck(id, updates as UpdateDeckRequest)
      const updatedDeck = transformDeckDto(response.deck)
      const index = decks.value.findIndex((d) => d.id === id)
      if (index !== -1) {
        decks.value[index] = updatedDeck
      }
      return updatedDeck
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || '更新卡組失敗'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteDeck(id: string) {
    loading.value = true
    error.value = null
    try {
      await api.deck.deleteDeck(id)
      const index = decks.value.findIndex((d) => d.id === id)
      if (index !== -1) {
        decks.value.splice(index, 1)
      }
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || '刪除卡組失敗'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 本地 Actions
  function getDeckById(id: string): Deck | undefined {
    return decks.value.find((deck) => deck.id === id)
  }

  function setCurrentDeck(id: string) {
    currentDeck.value = getDeckById(id) || null
  }

  // ✅ 新增：按需查詢 deck 統計
  async function fetchDeckStats(deckId: string) {
    try {
      const stats = await api.stats.getDeckStats(deckId)
      const deck = decks.value.find((d) => d.id === deckId)
      if (deck) {
        deck.cardCount = stats.cardCount
        deck.newCount = stats.newCount
        deck.learningCount = stats.learningCount
        deck.reviewCount = stats.reviewCount
        deck.masteredCount = stats.masteredCount
      }
      return stats
    } catch (err) {
      const apiError = err as ApiError
      console.error('獲取 deck 統計失敗:', apiError.message)
      throw err
    }
  }

  function updateDeckStats(deckId: string, stats: DeckStats) {
    const deck = decks.value.find((d) => d.id === deckId)
    if (deck) {
      deck.cardCount = stats.cardCount
      deck.newCount = stats.newCount
      deck.reviewCount = stats.reviewCount
      deck.masteredCount = stats.masteredCount
    }
  }

  return {
    decks,
    currentDeck,
    loading,
    error,
    totalDecks,
    getDeckById,
    setCurrentDeck,
    fetchDecks,
    fetchDeck,
    fetchDeckStats, // ✅ 新增
    createDeck,
    updateDeck,
    deleteDeck,
    updateDeckStats,
  }
})
