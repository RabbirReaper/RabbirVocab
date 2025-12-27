<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-3xl font-bold text-primary-color">我的卡組</h1>
      <button @click="showCreateModal = true" class="btn btn-primary">➕ 建立新卡組</button>
    </div>

    <!-- Loading 狀態 -->
    <div v-if="deckStore.loading" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 6" :key="i" class="card animate-pulse">
        <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div class="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>

    <!-- Error 狀態 -->
    <div v-else-if="deckStore.error" class="card bg-red-50 dark:bg-red-900/20">
      <p class="text-red-600 dark:text-red-400">{{ deckStore.error }}</p>
      <button @click="deckStore.fetchDecks()" class="btn btn-primary mt-4">重試</button>
    </div>

    <!-- 空狀態 -->
    <div v-else-if="deckStore.decks.length === 0" class="text-center py-12">
      <p class="text-secondary-color mb-4">還沒有任何卡組，現在建立第一個吧！</p>
      <button @click="showCreateModal = true" class="btn btn-primary">➕ 建立新卡組</button>
    </div>

    <!-- 卡組列表 -->
    <div v-else class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <RouterLink
        v-for="deck in deckStore.decks"
        :key="deck.id"
        :to="`/app/decks/${deck.id}`"
        class="card hover:shadow-lg transition-shadow group cursor-pointer"
      >
        <div class="flex justify-between items-start mb-3">
          <h3
            class="text-xl font-bold text-primary-color group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"
          >
            {{ deck.name }}
          </h3>
          <span class="text-2xl">📚</span>
        </div>

        <p class="text-secondary-color mb-6 line-clamp-2">
          {{ deck.description }}
        </p>

        <div class="mt-auto">
          <RouterLink
            :to="`/app/study/${deck.id}`"
            class="btn btn-primary btn-sm w-full"
            @click.stop
          >
            開始學習
          </RouterLink>
        </div>
      </RouterLink>
    </div>

    <!-- 建立卡組 Modal -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click="showCreateModal = false"
    >
      <div class="card max-w-2xl w-full mx-4" @click.stop>
        <h2 class="text-2xl font-bold text-primary-color mb-4">建立新卡組</h2>

        <form @submit.prevent="handleCreateDeck" class="space-y-4">
          <div>
            <label for="deckName" class="block text-sm font-medium text-secondary-color mb-1">
              卡組名稱
            </label>
            <input
              id="deckName"
              v-model="newDeckName"
              type="text"
              required
              class="w-full px-4 py-2 border border-primary-color rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-primary-color"
              placeholder="例如：日常英語單字"
            />
          </div>

          <div>
            <label
              for="deckDescription"
              class="block text-sm font-medium text-secondary-color mb-1"
            >
              描述
            </label>
            <textarea
              id="deckDescription"
              v-model="newDeckDescription"
              rows="3"
              class="w-full px-4 py-2 border border-primary-color rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-primary-color"
              placeholder="簡單描述這個卡組的內容..."
            ></textarea>
          </div>

          <div class="flex space-x-3">
            <button
              type="button"
              @click="showCreateModal = false"
              class="btn btn-secondary flex-1"
              :disabled="deckStore.loading"
            >
              取消
            </button>
            <button type="submit" class="btn btn-primary flex-1" :disabled="deckStore.loading">
              {{ deckStore.loading ? '建立中...' : '建立' }}
            </button>
          </div>

          <div v-if="deckStore.error" class="text-sm text-red-600 dark:text-red-400 mt-2">
            {{ deckStore.error }}
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useDeckStore } from '@/stores/deck'

const deckStore = useDeckStore()

const showCreateModal = ref(false)
const newDeckName = ref('')
const newDeckDescription = ref('')

onMounted(async () => {
  await deckStore.fetchDecks()
})

const handleCreateDeck = async () => {
  try {
    await deckStore.createDeck(newDeckName.value, newDeckDescription.value)
    // 成功後關閉 Modal
    newDeckName.value = ''
    newDeckDescription.value = ''
    showCreateModal.value = false
  } catch (err) {
    // 錯誤已在 store 處理
    console.error('建立卡組失敗:', err)
  }
}
</script>
