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
   * 創建新的 Card（支持文件上傳）
   */
  createCard: async (data: CreateCardRequest | FormData): Promise<GetCardResponse> => {
    // 判斷是否為 FormData（包含文件）
    const isFormData = data instanceof FormData

    const response = (await apiClient.post(
      '/cards',
      data,
      isFormData
        ? {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        : undefined,
    )) as ApiResponse<GetCardResponse>
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
   * 更新 Card（支持文件上傳）
   */
  updateCard: async (
    cardId: string,
    data: UpdateCardRequest | FormData,
  ): Promise<GetCardResponse> => {
    const isFormData = data instanceof FormData

    const response = (await apiClient.put(
      `/cards/${cardId}`,
      data,
      isFormData
        ? {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        : undefined,
    )) as ApiResponse<GetCardResponse>
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
