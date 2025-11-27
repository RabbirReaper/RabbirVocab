import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/api/modules'
import type { ApiError } from '@/api/types'

export interface User {
  id: string
  username: string
  email: string
  displayName: string
  avatar?: string
  role?: string
}

export const useAuthStore = defineStore('auth', () => {
  // 狀態
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 計算屬性
  const isAuthenticated = computed(() => !!user.value)
  const currentUser = computed(() => user.value)

  // 登入
  async function login(email: string, password: string) {
    isLoading.value = true
    error.value = null

    try {
      const userData = await api.auth.login({ email, password })
      user.value = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        displayName: userData.displayName,
        avatar: userData.avatar,
        role: userData.role,
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
      const userData = await api.auth.register({ username, email, password })
      user.value = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        displayName: userData.displayName,
        avatar: userData.avatar,
        role: userData.role,
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

  // 登出
  async function logout() {
    try {
      await api.auth.logout()
    } catch (err) {
      console.error('登出 API 調用失敗:', err)
    } finally {
      user.value = null
      error.value = null
      localStorage.removeItem('user')
    }
  }

  // 初始化認證（驗證 session）
  async function initializeAuth() {
    // 先從 localStorage 讀取（快速顯示 UI）
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      user.value = JSON.parse(savedUser)
    }

    // 向後端驗證 session 是否有效
    try {
      const userData = await api.auth.getMe()
      user.value = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        displayName: userData.displayName,
        avatar: userData.avatar,
        role: userData.role,
      }
      localStorage.setItem('user', JSON.stringify(user.value))
    } catch {
      // Session 無效，清除狀態
      user.value = null
      localStorage.removeItem('user')
    }
  }

  // 初始化時恢復登入狀態
  initializeAuth()

  return {
    user,
    isLoading,
    error,
    isAuthenticated,
    currentUser,
    login,
    register,
    logout,
    initializeAuth,
  }
})
