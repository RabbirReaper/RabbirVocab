<template>
  <div class="min-h-screen page-bg flex items-center justify-center px-4">
    <div class="card max-w-md w-full">
      <div class="text-center mb-8">
        <div class="flex items-center justify-center space-x-2 mb-2">
          <h1 class="text-3xl font-bold text-primary-600 dark:text-primary-400">RabbirVocab</h1>
        </div>
        <p class="text-secondary-color">建立新帳號</p>
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
            class="w-full px-4 py-2 border border-primary-color rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-primary-color"
            placeholder="請輸入使用者名稱"
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
            class="w-full px-4 py-2 border border-primary-color rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-primary-color"
            placeholder="your@email.com"
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
            class="w-full px-4 py-2 border border-primary-color rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-primary-color"
            placeholder="請輸入密碼"
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
            class="w-full px-4 py-2 border border-primary-color rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-primary-color"
            placeholder="再次輸入密碼"
          />
        </div>

        <button type="submit" class="btn btn-primary w-full">註冊</button>
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

const handleRegister = () => {
  if (password.value !== confirmPassword.value) {
    alert('密碼不一致')
    return
  }

  authStore.register(username.value, email.value, password.value)
  router.push('/app/dashboard')
}
</script>
