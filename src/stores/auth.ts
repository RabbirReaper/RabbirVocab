import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export interface User {
  id: string
  username: string
  email: string
  displayName: string
  avatar?: string
  languagePreference: string
}

export const useAuthStore = defineStore('auth', () => {
  // 狀態
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)

  // 計算屬性
  const isAuthenticated = computed(() => !!user.value && !!token.value)
  const currentUser = computed(() => user.value)

  // 動作
  function login(username: string, password: string) {
    // 模擬登入（使用假資料）
    user.value = {
      id: '1',
      username,
      email: `${username}@example.com`,
      displayName: username,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + username,
      languagePreference: 'zh-TW'
    }
    token.value = 'fake-jwt-token-' + Date.now()

    // 儲存到 localStorage
    localStorage.setItem('user', JSON.stringify(user.value))
    localStorage.setItem('token', token.value)
  }

  function register(username: string, email: string, password: string) {
    // 模擬註冊（使用假資料）
    user.value = {
      id: '1',
      username,
      email,
      displayName: username,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + username,
      languagePreference: 'zh-TW'
    }
    token.value = 'fake-jwt-token-' + Date.now()

    // 儲存到 localStorage
    localStorage.setItem('user', JSON.stringify(user.value))
    localStorage.setItem('token', token.value)
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  function initializeAuth() {
    // 從 localStorage 恢復登入狀態
    const savedUser = localStorage.getItem('user')
    const savedToken = localStorage.getItem('token')

    if (savedUser && savedToken) {
      user.value = JSON.parse(savedUser)
      token.value = savedToken
    }
  }

  // 初始化時恢復登入狀態
  initializeAuth()

  return {
    user,
    token,
    isAuthenticated,
    currentUser,
    login,
    register,
    logout,
    initializeAuth
  }
})
