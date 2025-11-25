import session from 'express-session'
import MongoStore from 'connect-mongo'

/**
 * Session 配置
 */
export const sessionConfig = {
  // Session 密鑰
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',

  // Session 儲存方式：使用 MongoDB
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/rabbirvocab',
    touchAfter: 24 * 3600, // 24 小時內只更新一次 session（降低資料庫負載）
    crypto: {
      secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    },
  }),

  // Cookie 設定
  cookie: {
    maxAge: 30 * 60 * 1000, // 30 分鐘後過期（用戶活動時會自動延長）
    httpOnly: true, // 防止 XSS 攻擊
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax', // 生產環境支援跨域，開發環境使用 lax
  },

  // Session 設定
  resave: false, // 不強制保存未修改的 session
  saveUninitialized: false, // 不保存未初始化的 session
  rolling: true, // 每次請求時重置 cookie 過期時間（保持用戶登入狀態）
  name: 'sessionId', // 自定義 cookie 名稱（隱藏預設的 connect.sid）
}

/**
 * 創建 session middleware
 */
export const createSessionMiddleware = () => {
  return session(sessionConfig)
}
