import apiClient from '../client'
import type {
  ApiResponse,
  CreateDeckRequest,
  UpdateDeckRequest,
  GetDecksResponse,
  GetDeckResponse,
} from '../types'

export const deckApi = {
  /**
   * 創建新的 Deck
   */
  createDeck: async (data: CreateDeckRequest): Promise<GetDeckResponse> => {
    const response = (await apiClient.post('/decks', data)) as ApiResponse<GetDeckResponse>
    return response.data
  },

  /**
   * 獲取當前用戶的所有 Decks
   */
  getDecks: async (): Promise<GetDecksResponse> => {
    const response = (await apiClient.get('/decks')) as ApiResponse<GetDecksResponse>
    return response.data
  },

  /**
   * 獲取單個 Deck
   */
  getDeck: async (deckId: string): Promise<GetDeckResponse> => {
    const response = (await apiClient.get(`/decks/${deckId}`)) as ApiResponse<GetDeckResponse>
    return response.data
  },

  /**
   * 更新 Deck
   */
  updateDeck: async (deckId: string, data: UpdateDeckRequest): Promise<GetDeckResponse> => {
    const response = (await apiClient.put(`/decks/${deckId}`, data)) as ApiResponse<GetDeckResponse>
    return response.data
  },

  /**
   * 刪除 Deck（軟刪除）
   */
  deleteDeck: async (deckId: string): Promise<GetDeckResponse> => {
    const response = (await apiClient.delete(`/decks/${deckId}`)) as ApiResponse<GetDeckResponse>
    return response.data
  },
}
