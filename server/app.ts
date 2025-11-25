import express, { Application } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import path from 'path'
import { fileURLToPath } from 'url'
import { createSessionMiddleware } from './config/session.js'
import { connectDatabase } from './config/database.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

// Routes
import authRoutes from './routes/authRoutes.js'
// import apiRoutes from './routes/index.js' // 未來可以整合所有 API 路由

// ES Module 環境下獲取 __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * 創建 Express 應用
 */
export const createApp = (): Application => {
  const app = express()

  // 安全性 middleware (需要配置以允許靜態資源)
  app.use(
    helmet({
      contentSecurityPolicy: false, // 如果前端有內聯腳本，需要關閉或配置
    }),
  )

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

  // 提供前端靜態文件 (生產環境)
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../../dist')))
  }

  // Logger (開發環境)
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
  }

  // Session middleware
  app.use(createSessionMiddleware())

  // 健康檢查
  app.get('/health', (req, res) => {
    console.log('session data:', req.session)
    res.status(200).json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    })
  })

  // API Routes
  app.use('/api/auth', authRoutes)
  // app.use('/api', apiRoutes) // 未來可以添加更多路由

  // SPA 路由處理 - 所有非 /api 開頭的路由都返回 index.html
  // 這樣可以支援前端路由 (Vue Router)
  if (process.env.NODE_ENV === 'production') {
    app.get(/^\/(?!api).*/, (_req, res) => {
      res.sendFile(path.resolve(__dirname, '../../dist', 'index.html'))
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
  const PORT = process.env.PORT || 80

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
