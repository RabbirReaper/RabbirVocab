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
    },

    // 統計資訊
    stats: {
      totalCards: {
        type: Number,
        default: 0,
      },
      newCards: {
        type: Number,
        default: 0,
      },
      learningCards: {
        type: Number,
        default: 0,
      },
      reviewCards: {
        type: Number,
        default: 0,
      },
      masteredCards: {
        type: Number,
        default: 0,
      },
    },

    // 標籤
    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    // 封面圖片
    coverImage: {
      type: String,
      default: null,
    },

    // 顏色主題
    color: {
      type: String,
      default: '#4CAF50',
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

// 更新卡組統計
deckSchema.methods.updateStats = async function (): Promise<void> {
  const Card = mongoose.model('Card');

  const stats = await Card.aggregate([
    { $match: { deck: this._id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  this.stats.totalCards = 0;
  this.stats.newCards = 0;
  this.stats.learningCards = 0;
  this.stats.reviewCards = 0;
  this.stats.masteredCards = 0;

  stats.forEach((stat) => {
    this.stats.totalCards += stat.count;
    switch (stat._id) {
      case 'new':
        this.stats.newCards = stat.count;
        break;
      case 'learning':
        this.stats.learningCards = stat.count;
        break;
      case 'review':
        this.stats.reviewCards = stat.count;
        break;
      case 'mastered':
        this.stats.masteredCards = stat.count;
        break;
    }
  });

  await this.save();
};

const Deck: Model<IDeck> = mongoose.model<IDeck>('Deck', deckSchema);

export default Deck;
