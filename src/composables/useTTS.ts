// composables/useTTS.ts
import { ref } from 'vue'
import { EdgeTTS } from '@andresaya/edge-tts'

export function useTTS() {
  const isPlaying = ref(false)

  /**
   * 使用 Edge TTS 播放文字
   * @param text 要播放的文字
   * @param voice 語音選項（預設為英文女聲）
   */
  async function playEdgeTTS(text: string, voice: string = 'en-US-JennyNeural') {
    try {
      const tts = new EdgeTTS()

      // 合成語音
      await tts.synthesize(text, voice, {
        rate: '+10%', // 10% 加速
        pitch: '+0Hz',
        volume: '+0%'
      })

      // 取得音訊數據 Buffer 並轉換為 Blob
      const audioBuffer = tts.toBuffer()
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' })
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)

      return new Promise<void>((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl)
          resolve()
        }
        audio.onerror = (event) => {
          URL.revokeObjectURL(audioUrl)
          reject(new Error('音訊播放失敗'))
        }
        audio.play().catch(reject)
      })
    } catch (err) {
      console.error('Edge TTS 失敗:', err)
      throw err
    }
  }

  /**
   * 使用 Web Speech API 播放文字
   * @param text 要播放的文字
   * @param lang 語言代碼（預設為美式英文）
   */
  function playWebSpeech(text: string, lang: string = 'en-US') {
    if (!('speechSynthesis' in window)) {
      throw new Error('您的瀏覽器不支援語音播放功能')
    }

    return new Promise<void>((resolve, reject) => {
      // 停止任何正在播放的語音
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = lang
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 1

      utterance.onend = () => resolve()
      utterance.onerror = (event) => {
        reject(new Error(`語音播放失敗: ${event.error}`))
      }

      window.speechSynthesis.speak(utterance)
    })
  }

  /**
   * 播放 TTS（自動降級）
   * 優先使用 Edge TTS，失敗時自動切換到 Web Speech API
   * @param text 要播放的文字
   * @param lang 語言代碼（預設為美式英文）
   */
  async function playTTS(text: string, lang: string = 'en-US') {
    if (!text || text.trim() === '') {
      throw new Error('請輸入要播放的文字')
    }

    isPlaying.value = true

    try {
      // 方案 1: 嘗試使用 Edge TTS（音質更好）
      try {
        console.log('嘗試使用 Edge TTS 播放...')
        await playEdgeTTS(text, `${lang}-JennyNeural`)
        console.log('✓ Edge TTS 播放成功')
      } catch (edgeError) {
        // 方案 2: 降級到 Web Speech API
        console.warn('Edge TTS 失敗，切換到 Web Speech API:', edgeError)
        await playWebSpeech(text, lang)
        console.log('✓ Web Speech API 播放成功')
      }
    } catch (err) {
      console.error('TTS 播放失敗:', err)
      throw err
    } finally {
      isPlaying.value = false
    }
  }

  return {
    playTTS,
    isPlaying,
    // 也匯出單獨的方法供進階使用
    playEdgeTTS,
    playWebSpeech
  }
}
