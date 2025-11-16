<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800">
    <!-- Navbar -->
    <nav class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm">
      <div class="container mx-auto px-4 py-4">
        <div class="flex justify-between items-center">
          <div class="flex items-center space-x-2">
            <span class="text-2xl">🐰</span>
            <h1 class="text-2xl font-bold text-primary-600 dark:text-primary-400">RabbirVocab</h1>
          </div>
          <div class="space-x-4">
            <RouterLink to="/login" class="btn btn-secondary">登入</RouterLink>
            <RouterLink to="/register" class="btn btn-primary">註冊</RouterLink>
          </div>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <div class="container mx-auto px-4 py-20">
      <div class="text-center max-w-3xl mx-auto">
        <h2 class="text-5xl font-bold text-gray-900 dark:text-white mb-6">
          智慧學習，高效記憶
        </h2>
        <p class="text-xl text-gray-600 dark:text-gray-300 mb-8">
          使用間隔重複系統 (SRS) 演算法，讓你的單字記憶更持久、更有效
        </p>
        <RouterLink to="/register" class="btn btn-primary btn-lg">
          開始免費使用
        </RouterLink>
      </div>

      <!-- Features -->
      <div class="grid md:grid-cols-3 gap-8 mt-20">
        <div class="card text-center">
          <div class="text-4xl mb-4">🧠</div>
          <h3 class="text-xl font-semibold mb-2 text-gray-900 dark:text-white">科學演算法</h3>
          <p class="text-gray-600 dark:text-gray-400">
            基於認知科學的間隔重複演算法，在最佳時機複習單字
          </p>
        </div>

        <div class="card text-center">
          <div class="text-4xl mb-4">📊</div>
          <h3 class="text-xl font-semibold mb-2 text-gray-900 dark:text-white">學習統計</h3>
          <p class="text-gray-600 dark:text-gray-400">
            詳細的學習數據分析，追蹤你的進步軌跡
          </p>
        </div>

        <div class="card text-center">
          <div class="text-4xl mb-4">🎯</div>
          <h3 class="text-xl font-semibold mb-2 text-gray-900 dark:text-white">個人化學習</h3>
          <p class="text-gray-600 dark:text-gray-400">
            自訂學習目標和節奏，打造專屬於你的學習計畫
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>
