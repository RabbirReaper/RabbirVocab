import { Router } from 'express'
import { getOverviewStats, getRecentActivity, getDeckStats } from '../controllers/statsController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

// 所有路由都需要身份驗證
router.use(requireAuth)

// 統計路由
router.get('/overview', getOverviewStats) // 獲取總體統計
router.get('/recent-activity', getRecentActivity) // 獲取最近活動
router.get('/deck/:deckId', getDeckStats) // 獲取 Deck 統計

export default router
