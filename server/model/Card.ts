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
cardSchema.index({ user: 1, deck: 1, isDeleted: 1 }) // ⭐ 最重要：查詢用戶的卡片
cardSchema.index({ user: 1, deck: 1, status: 1, 'srs.dueDate': 1 }) // 複習查詢
cardSchema.index({ deck: 1, isDeleted: 1 }) // deck 的卡片查詢

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
 * @param quality 評分 (1-4)
 *   1: 完全忘記 (Again)
 *   2: 正確但困難 (Hard)
 *   3: 正確且容易 (Good)
 *   4: 完美記得 (Easy)
 * @param config FSRS 配置
 */
cardSchema.methods.calculateNextReview = function (
  quality: number,
  config: Required<ISRSConfig>,
): void {
  const now = new Date()
  const fsrsConfig = toFSRSConfig(config)

  // 處理新卡片
  if (this.status === 'new') {
    if (quality === 4) {
      // Easy: 直接畢業進入複習階段
      const initialState = createInitialState(quality, fsrsConfig)

      this.srs.stability = initialState.stability
      this.srs.difficulty = initialState.difficulty
      this.srs.dueDate = initialState.dueDate
      this.srs.lastReviewed = now
      this.srs.learningStep = -1
      this.srs.lapseCount = 0
      this.status = 'review'
    } else {
      // Again/Hard/Good: 進入學習階段
      let stepIndex = 0

      // Good: 如果有第二步，直接進入第二步
      if (quality === 3 && fsrsConfig.learningSteps.length > 1) {
        stepIndex = 1
      }
      // Hard/Again: 從第一步開始
      else {
        stepIndex = 0
      }

      const nextDueDate = new Date(now)
      nextDueDate.setMinutes(nextDueDate.getMinutes() + fsrsConfig.learningSteps[stepIndex])

      this.srs.dueDate = nextDueDate
      this.srs.lastReviewed = now
      this.srs.learningStep = stepIndex
      this.srs.lapseCount = quality === 1 ? 1 : 0
      this.srs.stability = 0  // 學習階段暫不設置
      this.srs.difficulty = 5  // 預設中等難度
      this.status = 'learning'
    }
    return
  }

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
  if (quality === 1) {
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

/**
 * 輔助函數：將天數轉換為人類可讀的間隔字符串
 */
function formatInterval(days: number): string {
  if (days < 1) {
    // 小於一天，轉換為分鐘
    const minutes = Math.round(days * 1440)
    if (minutes < 60) {
      return `${minutes}m`
    }
    // 小時
    const hours = Math.round(minutes / 60)
    return `${hours}h`
  }

  // 大於等於一天
  if (days < 2) {
    return `${days.toFixed(1)}d`.replace('.0d', 'd')
  }

  return `${Math.round(days)}d`
}

/**
 * 獲取調度信息（預覽四個按鈕的結果）
 * 此方法不會修改卡片狀態，僅用於預覽
 */
cardSchema.methods.getSchedulingInfo = function (config: Required<ISRSConfig>) {
  const now = new Date()
  const fsrsConfig = toFSRSConfig(config)

  interface SchedulingOption {
    interval: string
    intervalDays: number
    nextState: {
      status: CardStatus
      learningStep: number
      stability: number
      difficulty: number
      dueDate: Date
    }
  }

  const calculateOption = (quality: number): SchedulingOption => {
    // 處理新卡片的特殊邏輯
    if (this.status === 'new') {
      if (quality === 4) {
        // Easy: 直接畢業
        const initialState = createInitialState(quality, fsrsConfig)
        const scheduledDays =
          (initialState.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)

        return {
          interval: formatInterval(scheduledDays),
          intervalDays: scheduledDays,
          nextState: {
            status: 'review',
            learningStep: -1,
            stability: initialState.stability,
            difficulty: initialState.difficulty,
            dueDate: initialState.dueDate,
          },
        }
      } else {
        // Again/Hard/Good: 進入學習階段
        let stepIndex = 0

        // Good: 如果有第二步，直接進入第二步
        if (quality === 3 && fsrsConfig.learningSteps.length > 1) {
          stepIndex = 1
        }

        const nextDueDate = new Date(now)
        nextDueDate.setMinutes(nextDueDate.getMinutes() + fsrsConfig.learningSteps[stepIndex])
        const scheduledDays = fsrsConfig.learningSteps[stepIndex] / 1440

        return {
          interval: formatInterval(scheduledDays),
          intervalDays: scheduledDays,
          nextState: {
            status: 'learning',
            learningStep: stepIndex,
            stability: 0,
            difficulty: 5,
            dueDate: nextDueDate,
          },
        }
      }
    }

    // 學習中或複習中的卡片：使用 FSRS review 函數
    const currentState = {
      stability: this.srs.stability,
      difficulty: this.srs.difficulty,
      learningStep: this.srs.learningStep,
      lapseCount: this.srs.lapseCount,
      dueDate: this.srs.dueDate,
      lastReviewed: this.srs.lastReviewed,
    }

    const result = review(currentState, quality, fsrsConfig)

    // 判斷狀態
    let status: CardStatus
    if (quality === 1 || result.state.learningStep >= 0) {
      status = 'learning'
    } else {
      status = 'review'
    }

    return {
      interval: formatInterval(result.scheduledDays),
      intervalDays: result.scheduledDays,
      nextState: {
        status,
        learningStep: result.state.learningStep,
        stability: result.state.stability,
        difficulty: result.state.difficulty,
        dueDate: result.state.dueDate,
      },
    }
  }

  // 返回四個選項的調度信息
  return {
    currentState: {
      status: this.status,
      learningStep: this.srs.learningStep,
      stability: this.srs.stability,
      difficulty: this.srs.difficulty,
      dueDate: this.srs.dueDate,
    },
    schedulingOptions: {
      again: calculateOption(1),
      hard: calculateOption(2),
      good: calculateOption(3),
      easy: calculateOption(4),
    },
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
