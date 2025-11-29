import apiClient from '../client'
import type {
  ApiResponse,
  CreateCardRequest,
  UpdateCardRequest,
  GetCardsResponse,
  GetCardResponse,
} from '../types'

export const cardApi = {
  /**
   * 創建新的 Card
   */
  createCard: async (data: CreateCardRequest): Promise<GetCardResponse> => {
    const response = (await apiClient.post('/cards', data)) as ApiResponse<GetCardResponse>
    return response.data
  },

  /**
   * 獲取指定 Deck 的所有 Cards (使用 query parameter)
   */
  getCards: async (deckId: string): Promise<GetCardsResponse> => {
    const response = (await apiClient.get('/cards', {
      params: { deck: deckId },
    })) as ApiResponse<GetCardsResponse>
    return response.data
  },

  /**
   * 獲取指定 Deck 的所有 Cards (使用路由參數)
   */
  getAllCardsInDeck: async (deckId: string): Promise<GetCardsResponse> => {
    const response = (await apiClient.get(
      `/cards/deck/${deckId}`,
    )) as ApiResponse<GetCardsResponse>
    return response.data
  },

  /**
   * 獲取單個 Card
   */
  getCard: async (cardId: string): Promise<GetCardResponse> => {
    const response = (await apiClient.get(`/cards/${cardId}`)) as ApiResponse<GetCardResponse>
    return response.data
  },

  /**
   * 更新 Card
   */
  updateCard: async (cardId: string, data: UpdateCardRequest): Promise<GetCardResponse> => {
    const response = (await apiClient.put(`/cards/${cardId}`, data)) as ApiResponse<GetCardResponse>
    return response.data
  },

  /**
   * 刪除 Card（軟刪除）
   */
  deleteCard: async (cardId: string): Promise<GetCardResponse> => {
    const response = (await apiClient.delete(`/cards/${cardId}`)) as ApiResponse<GetCardResponse>
    return response.data
  },
}
