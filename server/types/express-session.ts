// Express Session 型別擴展
// 此檔案擴展 express-session 的 SessionData 介面以支援自定義的 session 屬性

declare module 'express-session' {
  interface SessionData {
    userId: string
    role: string
  }
}

export {}
