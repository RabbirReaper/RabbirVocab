import mongoose, { Schema, Model } from 'mongoose'
import bcrypt from 'bcryptjs'
import { IUser } from './types'

const userSchema = new Schema<IUser>(
  {
    // 基本資訊
    username: {
      type: String,
      required: true,
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

    // 權限角色
    role: {
      type: String,
      enum: ['user', 'pro', 'admin', 'super_admin'],
      default: 'user',
    },

    // 訂閱資訊
    subscription: {
      plan: {
        type: String,
        enum: ['free', 'pro'],
        default: 'free',
      },
      startDate: Date,
      endDate: Date,
      isActive: {
        type: Boolean,
        default: false,
      },
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
