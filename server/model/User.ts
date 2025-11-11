import mongoose, { Schema, Model } from 'mongoose'
import bcrypt from 'bcryptjs'
import { IUser } from './types'

const userSchema = new Schema<IUser>(
  {
    // 基本資訊
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    // 個人資料
    displayName: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
      default: null,
    },

    // 學習設定
    studySettings: {
      newCardsPerDay: {
        type: Number,
        default: 20,
      },
      reviewCardsPerDay: {
        type: Number,
        default: 200,
      },
      easyInterval: {
        type: Number,
        default: 60, // 天
      },
      graduatingInterval: {
        type: Number,
        default: 15, // 天
      },
      // SRS 演算法配置（可由前端調整）
      srsConfig: {
        learningSteps: {
          type: [Number],
          default: [15, 1440, 8640], // 15分鐘, 1天, 6天
        },
        graduatingInterval: {
          type: Number,
          default: 15,
        },
        easyInterval: {
          type: Number,
          default: 60,
        },
        relearningSteps: {
          type: [Number],
          default: [20], // 20分鐘
        },
        minimumInterval: {
          type: Number,
          default: 2,
        },
        leechThreshold: {
          type: Number,
          default: 8,
        },
        easyBonus: {
          type: Number,
          default: 1.3,
        },
        hardInterval: {
          type: Number,
          default: 1.2,
        },
        minEaseFactor: {
          type: Number,
          default: 1.3,
        },
        maxEaseFactor: {
          type: Number,
          default: 2.5,
        },
      },
    },

    // 統計資訊
    stats: {
      totalCards: {
        type: Number,
        default: 0,
      },
      cardsLearned: {
        type: Number,
        default: 0,
      },
      totalReviews: {
        type: Number,
        default: 0,
      },
      studyStreak: {
        type: Number,
        default: 0,
      },
      lastStudyDate: {
        type: Date,
        default: null,
      },
    },

    // 帳號狀態
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

// 密碼加密
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error as Error)
  }
})

// 密碼驗證方法
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password)
}

// 更新學習統計
userSchema.methods.updateStudyStats = function (): void {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const lastStudy = this.stats.lastStudyDate
  if (lastStudy) {
    lastStudy.setHours(0, 0, 0, 0)
    const daysDiff = Math.floor((today.getTime() - lastStudy.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff === 1) {
      this.stats.studyStreak += 1
    } else if (daysDiff > 1) {
      this.stats.studyStreak = 1
    }
  } else {
    this.stats.studyStreak = 1
  }

  this.stats.lastStudyDate = new Date()
}

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema)

export default User
