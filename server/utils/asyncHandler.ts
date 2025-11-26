import { Request, Response, NextFunction } from 'express'

/**
 * 非同步請求處理器函數型別
 * @template T - 函數返回值型別 (預設為 void)
 */
type AsyncRequestHandler<T = void> = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<T>

/**
 * 包裝 async 函數，自動捕獲錯誤並傳給錯誤處理 middleware
 *
 * @template T - 非同步函數的返回型別 (預設為 void)
 * @param fn - 要包裝的非同步函數
 * @returns Express 路由處理器
 *
 * @example
 * // Middleware 用法 (返回 void)
 * export const requireAuth = asyncHandler(async (req, res, next) => {
 *   // ... 驗證邏輯
 *   next()
 * })
 *
 * @example
 * // Controller 用法 (返回 Response)
 * export const getUser = asyncHandler(async (req, res) => {
 *   const user = await User.findById(req.params.id)
 *   res.json({ user })
 * })
 */
export const asyncHandler =
  <T = void>(fn: AsyncRequestHandler<T>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
