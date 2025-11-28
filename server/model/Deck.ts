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
      // SRS 演算法配置（每個牌組可獨立設定）
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

    // 是否已刪除（軟刪除）
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// 索引
deckSchema.index({ user: 1 });

const Deck: Model<IDeck> = mongoose.model<IDeck>('Deck', deckSchema);

export default Deck;
