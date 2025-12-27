<template>
  <div class="space-y-6">
    <!-- Loading 狀態 -->
    <div v-if="deckStore.loading || cardStore.loading" class="space-y-6">
      <div class="animate-pulse">
        <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
      <div class="grid md:grid-cols-4 gap-6">
        <div v-for="i in 4" :key="i" class="card animate-pulse">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    </div>

    <!-- Error 狀態 -->
    <div v-else-if="deckStore.error || cardStore.error" class="card bg-red-50 dark:bg-red-900/20">
      <p class="text-red-600 dark:text-red-400">
        {{ deckStore.error || cardStore.error }}
      </p>
      <button @click="loadData" class="btn btn-primary mt-4">重試</button>
    </div>

    <!-- 主要內容 -->
    <div v-else-if="deck" class="space-y-6">
      <!-- 卡組標題 -->
      <div class="flex justify-between items-start">
        <div>
          <RouterLink
            to="/app/decks"
            class="text-primary-600 dark:text-primary-400 hover:underline mb-2 inline-block"
          >
            ← 返回卡組列表
          </RouterLink>
          <h1 class="text-3xl font-bold text-primary-color">{{ deck.name }}</h1>
          <p class="text-secondary-color mt-2">{{ deck.description }}</p>
        </div>
        <RouterLink :to="`/app/study/${deck.id}`" class="btn btn-primary"> 🎯 開始學習 </RouterLink>
      </div>

      <!-- 統計卡片 -->
      <div class="grid md:grid-cols-4 gap-6">
        <div class="card">
          <p class="text-sm text-secondary-color">總卡片數</p>
          <p class="text-3xl font-bold text-primary-color mt-1">{{ deck.cardCount }}</p>
        </div>
        <div class="card">
          <p class="text-sm text-secondary-color">新卡片</p>
          <p class="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-1">
            {{ deck.newCount }}
          </p>
        </div>
        <div class="card">
          <p class="text-sm text-secondary-color">待複習</p>
          <p class="text-3xl font-bold text-warning-600 dark:text-warning-400 mt-1">
            {{ deck.reviewCount }}
          </p>
        </div>
        <div class="card">
          <p class="text-sm text-secondary-color">已掌握</p>
          <p class="text-3xl font-bold text-success-600 dark:text-success-400 mt-1">
            {{ deck.masteredCount }}
          </p>
        </div>
      </div>

      <!-- 卡片列表 -->
      <div class="card">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold text-primary-color">卡片列表</h2>
          <RouterLink :to="`/app/cards/create?deck=${deckId}`" class="btn btn-primary btn-sm">
            ➕ 新增卡片
          </RouterLink>
        </div>

        <div v-if="paginatedCards.length > 0" class="space-y-2">
          <div
            v-for="card in paginatedCards"
            :key="card.id"
            class="flex items-center justify-between p-4 bg-secondary-color rounded-lg bg-hover-color transition-colors"
          >
            <div class="flex-1">
              <div class="font-semibold text-primary-color">{{ card.front }}</div>
            </div>
            <div class="flex items-center space-x-4">
              <span :class="getStatusBadgeClass(card.status)" class="badge">
                {{ getStatusText(card.status) }}
              </span>
              <span class="text-sm text-tertiary-color">
                間隔: {{ formatCardInterval(card) }}
              </span>
              <!-- 操作按鈕 -->
              <div class="flex items-center space-x-2">
                <button @click="handleEditCard(card.id)" class="btn btn-sm btn-secondary">
                  編輯
                </button>
                <button
                  @click="openDeleteModal(card)"
                  class="btn btn-sm bg-red-500 hover:bg-red-600 text-white border-0"
                >
                  刪除
                </button>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-12 text-tertiary-color">
          還沒有卡片，點擊「新增卡片」開始建立吧！
        </div>

        <!-- 分頁控制 -->
        <div
          v-if="totalPages > 1"
          class="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <!-- 分頁按鈕 -->
          <div class="flex items-center space-x-2">
            <button
              @click="currentPage--"
              :disabled="!hasPrevPage"
              class="btn btn-sm btn-outline"
              :class="{ 'opacity-50 cursor-not-allowed': !hasPrevPage }"
            >
              ← 上一頁
            </button>

            <div class="flex items-center space-x-1">
              <button
                v-for="page in visiblePages"
                :key="page"
                @click="page > 0 ? (currentPage = page) : null"
                :disabled="page === -1"
                :class="{
                  'bg-primary-500 text-white border-primary-500': page === currentPage,
                  'btn-outline': page !== currentPage && page > 0,
                  'cursor-default': page === -1,
                }"
                class="btn btn-sm min-w-10"
              >
                {{ page === -1 ? '...' : page }}
              </button>
            </div>

            <button
              @click="currentPage++"
              :disabled="!hasNextPage"
              class="btn btn-sm btn-outline"
              :class="{ 'opacity-50 cursor-not-allowed': !hasNextPage }"
            >
              下一頁 →
            </button>
          </div>

          <!-- 資訊文字 -->
          <div class="text-sm text-tertiary-color">
            顯示 {{ startIndex }}-{{ endIndex }} 筆，共 {{ cards.length }} 筆
          </div>
        </div>
      </div>

      <!-- SRS 設定 -->
      <div class="card">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold text-primary-color">學習設定</h2>

          <!-- 編輯/取消/確認按鈕 -->
          <div v-if="!isEditingSettings">
            <button @click="startEditing" class="btn btn-secondary btn-sm">✏️ 編輯</button>
          </div>
          <div v-else class="flex space-x-2">
            <button @click="cancelEditing" class="btn btn-outline btn-sm">取消</button>
            <button
              @click="saveSettings"
              class="btn btn-primary btn-sm"
              :disabled="deckStore.loading"
            >
              {{ deckStore.loading ? '儲存中...' : '確認修改' }}
            </button>
          </div>
        </div>

        <!-- 錯誤訊息 -->
        <div v-if="settingsError" class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p class="text-sm text-red-600 dark:text-red-400">{{ settingsError }}</p>
        </div>

        <!-- 檢視模式 -->
        <div v-if="!isEditingSettings" class="space-y-6">
          <!-- 基本設定 -->
          <div>
            <h3 class="text-lg font-semibold text-primary-color mb-3">基本設定</h3>
            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-secondary-color mb-1">
                  每日新卡片數
                </label>
                <input
                  type="number"
                  :value="deck.newCardsPerDay"
                  class="w-full px-4 py-2 border border-primary-color rounded-lg bg-disabled text-primary-color"
                  disabled
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-secondary-color mb-1">
                  每日複習數
                </label>
                <input
                  type="number"
                  :value="deck.reviewCardsPerDay"
                  class="w-full px-4 py-2 border border-primary-color rounded-lg bg-disabled text-primary-color"
                  disabled
                />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-secondary-color mb-1">
                  公開狀態
                </label>
                <input
                  type="text"
                  :value="deck.isPublic ? '公開' : '私人'"
                  class="w-full px-4 py-2 border border-primary-color rounded-lg bg-disabled text-primary-color"
                  disabled
                />
              </div>
            </div>
          </div>

          <!-- SRS 演算法參數 -->
          <div>
            <h3 class="text-lg font-semibold text-primary-color mb-3">FSRS-6 演算法參數</h3>
            <div class="grid md:grid-cols-2 gap-4">
              <!-- 期望保留率 -->
              <div>
                <label class="block text-sm font-medium text-secondary-color mb-1">
                  期望保留率
                </label>
                <input
                  type="number"
                  :value="deck.srsConfig.desiredRetention"
                  class="w-full px-4 py-2 border border-primary-color rounded-lg bg-disabled text-primary-color"
                  disabled
                />
                <p class="text-xs text-tertiary-color mt-1">目標記憶保留率（建議 0.85-0.95）</p>
              </div>

              <!-- 最大間隔 -->
              <div>
                <label class="block text-sm font-medium text-secondary-color mb-1">
                  最大間隔（天）
                </label>
                <input
                  type="number"
                  :value="deck.srsConfig.maximumInterval"
                  class="w-full px-4 py-2 border border-primary-color rounded-lg bg-disabled text-primary-color"
                  disabled
                />
                <p class="text-xs text-tertiary-color mt-1">複習間隔的上限</p>
              </div>

              <!-- 學習步驟 -->
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-secondary-color mb-1">
                  學習步驟（分鐘）
                </label>
                <input
                  type="text"
                  :value="formatSteps(deck.srsConfig.learningSteps)"
                  class="w-full px-4 py-2 border border-primary-color rounded-lg bg-disabled text-primary-color"
                  disabled
                />
                <p class="text-xs text-tertiary-color mt-1">新卡片的學習間隔，用逗號分隔</p>
              </div>

              <!-- 重學步驟 -->
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-secondary-color mb-1">
                  重學步驟（分鐘）
                </label>
                <input
                  type="text"
                  :value="formatSteps(deck.srsConfig.relearningSteps)"
                  class="w-full px-4 py-2 border border-primary-color rounded-lg bg-disabled text-primary-color"
                  disabled
                />
                <p class="text-xs text-tertiary-color mt-1">忘記卡片後的重學間隔</p>
              </div>

              <!-- 低效臨界值 -->
              <div>
                <label class="block text-sm font-medium text-secondary-color mb-1">
                  低效卡臨界值
                </label>
                <input
                  type="number"
                  :value="deck.srsConfig.leechThreshold"
                  class="w-full px-4 py-2 border border-primary-color rounded-lg bg-disabled text-primary-color"
                  disabled
                />
                <p class="text-xs text-tertiary-color mt-1">忘記多少次後標記為低效卡片</p>
              </div>

              <!-- Weights 參數（摺疊顯示） -->
              <div class="md:col-span-2">
                <details class="group">
                  <summary
                    class="cursor-pointer text-sm font-medium text-secondary-color mb-1 flex items-center"
                  >
                    <span class="mr-2 transform transition-transform group-open:rotate-90">▶</span>
                    <span>進階參數 (Weights)</span>
                  </summary>
                  <div class="mt-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p class="text-xs text-tertiary-color mb-2">
                      FSRS-6
                      權重參數（19個），用於計算記憶穩定度和難度。建議使用預設值，除非您了解其作用。
                    </p>
                    <div class="grid grid-cols-5 gap-2">
                      <div
                        v-for="(weight, index) in deck.srsConfig.weights"
                        :key="index"
                        class="text-center"
                      >
                        <div class="text-xs text-tertiary-color">w{{ index }}</div>
                        <div class="text-sm text-primary-color font-mono">
                          {{ weight.toFixed(2) }}
                        </div>
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>

        <!-- 編輯模式 -->
        <div v-else-if="editedSettings" class="space-y-6">
          <!-- 基本設定 -->
          <div>
            <h3 class="text-lg font-semibold text-primary-color mb-3">基本設定</h3>
            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-secondary-color mb-1">
                  每日新卡片數
                </label>
                <input
                  type="number"
                  v-model.number="editedSettings.newCardsPerDay"
                  class="w-full px-4 py-2 border border-primary-color rounded-lg bg-secondary-color text-primary-color"
                  min="0"
                  max="1000"
                />
                <p class="text-xs text-tertiary-color mt-1">每天學習的新卡片上限（建議 10-30）</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-secondary-color mb-1">
                  每日複習數
                </label>
                <input
                  type="number"
                  v-model.number="editedSettings.reviewCardsPerDay"
                  class="w-full px-4 py-2 border border-primary-color rounded-lg bg-secondary-color text-primary-color"
                  min="0"
                  max="9999"
                />
                <p class="text-xs text-tertiary-color mt-1">每天複習的卡片上限（建議 100-300）</p>
              </div>

              <div class="md:col-span-2">
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" v-model="editedSettings.isPublic" class="w-4 h-4" />
                  <span class="text-sm font-medium text-secondary-color">公開卡組</span>
                </label>
                <p class="text-xs text-tertiary-color mt-1 ml-6">允許其他用戶查看此卡組</p>
              </div>
            </div>
          </div>

          <!-- SRS 演算法參數 -->
          <div>
            <h3 class="text-lg font-semibold text-primary-color mb-3">FSRS-6 演算法參數</h3>
            <div class="grid md:grid-cols-2 gap-4">
              <!-- 期望保留率 -->
              <div>
                <label class="block text-sm font-medium text-secondary-color mb-1">
                  期望保留率
                </label>
                <input
                  type="number"
                  v-model.number="editedSettings.srsConfig.desiredRetention"
                  class="w-full px-4 py-2 border border-primary-color rounded-lg bg-secondary-color text-primary-color"
                  min="0.7"
                  max="0.97"
                  step="0.01"
                />
                <p class="text-xs text-tertiary-color mt-1">目標記憶保留率（建議 0.85-0.95）</p>
              </div>

              <!-- 最大間隔 -->
              <div>
                <label class="block text-sm font-medium text-secondary-color mb-1">
                  最大間隔（天）
                </label>
                <input
                  type="number"
                  v-model.number="editedSettings.srsConfig.maximumInterval"
                  class="w-full px-4 py-2 border border-primary-color rounded-lg bg-secondary-color text-primary-color"
                  min="1"
                  max="36500"
                />
                <p class="text-xs text-tertiary-color mt-1">複習間隔的上限（預設 36500 天）</p>
              </div>

              <!-- 學習步驟 -->
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-secondary-color mb-1">
                  學習步驟（分鐘）
                </label>
                <input
                  type="text"
                  v-model="learningStepsInput"
                  @blur="handleLearningStepsBlur"
                  class="w-full px-4 py-2 border border-primary-color rounded-lg bg-secondary-color text-primary-color"
                  placeholder="1, 10, 1h, 1d"
                />
                <p class="text-xs text-tertiary-color mt-1">
                  新卡片的學習間隔，用逗號分隔。支援單位：分鐘（預設）、h（小時）、d（天）。例如：1,
                  10, 1d 表示 1 分鐘、10 分鐘、1 天
                </p>
              </div>

              <!-- 重學步驟 -->
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-secondary-color mb-1">
                  重學步驟（分鐘）
                </label>
                <input
                  type="text"
                  v-model="relearningStepsInput"
                  @blur="handleRelearningStepsBlur"
                  class="w-full px-4 py-2 border border-primary-color rounded-lg bg-secondary-color text-primary-color"
                  placeholder="10, 1h, 1d"
                />
                <p class="text-xs text-tertiary-color mt-1">
                  忘記卡片後的重學間隔，用逗號分隔。支援單位：分鐘（預設）、h（小時）、d（天）
                </p>
              </div>

              <!-- 低效臨界值 -->
              <div>
                <label class="block text-sm font-medium text-secondary-color mb-1">
                  低效卡臨界值
                </label>
                <input
                  type="number"
                  v-model.number="editedSettings.srsConfig.leechThreshold"
                  class="w-full px-4 py-2 border border-primary-color rounded-lg bg-secondary-color text-primary-color"
                  min="2"
                  max="20"
                />
                <p class="text-xs text-tertiary-color mt-1">
                  忘記多少次後標記為低效卡片（建議 6-10）
                </p>
              </div>

              <!-- Weights 編輯器 -->
              <div class="md:col-span-2">
                <details class="group">
                  <summary
                    class="cursor-pointer text-sm font-medium text-secondary-color mb-1 flex items-center"
                  >
                    <span class="mr-2 transform transition-transform group-open:rotate-90">▶</span>
                    <span>進階參數 (Weights)</span>
                    <span
                      class="ml-2 px-2 py-0.5 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded"
                    >
                      進階使用者
                    </span>
                  </summary>
                  <div class="mt-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div
                      class="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded"
                    >
                      <p class="text-xs text-yellow-800 dark:text-yellow-200">
                        ⚠️ 注意：這些參數控制 FSRS 算法的核心計算。建議只有在您充分理解 FSRS-6
                        算法原理後才修改。不正確的設定可能導致學習效果下降。
                      </p>
                    </div>
                    <div
                      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3"
                    >
                      <div v-for="(weight, index) in editedSettings.srsConfig.weights" :key="index">
                        <label class="block text-xs text-tertiary-color mb-1"> w{{ index }} </label>
                        <input
                          type="number"
                          v-model.number="editedSettings.srsConfig.weights[index]"
                          class="w-full px-2 py-1 text-sm border border-primary-color rounded bg-white dark:bg-gray-700 text-primary-color font-mono"
                          step="0.01"
                        />
                      </div>
                    </div>
                    <div class="mt-3 flex justify-end">
                      <button
                        @click="resetWeightsToDefault"
                        class="btn btn-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-primary-color border-0"
                        type="button"
                      >
                        重置為預設值
                      </button>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 刪除確認 Modal -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click="closeDeleteModal"
    >
      <div class="card max-w-md w-full mx-4 animate-slide-up" @click.stop>
        <h2 class="text-2xl font-bold text-primary-color mb-4">確認刪除卡片</h2>

        <div class="mb-6">
          <p class="text-secondary-color mb-2">確定要刪除以下卡片嗎？</p>
          <div class="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p class="font-semibold text-primary-color">{{ cardToDelete?.front }}</p>
          </div>
          <p class="text-sm text-tertiary-color mt-2">此操作無法復原</p>
        </div>

        <div class="flex space-x-3">
          <button
            type="button"
            @click="closeDeleteModal"
            class="btn btn-outline flex-1"
            :disabled="cardStore.loading"
          >
            取消
          </button>
          <button
            @click="confirmDelete"
            class="btn flex-1 bg-red-500 hover:bg-red-600 text-white border-0"
            :disabled="cardStore.loading"
          >
            {{ cardStore.loading ? '刪除中...' : '確認刪除' }}
          </button>
        </div>

        <div v-if="cardStore.error" class="mt-4 text-sm text-red-600 dark:text-red-400">
          {{ cardStore.error }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import type { Card } from '@/stores/card'
import type { DeckSettings } from '@/api/types'
import { useDeckStore } from '@/stores/deck'
import { useCardStore } from '@/stores/card'

const route = useRoute()
const router = useRouter()
const deckStore = useDeckStore()
const cardStore = useCardStore()

const deckId = route.params.deckId as string
const deck = computed(() => deckStore.getDeckById(deckId))
const cards = computed(() => cardStore.getCardsByDeck(deckId))

// 刪除 modal 狀態
const showDeleteModal = ref(false)
const cardToDelete = ref<Card | null>(null)

// 設定編輯模式狀態
const isEditingSettings = ref(false)
const editedSettings = ref<DeckSettings | null>(null)
const settingsError = ref<string | null>(null)

// 臨時輸入狀態（用於步驟輸入）
const learningStepsInput = ref<string>('')
const relearningStepsInput = ref<string>('')

// FSRS-6 預設 weights 參數
const DEFAULT_WEIGHTS = [0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575, 0.1192, 1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621]

// 分頁狀態
const currentPage = ref(1)
const itemsPerPage = 10

// 分頁計算屬性
const paginatedCards = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return cards.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(cards.value.length / itemsPerPage))

const hasNextPage = computed(() => currentPage.value < totalPages.value)
const hasPrevPage = computed(() => currentPage.value > 1)
const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage + 1)
const endIndex = computed(() => Math.min(currentPage.value * itemsPerPage, cards.value.length))

const visiblePages = computed(() => {
  const pages: number[] = []
  const total = totalPages.value
  const current = currentPage.value

  if (total <= 7) {
    // 總頁數 <= 7，顯示所有頁碼
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // 總頁數 > 7，顯示部分頁碼
    // 格式：1 ... current-1 current current+1 ... total
    pages.push(1)

    if (current > 3) {
      pages.push(-1) // -1 代表 "..."
    }

    // 當前頁前一頁
    if (current > 2) {
      pages.push(current - 1)
    }

    // 當前頁（如果不是首尾頁）
    if (current !== 1 && current !== total) {
      pages.push(current)
    }

    // 當前頁後一頁
    if (current < total - 1) {
      pages.push(current + 1)
    }

    if (current < total - 2) {
      pages.push(-1)
    }

    pages.push(total)
  }

  return pages
})

// 監聽卡片數量變化，重置頁碼
watch(
  () => cards.value.length,
  () => {
    if (currentPage.value > totalPages.value && totalPages.value > 0) {
      currentPage.value = 1
    }
  },
)

// 載入數據
const loadData = async () => {
  await Promise.all([deckStore.fetchDeck(deckId), cardStore.fetchCardsByDeck(deckId)])
}

onMounted(() => {
  loadData()
})

// 處理編輯
const handleEditCard = (cardId: string) => {
  router.push(`/app/cards/create?edit=${cardId}`)
}

// 打開刪除 modal
const openDeleteModal = (card: Card) => {
  cardToDelete.value = card
  showDeleteModal.value = true
}

// 關閉刪除 modal
const closeDeleteModal = () => {
  showDeleteModal.value = false
  cardToDelete.value = null
}

// 確認刪除
const confirmDelete = async () => {
  if (!cardToDelete.value) return

  try {
    await cardStore.deleteCard(cardToDelete.value.id)
    closeDeleteModal()
  } catch (error) {
    console.error('Failed to delete card:', error)
  }
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    new: '新卡',
    learning: '學習中',
    review: '複習',
    mastered: '已掌握',
  }
  return statusMap[status] || status
}

const getStatusBadgeClass = (status: string) => {
  const classMap: Record<string, string> = {
    new: 'badge-primary',
    learning: 'badge-warning',
    review: 'badge-info',
    mastered: 'badge-success',
  }
  return classMap[status] || ''
}

// 編輯模式函數
// 開始編輯
const startEditing = () => {
  if (!deck.value) return

  // 深拷貝當前設定（使用 FSRS-6 結構）
  editedSettings.value = {
    newCardsPerDay: deck.value.newCardsPerDay || 20,
    reviewCardsPerDay: deck.value.reviewCardsPerDay || 200,
    isPublic: deck.value.isPublic,
    srsConfig: {
      weights: [...(deck.value.srsConfig.weights || DEFAULT_WEIGHTS)],
      desiredRetention: deck.value.srsConfig.desiredRetention || 0.9,
      learningSteps: [...deck.value.srsConfig.learningSteps],
      relearningSteps: [...deck.value.srsConfig.relearningSteps],
      maximumInterval: deck.value.srsConfig.maximumInterval || 36500,
      leechThreshold: deck.value.srsConfig.leechThreshold || 8,
    },
  }

  // 初始化臨時輸入值
  learningStepsInput.value = formatSteps(deck.value.srsConfig.learningSteps)
  relearningStepsInput.value = formatSteps(deck.value.srsConfig.relearningSteps)

  isEditingSettings.value = true
  settingsError.value = null
}

// 重置 weights 為預設值
const resetWeightsToDefault = () => {
  if (editedSettings.value) {
    editedSettings.value.srsConfig.weights = [...DEFAULT_WEIGHTS]
  }
}

// 取消編輯
const cancelEditing = () => {
  isEditingSettings.value = false
  editedSettings.value = null
  settingsError.value = null
}

// 驗證設定
const validateSettings = (settings: DeckSettings): string | null => {
  // 基本設定驗證
  if (settings.newCardsPerDay < 0 || settings.newCardsPerDay > 1000) {
    return '每日新卡片數必須在 0-1000 之間'
  }
  if (settings.reviewCardsPerDay < 0 || settings.reviewCardsPerDay > 9999) {
    return '每日複習數必須在 0-9999 之間'
  }

  // FSRS-6 參數驗證
  const config = settings.srsConfig

  // 期望保留率
  if (config.desiredRetention < 0.7 || config.desiredRetention > 0.97) {
    return '期望保留率必須在 0.7-0.97 之間'
  }

  // 最大間隔
  if (config.maximumInterval < 1 || config.maximumInterval > 36500) {
    return '最大間隔必須在 1-36500 天之間'
  }

  // 學習步驟
  if (!config.learningSteps || config.learningSteps.length === 0) {
    return '學習步驟至少需要一個間隔'
  }
  if (config.learningSteps.some((step) => step <= 0)) {
    return '學習步驟必須大於 0'
  }

  // 重學步驟
  if (!config.relearningSteps || config.relearningSteps.length === 0) {
    return '重學步驟至少需要一個間隔'
  }
  if (config.relearningSteps.some((step) => step <= 0)) {
    return '重學步驟必須大於 0'
  }

  // 低效臨界值
  if (config.leechThreshold < 2 || config.leechThreshold > 20) {
    return '低效臨界值必須在 2-20 之間'
  }

  // Weights 驗證
  if (!config.weights || config.weights.length !== 19) {
    return 'Weights 參數必須包含 19 個數值'
  }

  return null
}

// 儲存設定
const saveSettings = async () => {
  if (!editedSettings.value || !deck.value) return

  const validationError = validateSettings(editedSettings.value)
  if (validationError) {
    settingsError.value = validationError
    return
  }

  try {
    // API 要求 name 和 description 為必填，所以一起傳送
    await deckStore.updateDeck(deck.value.id, {
      name: deck.value.name,
      description: deck.value.description,
      settings: editedSettings.value,
    })
    isEditingSettings.value = false
    editedSettings.value = null
    settingsError.value = null
  } catch (err) {
    settingsError.value = err instanceof Error ? err.message : '更新設定失敗'
  }
}

// 陣列輸入處理函數
// 格式化陣列為字串（用於顯示）
const formatSteps = (steps: number[]): string => {
  return steps.join(', ')
}

// 解析字串為陣列（用於輸入）
// 支援格式：數字 (分鐘)、數字h (小時)、數字d (天)
// 例如：1, 10, 1h, 2d → [1, 10, 60, 2880]
const parseSteps = (input: string): number[] => {
  return input
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0)
    .map((s) => {
      // 檢查是否有單位後綴
      if (s.endsWith('d')) {
        // 天數：轉換為分鐘 (1d = 24 * 60 = 1440 分鐘)
        const days = parseFloat(s.slice(0, -1))
        return isNaN(days) ? NaN : days * 24 * 60
      } else if (s.endsWith('h')) {
        // 小時：轉換為分鐘 (1h = 60 分鐘)
        const hours = parseFloat(s.slice(0, -1))
        return isNaN(hours) ? NaN : hours * 60
      } else {
        // 純數字：直接當作分鐘
        return parseFloat(s)
      }
    })
    .filter((n) => !isNaN(n) && n > 0)
    .map((n) => Math.round(n)) // 確保是整數
}

// 處理學習步驟輸入失去焦點
const handleLearningStepsBlur = () => {
  if (!editedSettings.value) return
  const parsed = parseSteps(learningStepsInput.value)
  if (parsed.length > 0) {
    editedSettings.value.srsConfig.learningSteps = parsed
  }
  // 重新格式化顯示（移除多餘空格等）
  learningStepsInput.value = formatSteps(editedSettings.value.srsConfig.learningSteps)
}

// 處理重學步驟輸入失去焦點
const handleRelearningStepsBlur = () => {
  if (!editedSettings.value) return
  const parsed = parseSteps(relearningStepsInput.value)
  if (parsed.length > 0) {
    editedSettings.value.srsConfig.relearningSteps = parsed
  }
  // 重新格式化顯示（移除多餘空格等）
  relearningStepsInput.value = formatSteps(editedSettings.value.srsConfig.relearningSteps)
}

// 格式化卡片間隔顯示
const formatCardInterval = (card: Card): string => {
  const now = new Date()
  const dueDate = new Date(card.srs.dueDate)
  const diffMs = dueDate.getTime() - now.getTime()

  // 已過期
  if (diffMs <= 0) {
    return '已到期'
  }

  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  // 根據時間差顯示最大的時間單位
  if (diffMinutes < 60) {
    return `${diffMinutes}分鐘`
  } else if (diffHours < 24) {
    return `${diffHours}小時`
  } else {
    return `${diffDays}天`
  }
}
</script>
