<template>
  <div class="min-h-screen page-bg flex items-center justify-center px-4">
    <div class="card max-w-md w-full">
      <div class="text-center mb-8">
        <div class="flex items-center justify-center space-x-2 mb-2">
          <span class="text-4xl">🐰</span>
          <h1 class="text-3xl font-bold text-primary-600 dark:text-primary-400">RabbirVocab</h1>
        </div>
        <p class="text-secondary-color">登入你的帳號</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            使用者名稱
          </label>
          <input
            id="username"
            v-model="username"
            type="text"
            required
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="請輸入使用者名稱"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            密碼
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="請輸入密碼"
          />
        </div>

        <button type="submit" class="btn btn-primary w-full">
          登入
        </button>
      </form>

      <div class="mt-6 text-center">
        <p class="text-sm text-secondary-color">
          還沒有帳號？
          <RouterLink to="/register" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">
            立即註冊
          </RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')

const handleLogin = () => {
  authStore.login(username.value, password.value)
  router.push('/app/dashboard')
}
</script>
