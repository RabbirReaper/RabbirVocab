import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/errors.js'
import mongoose from 'mongoose'

/**
 * MongoDB 重複鍵錯誤介面
 */
interface MongoDuplicateKeyError extends Error {
  code: number
  keyValue: Record<string, unknown>
}

/**
 * Mongoose 驗證錯誤項目介面
 */
interface MongooseValidationErrorItem {
  message: string
  path: string
}

/**
 * 開發環境錯誤回應
 */
const sendErrorDev = (err: AppError, res: Response) => {
  res.status(err.statusCode).json({
    message: err.message,
    error: {
      ...err,
      stack: err.stack,
    },
  })
}

/**
 * 生產環境錯誤回應
 */
const sendErrorProd = (err: AppError, res: Response) => {
  // 可操作的、可信任的錯誤：發送詳細訊息給客戶端
  if (err.isOperational) {
    res.status(err.statusCode).json({
      message: err.message,
    })
  } else {
    // 程式錯誤或未知錯誤：不洩露錯誤細節
    console.error('❌ ERROR:', err)

    res.status(500).json({
      message: '伺服器發生錯誤',
    })
  }
}

/**
 * 處理 Mongoose CastError (無效的 ID 格式)
 */
const handleCastError = (err: mongoose.Error.CastError): AppError => {
  const message = `無效的 ${err.path}: ${err.value}`
  return new AppError(message, 400)
}

/**
 * 處理 Mongoose 重複鍵錯誤
 */
const handleDuplicateFieldsError = (err: MongoDuplicateKeyError): AppError => {
  const field = Object.keys(err.keyValue)[0]
  const value = err.keyValue[field]
  const message = `${field} "${value}" 已被使用，請使用其他值`
  return new AppError(message, 409)
}

/**
 * 處理 Mongoose 驗證錯誤
 */
const handleValidationError = (err: mongoose.Error.ValidationError): AppError => {
  const errors = Object.values(err.errors).map((el: MongooseValidationErrorItem) => el.message)
  const message = `驗證失敗：${errors.join(', ')}`
  return new AppError(message, 400)
}

/**
 * 全域錯誤處理 middleware
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  let error: AppError = {
    ...(err as AppError),
    name: err.name,
    message: err.message,
    statusCode: (err as AppError).statusCode || 500,
    isOperational: (err as AppError).isOperational !== undefined ? (err as AppError).isOperational : false,
  } as AppError

  // Mongoose CastError (無效的 ObjectId)
  if (err.name === 'CastError') {
    error = handleCastError(err as mongoose.Error.CastError)
  }

  // Mongoose 重複鍵錯誤
  if ('code' in err && err.code === 11000) {
    error = handleDuplicateFieldsError(err as MongoDuplicateKeyError)
  }

  // Mongoose 驗證錯誤
  if (err.name === 'ValidationError') {
    error = handleValidationError(err as mongoose.Error.ValidationError)
  }

  // JWT 錯誤處理
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('無效的 token，請重新登入', 401)
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token 已過期，請重新登入', 401)
  }

  // 根據環境發送不同的錯誤回應
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res)
  } else {
    sendErrorProd(error, res)
  }
}

/**
 * 404 錯誤處理
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    message: `找不到路由: ${req.method} ${req.originalUrl}`,
  })
}
