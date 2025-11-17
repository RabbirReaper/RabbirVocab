<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-3xl font-bold text-primary-color">我的卡組</h1>
      <button @click="showCreateModal = true" class="btn btn-primary">
        ➕ 建立新卡組
      </button>
    </div>

    <!-- 卡組列表 -->
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <RouterLink
        v-for="deck in deckStore.decks"
        :key="deck.id"
        :to="`/app/decks/${deck.id}`"
        class="card hover:shadow-lg transition-shadow group cursor-pointer"
      >
        <div class="flex justify-between items-start mb-3">
          <h3 class="text-xl font-bold text-primary-color group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {{ deck.name }}
          </h3>
          <span class="text-2xl">📚</span>
        </div>

        <p class="text-secondary-color mb-4 line-clamp-2">
          {{ deck.description }}
        </p>

        <div class="flex items-center justify-between text-sm">
          <div class="flex space-x-4">
            <div>
              <span class="text-tertiary-color">總計</span>
              <span class="ml-1 font-semibold text-primary-color">{{ deck.cardCount }}</span>
            </div>
            <div>
              <span class="text-tertiary-color">新卡</span>
              <span class="ml-1 font-semibold text-primary-600 dark:text-primary-400">{{ deck.newCount }}</span>
            </div>
            <div>
              <span class="text-tertiary-color">複習</span>
              <span class="ml-1 font-semibold text-warning-600 dark:text-warning-400">{{ deck.reviewCount }}</span>
            </div>
          </div>
        </div>

        <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
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
      <div class="card max-w-md w-full mx-4" @click.stop>
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
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-primary-color"
              placeholder="例如：日常英語單字"
            />
          </div>

          <div>
            <label for="deckDescription" class="block text-sm font-medium text-secondary-color mb-1">
              描述
            </label>
            <textarea
              id="deckDescription"
              v-model="newDeckDescription"
              rows="3"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-primary-color"
              placeholder="簡單描述這個卡組的內容..."
            ></textarea>
          </div>

          <div class="flex space-x-3">
            <button type="button" @click="showCreateModal = false" class="btn btn-secondary flex-1">
              取消
            </button>
            <button type="submit" class="btn btn-primary flex-1">建立</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useDeckStore } from '@/stores/deck'

const deckStore = useDeckStore()

const showCreateModal = ref(false)
const newDeckName = ref('')
const newDeckDescription = ref('')

const handleCreateDeck = () => {
  deckStore.createDeck(newDeckName.value, newDeckDescription.value)
  newDeckName.value = ''
  newDeckDescription.value = ''
  showCreateModal.value = false
}
</script>
