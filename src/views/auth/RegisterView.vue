<template>
  <div class="min-h-screen page-bg flex items-center justify-center px-4">
    <div class="card-modern max-w-md w-full relative z-10">
      <div class="text-center mb-8">
        <div class="flex items-center justify-center space-x-2 mb-2">
          <h1 class="text-3xl font-bold text-primary-600 dark:text-primary-400">RabbirVocab</h1>
        </div>
        <p class="text-secondary-color">建立新帳號</p>
      </div>

      <!-- 錯誤訊息顯示 -->
      <div
        v-if="authStore.error"
        class="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-sm"
      >
        {{ authStore.error }}
      </div>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <div>
          <label for="username" class="block text-sm font-medium text-secondary-color mb-1">
            使用者名稱
          </label>
          <input
            id="username"
            v-model="username"
            type="text"
            required
            minlength="3"
            class="input-modern"
            placeholder="請輸入使用者名稱"
            :disabled="authStore.isLoading"
          />
        </div>

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
            minlength="6"
            class="input-modern"
            placeholder="請輸入密碼"
            :disabled="authStore.isLoading"
          />
        </div>

        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-secondary-color mb-1">
            確認密碼
          </label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            required
            class="input-modern"
            placeholder="再次輸入密碼"
            :disabled="authStore.isLoading"
          />
        </div>

        <button type="submit" class="btn-modern w-full" :disabled="authStore.isLoading">
          {{ authStore.isLoading ? '註冊中...' : '註冊' }}
        </button>
      </form>

      <div class="mt-6 text-center">
        <p class="text-sm text-secondary-color">
          已經有帳號了？
          <RouterLink
            to="/login"
            class="text-primary-600 dark:text-primary-400 hover:underline font-medium"
          >
            立即登入
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
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

const handleRegister = async () => {
  // 清除之前的錯誤
  authStore.error = null

  // 前端驗證
  if (username.value.length < 3) {
    authStore.error = '使用者名稱長度至少需要 3 個字元'
    return
  }

  if (password.value.length < 6) {
    authStore.error = '密碼長度至少需要 6 個字元'
    return
  }

  if (password.value !== confirmPassword.value) {
    authStore.error = '密碼不一致'
    return
  }

  try {
    await authStore.register(username.value, email.value, password.value)
    router.push('/app/dashboard')
  } catch (error) {
    // 錯誤已在 authStore 中處理（如：email 已存在）
    console.error('註冊失敗:', error)
  }
}
</script>
