import { Router } from 'express'
import authRoutes from './authRoutes.js'
import deckRoutes from './deckRoutes.js'
import cardRoutes from './cardRoutes.js'
// import tagRoutes from './tagRoutes.js'

const router = Router()

/**
 * API 路由統一入口
 * 所有路由都掛載在 /api 前綴下
 */

// 認證路由
router.use('/auth', authRoutes)

// 卡組和卡片管理
router.use('/decks', deckRoutes) // 卡組管理
router.use('/cards', cardRoutes) // 卡片管理

// 未來可以添加的路由：
// router.use('/tags', tagRoutes)        // 標籤管理
// router.use('/study', studyRoutes)     // 學習相關
// router.use('/review', reviewRoutes)   // 複習記錄
// router.use('/stats', statsRoutes)     // 統計數據
// router.use('/admin', adminRoutes)     // 管理員功能

export default router
