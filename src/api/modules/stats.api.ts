import apiClient from '../client'
import type {
  ApiResponse,
  OverviewStats,
  RecentActivityResponse,
  DeckStats,
} from '../types'

export const statsApi = {
  /**
   * 獲取用戶總體統計
   */
  getOverview: async (): Promise<OverviewStats> => {
    const response = (await apiClient.get('/stats/overview')) as ApiResponse<OverviewStats>
    return response.data
  },

  /**
   * 獲取最近學習活動
   */
  getRecentActivity: async (params?: { days?: number }): Promise<RecentActivityResponse> => {
    const response = (await apiClient.get('/stats/recent-activity', {
      params,
    })) as ApiResponse<RecentActivityResponse>
    return response.data
  },

  /**
   * 獲取 Deck 統計
   */
  getDeckStats: async (deckId: string): Promise<DeckStats> => {
    const response = (await apiClient.get(`/stats/deck/${deckId}`)) as ApiResponse<DeckStats>
    return response.data
  },
}
