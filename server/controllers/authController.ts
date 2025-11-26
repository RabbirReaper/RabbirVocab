import { Request, Response } from 'express'
import User from '../model/User.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import {
  ValidationError,
  UnauthorizedError,
  ConflictError,
  NotFoundError,
} from '../utils/errors.js'

// 擴展 Express Session 類型
declare module 'express-session' {
  interface SessionData {
    userId: string
    role: string
  }
}

/**
 * @desc    註冊新用戶
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password } = req.body

  // 驗證必填欄位
  if (!username || !email || !password) {
    throw new ValidationError('請提供 username、email 和 password')
  }

  // 驗證密碼長度
  if (password.length < 6) {
    throw new ValidationError('密碼長度至少需要 6 個字元')
  }

  // 驗證用戶名長度
  if (username.length < 3) {
    throw new ValidationError('用戶名長度至少需要 3 個字元')
  }

  // 驗證 email 格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new ValidationError('請提供有效的 email 格式')
  }

  // 檢查 email 是否已存在
  const existingUser = await User.findOne({ email: email.toLowerCase() })
  if (existingUser) {
    throw new ConflictError('此 email 已被註冊')
  }

  // 創建新用戶
  const user = await User.create({
    username,
    email: email.toLowerCase(),
    password,
  })

  // 設置 session
  req.session.userId = user._id.toString()
  req.session.role = user.role

  res.status(201).json({
    message: 'success',
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role,
      },
    },
  })
})

/**
 * @desc    用戶登入
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body

  // 驗證必填欄位
  if (!email || !password) {
    throw new ValidationError('請提供 email 和 password')
  }

  // 查找用戶（包含密碼欄位）
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password')

  if (!user) {
    throw new UnauthorizedError('Email 或密碼錯誤')
  }

  // 檢查帳號是否啟用
  if (!user.isActive) {
    throw new UnauthorizedError('此帳號已被停用')
  }

  // 驗證密碼
  const isPasswordCorrect = await user.comparePassword(password)
  if (!isPasswordCorrect) {
    throw new UnauthorizedError('Email 或密碼錯誤')
  }

  // 更新最後登入時間
  user.lastLogin = new Date()
  await user.save()

  // 設置 session
  req.session.userId = user._id.toString()
  req.session.role = user.role

  res.status(200).json({
    message: 'success',
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role,
        stats: user.stats,
      },
    },
  })
})

/**
 * @desc    用戶登出
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  // 銷毀 session
  req.session.destroy((err) => {
    if (err) {
      console.error('Session 銷毀失敗:', err)
    }
  })

  // 清除 cookie
  res.clearCookie('sessionId') // 自定義的 session cookie 名稱（與 config/session.ts 中設置一致）

  res.status(200).json({
    message: 'success',
  })
})

/**
 * @desc    獲取當前用戶資訊
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId

  if (!userId) {
    throw new UnauthorizedError('未登入')
  }

  const user = await User.findById(userId)

  if (!user) {
    throw new NotFoundError('用戶不存在')
  }

  res.status(200).json({
    message: 'success',
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role,
        stats: user.stats,
        subscription: user.subscription,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    },
  })
})

/**
 * @desc    更新用戶資料
 * @route   PATCH /api/auth/profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId

  if (!userId) {
    throw new UnauthorizedError('未登入')
  }

  const { username, displayName, avatar } = req.body

  // 只允許更新特定欄位
  const allowedUpdates: {
    username?: string
    displayName?: string
    avatar?: string
  } = {}
  if (username !== undefined) {
    if (username.length < 3) {
      throw new ValidationError('用戶名長度至少需要 3 個字元')
    }
    allowedUpdates.username = username
  }
  if (displayName !== undefined) allowedUpdates.displayName = displayName
  if (avatar !== undefined) allowedUpdates.avatar = avatar

  const user = await User.findByIdAndUpdate(userId, allowedUpdates, {
    new: true,
    runValidators: true,
  })

  if (!user) {
    throw new NotFoundError('用戶不存在')
  }

  res.status(200).json({
    message: 'success',
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role,
      },
    },
  })
})

/**
 * @desc    修改密碼
 * @route   PATCH /api/auth/change-password
 * @access  Private
 */
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId

  if (!userId) {
    throw new UnauthorizedError('未登入')
  }

  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword) {
    throw new ValidationError('請提供當前密碼和新密碼')
  }

  if (newPassword.length < 6) {
    throw new ValidationError('新密碼長度至少需要 6 個字元')
  }

  // 查找用戶（包含密碼欄位）
  const user = await User.findById(userId).select('+password')

  if (!user) {
    throw new NotFoundError('用戶不存在')
  }

  // 驗證當前密碼
  const isPasswordCorrect = await user.comparePassword(currentPassword)
  if (!isPasswordCorrect) {
    throw new UnauthorizedError('當前密碼錯誤')
  }

  // 更新密碼
  user.password = newPassword
  await user.save()

  res.status(200).json({
    message: 'success',
  })
})
