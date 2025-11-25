import { Request, Response, NextFunction } from 'express'
import User from '../model/User.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { UnauthorizedError, ForbiddenError, NotFoundError } from '../utils/errors.js'
import { UserRole } from '../model/types.js'
// 導入 Express 型別擴展（必須導入以讓 TypeScript 識別型別擴展）
import '../types/express.js'

/**
 * 驗證用戶是否已登入
 */
export const requireAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  // 檢查 session 中是否有 userId
  if (!req.session || !req.session.userId) {
    throw new UnauthorizedError('請先登入')
  }

  // 從資料庫獲取用戶資訊
  const user = await User.findById(req.session.userId)

  if (!user) {
    // 清除無效的 session
    req.session.destroy(() => {})
    throw new UnauthorizedError('用戶不存在，請重新登入')
  }

  // 檢查帳號是否啟用
  if (!user.isActive) {
    throw new UnauthorizedError('此帳號已被停用')
  }

  // 將用戶資訊附加到 request 上，供後續 middleware 使用
  req.user = user

  next()
})

/**
 * 角色權限驗證 (RBAC)
 * 定義角色層級：user < pro < admin < super_admin
 */
const roleHierarchy: Record<UserRole, number> = {
  user: 1,
  pro: 2,
  admin: 3,
  super_admin: 4,
}

/**
 * 驗證用戶是否具有指定角色或更高權限
 * @param allowedRoles - 允許的角色列表
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    // 確保已經過 requireAuth
    if (!req.user) {
      throw new UnauthorizedError('請先登入')
    }

    const userRole = req.user.role as UserRole
    const userLevel = roleHierarchy[userRole]

    // 檢查用戶角色是否符合要求
    const hasPermission = allowedRoles.some((role) => {
      const requiredLevel = roleHierarchy[role]
      return userLevel >= requiredLevel
    })

    if (!hasPermission) {
      throw new ForbiddenError('權限不足，無法執行此操作')
    }

    next()
  })
}

/**
 * 驗證用戶是否為資源擁有者或管理員
 * @param getResourceOwnerId - 函數，用於從 request 中獲取資源擁有者 ID
 */
export const requireOwnerOrAdmin = (
  getResourceOwnerId: (req: Request) => Promise<string | null>,
) => {
  return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    // 確保已經過 requireAuth
    if (!req.user) {
      throw new UnauthorizedError('請先登入')
    }

    const userRole = req.user.role as UserRole
    const userId = req.user._id.toString()

    // 管理員和超級管理員可以訪問所有資源
    if (userRole === 'admin' || userRole === 'super_admin') {
      return next()
    }

    // 獲取資源擁有者 ID
    const resourceOwnerId = await getResourceOwnerId(req)

    if (!resourceOwnerId) {
      throw new NotFoundError('資源不存在')
    }

    // 檢查是否為資源擁有者
    if (userId !== resourceOwnerId) {
      throw new ForbiddenError('您沒有權限訪問此資源')
    }

    next()
  })
}

/**
 * 速率限制檢查器 (可選)
 * 基於角色的不同限制
 * @param limits - 各角色的速率限制配置
 * TODO: 實作實際的速率限制邏輯（需要 Redis）
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const checkRateLimit = (_limits: Record<UserRole, number>) => {
  return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    // 確保已經過 requireAuth
    if (!req.user) {
      throw new UnauthorizedError('請先登入')
    }

    // 這裡可以實作實際的速率限制邏輯
    // 例如：使用 Redis 存儲用戶請求次數
    // const userRole = req.user.role as UserRole
    // const limit = limits[userRole]
    // 檢查並限制請求頻率...

    next()
  })
}

/**
 * 驗證用戶訂閱狀態
 */
export const requireSubscription = (minPlan: 'free' | 'pro' = 'pro') => {
  return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    // 確保已經過 requireAuth
    if (!req.user) {
      throw new UnauthorizedError('請先登入')
    }

    const user = req.user
    const userRole = user.role as UserRole

    // 管理員和超級管理員不受訂閱限制
    if (userRole === 'admin' || userRole === 'super_admin') {
      return next()
    }

    // 檢查訂閱狀態
    if (minPlan === 'pro') {
      const hasPro =
        user.subscription?.plan === 'pro' &&
        user.subscription?.isActive &&
        user.subscription?.endDate &&
        new Date(user.subscription.endDate) > new Date()

      if (!hasPro) {
        throw new ForbiddenError('此功能需要 Pro 訂閱')
      }
    }

    next()
  })
}
