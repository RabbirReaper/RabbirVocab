import { Request, Response, NextFunction } from 'express'

/**
 * 包裝 async 函數，自動捕獲錯誤並傳給錯誤處理 middleware
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
