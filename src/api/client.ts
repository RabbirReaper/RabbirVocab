import axios from 'axios'
import { setupInterceptors } from './interceptors'

export const apiClient = axios.create({
  baseURL: '/api', // 使用 Vite proxy
  timeout: 10000,
  withCredentials: true, // 攜帶 cookies（session 認證必需）
  headers: {
    'Content-Type': 'application/json',
  },
})

setupInterceptors(apiClient)

export default apiClient
