import { authApi } from './auth.api'

export { authApi }

// 統一 API 對象（推薦使用方式）
export const api = {
  auth: authApi,
  // 未來擴展: deck, card 等
}
