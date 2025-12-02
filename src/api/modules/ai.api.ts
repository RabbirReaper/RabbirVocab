import axios from 'axios'
import type { GenerateContentRequest, GenerateContentResponse } from '../types'

// 為 AI 服務創建獨立的 axios 客戶端
const aiClient = axios.create({
  baseURL: 'http://localhost:1234/v1',
  timeout: 30000, // AI 生成可能需要更長時間
  headers: {
    'Content-Type': 'application/json',
  },
})

export const aiApi = {
  /**
   * 使用 AI 生成卡片內容
   * @param input 輸入文字（例如：單字）
   * @returns 生成的內容
   */
  generateContent: async (input: string): Promise<string> => {
    const requestData: GenerateContentRequest = {
      model: 'qwen/qwen3-vl-8b',
      input: input,
      stream: false,
    }

    try {
      const response = await aiClient.post<GenerateContentResponse>('/responses', requestData)

      // 根據實際 API 回傳結構提取內容
      // 提取 output[0].content[0].text
      const text = response.data.output?.[0]?.content?.[0]?.text

      if (!text) {
        console.error('無法從 AI 響應中提取文本:', response.data)
        throw new Error('AI 響應格式錯誤')
      }

      return text
    } catch (error) {
      console.error('AI 生成失敗:', error)
      throw new Error('AI 生成內容失敗，請稍後再試')
    }
  },
}
