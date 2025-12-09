import mongoose, { Schema, Model } from 'mongoose'
import { ICard, CardStatus, ISRSConfig } from './types'

const cardSchema = new Schema<ICard>(
  {
    // 所屬卡組
    deck: {
      type: Schema.Types.ObjectId,
      ref: 'Deck',
      required: true,
    },

    // 字卡內容（支援 markdown）
    front: {
      type: String,
      required: true,
      trim: true,
    },

    // 背面內容
    back: {
      image: {
        url: { type: String },
        key: { type: String },
        alt: { type: String },
      },
      content: {
        type: String,
        required: true,
        default: '',
      },
    },

    // 音檔
    audio: {
      url: { type: String },
      key: { type: String },
      duration: { type: Number },
    },

    // 標籤
    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Tag',
      },
    ],

    // 學習狀態
    status: {
      type: String,
      enum: ['new', 'learning', 'review'] as CardStatus[],
      default: 'new',
    },

    // SRS (Spaced Repetition System) 相關欄位
    srs: {
      // 難度係數 (Ease Factor)
      easeFactor: {
        type: Number,
        default: 2.5,
        min: 1.3,
      },

      // 間隔天數
      interval: {
        type: Number,
        default: 0,
      },

      // 重複次數
      repetitions: {
        type: Number,
        default: 0,
      },

      // 下次複習日期
      dueDate: {
        type: Date,
        default: Date.now,
      },

      // 上次複習日期
      lastReviewed: {
        type: Date,
        default: null,
      },

      // 學習步驟（用於新卡片）
      learningStep: {
        type: Number,
        default: 0,
      },

      // 遺忘次數（用於低效卡檢測）
      lapseCount: {
        type: Number,
        default: 0,
      },
    },

    // 複習歷史記錄
    reviewHistory: [
      {
        date: {
          type: Date,
          required: true,
        },
        type: {
          type: String,
          enum: ['learning', 'review', 'relearning'],
          required: true,
        },
        rating: {
          type: Number,
          required: true,
          min: 0,
          max: 3,
        },
        interval: {
          type: Number,
          required: true,
          default: 0,
        },
        easeFactor: {
          type: Number,
          required: false,
        },
        duration: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],

    // 擁有者
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // 是否已刪除（軟刪除）
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

// 索引
cardSchema.index({ user: 1 })

// SM-2 改良版算法計算下次複習時間（使用 Deck 的 SRS 配置）
cardSchema.methods.calculateNextReview = function (
  quality: number,
  config: Required<ISRSConfig>,
  duration: number = 0,
): void {
  // quality: 0-3
  // 0: 完全忘記
  // 1: 正確但困難
  // 2: 正確且容易
  // 3: 完美記得

  const cfg = config

  const now = new Date()
  const isNewOrLearning = this.status === 'new' || this.status === 'learning'

  // 計算與上次複習的時間間隔（秒）
  const intervalSinceLastReview = this.srs.lastReviewed
    ? Math.floor((now.getTime() - this.srs.lastReviewed.getTime()) / 1000)
    : 0

  // 判斷複習類型
  let reviewType: 'learning' | 'review' | 'relearning'
  let currentEaseFactor: number | undefined

  if (quality === 0) {
    // 完全忘記
    reviewType = 'relearning'
    this.srs.lapseCount += 1

    // 檢查是否達到低效卡臨界值
    if (this.srs.lapseCount >= cfg.leechThreshold) {
      // 自動添加 'leech' 標籤
      if (!this.tags.includes('leech')) {
        this.tags.push('leech')
      }
    }

    // 進入重新學習階段
    this.srs.repetitions = 0
    this.srs.learningStep = 0
    this.status = 'learning'

    // 使用重新學習步驟的第一步
    const nextStep = cfg.relearningSteps[0]
    this.srs.dueDate = new Date(now.getTime() + nextStep * 60 * 1000)
  } else if (isNewOrLearning) {
    // 在學習階段
    reviewType = 'learning'
    const steps = cfg.learningSteps
    const currentStep = this.srs.learningStep

    if (quality === 3) {
      // 按「完美記得」，直接畢業並使用簡單間隔
      this.srs.interval = cfg.easyInterval
      this.srs.repetitions = 1
      this.status = 'review'
      this.srs.dueDate = new Date(now.getTime() + cfg.easyInterval * 24 * 60 * 60 * 1000)
      // 學習階段按「完美記得」時記錄 easeFactor
      currentEaseFactor = this.srs.easeFactor
    } else if (currentStep < steps.length - 1) {
      // 進入下一個學習步驟
      this.srs.learningStep += 1
      const nextStepMinutes = steps[this.srs.learningStep]
      this.srs.dueDate = new Date(now.getTime() + nextStepMinutes * 60 * 1000)
    } else {
      // 完成所有學習步驟，畢業
      this.srs.interval = cfg.graduatingInterval
      this.srs.repetitions = 1
      this.status = 'review'
      this.srs.dueDate = new Date(now.getTime() + cfg.graduatingInterval * 24 * 60 * 60 * 1000)
      // 學習最後階段畢業時記錄 easeFactor
      currentEaseFactor = this.srs.easeFactor
    }
  } else {
    // 複習階段
    reviewType = 'review'
    let newInterval: number

    switch (quality) {
      case 1: // 正確但困難
        newInterval = Math.round(this.srs.interval * cfg.hardInterval)
        this.srs.easeFactor -= 0.15
        break
      case 2: // 正確且容易
        newInterval = Math.round(this.srs.interval * this.srs.easeFactor)
        break
      case 3: // 完美記得
        newInterval = Math.round(this.srs.interval * this.srs.easeFactor * cfg.easyBonus)
        this.srs.easeFactor += 0.1
        break
      default:
        newInterval = Math.round(this.srs.interval * this.srs.easeFactor)
    }

    // 應用最短間隔限制
    if (newInterval < cfg.minimumInterval) {
      newInterval = cfg.minimumInterval
    }

    this.srs.interval = newInterval
    this.srs.repetitions += 1

    // 限制 easeFactor 範圍
    if (this.srs.easeFactor < cfg.minEaseFactor) {
      this.srs.easeFactor = cfg.minEaseFactor
    }
    if (this.srs.easeFactor > cfg.maxEaseFactor) {
      this.srs.easeFactor = cfg.maxEaseFactor
    }

    // 設定下次複習日期
    this.srs.dueDate = new Date(now.getTime() + this.srs.interval * 24 * 60 * 60 * 1000)

    // 複習階段保持 review 狀態
    this.status = 'review'

    // 複習階段一定有 easeFactor
    currentEaseFactor = this.srs.easeFactor
  }

  this.srs.lastReviewed = now

  // 記錄到複習歷史
  this.reviewHistory.push({
    date: now,
    type: reviewType,
    rating: quality,
    interval: intervalSinceLastReview,
    easeFactor: currentEaseFactor,
    duration: duration,
  })
}

// 檢查是否到期需要複習
cardSchema.methods.isDue = function (): boolean {
  return this.srs.dueDate <= new Date()
}

// 檢查是否為低效卡（根據遺忘次數）
cardSchema.methods.isLeech = function (threshold: number = 8): boolean {
  return this.srs.lapseCount >= threshold
}

const Card: Model<ICard> = mongoose.model<ICard>('Card', cardSchema)

export default Card
