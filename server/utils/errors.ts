/**
 * 自定義錯誤基類
 */
export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational

    // 維護正確的 stack trace
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * 驗證錯誤 (400)
 */
export class ValidationError extends AppError {
  constructor(message: string = '驗證失敗') {
    super(message, 400)
  }
}

/**
 * 未授權錯誤 (401)
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = '未授權，請先登入') {
    super(message, 401)
  }
}

/**
 * 禁止訪問錯誤 (403)
 */
export class ForbiddenError extends AppError {
  constructor(message: string = '禁止訪問，權限不足') {
    super(message, 403)
  }
}

/**
 * 資源不存在錯誤 (404)
 */
export class NotFoundError extends AppError {
  constructor(message: string = '資源不存在') {
    super(message, 404)
  }
}

/**
 * 衝突錯誤 (409)
 */
export class ConflictError extends AppError {
  constructor(message: string = '資源衝突') {
    super(message, 409)
  }
}

/**
 * 伺服器內部錯誤 (500)
 */
export class InternalServerError extends AppError {
  constructor(message: string = '伺服器內部錯誤') {
    super(message, 500)
  }
}

/**
 * 資料庫錯誤
 */
export class DatabaseError extends AppError {
  constructor(message: string = '資料庫操作失敗') {
    super(message, 500)
  }
}
