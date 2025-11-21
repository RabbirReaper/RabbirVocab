<template>
  <div class="min-h-screen page-bg gradient-glow">
    <!-- Navbar -->
    <nav class="navbar backdrop-blur-sm shadow-sm relative z-10">
      <div class="container mx-auto px-4 py-4">
        <div class="flex justify-between items-center">
          <div class="flex items-center space-x-2">
            <div class="text-2xl font-bold text-primary-600 dark:text-primary-400">RabbirVocab</div>
          </div>
          <div class="space-x-4">
            <RouterLink to="/login" class="btn btn-secondary">登入</RouterLink>
            <RouterLink to="/register" class="btn btn-primary">註冊</RouterLink>
          </div>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <div class="container mx-auto px-4 py-20 grid-background relative z-10">
      <div class="text-center max-w-3xl mx-auto">
        <h2 class="text-5xl font-bold gradient-text mb-6">智慧學習，高效記憶</h2>
        <p class="text-xl text-secondary-color mb-8">
          使用間隔重複系統 (SRS) 演算法，讓你的單字記憶更持久、更有效
        </p>
        <RouterLink to="/register" class="btn-modern btn-lg"> 開始免費使用 </RouterLink>
      </div>

      <!-- Features -->
      <div class="grid md:grid-cols-3 gap-8 mt-20">
        <div class="card-modern text-center">
          <div class="text-4xl mb-4">🧠</div>
          <h3 class="text-xl font-semibold mb-2 text-primary-color">科學演算法</h3>
          <p class="text-secondary-color">基於認知科學的間隔重複演算法，在最佳時機複習單字</p>
        </div>

        <div class="card-modern text-center">
          <div class="text-4xl mb-4">📊</div>
          <h3 class="text-xl font-semibold mb-2 text-primary-color">學習統計</h3>
          <p class="text-secondary-color">詳細的學習數據分析，追蹤你的進步軌跡</p>
        </div>

        <div class="card-modern text-center">
          <div class="text-4xl mb-4">🎯</div>
          <h3 class="text-xl font-semibold mb-2 text-primary-color">個人化學習</h3>
          <p class="text-secondary-color">自訂學習目標和節奏，打造專屬於你的學習計畫</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>
