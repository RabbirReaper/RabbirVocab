import { Router } from 'express'
import {
  createCard,
  getCards,
  getAllCardsInDeck,
  getCard,
  updateCard,
  deleteCard,
} from '../controllers/cardController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

// 所有路由都需要身份驗證
router.use(requireAuth)

// CRUD 路由
router.post('/', createCard) // 創建 Card
router.get('/', getCards) // 獲取指定 Deck 的所有 Cards (需要 query parameter: deck)
router.get('/deck/:deckId', getAllCardsInDeck) // 獲取指定 Deck 的所有 Cards
router.get('/:cardId', getCard) // 獲取單個 Card
router.put('/:cardId', updateCard) // 更新 Card（完整替換）
router.delete('/:cardId', deleteCard) // 刪除 Card

export default router
