import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export interface SRSConfig {
  newCardsPerDay: number
  reviewsPerDay: number
  easyMultiplier: number
  hardMultiplier: number
  lapseSteps: number[]
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
  const decks = ref<Deck[]>([
    {
      id: '1',
      name: '日常英語單字',
      description: '常用的日常生活英語單字',
      user: '1',
      cardCount: 150,
      newCount: 20,
      reviewCount: 45,
      masteredCount: 85,
      srsConfig: {
        newCardsPerDay: 20,
        reviewsPerDay: 100,
        easyMultiplier: 2.5,
        hardMultiplier: 1.2,
        lapseSteps: [10],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'TOEFL 核心詞彙',
      description: 'TOEFL 考試必備詞彙',
      user: '1',
      cardCount: 300,
      newCount: 50,
      reviewCount: 120,
      masteredCount: 130,
      srsConfig: {
        newCardsPerDay: 30,
        reviewsPerDay: 150,
        easyMultiplier: 2.5,
        hardMultiplier: 1.2,
        lapseSteps: [10],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      name: '商業英文',
      description: '商務場合常用英文詞彙與句型',
      user: '1',
      cardCount: 80,
      newCount: 10,
      reviewCount: 25,
      masteredCount: 45,
      srsConfig: {
        newCardsPerDay: 15,
        reviewsPerDay: 80,
        easyMultiplier: 2.5,
        hardMultiplier: 1.2,
        lapseSteps: [10],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ])

  const currentDeck = ref<Deck | null>(null)

  // 計算屬性
  const totalDecks = computed(() => decks.value.length)
  const totalCards = computed(() => decks.value.reduce((sum, deck) => sum + deck.cardCount, 0))
  const totalReviews = computed(() => decks.value.reduce((sum, deck) => sum + deck.reviewCount, 0))

  // 動作
  function getDeckById(id: string): Deck | undefined {
    return decks.value.find((deck) => deck.id === id)
  }

  function setCurrentDeck(id: string) {
    currentDeck.value = getDeckById(id) || null
  }

  function createDeck(name: string, description: string) {
    const newDeck: Deck = {
      id: String(Date.now()),
      name,
      description,
      user: '1',
      cardCount: 0,
      newCount: 0,
      reviewCount: 0,
      masteredCount: 0,
      srsConfig: {
        newCardsPerDay: 20,
        reviewsPerDay: 100,
        easyMultiplier: 2.5,
        hardMultiplier: 1.2,
        lapseSteps: [10],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    decks.value.push(newDeck)
    return newDeck
  }

  function updateDeck(id: string, updates: Partial<Omit<Deck, 'id' | 'createdAt'>>) {
    const index = decks.value.findIndex((deck) => deck.id === id)
    if (index !== -1) {
      decks.value[index] = {
        ...decks.value[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      } as Deck
    }
  }

  function deleteDeck(id: string) {
    const index = decks.value.findIndex((deck) => deck.id === id)
    if (index !== -1) {
      decks.value.splice(index, 1)
    }
  }

  return {
    decks,
    currentDeck,
    totalDecks,
    totalCards,
    totalReviews,
    getDeckById,
    setCurrentDeck,
    createDeck,
    updateDeck,
    deleteDeck,
  }
})
