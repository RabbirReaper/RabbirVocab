<template>
  <div v-if="deck" class="max-w-3xl mx-auto space-y-6">
    <!-- 標題與進度 -->
    <div>
      <RouterLink
        :to="`/app/decks/${deckId}`"
        class="text-primary-600 dark:text-primary-400 hover:underline mb-2 inline-block"
      >
        ← 返回卡組
      </RouterLink>
      <h1 class="text-3xl font-bold text-primary-color">{{ deck.name }}</h1>

      <!-- 進度條 -->
      <div class="mt-4">
        <div class="flex justify-between text-sm mb-2">
          <span class="text-secondary-color">學習進度</span>
          <span class="text-primary-color font-medium">
            {{ studiedCount }} / {{ totalDueCards }}
          </span>
        </div>
        <div class="w-full bg-progress rounded-full h-2">
          <div
            class="bg-primary-600 dark:bg-primary-500 h-2 rounded-full transition-all"
            :style="{ width: progressPercentage + '%' }"
          ></div>
        </div>
      </div>
    </div>

    <!-- 學習卡片 -->
    <div v-if="currentCard" class="study-card min-h-[400px] flex flex-col">
      <div class="flex-1 flex items-center justify-center">
        <div class="text-center w-full">
          <!-- 卡片正面/背面 -->
          <div v-if="!showAnswer" class="space-y-4">
            <div class="text-sm text-gray-500 dark:text-gray-500 uppercase tracking-wide">問題</div>
            <div class="text-4xl font-bold text-primary-color">
              {{ currentCard.front }}
            </div>
            <!-- 播放按鈕 -->
            <div v-if="currentCard.audio?.url" class="flex justify-center mt-4">
              <button
                @click="playAudio"
                class="btn btn-secondary btn-sm p-3 hover:scale-110 transition-transform"
                title="播放音檔"
              >
                🔊
              </button>
            </div>
          </div>

          <div v-else class="space-y-6">
            <div>
              <div class="text-sm text-gray-500 dark:text-gray-500 uppercase tracking-wide mb-2">
                問題
              </div>
              <div class="text-3xl font-bold text-primary-color">
                {{ currentCard.front }}
              </div>
              <!-- 播放按鈕 -->
              <div v-if="currentCard.audio?.url" class="flex justify-center mt-4">
                <button
                  @click="playAudio"
                  class="btn btn-secondary btn-sm p-3 hover:scale-110 transition-transform"
                  title="播放音檔"
                >
                  🔊
                </button>
              </div>
            </div>
            <div class="border-t border-primary-color pt-6">
              <div class="text-sm text-gray-500 dark:text-gray-500 uppercase tracking-wide mb-2">
                答案
              </div>

              <!-- 圖片顯示（如果有） -->
              <img
                v-if="currentCard.back.image?.url"
                :src="currentCard.back.image.url"
                :alt="currentCard.back.image.alt || '卡片圖片'"
                class="max-w-full h-auto rounded-lg shadow-md mb-4 mx-auto"
              />

              <!-- Markdown 內容渲染 -->
              <div
                class="prose prose-lg dark:prose-invert max-w-none text-left"
                v-html="renderedContent"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按鈕 -->
      <div class="mt-8 pt-6 border-t border-primary-color">
        <div v-if="!showAnswer" class="text-center">
          <button @click="showAnswer = true" class="btn btn-primary btn-lg">顯示答案</button>
        </div>

        <div v-else class="grid grid-cols-4 gap-3">
          <button
            @click="handleReview('again')"
            class="btn bg-red-500 hover:bg-red-600 text-white border-0"
          >
            <div class="text-sm font-semibold">Again</div>
            <div class="text-xs opacity-80 mt-1">&lt;1 min</div>
          </button>

          <button
            @click="handleReview('hard')"
            class="btn bg-orange-500 hover:bg-orange-600 text-white border-0"
          >
            <div class="text-sm font-semibold">Hard</div>
            <div class="text-xs opacity-80 mt-1">{{ getHardInterval() }}</div>
          </button>

          <button
            @click="handleReview('good')"
            class="btn bg-green-500 hover:bg-green-600 text-white border-0"
          >
            <div class="text-sm font-semibold">Good</div>
            <div class="text-xs opacity-80 mt-1">{{ getGoodInterval() }}</div>
          </button>

          <button
            @click="handleReview('easy')"
            class="btn bg-blue-500 hover:bg-blue-600 text-white border-0"
          >
            <div class="text-sm font-semibold">Easy</div>
            <div class="text-xs opacity-80 mt-1">{{ getEasyInterval() }}</div>
          </button>
        </div>
      </div>
    </div>

    <!-- 完成畫面 -->
    <div v-else class="card text-center py-12">
      <div class="text-6xl mb-4">🎉</div>
      <h2 class="text-2xl font-bold text-primary-color mb-2">太棒了！</h2>
      <p class="text-secondary-color mb-6">你已經完成今天的所有複習</p>
      <RouterLink :to="`/app/decks/${deckId}`" class="btn btn-primary"> 返回卡組 </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useDeckStore } from '@/stores/deck'
import { useCardStore, type Card } from '@/stores/card'
import MarkdownIt from 'markdown-it'

const route = useRoute()
const deckStore = useDeckStore()
const cardStore = useCardStore()

// 初始化 markdown-it
const md = new MarkdownIt({
  html: false, // 禁用 HTML 標籤（安全考量）
  breaks: true, // 轉換換行符為 <br>
  linkify: true, // 自動轉換 URL 為連結
  typographer: true, // 啟用智能引號和其他排版優化
})

const deckId = route.params.deckId as string
const deck = computed(() => deckStore.getDeckById(deckId))

const dueCards = ref<Card[]>([])
const currentCardIndex = ref(0)
const showAnswer = ref(false)
const studiedCount = ref(0)

const currentCard = computed(() => dueCards.value[currentCardIndex.value])
const totalDueCards = computed(() => dueCards.value.length)
const progressPercentage = computed(() => {
  if (totalDueCards.value === 0) return 100
  return Math.round((studiedCount.value / totalDueCards.value) * 100)
})

// 渲染 Markdown 的計算屬性
const renderedContent = computed(() => {
  if (!currentCard.value?.back?.content) return ''
  return md.render(currentCard.value.back.content)
})

const loadDueCards = () => {
  dueCards.value = cardStore.getDueCards(deckId)
}

const handleReview = (rating: 'again' | 'hard' | 'good' | 'easy') => {
  if (!currentCard.value) return

  cardStore.reviewCard(currentCard.value.id, rating)
  studiedCount.value++
  showAnswer.value = false

  // 移到下一張卡片
  currentCardIndex.value++
}

const getHardInterval = () => {
  if (!currentCard.value) return '1d'
  const interval = Math.max(1, Math.floor(currentCard.value.interval * 1.2))
  return interval < 1 ? '<1d' : `${interval}d`
}

const getGoodInterval = () => {
  if (!currentCard.value) return '3d'
  const interval =
    currentCard.value.interval === 0
      ? 1
      : Math.floor(currentCard.value.interval * currentCard.value.easeFactor)
  return `${interval}d`
}

const getEasyInterval = () => {
  if (!currentCard.value) return '7d'
  const interval =
    currentCard.value.interval === 0
      ? 4
      : Math.floor(currentCard.value.interval * currentCard.value.easeFactor * 1.3)
  return `${interval}d`
}

// 播放音檔
const playAudio = () => {
  if (!currentCard.value?.audio?.url) return

  const audio = new Audio(currentCard.value.audio.url)
  audio.play().catch((err) => {
    console.error('播放音檔失敗:', err)
  })
}

// 監聽當前卡片變化，自動播放音檔
watch(currentCard, (newCard) => {
  if (newCard?.audio?.url && !showAnswer.value) {
    // 延遲一小段時間以確保 UI 已渲染
    setTimeout(() => {
      playAudio()
    }, 300)
  }
})

onMounted(() => {
  loadDueCards()
})
</script>

<style scoped>
.prose :deep(h3 + ul),
.prose :deep(h3 + ol) {
  margin-top: 1rem;
}

.prose :deep(ul + h3),
.prose :deep(ol + h3) {
  margin-top: 1.5rem;
}

.prose :deep(ul li),
.prose :deep(ol li) {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

/* 確保第一個列表項也有上方間距 */
.prose :deep(ul li:first-child),
.prose :deep(ol li:first-child) {
  margin-top: 0.5rem;
}

/* 巢狀列表的間距調整 */
.prose :deep(ul ul),
.prose :deep(ul ol),
.prose :deep(ol ul),
.prose :deep(ol ol) {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}
</style>
