import { Router } from 'express'
import {
  createDeck,
  getDecks,
  getDeck,
  updateDeck,
  deleteDeck,
} from '../controllers/deckController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

// 所有路由都需要身份驗證
router.use(requireAuth)

// CRUD 路由
router.post('/', createDeck) // 創建 Deck
router.get('/', getDecks) // 獲取所有 Decks
router.get('/:deckId', getDeck) // 獲取單個 Deck
router.put('/:deckId', updateDeck) // 更新 Deck（完整替換）
router.delete('/:deckId', deleteDeck) // 刪除 Deck

export default router
