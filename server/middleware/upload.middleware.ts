import multer, { FileFilterCallback } from 'multer'
import { Request, Response, NextFunction } from 'express'
import { ValidationError } from '../utils/errors.js'

// 文件類型白名單
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg']

// 文件大小限制（字節）
const MAX_FILE_SIZE = 1 * 1024 * 1024 // 1MB

/**
 * Multer 配置 - 支持混合字段（文本 + 文件）
 * 使用記憶體存儲，支持同時上傳圖片和音頻
 */
export const uploadCardFiles = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE, // 1MB（統一限制）
    files: 2, // 最多 2 個文件（image + audio）
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (file.fieldname === 'image' && ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true)
    } else if (file.fieldname === 'audio' && ALLOWED_AUDIO_TYPES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new ValidationError(`不支持的文件格式: ${file.mimetype}`))
    }
  },
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'audio', maxCount: 1 },
])

/**
 * Multer 錯誤處理中間件
 * 處理文件上傳相關的錯誤
 */
export const handleMulterError = (
  err: any,
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ message: '文件大小不能超過 1MB' })
      return
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      res.status(400).json({ message: '文件數量超過限制' })
      return
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({ message: '不支持的文件字段' })
      return
    }
    res.status(400).json({ message: `文件上傳錯誤: ${err.message}` })
    return
  }

  // 如果是其他類型的錯誤，傳遞給下一個錯誤處理器
  next(err)
}
