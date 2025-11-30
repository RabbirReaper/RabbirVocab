<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- 頁面標題 -->
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bold text-primary-color">新增卡片</h1>
      <button @click="handleCancel" class="text-secondary-color hover:underline">← 返回</button>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- 1. 所屬卡組 -->
      <div class="card">
        <label class="block text-sm font-medium text-secondary-color mb-2">所屬卡組 *</label>
        <select
          v-model="formData.deck"
          required
          class="w-full px-4 py-2 border border-primary-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">請選擇卡組</option>
          <option v-for="deck in deckStore.decks" :key="deck.id" :value="deck.id">
            {{ deck.name }}
          </option>
        </select>
      </div>

      <!-- 2. 正面 -->
      <div class="card">
        <h2 class="text-xl font-bold text-primary-color mb-4">正面</h2>
        <div class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-secondary-color mb-2">單字 *</label>
            <div class="flex space-x-2">
              <input
                v-model="formData.front"
                type="text"
                required
                class="flex-1 px-4 py-2 border border-primary-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="例如：apple"
              />
              <button
                type="button"
                @click="playTTS"
                :disabled="isTTSPlaying"
                class="btn btn-secondary px-6"
                :class="{ 'opacity-50 cursor-not-allowed': isTTSPlaying }"
                title="播放發音"
              >
                {{ isTTSPlaying ? '🔊 播放中...' : '🔊 播放' }}
              </button>
            </div>
            <p class="text-xs text-tertiary-color mt-1">
              <!-- TODO: 未來支援音檔上傳（Cloudflare R2） -->
              優先使用 Edge TTS（高品質），備援使用 Web Speech API，未來支援自訂音檔上傳
            </p>
          </div>
        </div>
      </div>

      <!-- 3. 背面 -->
      <div class="card">
        <h2 class="text-xl font-bold text-primary-color mb-4">背面</h2>
        <div class="space-y-4">
          <!-- 3.1 單字 -->
          <div>
            <label class="block text-sm font-medium text-secondary-color mb-2">單字 *</label>
            <input
              v-model="formData.back.word"
              type="text"
              required
              class="w-full px-4 py-2 border border-primary-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="例如：蘋果"
            />
          </div>

          <!-- 3.2 內容說明 -->
          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="block text-sm font-medium text-secondary-color">
                內容說明（Markdown）*
              </label>
              <button type="button" @click="generateWithAI" class="btn btn-sm btn-secondary">
                ✨ AI 生成
              </button>
            </div>
            <textarea
              v-model="formData.back.content"
              rows="8"
              required
              class="w-full px-4 py-2 border border-primary-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
              placeholder="# 例句&#10;- An apple a day keeps the doctor away.&#10;&#10;# 詞性&#10;n. 名詞&#10;&#10;# 補充&#10;複數形式：apples"
            ></textarea>
            <p class="text-xs text-tertiary-color mt-1">
              支援 Markdown 格式，製作階段不需要渲染，背誦時才會顯示格式化內容
            </p>
          </div>

          <!-- 3.3 圖片 -->
          <div>
            <label class="block text-sm font-medium text-secondary-color mb-2">圖片</label>
            <div
              class="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center"
            >
              <div class="text-4xl mb-2">🖼️</div>
              <p class="text-secondary-color">圖片上傳功能開發中</p>
              <p class="text-xs text-tertiary-color mt-2">
                <!-- TODO: 未來支援圖片上傳（Cloudflare R2） -->
                未來將支援圖片上傳至 Cloudflare R2
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. 音檔 -->
      <div class="card">
        <h2 class="text-xl font-bold text-primary-color mb-4">音檔</h2>
        <div
          class="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center"
        >
          <div class="text-4xl mb-2">🎵</div>
          <p class="text-secondary-color">音檔上傳功能開發中</p>
          <p class="text-xs text-tertiary-color mt-2">
            <!-- TODO: 未來支援音檔上傳（Cloudflare R2） -->
            未來將支援音檔上傳至 Cloudflare R2
          </p>
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
      <div class="flex space-x-4">
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
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDeckStore } from '@/stores/deck'
import { useCardStore } from '@/stores/card'
import { useTTS } from '@/composables/useTTS'
import type { CreateCardRequest } from '@/api/types'

const router = useRouter()
const route = useRoute()
const deckStore = useDeckStore()
const cardStore = useCardStore()
const { playTTS: playTTSAudio, isPlaying: isTTSPlaying } = useTTS()

// 表單資料
const formData = ref<CreateCardRequest>({
  deck: (route.query.deck as string) || '',
  front: '',
  back: {
    word: '',
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

// 載入卡組列表
onMounted(async () => {
  if (deckStore.decks.length === 0) {
    await deckStore.fetchDecks()
  }
})

// TTS 播放 - 使用 composable（自動降級：Edge TTS → Web Speech API）
const playTTS = async () => {
  if (!formData.value.front) {
    alert('請先輸入單字')
    return
  }

  try {
    await playTTSAudio(formData.value.front, 'en-US')
  } catch (err) {
    console.error('TTS 播放失敗:', err)
    alert(err instanceof Error ? err.message : '播放失敗，請稍後再試')
  }
}

// AI 生成（佔位功能）
const generateWithAI = () => {
  alert('AI 生成功能開發中，敬請期待！')
  // TODO: 未來整合 AI API
  // 預期功能：根據 formData.value.front 調用 AI API 生成背面內容
  // const response = await api.ai.generateCardContent({ word: formData.value.front })
  // formData.value.back.content = response.content
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

// 表單提交
const handleSubmit = async () => {
  loading.value = true
  error.value = null

  try {
    // TODO: 標籤目前為字串陣列，未來需要轉換為 Tag ObjectId
    const cardData: CreateCardRequest = {
      deck: formData.value.deck,
      front: formData.value.front,
      back: formData.value.back,
      tags: selectedTags.value, // 字串陣列符合 CreateCardRequest 類型
    }

    await cardStore.createCard(cardData)

    // 跳轉到卡組詳情頁
    router.push(`/app/decks/${formData.value.deck}`)
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : '建立卡片失敗'
    console.error('建立卡片失敗:', err)
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  router.back()
}
</script>
