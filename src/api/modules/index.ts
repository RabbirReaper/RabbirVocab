import { authApi } from './auth.api'
import { deckApi } from './deck.api'
import { cardApi } from './card.api'
import { aiApi } from './ai.api'

export { authApi, deckApi, cardApi, aiApi }

// 統一 API 對象（推薦使用方式）
export const api = {
  auth: authApi,
  deck: deckApi,
  card: cardApi,
  ai: aiApi,
}
