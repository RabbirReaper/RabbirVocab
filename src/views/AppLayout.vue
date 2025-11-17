<template>
  <div class="min-h-screen page-bg">
    <!-- Navbar -->
    <nav class="page-bg">
      <div class="container mx-auto px-4">
        <div class="flex justify-between items-center h-16">
          <!-- Logo -->
          <RouterLink to="/app/dashboard" class="flex items-center space-x-2">
            <span class="text-2xl">🐰</span>
            <h1 class="text-xl font-bold text-primary-600 dark:text-primary-400">RabbirVocab</h1>
          </RouterLink>

          <!-- Navigation Links -->
          <div class="hidden md:flex items-center space-x-6">
            <RouterLink
              to="/app/dashboard"
              class="nav-link"
              active-class="text-primary-600 dark:text-primary-400 font-semibold"
            >
              儀表板
            </RouterLink>
            <RouterLink
              to="/app/decks"
              class="nav-link"
              active-class="text-primary-600 dark:text-primary-400 font-semibold"
            >
              卡組
            </RouterLink>
            <RouterLink
              to="/app/cards"
              class="nav-link"
              active-class="text-primary-600 dark:text-primary-400 font-semibold"
            >
              卡片
            </RouterLink>
            <RouterLink
              to="/app/statistics"
              class="nav-link"
              active-class="text-primary-600 dark:text-primary-400 font-semibold"
            >
              統計
            </RouterLink>
          </div>

          <!-- User Menu -->
          <div class="flex items-center space-x-4">
            <button
              @click="toggleDarkMode"
              class="p-2 rounded-lg bg-hover-color"
            >
              <span v-if="isDark">🌙</span>
              <span v-else>☀️</span>
            </button>

            <div class="relative">
              <button
                @click="showUserMenu = !showUserMenu"
                class="flex items-center space-x-2 p-2 rounded-lg bg-hover-color"
              >
                <img
                  :src="authStore.currentUser?.avatar"
                  :alt="authStore.currentUser?.displayName"
                  class="w-8 h-8 rounded-full"
                />
                <span class="text-sm font-medium text-secondary-color">
                  {{ authStore.currentUser?.displayName }}
                </span>
              </button>

              <!-- Dropdown Menu -->
              <div
                v-if="showUserMenu"
                class="absolute right-0 mt-2 w-48 bg-primary-color rounded-lg shadow-lg border border-primary-color z-50"
              >
                <RouterLink
                  to="/app/settings"
                  class="block px-4 py-2 text-sm text-secondary-color bg-hover-color rounded-t-lg"
                  @click="showUserMenu = false"
                >
                  個人設定
                </RouterLink>
                <button
                  @click="handleLogout"
                  class="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 bg-hover-color rounded-b-lg"
                >
                  登出
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-8">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const showUserMenu = ref(false)
const isDark = ref(false)

const toggleDarkMode = () => {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

const handleLogout = () => {
  authStore.logout()
  showUserMenu.value = false
  router.push('/login')
}

// 初始化暗色模式
onMounted(() => {
  const theme = localStorage.getItem('theme')
  isDark.value =
    theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)
  if (isDark.value) {
    document.documentElement.classList.add('dark')
  }
})
</script>
