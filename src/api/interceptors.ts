import type { AxiosInstance, AxiosError } from 'axios'
import type { ApiErrorResponse } from './types'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

export function setupInterceptors(client: AxiosInstance) {
  // 請求攔截器
  client.interceptors.request.use(
    (config) => {
      if (import.meta.env.DEV) {
        console.log('API Request:', config.method?.toUpperCase(), config.url)
      }
      return config
    },
    (error) => Promise.reject(error),
  )

  // 響應攔截器
  client.interceptors.response.use(
    (response) => {
      // 提取 data 字段（後端格式：{ message, data }）
      return response.data
    },
    (error: AxiosError<ApiErrorResponse>) => {
      if (error.response) {
        const status = error.response.status
        // 直接使用後端返回的錯誤訊息
        const message = error.response.data.message || '請求失敗'
        // console.log('API Response Error:', status, error.response)
        // 401: 未授權，清除登入狀態並重定向
        if (status === 401) {
          const authStore = useAuthStore()
          // 使用 clearAuthState 而不是 logout，避免再次呼叫 API 造成無限循環
          authStore.clearAuthState()

          // 只在需要認證的頁面才重定向到登入頁
          const currentRoute = router.currentRoute.value
          const requiresAuth = currentRoute.meta.requiresAuth === true

          if (requiresAuth && currentRoute.path !== '/login') {
            router.push('/login')
          }
        }

        return Promise.reject({
          message,
          statusCode: status,
          originalError: error,
        })
      } else {
        // 網絡錯誤
        return Promise.reject({
          message: '網絡連接失敗，請檢查您的網絡',
          statusCode: 0,
          originalError: error,
        })
      }
    },
  )
}
