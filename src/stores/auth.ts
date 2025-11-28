import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/api/modules'
import type { ApiError } from '@/api/types'

export interface User {
  id: string
  username: string
  email: string
  role?: string
}

export const useAuthStore = defineStore('auth', () => {
  // 狀態
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isInitialized = ref(false)

  // 計算屬性
  const isAuthenticated = computed(() => !!user.value)
  const currentUser = computed(() => user.value)

  // 登入
  async function login(email: string, password: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.auth.login({ email, password })
      user.value = {
        id: response.user.id,
        username: response.user.username,
        email: response.user.email,
        role: response.user.role,
      }
      localStorage.setItem('user', JSON.stringify(user.value))
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || '登入失敗'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // 註冊
  async function register(username: string, email: string, password: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.auth.register({ username, email, password })
      user.value = {
        id: response.user.id,
        username: response.user.username,
        email: response.user.email,
        role: response.user.role,
      }
      localStorage.setItem('user', JSON.stringify(user.value))
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || '註冊失敗'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // 清除認證狀態（不呼叫 API，用於 401 等被動登出情況）
  function clearAuthState() {
    user.value = null
    error.value = null
    localStorage.removeItem('user')
  }

  // 登出（主動登出，會呼叫 API）
  async function logout() {
    try {
      await api.auth.logout()
    } catch (err) {
      console.error('登出 API 調用失敗:', err)
    } finally {
      clearAuthState()
    }
  }

  // 初始化認證（驗證 session）
  async function initializeAuth() {
    // 防止重複初始化
    if (isInitialized.value) {
      return
    }

    // 先從 localStorage 讀取（快速顯示 UI）
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        user.value = JSON.parse(savedUser)
      } catch {
        localStorage.removeItem('user')
      }
    }

    // 向後端驗證 session 是否有效
    try {
      const response = await api.auth.getMe()
      user.value = {
        id: response.user.id,
        username: response.user.username,
        email: response.user.email,
        role: response.user.role,
      }
      localStorage.setItem('user', JSON.stringify(user.value))
    } catch {
      // Session 無效，清除狀態 (interceptor 已經處理了 clearAuthState)
      // 這裡只需要確保狀態是清空的
      user.value = null
      localStorage.removeItem('user')
    } finally {
      isInitialized.value = true
    }
  }

  // 不在這裡自動初始化，由路由守衛控制
  // initializeAuth()

  return {
    user,
    isLoading,
    error,
    isInitialized,
    isAuthenticated,
    currentUser,
    login,
    register,
    logout,
    clearAuthState,
    initializeAuth,
  }
})
