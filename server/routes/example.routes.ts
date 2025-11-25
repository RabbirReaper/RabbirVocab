import { Router, Request } from 'express'
import { requireAuth, requireRole, requireOwnerOrAdmin } from '../middleware/authMiddleware'
import { asyncHandler } from '../utils/asyncHandler'
import Deck from '../model/Deck'

const router = Router()

/**
 * 範例：公開路由（無需驗證）
 * GET /api/example/public
 */
router.get('/public', (_req, res) => {
  res.json({ message: '這是公開路由' })
})

/**
 * 範例：需要登入的路由
 * GET /api/example/protected
 */
router.get('/protected', requireAuth, (req, res) => {
  const user = req.user!
  res.json({
    message: '這是受保護的路由',
    user: {
      id: user._id,
      username: user.username,
      role: user.role,
    },
  })
})

/**
 * 範例：需要 Pro 用戶或更高權限
 * GET /api/example/pro-only
 */
router.get('/pro-only', requireAuth, requireRole('pro'), (req, res) => {
  res.json({
    message: '這是 Pro 用戶專屬功能',
    user: req.user!.username,
  })
})

/**
 * 範例：需要管理員權限
 * GET /api/example/admin-only
 */
router.get('/admin-only', requireAuth, requireRole('admin'), (req, res) => {
  res.json({
    message: '這是管理員專屬功能',
    user: req.user!.username,
  })
})

/**
 * 範例：需要超級管理員權限
 * GET /api/example/super-admin-only
 */
router.get('/super-admin-only', requireAuth, requireRole('super_admin'), (req, res) => {
  res.json({
    message: '這是超級管理員專屬功能',
    user: req.user!.username,
  })
})

/**
 * 範例：驗證資源擁有者或管理員
 * GET /api/example/deck/:deckId
 */
router.get(
  '/deck/:deckId',
  requireAuth,
  requireOwnerOrAdmin(async (req: Request) => {
    // 從資料庫獲取資源擁有者 ID
    const deck = await Deck.findById(req.params.deckId)
    return deck ? deck.user.toString() : null
  }),
  asyncHandler(async (req, res) => {
    const deck = await Deck.findById(req.params.deckId)
    res.json({
      message: '您可以訪問此卡組',
      deck,
    })
  }),
)

/**
 * 範例：多個角色都可以訪問
 * 允許 admin 和 super_admin 訪問
 * GET /api/example/admin-area
 */
router.get('/admin-area', requireAuth, requireRole('admin', 'super_admin'), (req, res) => {
  res.json({
    message: '管理員區域',
    user: req.user!.username,
  })
})

export default router
