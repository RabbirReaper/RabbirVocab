import express, { Application } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import path from 'path'
import { fileURLToPath } from 'url'
import { createSessionMiddleware } from './config/session.js'
import { connectDatabase } from './config/database.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

// 預先載入所有模型以註冊 Mongoose schemas
import './model/User.js'
import './model/Deck.js'
import './model/Card.js'
import './model/Tag.js'
import './model/Review.js'
import './model/StudySession.js'

import apiRoutes from './routes/index.js' // 未來可以整合所有 API 路由

// ES Module 環境下獲取 __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * 創建 Express 應用
 */
export const createApp = (): Application => {
  const app = express()

  // 安全性 middleware (生產環境需要配置以允許靜態資源)
  if (process.env.NODE_ENV !== 'production') {
    app.use(
      helmet({
        contentSecurityPolicy: false,
      }),
    )
  }

  // CORS 配置 (需要在所有路由之前)
  app.use(
    cors({
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true, // 允許攜帶 cookies
    }),
  )

  // Body parser - 全局 JSON 和 URL 編碼解析中間件
  app.use(express.json({ limit: '2mb' }))
  app.use(express.urlencoded({ limit: '2mb', extended: true }))

  // Logger (開發環境)
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
  }

  // Session middleware
  app.use(createSessionMiddleware())

  // 健康檢查
  app.get('/health', (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    })
  })

  app.use('/api', apiRoutes) // 未來可以添加更多路由

  // 提供前端靜態文件 (生產環境) - 必須在 API 路由之後
  if (process.env.NODE_ENV === 'production') {
    const staticPath = path.resolve(__dirname, '..')

    // 提供靜態資源
    app.use(express.static(staticPath))

    // SPA 路由處理 - 所有非 API 路由都返回 index.html
    app.use((_req, res, next) => {
      // 如果是 API 路由,跳到下一個 middleware (讓後面的 404 處理器處理)
      if (_req.path.startsWith('/api')) {
        return next()
      }
      // 否則返回前端 index.html
      res.sendFile(path.resolve(staticPath, 'index.html'))
    })
  }

  // 404 處理 (只處理 API 路由)
  app.use('/api', notFoundHandler)

  // 錯誤處理
  app.use(errorHandler)

  return app
}

/**
 * 啟動伺服器
 */
export const startServer = async (): Promise<void> => {
  const PORT = process.env.PORT || 8080

  try {
    // 連接資料庫
    await connectDatabase()

    // 創建應用
    const app = createApp()

    // 啟動伺服器
    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`)
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`Database: Connected`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}
