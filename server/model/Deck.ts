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
          default: [
            0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49,
            0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61,
            0.0, 0.0  // FSRS-6 新增的參數
          ],
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
deckSchema.index({ user: 1 });

const Deck: Model<IDeck> = mongoose.model<IDeck>('Deck', deckSchema);

export default Deck;
