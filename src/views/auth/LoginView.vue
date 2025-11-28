<template>
  <div class="min-h-screen page-bg flex items-center justify-center px-4">
    <div class="card-modern max-w-md w-full relative z-10">
      <div class="text-center mb-8">
        <div class="flex items-center justify-center space-x-2 mb-2">
          <h1 class="text-3xl font-bold text-primary-600 dark:text-primary-400">RabbirVocab</h1>
        </div>
        <p class="text-secondary-color">登入你的帳號</p>
      </div>

      <!-- 錯誤訊息顯示 -->
      <div
        v-if="authStore.error"
        class="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-sm"
      >
        {{ authStore.error }}
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium text-secondary-color mb-1">
            電子郵件
          </label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            class="input-modern"
            placeholder="your@email.com"
            :disabled="authStore.isLoading"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-secondary-color mb-1">
            密碼
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            class="input-modern"
            placeholder="請輸入密碼"
            :disabled="authStore.isLoading"
          />
        </div>

        <button type="submit" class="btn-modern w-full" :disabled="authStore.isLoading">
          {{ authStore.isLoading ? '登入中...' : '登入' }}
        </button>
      </form>

      <div class="mt-6 text-center">
        <p class="text-sm text-secondary-color">
          還沒有帳號？
          <RouterLink
            to="/register"
            class="text-primary-600 dark:text-primary-400 hover:underline font-medium"
          >
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

const email = ref('')
const password = ref('')

const handleLogin = async () => {
  try {
    await authStore.login(email.value, password.value)
    router.push('/app/dashboard')
  } catch (error) {
    // 錯誤已在 authStore 中處理
    console.error('登入失敗:', error)
  }
}
</script>
