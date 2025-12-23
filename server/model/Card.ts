import mongoose, { Schema, Model } from 'mongoose'
import { ICard, CardStatus, ISRSConfig } from './types'
import { review, createInitialState, IFSRSConfig, DEFAULT_FSRS_CONFIG } from '../utils/fsrs-algorithm'

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

    // FSRS-6 狀態
    srs: {
      // 穩定度（天）
      stability: {
        type: Number,
        default: 0,
      },

      // 難度 (1-10)
      difficulty: {
        type: Number,
        default: 5,
        min: 1,
        max: 10,
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

      // 學習步驟（-1 表示已畢業）
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
cardSchema.index({ deck: 1, status: 1 })
cardSchema.index({ deck: 1, status: 1, 'srs.dueDate': 1 })
cardSchema.index({ 'srs.dueDate': 1 })

/**
 * 將 ISRSConfig 轉換為 IFSRSConfig
 * 補充預設值
 */
function toFSRSConfig(config: Required<ISRSConfig>): IFSRSConfig {
  return {
    weights: config.weights || DEFAULT_FSRS_CONFIG.weights,
    desiredRetention: config.desiredRetention || DEFAULT_FSRS_CONFIG.desiredRetention,
    learningSteps: config.learningSteps || DEFAULT_FSRS_CONFIG.learningSteps,
    relearningSteps: config.relearningSteps || DEFAULT_FSRS_CONFIG.relearningSteps,
    maximumInterval: config.maximumInterval || DEFAULT_FSRS_CONFIG.maximumInterval,
    leechThreshold: config.leechThreshold || DEFAULT_FSRS_CONFIG.leechThreshold,
  }
}

/**
 * FSRS-6 算法計算下次複習時間
 *
 * @param quality 評分 (0-3)
 *   0: 完全忘記 (Again)
 *   1: 正確但困難 (Hard)
 *   2: 正確且容易 (Good)
 *   3: 完美記得 (Easy)
 * @param config FSRS 配置
 * @param duration 複習耗時（秒）
 */
cardSchema.methods.calculateNextReview = function (
  quality: number,
  config: Required<ISRSConfig>,
  duration: number = 0,
): void {
  const now = new Date()
  const fsrsConfig = toFSRSConfig(config)

  // 處理新卡片
  if (this.status === 'new') {
    // 創建初始狀態
    const initialState = createInitialState(quality, fsrsConfig)

    // 更新卡片狀態
    this.srs.stability = initialState.stability
    this.srs.difficulty = initialState.difficulty
    this.srs.dueDate = initialState.dueDate
    this.srs.lastReviewed = now
    this.srs.learningStep = initialState.learningStep
    this.srs.lapseCount = quality === 0 ? 1 : 0

    // 設定學習狀態
    if (initialState.learningStep === -1) {
      // 直接畢業（評分為 Easy 時）
      this.status = 'review'
    } else {
      this.status = 'learning'
    }
  } else {
    // 使用 FSRS 複習算法
    const currentState = {
      stability: this.srs.stability,
      difficulty: this.srs.difficulty,
      learningStep: this.srs.learningStep,
      lapseCount: this.srs.lapseCount,
      dueDate: this.srs.dueDate,
      lastReviewed: this.srs.lastReviewed,
    }

    const result = review(currentState, quality, fsrsConfig)

    // 更新卡片狀態
    this.srs.stability = result.state.stability
    this.srs.difficulty = result.state.difficulty
    this.srs.dueDate = result.state.dueDate
    this.srs.lastReviewed = now
    this.srs.learningStep = result.state.learningStep
    this.srs.lapseCount = result.state.lapseCount

    // 判斷複習類型和卡片狀態
    if (quality === 0) {
      this.status = 'learning'

      // 檢查是否達到低效卡臨界值
      if (this.srs.lapseCount >= fsrsConfig.leechThreshold) {
        // TODO: 自動添加 'leech' 標籤
        // 需要在 Tag model 實作後處理
      }
    } else if (result.state.learningStep >= 0) {
      this.status = 'learning'
    } else {
      this.status = 'review'
    }
  }
}

/**
 * 檢查是否到期需要複習
 */
cardSchema.methods.isDue = function (): boolean {
  return this.srs.dueDate <= new Date()
}

/**
 * 檢查是否為低效卡（根據遺忘次數）
 */
cardSchema.methods.isLeech = function (threshold: number = 8): boolean {
  return this.srs.lapseCount >= threshold
}

const Card: Model<ICard> = mongoose.model<ICard>('Card', cardSchema)

export default Card
