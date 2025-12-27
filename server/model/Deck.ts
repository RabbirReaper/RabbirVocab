import mongoose, { Schema, Model } from 'mongoose';
import { IDeck } from './types';

const deckSchema = new Schema<IDeck>(
  {
    // 基本資訊
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },

    // 擁有者
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // 卡組設定
    settings: {
      newCardsPerDay: {
        type: Number,
        default: 20,
      },
      reviewCardsPerDay: {
        type: Number,
        default: 200,
      },
      isPublic: {
        type: Boolean,
        default: false,
      },
      // FSRS-6 演算法配置（每個牌組可獨立設定）
      srsConfig: {
        // FSRS-6 權重參數（19 個）
        weights: {
          type: [Number],
          default: [0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575, 0.1192, 1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621],
        },
        // 期望保留率 (0.7-0.97)
        desiredRetention: {
          type: Number,
          default: 0.9,
          min: 0.7,
          max: 0.97,
        },
        // 學習步驟（分鐘）
        learningSteps: {
          type: [Number],
          default: [1, 10], // 1分鐘, 10分鐘
        },
        // 重新學習步驟（分鐘）
        relearningSteps: {
          type: [Number],
          default: [10], // 10分鐘
        },
        // 最大間隔天數
        maximumInterval: {
          type: Number,
          default: 36500, // 100年
        },
        // 低效卡閾值
        leechThreshold: {
          type: Number,
          default: 8,
        },
      },
    },

    // 是否已刪除（軟刪除）
    isDeleted: {
      type: Boolean,
      default: false,
    },
  }
);

// 索引
deckSchema.index({ user: 1, isDeleted: 1 }); // ⭐ 查詢用戶的未刪除 deck
deckSchema.index({ user: 1, createdAt: -1 }); // 按創建時間排序

const Deck: Model<IDeck> = mongoose.model<IDeck>('Deck', deckSchema);

export default Deck;
