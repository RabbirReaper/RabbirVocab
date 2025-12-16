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
    <div
      v-else-if="deckStore.error || cardStore.error"
      class="card bg-red-50 dark:bg-red-900/20"
    >
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
        <RouterLink :to="`/app/study/${deck.id}`" class="btn btn-primary">
          🎯 開始學習
        </RouterLink>
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
          <RouterLink
            :to="`/app/cards/create?deck=${deckId}`"
            class="btn btn-primary btn-sm"
          >
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
              <span class="text-sm text-tertiary-color"> 間隔: {{ formatCardInterval(card) }} </span>
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
                  'cursor-default': page === -1
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
            <button @click="saveSettings" class="btn btn-primary btn-sm" :disabled="deckStore.loading">
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
                  :value="deck.srsConfig.newCardsPerDay"
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
                  :value="deck.srsConfig.reviewsPerDay"
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
            <h3 class="text-lg font-semibold text-primary-color mb-3">SRS 演算法參數</h3>
            <div class="grid md:grid-cols-2 gap-4">
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
              </div>

              <!-- 畢業間隔 -->
              <div>
                <label class="block text-sm font-medium text-secondary-color mb-1">
                  畢業間隔（天）
                </label>
                <input
                  type="number"
                  :value="deck.srsConfig.graduatingInterval"
                  class="w-full px-4 py-2 border border-primary-color rounded-lg bg-disabled text-primary-color"
                  disabled
                />
              </div>

              <!-- 簡單間隔 -->
              <div>
                <label class="block text-sm font-medium text-secondary-color mb-1">
                  簡單間隔（天）
                </label>
                <input
                  type="number"
                  :value="deck.srsConfig.easyInterval"
                  class="w-full px-4 py-2 border border-primary-color rounded-lg bg-disabled text-primary-color"
                  disabled
                />
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
              </div>

              <!-- 最小間隔 -->
              <div>
                <label class="block text-sm font-medium text-secondary-color mb-1">
                  最小間隔（天）
                </label>
                <input
                  type="number"
                  :value="deck.srsConfig.minimumInterval"
                  class="w-full px-4 py-2 border border-primary-color rounded-lg bg-disabled text-primary-color"
                  disabled
                />
              </div>

              <!-- 困難倍數 -->
              <div>
                <label class="block text-sm font-medium text-secondary-color mb-1">困難倍數</label>
                <input
                  type="number"
                  :value="deck.srsConfig.hardInterval"
                  class="w-full px-4 py-2 border border-primary-color rounded-lg bg-disabled text-primary-color"
                  disabled
                />
              </div>

              <!-- 簡單加成 -->
              <div>
                <label class="block text-sm font-medium text-secondary-color mb-1">簡單加成</label>
                <input
                  type="number"
                  :value="deck.srsConfig.easyBonus"
                  class="w-full px-4 py-2 border border-primary-color rounded-lg bg-disabled text-primary-color"
                  disabled
                />
              </div>

              <!-- 低效臨界值 -->
              <div>
                <label class="block text-sm font-medium text-secondary-color mb-1">
                  低效臨界值
                </label>
                <input
                  type="number"
                  :value="deck.srsConfig.leechThreshold"
                  class="w-full px-4 py-2 border border-primary-color rounded-lg bg-disabled text-primary-color"
                  disabled
                />
              </div>

              <!-- 最小難度係數 -->
              <div>
                <label class="block text-sm font-medium text-secondary-color mb-1">
                  最小難度係數
                </label>
                <input
                  type="number"
                  :value="deck.srsConfig.minEaseFactor"
                  class="w-full px-4 py-2 border border-primary-color rounded-lg bg-disabled text-primary-color"
                  disabled
                />
              </div>

              <!-- 最大難度係數 -->
              <div>
                <label class="block text-sm font-medium text-secondary-color mb-1">
                  最大難度係數
                </label>
                <input
                  type="number"
                  :value="deck.srsConfig.maxEaseFactor"
                  class="w-full px-4 py-2 border border-primary-color rounded-lg bg-disabled text-primary-color"
                  disabled
                />
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
            <h3 class="text-lg font-semibold text-primary-color mb-3">SRS 演算法參數</h3>
            <div class="grid md:grid-cols-2 gap-4">
              <!-- 學習步驟 -->
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-secondary-color mb-1">
                  學習步驟（分鐘）
                </label>
                <input
                  type="text"
                  :value="formatSteps(editedSettings.srsConfig.learningSteps)"
                  @input="
                    editedSettings.srsConfig.learningSteps = parseSteps(
                      ($event.target as HTMLInputElement).value
                    )
                  "
                  class="w-full px-4 py-2 border border-primary-color rounded-lg bg-secondary-color text-primary-color"
                  placeholder="15, 1440, 8640"
                />
                <p class="text-xs text-tertiary-color mt-1">
                  新卡片的學習間隔，用逗號分隔。例如：15, 1440 表示 15 分鐘後、1 天後
                </p>
              </div>

              <!-- 畢業間隔 -->
              <div>
                <label class="block text-sm font-medium text-secondary-color mb-1">
                  畢業間隔（天）
                </label>
                <input
                  type="number"
                  v-model.number="editedSettings.srsConfig.graduatingInterval"
                  class="w-full px-4 py-2 border border-primary-color rounded-lg bg-secondary-color text-primary-color"
                  min="1"
                  max="365"
                />
                <p class="text-xs text-tertiary-color mt-1">完成學習步驟後的首次複習間隔</p>
              </div>

              <!-- 簡單間隔 -->
              <div>
                <label class="block text-sm font-medium text-secondary-color mb-1">
                  簡單間隔（天）
                </label>
                <input
                  type="number"
                  v-model.number="editedSettings.srsConfig.easyInterval"
                  class="w-full px-4 py-2 border border-primary-color rounded-lg bg-secondary-color text-primary-color"
                  min="1"
                  max="365"
                />
                <p class="text-xs text-tertiary-color mt-1">選擇「簡單」時的首次複習間隔</p>
              </div>

              <!-- 重學步驟 -->
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-secondary-color mb-1">
                  重學步驟（分鐘）
                </label>
                <input
                  type="text"
                  :value="formatSteps(editedSettings.srsConfig.relearningSteps)"
                  @input="
                    editedSettings.srsConfig.relearningSteps = parseSteps(
                      ($event.target as HTMLInputElement).value
                    )
                  "
                  class="w-full px-4 py-2 border border-primary-color rounded-lg bg-secondary-color text-primary-color"
                  placeholder="20"
                />
                <p class="text-xs text-tertiary-color mt-1">忘記卡片後的重學間隔，用逗號分隔</p>
              </div>

              <!-- 最小間隔 -->
              <div>
                <label class="block text-sm font-medium text-secondary-color mb-1">
                  最小間隔（天）
                </label>
                <input
                  type="number"
                  v-model.number="editedSettings.srsConfig.minimumInterval"
                  class="w-full px-4 py-2 border border-primary-color rounded-lg bg-secondary-color text-primary-color"
                  min="1"
                  max="365"
                />
                <p class="text-xs text-tertiary-color mt-1">複習間隔的最小值，防止過於頻繁</p>
              </div>

              <!-- 困難倍數 -->
              <div>
                <label class="block text-sm font-medium text-secondary-color mb-1">困難倍數</label>
                <input
                  type="number"
                  v-model.number="editedSettings.srsConfig.hardInterval"
                  class="w-full px-4 py-2 border border-primary-color rounded-lg bg-secondary-color text-primary-color"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                />
                <p class="text-xs text-tertiary-color mt-1">
                  選擇「困難」時的間隔倍數（建議 1.0-1.5）
                </p>
              </div>

              <!-- 簡單加成 -->
              <div>
                <label class="block text-sm font-medium text-secondary-color mb-1">簡單加成</label>
                <input
                  type="number"
                  v-model.number="editedSettings.srsConfig.easyBonus"
                  class="w-full px-4 py-2 border border-primary-color rounded-lg bg-secondary-color text-primary-color"
                  min="1.0"
                  max="3.0"
                  step="0.1"
                />
                <p class="text-xs text-tertiary-color mt-1">
                  選擇「簡單」時的間隔倍數（建議 1.2-1.5）
                </p>
              </div>

              <!-- 低效臨界值 -->
              <div>
                <label class="block text-sm font-medium text-secondary-color mb-1">
                  低效臨界值
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

              <!-- 最小難度係數 -->
              <div>
                <label class="block text-sm font-medium text-secondary-color mb-1">
                  最小難度係數
                </label>
                <input
                  type="number"
                  v-model.number="editedSettings.srsConfig.minEaseFactor"
                  class="w-full px-4 py-2 border border-primary-color rounded-lg bg-secondary-color text-primary-color"
                  min="1.0"
                  max="2.0"
                  step="0.1"
                />
                <p class="text-xs text-tertiary-color mt-1">難度係數的下限（建議 1.3）</p>
              </div>

              <!-- 最大難度係數 -->
              <div>
                <label class="block text-sm font-medium text-secondary-color mb-1">
                  最大難度係數
                </label>
                <input
                  type="number"
                  v-model.number="editedSettings.srsConfig.maxEaseFactor"
                  class="w-full px-4 py-2 border border-primary-color rounded-lg bg-secondary-color text-primary-color"
                  min="2.0"
                  max="5.0"
                  step="0.1"
                />
                <p class="text-xs text-tertiary-color mt-1">難度係數的上限（建議 2.5）</p>
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
  }
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

  // 深拷貝當前設定
  editedSettings.value = {
    newCardsPerDay: deck.value.srsConfig.newCardsPerDay,
    reviewCardsPerDay: deck.value.srsConfig.reviewsPerDay,
    isPublic: deck.value.isPublic,
    srsConfig: {
      learningSteps: [...deck.value.srsConfig.learningSteps],
      graduatingInterval: deck.value.srsConfig.graduatingInterval,
      easyInterval: deck.value.srsConfig.easyInterval,
      relearningSteps: [...deck.value.srsConfig.relearningSteps],
      minimumInterval: deck.value.srsConfig.minimumInterval,
      leechThreshold: deck.value.srsConfig.leechThreshold,
      easyBonus: deck.value.srsConfig.easyBonus,
      hardInterval: deck.value.srsConfig.hardInterval,
      minEaseFactor: deck.value.srsConfig.minEaseFactor,
      maxEaseFactor: deck.value.srsConfig.maxEaseFactor,
    }
  }

  isEditingSettings.value = true
  settingsError.value = null
}

// 取消編輯
const cancelEditing = () => {
  isEditingSettings.value = false
  editedSettings.value = null
  settingsError.value = null
}

// 驗證設定
const validateSettings = (settings: DeckSettings): string | null => {
  if (settings.newCardsPerDay < 0 || settings.newCardsPerDay > 1000) {
    return '每日新卡片數必須在 0-1000 之間'
  }
  if (settings.reviewCardsPerDay < 0 || settings.reviewCardsPerDay > 9999) {
    return '每日複習數必須在 0-9999 之間'
  }
  if (settings.srsConfig.learningSteps.length === 0) {
    return '學習步驟至少需要一個間隔'
  }
  if (settings.srsConfig.learningSteps.some(step => step <= 0)) {
    return '學習步驟必須大於 0'
  }
  if (settings.srsConfig.graduatingInterval < 1 || settings.srsConfig.graduatingInterval > 365) {
    return '畢業間隔必須在 1-365 天之間'
  }
  if (settings.srsConfig.easyInterval < 1 || settings.srsConfig.easyInterval > 365) {
    return '簡單間隔必須在 1-365 天之間'
  }
  if (settings.srsConfig.minimumInterval < 1 || settings.srsConfig.minimumInterval > 365) {
    return '最小間隔必須在 1-365 天之間'
  }
  if (settings.srsConfig.hardInterval < 0.5 || settings.srsConfig.hardInterval > 2.0) {
    return '困難倍數必須在 0.5-2.0 之間'
  }
  if (settings.srsConfig.easyBonus < 1.0 || settings.srsConfig.easyBonus > 3.0) {
    return '簡單加成必須在 1.0-3.0 之間'
  }
  if (settings.srsConfig.minEaseFactor < 1.0 || settings.srsConfig.minEaseFactor > 2.0) {
    return '最小難度係數必須在 1.0-2.0 之間'
  }
  if (settings.srsConfig.maxEaseFactor < 2.0 || settings.srsConfig.maxEaseFactor > 5.0) {
    return '最大難度係數必須在 2.0-5.0 之間'
  }
  if (settings.srsConfig.minEaseFactor >= settings.srsConfig.maxEaseFactor) {
    return '最小難度係數必須小於最大難度係數'
  }
  if (settings.srsConfig.leechThreshold < 2 || settings.srsConfig.leechThreshold > 20) {
    return '低效臨界值必須在 2-20 之間'
  }
  if (settings.srsConfig.relearningSteps.length === 0) {
    return '重學步驟至少需要一個間隔'
  }
  if (settings.srsConfig.relearningSteps.some(step => step <= 0)) {
    return '重學步驟必須大於 0'
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
      settings: editedSettings.value
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
const parseSteps = (input: string): number[] => {
  return input
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => parseInt(s, 10))
    .filter(n => !isNaN(n))
}

// 格式化卡片間隔顯示
const formatCardInterval = (card: Card): string => {
  const now = new Date()
  const dueDate = new Date(card.srs.dueDate)

  // 如果是學習階段（interval = 0），計算距離下次複習的時間
  if (card.srs.interval === 0) {
    const diffMs = dueDate.getTime() - now.getTime()

    // 已過期
    if (diffMs <= 0) {
      return '已到期'
    }

    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    // 小於 1 小時，顯示分鐘
    if (diffMinutes < 60) {
      return `${diffMinutes}分鐘`
    }
    // 小於 1 天，顯示小時
    else if (diffHours < 24) {
      return `${diffHours}小時`
    }
    // 顯示天數
    else {
      return `${diffDays}天`
    }
  }

  // 複習階段，直接使用 interval（天數）
  const days = card.srs.interval

  // 小於 1 天，檢查是否有分鐘級別的間隔
  if (days < 1) {
    const diffMs = dueDate.getTime() - now.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffMinutes < 60) {
      return `${diffMinutes}分鐘`
    } else if (diffHours < 24) {
      return `${diffHours}小時`
    }
  }

  return `${days}天`
}
</script>
