import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/api/modules'
import type { DeckDto, UpdateDeckRequest, ApiError } from '@/api/types'

export interface SRSConfig {
  newCardsPerDay: number
  reviewsPerDay: number
  easyMultiplier: number
  hardMultiplier: number
  lapseSteps: number[]
}

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
  cardCount: number
  newCount: number
  reviewCount: number
  masteredCount: number
  srsConfig: SRSConfig
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
  const totalCards = computed(() => decks.value.reduce((sum, deck) => sum + deck.cardCount, 0))
  const totalReviews = computed(() => decks.value.reduce((sum, deck) => sum + deck.reviewCount, 0))

  // 轉換函數：將 API 返回的 DeckDto 轉換為前端 Deck
  function transformDeckDto(dto: DeckDto, stats?: DeckStats): Deck {
    return {
      id: dto._id,
      name: dto.name,
      description: dto.description,
      user: dto.user,
      cardCount: stats?.cardCount || 0,
      newCount: stats?.newCount || 0,
      reviewCount: stats?.reviewCount || 0,
      masteredCount: stats?.masteredCount || 0,
      srsConfig: {
        newCardsPerDay: dto.settings.newCardsPerDay,
        reviewsPerDay: dto.settings.reviewCardsPerDay,
        easyMultiplier: dto.settings.srsConfig.easyBonus,
        hardMultiplier: dto.settings.srsConfig.hardInterval,
        lapseSteps: dto.settings.srsConfig.relearningSteps,
      },
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

  async function updateDeck(id: string, updates: { name?: string; description?: string }) {
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
    totalCards,
    totalReviews,
    getDeckById,
    setCurrentDeck,
    fetchDecks,
    fetchDeck,
    createDeck,
    updateDeck,
    deleteDeck,
    updateDeckStats,
  }
})
