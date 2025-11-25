// Express 型別擴展
// 此檔案擴展 Express.Request 介面以支援自定義的 user 屬性

import type { IUser } from '../model/types.js'

declare global {
  namespace Express {
    interface Request {
      user?: IUser
    }
  }
}

export {}
