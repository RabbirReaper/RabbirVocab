import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export interface Card {
  id: string
  deck: string
  front: string
  back: string
  image?: string
  audio?: string
  tags: string[]
  status: 'new' | 'learning' | 'review' | 'mastered'
  easeFactor: number
  interval: number
  dueDate: string
  createdAt: string
  updatedAt: string
}

export const useCardStore = defineStore('card', () => {
  // 狀態
  const cards = ref<Card[]>([
    {
      id: '1',
      deck: '1',
      front: 'hello',
      back: '哈囉、你好',
      tags: ['greeting', 'basic'],
      status: 'mastered',
      easeFactor: 2.5,
      interval: 30,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      deck: '1',
      front: 'goodbye',
      back: '再見',
      tags: ['greeting', 'basic'],
      status: 'review',
      easeFactor: 2.3,
      interval: 7,
      dueDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '3',
      deck: '1',
      front: 'thank you',
      back: '謝謝',
      tags: ['polite', 'basic'],
      status: 'learning',
      easeFactor: 2.5,
      interval: 1,
      dueDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '4',
      deck: '2',
      front: 'abundant',
      back: '豐富的、充足的',
      tags: ['adjective', 'toefl'],
      status: 'new',
      easeFactor: 2.5,
      interval: 0,
      dueDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '5',
      deck: '2',
      front: 'accomplish',
      back: '完成、達成',
      tags: ['verb', 'toefl'],
      status: 'review',
      easeFactor: 2.4,
      interval: 14,
      dueDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ])

  const currentCard = ref<Card | null>(null)

  // 計算屬性
  const totalCards = computed(() => cards.value.length)

  // 動作
  function getCardsByDeck(deckId: string): Card[] {
    return cards.value.filter(card => card.deck === deckId)
  }

  function getDueCards(deckId: string): Card[] {
    const now = new Date()
    return cards.value.filter(card =>
      card.deck === deckId && new Date(card.dueDate) <= now
    )
  }

  function getCardById(id: string): Card | undefined {
    return cards.value.find(card => card.id === id)
  }

  function createCard(deckId: string, front: string, back: string, tags: string[] = []) {
    const newCard: Card = {
      id: String(Date.now()),
      deck: deckId,
      front,
      back,
      tags,
      status: 'new',
      easeFactor: 2.5,
      interval: 0,
      dueDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    cards.value.push(newCard)
    return newCard
  }

  function updateCard(id: string, updates: Partial<Omit<Card, 'id' | 'createdAt'>>) {
    const index = cards.value.findIndex(card => card.id === id)
    if (index !== -1) {
      cards.value[index] = {
        ...cards.value[index],
        ...updates,
        updatedAt: new Date().toISOString()
      } as Card
    }
  }

  function deleteCard(id: string) {
    const index = cards.value.findIndex(card => card.id === id)
    if (index !== -1) {
      cards.value.splice(index, 1)
    }
  }

  function reviewCard(id: string, rating: 'again' | 'hard' | 'good' | 'easy') {
    const card = getCardById(id)
    if (!card) return

    let newInterval = card.interval
    let newEaseFactor = card.easeFactor
    let newStatus = card.status

    // 簡化的 SRS 演算法
    switch (rating) {
      case 'again':
        newInterval = 0
        newEaseFactor = Math.max(1.3, card.easeFactor - 0.2)
        newStatus = 'learning'
        break
      case 'hard':
        newInterval = Math.max(1, Math.floor(card.interval * 1.2))
        newEaseFactor = Math.max(1.3, card.easeFactor - 0.15)
        newStatus = 'review'
        break
      case 'good':
        newInterval = card.interval === 0 ? 1 : Math.floor(card.interval * card.easeFactor)
        newStatus = newInterval >= 21 ? 'mastered' : 'review'
        break
      case 'easy':
        newInterval = card.interval === 0 ? 4 : Math.floor(card.interval * card.easeFactor * 1.3)
        newEaseFactor = card.easeFactor + 0.15
        newStatus = 'mastered'
        break
    }

    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + newInterval)

    updateCard(id, {
      interval: newInterval,
      easeFactor: newEaseFactor,
      status: newStatus,
      dueDate: dueDate.toISOString()
    })
  }

  return {
    cards,
    currentCard,
    totalCards,
    getCardsByDeck,
    getDueCards,
    getCardById,
    createCard,
    updateCard,
    deleteCard,
    reviewCard
  }
})
