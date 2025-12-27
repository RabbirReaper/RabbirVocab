import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useDeckStore } from './deck'
import { api } from '@/api/modules'
import type {
  CardDto,
  CreateCardRequest,
  UpdateCardRequest,
  CardImage,
  CardAudio,
  CardSRS,
  ApiError,
} from '@/api/types'
import type { DeckStats } from './deck'

export interface Card {
  id: string
  deck: string
  front: string
  back: {
    image?: CardImage
    content: string
  }
  audio?: CardAudio
  tags: string[] // TODO: 未來改為 Tag ObjectId 陣列
  status: 'new' | 'learning' | 'review'
  srs: CardSRS
  dueDate: string // 從 srs.dueDate 直接提取
  createdAt: string
  updatedAt: string
}

export const useCardStore = defineStore('card', () => {
  // 狀態
  const cards = ref<Card[]>([])
  const currentCard = ref<Card | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 計算屬性
  const totalCards = computed(() => cards.value.length)

  // 轉換函數：將 API 返回的 CardDto 轉換為前端 Card
  function transformCardDto(dto: CardDto): Card {
    return {
      id: dto._id,
      deck: dto.deck,
      front: dto.front,
      back: dto.back,
      audio: dto.audio,
      tags: dto.tags,
      status: dto.status,
      srs: dto.srs,
      dueDate: dto.srs.dueDate, // 直接從 srs 提取
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    }
  }

  // 統計計算函數
  function calculateDeckStats(deckId: string): DeckStats {
    const deckCards = cards.value.filter((c) => c.deck === deckId)
    const now = new Date()

    return {
      cardCount: deckCards.length,
      newCount: deckCards.filter((c) => c.status === 'new').length,
      reviewCount: deckCards.filter(
        (c) => c.status === 'review' && new Date(c.srs.dueDate) <= now,
      ).length,
      masteredCount: deckCards.filter((c) => c.srs.stability >= 21).length, // 使用 FSRS-6 的 stability
    }
  }

  // API Actions
  async function fetchCardsByDeck(deckId: string) {
    loading.value = true
    error.value = null
    try {
      const response = await api.card.getAllCardsInDeck(deckId)
      const transformedCards = response.cards.map(transformCardDto)

      // 替換該卡組的卡片
      cards.value = [...cards.value.filter((c) => c.deck !== deckId), ...transformedCards]

      // 計算並更新統計
      const stats = calculateDeckStats(deckId)
      const deckStore = useDeckStore()
      deckStore.updateDeckStats(deckId, stats)

      return transformedCards
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || '獲取卡片失敗'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createCard(data: CreateCardRequest) {
    loading.value = true
    error.value = null
    try {
      const response = await api.card.createCard(data)
      const newCard = transformCardDto(response.card)
      cards.value.push(newCard)

      // 更新卡組統計
      const stats = calculateDeckStats(data.deck)
      const deckStore = useDeckStore()
      deckStore.updateDeckStats(data.deck, stats)

      return newCard
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || '建立卡片失敗'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateCard(id: string, data: UpdateCardRequest) {
    loading.value = true
    error.value = null
    try {
      const response = await api.card.updateCard(id, data)
      const updatedCard = transformCardDto(response.card)
      const index = cards.value.findIndex((c) => c.id === id)
      if (index !== -1) {
        cards.value[index] = updatedCard
      }
      return updatedCard
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || '更新卡片失敗'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteCard(id: string) {
    loading.value = true
    error.value = null
    try {
      const card = getCardById(id)
      if (!card) return

      await api.card.deleteCard(id)
      const index = cards.value.findIndex((c) => c.id === id)
      if (index !== -1) {
        cards.value.splice(index, 1)
      }

      // 更新卡組統計
      const stats = calculateDeckStats(card.deck)
      const deckStore = useDeckStore()
      deckStore.updateDeckStats(card.deck, stats)
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || '刪除卡片失敗'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 本地 Actions
  function getCardsByDeck(deckId: string): Card[] {
    return cards.value.filter((card) => card.deck === deckId)
  }

  function getDueCards(deckId: string): Card[] {
    const now = new Date()
    return cards.value.filter((card) => card.deck === deckId && new Date(card.dueDate) <= now)
  }

  function getCardById(id: string): Card | undefined {
    return cards.value.find((card) => card.id === id)
  }

  async function reviewCard(
    id: string,
    rating: 'again' | 'hard' | 'good' | 'easy',
  ) {
    loading.value = true
    error.value = null
    try {
      const card = getCardById(id)
      if (!card) {
        throw new Error('找不到此字卡')
      }

      // 將 rating 轉換為 quality (1-4)
      const qualityMap = {
        again: 1, // 修改: 0 -> 1
        hard: 2,  // 修改: 1 -> 2
        good: 3,  // 修改: 2 -> 3
        easy: 4,  // 修改: 3 -> 4
      }
      const quality = qualityMap[rating]

      // 調用 API 進行複習
      const response = await api.card.reviewCard(id, { quality })
      const updatedCard = transformCardDto(response.card)

      // 更新本地狀態
      const index = cards.value.findIndex((c) => c.id === id)
      if (index !== -1) {
        cards.value[index] = updatedCard
      }

      // 更新卡組統計
      const stats = calculateDeckStats(card.deck)
      const deckStore = useDeckStore()
      deckStore.updateDeckStats(card.deck, stats)

      return updatedCard
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || '複習卡片失敗'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    cards,
    currentCard,
    loading,
    error,
    totalCards,
    getCardsByDeck,
    getDueCards,
    getCardById,
    fetchCardsByDeck,
    createCard,
    updateCard,
    deleteCard,
    reviewCard,
  }
})
