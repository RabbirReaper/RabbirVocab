<template>
  <div class="max-w-4xl space-y-6">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white">個人設定</h1>

    <!-- 個人資料 -->
    <div class="card">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">個人資料</h2>
      <div class="space-y-4">
        <div class="flex items-center space-x-6">
          <img
            :src="authStore.currentUser?.avatar"
            :alt="authStore.currentUser?.displayName"
            class="w-20 h-20 rounded-full"
          />
          <div>
            <button class="btn btn-secondary btn-sm">更換頭像</button>
            <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">建議尺寸：200x200px</p>
          </div>
        </div>

        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              使用者名稱
            </label>
            <input
              type="text"
              :value="authStore.currentUser?.username"
              disabled
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              顯示名稱
            </label>
            <input
              type="text"
              :value="authStore.currentUser?.displayName"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              電子郵件
            </label>
            <input
              type="email"
              :value="authStore.currentUser?.email"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              語言偏好
            </label>
            <select
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="zh-TW">繁體中文</option>
              <option value="zh-CN">简体中文</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        <div class="flex justify-end">
          <button class="btn btn-primary">儲存變更</button>
        </div>
      </div>
    </div>

    <!-- 學習設定 -->
    <div class="card">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">預設學習設定</h2>
      <div class="grid md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            每日新卡片數
          </label>
          <input
            type="number"
            value="20"
            min="1"
            max="100"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">建議：10-30張</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            每日最大複習數
          </label>
          <input
            type="number"
            value="100"
            min="10"
            max="500"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">建議：50-200張</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Easy 倍數
          </label>
          <input
            type="number"
            value="2.5"
            min="1.5"
            max="4.0"
            step="0.1"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Hard 倍數
          </label>
          <input
            type="number"
            value="1.2"
            min="1.0"
            max="2.0"
            step="0.1"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div class="flex justify-end mt-4">
        <button class="btn btn-primary">儲存設定</button>
      </div>
    </div>

    <!-- 帳號設定 -->
    <div class="card">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">帳號與安全</h2>
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">修改密碼</h3>
          <div class="grid md:grid-cols-2 gap-4">
            <input
              type="password"
              placeholder="目前密碼"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <div></div>
            <input
              type="password"
              placeholder="新密碼"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <input
              type="password"
              placeholder="確認新密碼"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <button class="btn btn-secondary mt-2">更新密碼</button>
        </div>

        <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 class="text-sm font-medium text-red-600 dark:text-red-400 mb-2">危險區域</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
            刪除帳號後，所有數據將永久消失且無法復原。
          </p>
          <button class="btn bg-red-500 hover:bg-red-600 text-white border-0">
            刪除帳號
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>
