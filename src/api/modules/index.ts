import { authApi } from './auth.api'
import { deckApi } from './deck.api'
import { cardApi } from './card.api'

export { authApi, deckApi, cardApi }

// 統一 API 對象（推薦使用方式）
export const api = {
  auth: authApi,
  deck: deckApi,
  card: cardApi,
}
