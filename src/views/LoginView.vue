<template>
  <div class="min-h-screen page-bg flex items-center justify-center px-4">
    <div class="card-modern max-w-md w-full relative z-10">
      <div class="text-center mb-8">
        <div class="flex items-center justify-center space-x-2 mb-2">
          <h1 class="text-3xl font-bold text-primary-600 dark:text-primary-400">RabbirVocab</h1>
        </div>
        <p class="text-secondary-color">登入你的帳號</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label for="username" class="block text-sm font-medium text-secondary-color mb-1">
            使用者名稱
          </label>
          <input
            id="username"
            v-model="username"
            type="text"
            required
            class="input-modern"
            placeholder="請輸入使用者名稱"
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
          />
        </div>

        <button type="submit" class="btn-modern w-full">登入</button>
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

const username = ref('')
const password = ref('')

const handleLogin = () => {
  authStore.login(username.value, password.value)
  router.push('/app/dashboard')
}
</script>
