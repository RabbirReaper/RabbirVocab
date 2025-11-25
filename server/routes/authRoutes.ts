import { Router } from 'express'
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
} from '../controllers/authController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

// 公開路由
router.post('/register', register)
router.post('/login', login)

// 需要身份驗證的路由
router.post('/logout', requireAuth, logout)
router.get('/me', requireAuth, getMe)
router.patch('/profile', requireAuth, updateProfile)
router.patch('/change-password', requireAuth, changePassword)

export default router
