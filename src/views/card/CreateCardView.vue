<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- 頁面標題 -->
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bold text-primary-color">
        {{ isEditMode ? '編輯卡片' : '新增卡片' }}
      </h1>
      <button @click="handleCancel" class="text-secondary-color hover:underline">← 返回</button>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- 1. 所屬卡組 -->
      <div class="card">
        <label class="block text-sm font-medium text-secondary-color mb-2">所屬卡組 *</label>
        <select
          v-model="formData.deck"
          required
          :disabled="isEditMode"
          class="w-full px-4 py-2 border border-primary-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          :class="{ 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed': isEditMode }"
        >
          <option value="">請選擇卡組</option>
          <option v-for="deck in deckStore.decks" :key="deck.id" :value="deck.id">
            {{ deck.name }}
          </option>
        </select>
        <p v-if="isEditMode" class="text-xs text-tertiary-color mt-1">編輯模式下無法變更卡組</p>
      </div>

      <!-- 2. 正面 -->
      <div class="card">
        <h2 class="text-xl font-bold text-primary-color mb-4">正面</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-secondary-color mb-2">單字 *</label>
            <input
              v-model="formData.front"
              type="text"
              required
              class="w-full px-4 py-2 border border-primary-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="例如：apple"
            />
          </div>

          <!-- TTS 測試區塊 -->
          <div
            class="border border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50"
          >
            <h3 class="text-sm font-semibold text-primary-color mb-3 flex items-center">
              <span class="text-lg mr-2">🔊</span>
              語音測試
            </h3>

            <!-- 語音選擇 -->
            <div class="mb-3">
              <label class="block text-xs font-medium text-secondary-color mb-1">選擇語音</label>
              <select
                v-model="ttsVoice"
                :disabled="ttsLoading"
                class="w-full px-3 py-2 text-sm border border-primary-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option v-for="voice in voices" :key="voice.value" :value="voice.value">
                  {{ voice.label }}
                </option>
              </select>
            </div>

            <!-- 按鈕區 -->
            <div class="flex gap-2 mb-3">
              <button
                type="button"
                @click="handleTTS"
                :disabled="ttsLoading || !formData.front"
                class="btn btn-primary flex-1"
                :class="{ 'opacity-50 cursor-not-allowed': ttsLoading || !formData.front }"
              >
                <span v-if="ttsLoading" class="inline-block animate-spin mr-2">⏳</span>
                <span v-else class="mr-2">▶</span>
                {{ ttsLoading ? '生成中...' : '生成語音' }}
              </button>
              <button
                type="button"
                @click="clearAudio"
                :disabled="ttsLoading || !audioUrl"
                class="btn btn-secondary px-4"
                :class="{ 'opacity-50 cursor-not-allowed': ttsLoading || !audioUrl }"
              >
                <span>✖</span>
              </button>
            </div>

            <!-- 訊息顯示 -->
            <div
              v-if="ttsMessage"
              class="mb-3 px-3 py-2 rounded text-sm"
              :class="{
                'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300': ttsLoading,
                'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300':
                  !ttsLoading && ttsMessage.includes('成功'),
                'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300':
                  ttsMessage.includes('錯誤') || ttsMessage.includes('失敗'),
              }"
            >
              {{ ttsMessage }}
            </div>

            <!-- 音訊播放器 -->
            <div v-if="audioUrl" class="mt-3">
              <label class="block text-xs font-medium text-secondary-color mb-1">播放音訊</label>
              <audio id="ttsAudio" :src="audioUrl" controls class="w-full"></audio>
            </div>

            <p class="text-xs text-tertiary-color mt-3">
              優先使用 Edge TTS（高品質），未來支援自訂音檔上傳（Cloudflare R2）
            </p>
          </div>
        </div>
      </div>

      <!-- 3. 背面 -->
      <div class="card">
        <h2 class="text-xl font-bold text-primary-color mb-4">背面</h2>
        <div class="space-y-4">
          <!-- 3.1 內容說明 -->
          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="block text-sm font-medium text-secondary-color">
                內容說明（Markdown）*
              </label>
              <button
                type="button"
                @click="generateWithAI"
                :disabled="aiLoading || !formData.front"
                class="btn btn-sm btn-secondary"
                :class="{ 'opacity-50 cursor-not-allowed': aiLoading || !formData.front }"
              >
                <span v-if="aiLoading" class="inline-block animate-spin mr-1">⏳</span>
                <span v-else class="mr-1">✨</span>
                {{ aiLoading ? 'AI 生成中...' : 'AI 生成' }}
              </button>
            </div>

            <!-- AI 訊息顯示 -->
            <div
              v-if="aiMessage"
              class="mb-2 px-3 py-2 rounded text-sm"
              :class="{
                'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300': aiLoading,
                'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300':
                  !aiLoading && aiMessage.includes('成功'),
                'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300':
                  aiMessage.includes('失敗') || aiMessage.includes('錯誤'),
                'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300':
                  aiMessage.includes('請先'),
              }"
            >
              {{ aiMessage }}
            </div>

            <textarea
              ref="contentTextarea"
              v-model="formData.back.content"
              @input="autoResize"
              required
              class="w-full px-4 py-2 border border-primary-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm resize-none overflow-hidden"
              placeholder="# 例句&#10;- An apple a day keeps the doctor away.&#10;&#10;# 詞性&#10;n. 名詞&#10;&#10;# 補充&#10;複數形式：apples"
              rows="3"
            ></textarea>
            <p class="text-xs text-tertiary-color mt-1">
              支援 Markdown 格式，製作階段不需要渲染，背誦時才會顯示格式化內容
            </p>
          </div>

          <!-- 3.3 圖片 -->
          <div>
            <label class="block text-sm font-medium text-secondary-color mb-2">圖片</label>

            <!-- 上傳區域 -->
            <div
              v-if="!imagePreview"
              class="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center"
            >
              <input
                type="file"
                ref="imageInput"
                @change="handleImageSelect"
                accept="image/jpeg,image/png,image/webp"
                class="hidden"
              />
              <button type="button" @click="imageInput?.click()" class="btn btn-secondary">
                📁 選擇圖片
              </button>
              <p class="text-xs text-tertiary-color mt-2">支援 JPG、PNG、WebP 格式，最大 1MB</p>
            </div>

            <!-- 預覽區域 -->
            <div v-else class="relative">
              <img :src="imagePreview" alt="預覽" class="w-full rounded-lg" />
              <button
                type="button"
                @click="clearImage"
                class="absolute top-2 right-2 btn btn-secondary"
              >
                ✖ 刪除
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. 音檔 -->
      <div class="card">
        <h2 class="text-xl font-bold text-primary-color mb-4">音檔</h2>

        <!-- 上傳區域 -->
        <div
          v-if="!audioPreview"
          class="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center"
        >
          <input
            type="file"
            ref="audioInput"
            @change="handleAudioSelect"
            accept="audio/mpeg,audio/wav,audio/ogg"
            class="hidden"
          />
          <div class="flex gap-2 justify-center">
            <button type="button" @click="audioInput?.click()" class="btn btn-secondary">
              📁 選擇音檔
            </button>
            <button
              type="button"
              @click="useTTSAudio"
              :disabled="!audioUrl"
              class="btn btn-primary"
              :class="{ 'opacity-50 cursor-not-allowed': !audioUrl }"
            >
              🔊 使用語音測試音檔
            </button>
          </div>
          <p class="text-xs text-tertiary-color mt-2">支援 MP3、WAV、OGG 格式，最大 1MB</p>
        </div>

        <!-- 播放器 -->
        <div v-else>
          <audio :src="audioPreview" controls class="w-full" />
          <button type="button" @click="clearUploadedAudio" class="btn btn-secondary mt-2">
            ✖ 刪除
          </button>
        </div>
      </div>

      <!-- 5. 標籤 -->
      <div class="card">
        <h2 class="text-xl font-bold text-primary-color mb-4">標籤</h2>

        <!-- 已選標籤 -->
        <div v-if="selectedTags.length > 0" class="flex flex-wrap gap-2 mb-4">
          <span
            v-for="tag in selectedTags"
            :key="tag"
            class="badge badge-primary inline-flex items-center space-x-2 px-3 py-1"
          >
            <span>{{ tag }}</span>
            <button type="button" @click="removeTag(tag)" class="hover:text-red-500 font-bold">
              ×
            </button>
          </span>
        </div>

        <!-- 標籤操作 -->
        <div class="flex space-x-2">
          <div class="relative flex-1">
            <button
              type="button"
              @click="showTagDropdown = !showTagDropdown"
              class="btn btn-secondary w-full"
            >
              從現有標籤選擇
            </button>
            <!-- 下拉選單 -->
            <div
              v-if="showTagDropdown"
              class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-primary-color rounded-lg shadow-lg max-h-48 overflow-y-auto"
            >
              <button
                v-for="tag in availableTags.filter((t) => !selectedTags.includes(t))"
                :key="tag"
                type="button"
                @click="addTag(tag)"
                class="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-primary-color"
              >
                {{ tag }}
              </button>
              <div
                v-if="availableTags.filter((t) => !selectedTags.includes(t)).length === 0"
                class="px-4 py-2 text-center text-secondary-color"
              >
                所有標籤已選擇
              </div>
            </div>
          </div>
          <button type="button" @click="showAddTagModal = true" class="btn btn-outline px-6">
            + 新增標籤
          </button>
        </div>

        <p class="text-xs text-tertiary-color mt-2">
          <!-- TODO: 未來整合標籤 API，目前使用假資料 -->
          目前使用假資料，未來整合標籤 API 後可管理自訂標籤
        </p>
      </div>

      <!-- 6. 提交按鈕 -->
      <!-- 編輯模式按鈕 -->
      <div v-if="isEditMode" class="flex space-x-3">
        <button type="button" @click="handleReset" class="btn btn-outline" :disabled="loading">
          重製
        </button>
        <button
          type="button"
          @click="handleCancel"
          class="btn btn-secondary flex-1"
          :disabled="loading"
        >
          取消
        </button>
        <button type="submit" :disabled="loading" class="btn btn-primary flex-1">
          {{ loading ? '更新中...' : '修改完成' }}
        </button>
      </div>

      <!-- 新建模式按鈕 -->
      <div v-else class="flex space-x-4">
        <button
          type="button"
          @click="handleCancel"
          class="btn btn-secondary flex-1"
          :disabled="loading"
        >
          取消
        </button>
        <button type="submit" :disabled="loading" class="btn btn-primary flex-1">
          {{ loading ? '建立中...' : '建立卡片' }}
        </button>
      </div>

      <!-- 錯誤提示 -->
      <div v-if="error" class="card bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500">
        <p class="text-red-600 dark:text-red-400">{{ error }}</p>
      </div>
    </form>

    <!-- 新增標籤 Modal -->
    <div
      v-if="showAddTagModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click="showAddTagModal = false"
    >
      <div class="card max-w-md w-full mx-4" @click.stop>
        <h2 class="text-2xl font-bold text-primary-color mb-4">新增標籤</h2>
        <form @submit.prevent="handleAddTag">
          <div class="mb-4">
            <label class="block text-sm font-medium text-secondary-color mb-2">標籤名稱</label>
            <input
              v-model="newTagName"
              type="text"
              required
              class="w-full px-4 py-2 border border-primary-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="例如：基礎"
            />
          </div>
          <div class="flex space-x-3">
            <button type="button" @click="showAddTagModal = false" class="btn btn-secondary flex-1">
              取消
            </button>
            <button type="submit" class="btn btn-primary flex-1">新增</button>
          </div>
        </form>
        <p class="text-xs text-tertiary-color mt-3">
          <!-- TODO: 標籤 API 開發後將保存到後端 -->
          目前僅添加到本地狀態，未來整合 API 後將保存到後端
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDeckStore } from '@/stores/deck'
import { useCardStore } from '@/stores/card'
import { EdgeTTS } from 'edge-tts-universal/browser'
import type { CreateCardRequest, CardDto } from '@/api/types'
import { aiApi, cardApi } from '@/api/modules'

const router = useRouter()
const route = useRoute()
const deckStore = useDeckStore()
const cardStore = useCardStore()

// 編輯模式狀態
const isEditMode = computed(() => !!route.query.edit)
const editCardId = computed(() => route.query.edit as string)
const originalCardData = ref<CardDto | null>(null)
const fetchingCard = ref(false)
const fetchError = ref<string | null>(null)

// 表單資料
const formData = ref<CreateCardRequest>({
  deck: (route.query.deck as string) || '',
  front: '',
  back: {
    content: '',
  },
  tags: [],
})

// UI 狀態
const loading = ref(false)
const error = ref<string | null>(null)
const showTagDropdown = ref(false)
const showAddTagModal = ref(false)
const newTagName = ref('')

// 標籤相關（使用假資料）
const availableTags = ref(['基礎', '進階', '商務', '旅遊'])
const selectedTags = ref<string[]>([])

// 文件上傳相關狀態
const imageInput = ref<HTMLInputElement | null>(null)
const imageFile = ref<File | null>(null)
const imagePreview = ref<string>('')

const audioInput = ref<HTMLInputElement | null>(null)
const audioFile = ref<File | null>(null)
const audioPreview = ref<string>('')

// ===== TTS 測試功能 =====
const ttsVoice = ref('en-US-EmmaMultilingualNeural') // 語音選擇
const ttsLoading = ref(false) // 載入狀態
const ttsMessage = ref('') // 訊息顯示
const audioUrl = ref('') // 音訊 URL

// 可用的語音選項
const voices = [
  { value: 'en-US-EmmaMultilingualNeural', label: 'English (US) - Emma' },
  { value: 'en-GB-SoniaNeural', label: 'English (UK) - Sonia' },
  { value: 'zh-CN-XiaoxiaoNeural', label: '中文 (簡體) - 曉曉' },
  { value: 'zh-TW-HsiaoChenNeural', label: '中文 (台灣) - 曉臻' },
  { value: 'ja-JP-NanamiNeural', label: '日本語 - Nanami' },
]

// 執行 TTS - 修復版本，使用 edge-tts-universal
const handleTTS = async () => {
  if (!formData.value.front.trim()) {
    ttsMessage.value = '請輸入單字！'
    return
  }

  ttsLoading.value = true
  ttsMessage.value = '正在生成語音...'

  try {
    // 清除舊的音訊 URL
    if (audioUrl.value) {
      URL.revokeObjectURL(audioUrl.value)
      audioUrl.value = ''
    }

    // 建立 TTS 實例（使用 edge-tts-universal/browser）
    const tts = new EdgeTTS(formData.value.front, ttsVoice.value)

    // 合成語音
    const result = await tts.synthesize()

    // 檢查是否有音訊數據
    if (!result || !result.audio) {
      throw new Error('未收到音訊數據')
    }

    // 建立 Blob 和 URL
    const blob = new Blob([result.audio], { type: 'audio/mpeg' })
    audioUrl.value = URL.createObjectURL(blob)

    ttsMessage.value = '語音生成成功！'

    // 自動播放
    nextTick(() => {
      const audioElement = document.getElementById('ttsAudio') as HTMLAudioElement
      if (audioElement) {
        audioElement.play().catch((err) => {
          console.warn('自動播放失敗:', err)
          ttsMessage.value = '語音生成成功！請手動播放'
        })
      }
    })
  } catch (error) {
    console.error('TTS Error:', error)
    const errorMessage = error instanceof Error ? error.message : '未知錯誤'

    // 提供更友善的錯誤訊息
    if (errorMessage.includes('WebSocket') || errorMessage.includes('network')) {
      ttsMessage.value = '無法連接到 Microsoft Edge TTS 服務，請檢查網路連線後再試。'
    } else if (errorMessage.includes('timeout')) {
      ttsMessage.value = '連線逾時，請稍後再試。'
    } else {
      ttsMessage.value = `錯誤: ${errorMessage}`
    }
  } finally {
    ttsLoading.value = false
  }
}

// 清除音訊
const clearAudio = () => {
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value)
    audioUrl.value = ''
  }
  ttsMessage.value = ''
}

// 獲取卡片資料（編輯模式）
const fetchCardForEdit = async () => {
  if (!editCardId.value) return

  fetchingCard.value = true
  fetchError.value = null

  try {
    const response = await cardApi.getCard(editCardId.value)
    const card = response.card
    originalCardData.value = card

    // 預填表單
    formData.value = {
      deck: card.deck,
      front: card.front,
      back: { content: card.back.content },
      tags: card.tags,
    }

    selectedTags.value = card.tags || []

    // 處理既有圖片
    if (card.back.image?.url) {
      imagePreview.value = card.back.image.url
    }

    // 處理既有音檔
    if (card.audio?.url) {
      audioPreview.value = card.audio.url
    }

    await nextTick()
    autoResize()
  } catch (err: unknown) {
    console.error('Failed to fetch card:', err)
    fetchError.value = err instanceof Error ? err.message : '無法載入卡片資料'
  } finally {
    fetchingCard.value = false
  }
}

// 載入卡組列表
onMounted(async () => {
  if (deckStore.decks.length === 0) {
    await deckStore.fetchDecks()
  }

  // 編輯模式：獲取卡片資料
  if (isEditMode.value) {
    await fetchCardForEdit()
  }

  // 初始化 textarea 高度
  await nextTick()
  autoResize()
})

// AI 生成狀態
const aiLoading = ref(false)
const aiMessage = ref('')

// Textarea 自動調整高度
const contentTextarea = ref<HTMLTextAreaElement | null>(null)

const autoResize = () => {
  if (contentTextarea.value) {
    contentTextarea.value.style.height = 'auto'
    contentTextarea.value.style.height = contentTextarea.value.scrollHeight + 'px'
  }
}

// AI 生成功能
const generateWithAI = async () => {
  if (!formData.value.front.trim()) {
    aiMessage.value = '請先輸入單字！'
    setTimeout(() => {
      aiMessage.value = ''
    }, 3000)
    return
  }

  aiLoading.value = true
  aiMessage.value = '正在使用 AI 生成內容...'

  try {
    const content = await aiApi.generateContent(formData.value.front)
    formData.value.back.content = content
    aiMessage.value = 'AI 生成成功！'

    // 自動調整 textarea 高度
    await nextTick()
    autoResize()

    setTimeout(() => {
      aiMessage.value = ''
    }, 3000)
  } catch (error) {
    console.error('AI 生成失敗:', error)
    aiMessage.value = error instanceof Error ? error.message : 'AI 生成失敗，請稍後再試'
    setTimeout(() => {
      aiMessage.value = ''
    }, 5000)
  } finally {
    aiLoading.value = false
  }
}

// 標籤管理
const addTag = (tag: string) => {
  if (!selectedTags.value.includes(tag)) {
    selectedTags.value.push(tag)
  }
  showTagDropdown.value = false
}

const removeTag = (tag: string) => {
  selectedTags.value = selectedTags.value.filter((t) => t !== tag)
}

const handleAddTag = () => {
  const trimmedName = newTagName.value.trim()
  if (trimmedName && !availableTags.value.includes(trimmedName)) {
    availableTags.value.push(trimmedName)
    addTag(trimmedName)
  }
  newTagName.value = ''
  showAddTagModal.value = false
  // TODO: 未來調用標籤 API 保存到後端
  // await api.tag.createTag({ name: trimmedName })
}

// ===== 文件處理功能 =====
// 圖片處理
const handleImageSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  // 驗證文件大小（1MB）
  if (file.size > 1 * 1024 * 1024) {
    error.value = '圖片大小不能超過 1MB'
    return
  }

  imageFile.value = file
  imagePreview.value = URL.createObjectURL(file)
}

const clearImage = () => {
  if (imagePreview.value) {
    URL.revokeObjectURL(imagePreview.value)
  }
  imageFile.value = null
  imagePreview.value = ''
  if (imageInput.value) {
    imageInput.value.value = ''
  }
}

// 音頻處理
const handleAudioSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  // 驗證文件大小（1MB）
  if (file.size > 1 * 1024 * 1024) {
    error.value = '音檔大小不能超過 1MB'
    return
  }

  audioFile.value = file
  audioPreview.value = URL.createObjectURL(file)
}

const clearUploadedAudio = () => {
  if (audioPreview.value) {
    URL.revokeObjectURL(audioPreview.value)
  }
  audioFile.value = null
  audioPreview.value = ''
  if (audioInput.value) {
    audioInput.value.value = ''
  }
}

// 使用 TTS 生成的音檔
const useTTSAudio = async () => {
  if (!audioUrl.value) {
    return
  }

  try {
    // 從 Blob URL 獲取音訊數據
    const response = await fetch(audioUrl.value)
    const blob = await response.blob()

    // 生成文件名（使用單字名稱）
    const fileName = `${formData.value.front || 'tts-audio'}.mp3`

    // 轉換成 File 對象
    const file = new File([blob], fileName, { type: 'audio/mpeg' })

    // 設置音檔和預覽
    audioFile.value = file
    audioPreview.value = URL.createObjectURL(file)
  } catch (err: unknown) {
    console.error('使用 TTS 音檔失敗:', err)
    error.value = '使用 TTS 音檔失敗，請重新嘗試'
  }
}

// 表單提交
const handleSubmit = async () => {
  loading.value = true
  error.value = null

  try {
    // 判斷是否有文件需要上傳
    const hasFiles = imageFile.value || audioFile.value

    if (isEditMode.value) {
      // === 編輯模式 ===
      const cardId = editCardId.value

      if (hasFiles) {
        // 使用 FormData
        const formDataToSend = new FormData()
        formDataToSend.append('front', formData.value.front)
        formDataToSend.append('back', JSON.stringify({ content: formData.value.back.content }))

        if (selectedTags.value.length > 0) {
          formDataToSend.append('tags', JSON.stringify(selectedTags.value))
        }

        if (imageFile.value) formDataToSend.append('image', imageFile.value)
        if (audioFile.value) formDataToSend.append('audio', audioFile.value)

        await cardApi.updateCard(cardId, formDataToSend)
      } else {
        // 使用 JSON
        const updateData = {
          front: formData.value.front,
          back: formData.value.back,
          tags: selectedTags.value,
          ...(originalCardData.value?.audio && !audioFile.value
            ? { audio: originalCardData.value.audio }
            : {}),
        }

        await cardApi.updateCard(cardId, updateData)
      }

      router.push(`/app/decks/${formData.value.deck}`)
    } else {
      // === 新建模式 ===
      if (hasFiles) {
        // 使用 FormData
        const formDataToSend = new FormData()

        // 添加文本字段
        formDataToSend.append('deck', formData.value.deck)
        formDataToSend.append('front', formData.value.front)
        formDataToSend.append('back', JSON.stringify({ content: formData.value.back.content }))

        if (selectedTags.value.length > 0) {
          formDataToSend.append('tags', JSON.stringify(selectedTags.value))
        }

        // 添加文件
        if (imageFile.value) {
          formDataToSend.append('image', imageFile.value)
        }

        if (audioFile.value) {
          formDataToSend.append('audio', audioFile.value)
        }

        // 一次性提交
        await cardApi.createCard(formDataToSend)
      } else {
        // 沒有文件，使用 JSON
        const cardData: CreateCardRequest = {
          deck: formData.value.deck,
          front: formData.value.front,
          back: formData.value.back,
          tags: selectedTags.value,
        }

        await cardStore.createCard(cardData)
      }

      // 跳轉到卡組詳情頁
      router.push(`/app/decks/${formData.value.deck}`)
    }
  } catch (err: unknown) {
    error.value =
      err instanceof Error ? err.message : isEditMode.value ? '更新卡片失敗' : '建立卡片失敗'
    console.error('Submit failed:', err)
  } finally {
    loading.value = false
  }
}

// 重製表單（編輯模式）
const handleReset = () => {
  if (!originalCardData.value) return

  const card = originalCardData.value

  formData.value = {
    deck: card.deck,
    front: card.front,
    back: { content: card.back.content },
    tags: card.tags,
  }

  selectedTags.value = card.tags || []

  // 重置圖片
  clearImage()
  if (card.back.image?.url) {
    imagePreview.value = card.back.image.url
  }

  // 重置音檔
  clearUploadedAudio()
  if (card.audio?.url) {
    audioPreview.value = card.audio.url
  }

  clearAudio()
  nextTick(() => autoResize())
}

const handleCancel = () => {
  if (isEditMode.value && formData.value.deck) {
    router.push(`/app/decks/${formData.value.deck}`)
  } else {
    router.back()
  }
}

// 組件銷毀時清理 URL
onUnmounted(() => {
  clearImage()
  clearUploadedAudio()
})
</script>
