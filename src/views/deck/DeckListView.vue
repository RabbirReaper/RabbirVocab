<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-3xl font-bold text-primary-color">我的卡組</h1>
      <button @click="showCreateModal = true" class="btn btn-primary">➕ 建立新卡組</button>
    </div>

    <!-- Loading 狀態 - 列表樣式骨架屏 -->
    <div v-if="deckStore.loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="card animate-pulse">
        <div class="flex items-center justify-between">
          <!-- 左側:名稱和描述 -->
          <div class="flex-1 space-y-2">
            <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>

          <!-- 右側:統計和按鈕 (桌面版) -->
          <div class="hidden lg:flex items-center gap-4">
            <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error 狀態 -->
    <div v-else-if="deckStore.error" class="card bg-red-50 dark:bg-red-900/20">
      <p class="text-red-600 dark:text-red-400">{{ deckStore.error }}</p>
      <button @click="deckStore.fetchDecks()" class="btn btn-primary mt-4">重試</button>
    </div>

    <!-- 空狀態 -->
    <div v-else-if="deckStore.decks.length === 0" class="text-center py-12">
      <p class="text-secondary-color mb-4">還沒有任何卡組,現在建立第一個吧!</p>
      <button @click="showCreateModal = true" class="btn btn-primary">➕ 建立新卡組</button>
    </div>

    <!-- 卡組列表 - 垂直列表佈局 -->
    <div v-else class="space-y-4">
      <div v-for="deck in deckStore.decks" :key="deck.id" class="card hover:shadow-lg transition-shadow">
        <!-- Desktop 佈局 (≥1024px) -->
        <div class="hidden lg:flex items-center justify-between gap-6">
          <!-- 左側:Icon + 名稱和描述 -->
          <RouterLink :to="`/app/decks/${deck.id}`" class="flex items-center gap-4 flex-1 min-w-0 group">
            <span class="text-2xl shrink-0">📚</span>
            <div class="min-w-0">
              <h3 class="text-xl font-bold text-primary-color group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                {{ deck.name }}
              </h3>
              <p class="text-secondary-color text-sm line-clamp-1">
                {{ deck.description || '無描述' }}
              </p>
            </div>
          </RouterLink>

          <!-- 右側:統計徽章 + 按鈕 -->
          <div class="flex items-center gap-3 shrink-0">
            <!-- 統計徽章 -->
            <span class="badge-new" :title="`新卡片: ${deck.newCount ?? 0}`">
              {{ deck.newCount ?? 0 }}
            </span>
            <span class="badge-learning" :title="`學習中: ${deck.learningCount ?? 0}`">
              {{ deck.learningCount ?? 0 }}
            </span>
            <span class="badge-review" :title="`到期: ${deck.reviewCount ?? 0}`">
              {{ deck.reviewCount ?? 0 }}
            </span>

            <!-- 操作按鈕 -->
            <RouterLink :to="`/app/study/${deck.id}`" class="btn btn-primary btn-sm">
              開始背誦
            </RouterLink>
            <RouterLink :to="`/app/decks/${deck.id}`" class="btn btn-outline btn-sm">
              設定
            </RouterLink>
          </div>
        </div>

        <!-- Tablet 佈局 (768px-1023px) -->
        <div class="hidden md:block lg:hidden">
          <RouterLink :to="`/app/decks/${deck.id}`" class="flex items-center gap-3 mb-3 group">
            <span class="text-2xl">📚</span>
            <div class="flex-1 min-w-0">
              <h3 class="text-lg font-bold text-primary-color group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                {{ deck.name }}
              </h3>
              <p class="text-secondary-color text-sm line-clamp-1">
                {{ deck.description || '無描述' }}
              </p>
            </div>
          </RouterLink>

          <div class="flex items-center justify-between">
            <!-- 統計徽章 -->
            <div class="flex gap-2">
              <span class="badge-new" :title="`新卡片: ${deck.newCount ?? 0}`">
                {{ deck.newCount ?? 0 }}
              </span>
              <span class="badge-learning" :title="`學習中: ${deck.learningCount ?? 0}`">
                {{ deck.learningCount ?? 0 }}
              </span>
              <span class="badge-review" :title="`到期: ${deck.reviewCount ?? 0}`">
                {{ deck.reviewCount ?? 0 }}
              </span>
            </div>

            <!-- 操作按鈕 -->
            <div class="flex gap-2">
              <RouterLink :to="`/app/study/${deck.id}`" class="btn btn-primary btn-sm">
                開始背誦
              </RouterLink>
              <RouterLink :to="`/app/decks/${deck.id}`" class="btn btn-outline btn-sm">
                設定
              </RouterLink>
            </div>
          </div>
        </div>

        <!-- Mobile 佈局 (<768px) -->
        <div class="block md:hidden space-y-3">
          <RouterLink :to="`/app/decks/${deck.id}`" class="flex items-center gap-3 group">
            <span class="text-2xl">📚</span>
            <div class="flex-1 min-w-0">
              <h3 class="font-bold text-primary-color group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                {{ deck.name }}
              </h3>
              <p class="text-secondary-color text-sm line-clamp-1">
                {{ deck.description || '無描述' }}
              </p>
            </div>
          </RouterLink>

          <!-- 統計徽章 - 水平排列並帶標籤 -->
          <div class="flex justify-around">
            <div class="text-center">
              <div class="badge-new">{{ deck.newCount ?? 0 }}</div>
              <div class="text-xs text-secondary-color mt-1">新卡片</div>
            </div>
            <div class="text-center">
              <div class="badge-learning">{{ deck.learningCount ?? 0 }}</div>
              <div class="text-xs text-secondary-color mt-1">學習中</div>
            </div>
            <div class="text-center">
              <div class="badge-review">{{ deck.reviewCount ?? 0 }}</div>
              <div class="text-xs text-secondary-color mt-1">到期</div>
            </div>
          </div>

          <!-- 操作按鈕 - 並排 -->
          <div class="grid grid-cols-2 gap-2">
            <RouterLink :to="`/app/study/${deck.id}`" class="btn btn-primary btn-sm">
              開始背誦
            </RouterLink>
            <RouterLink :to="`/app/decks/${deck.id}`" class="btn btn-outline btn-sm">
              設定
            </RouterLink>
          </div>
        </div>
      </div>
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
              placeholder="例如:日常英語單字"
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
import { ref, onMounted, onActivated } from 'vue'
import { RouterLink } from 'vue-router'
import { useDeckStore } from '@/stores/deck'

const deckStore = useDeckStore()

const showCreateModal = ref(false)
const newDeckName = ref('')
const newDeckDescription = ref('')

// 批量加載統計數據的函數
async function loadAllDeckStats() {
  if (deckStore.decks.length === 0) return

  const batchSize = 5
  for (let i = 0; i < deckStore.decks.length; i += batchSize) {
    const batch = deckStore.decks.slice(i, i + batchSize)
    await Promise.all(
      batch.map((deck) =>
        deckStore.fetchDeckStats(deck.id).catch((err) => {
          console.error(`加載 ${deck.name} 統計失敗:`, err)
        }),
      ),
    )
  }
}

// 頁面掛載時加載卡組和統計
onMounted(async () => {
  await deckStore.fetchDecks()
  await loadAllDeckStats()
})

// 從背誦頁返回時自動更新統計
onActivated(async () => {
  await loadAllDeckStats()
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
