import mongoose, { Schema, Model, Types } from 'mongoose';
import { IReview, IReviewModel, ReviewType } from './types';

const reviewSchema = new Schema<IReview>(
  {
    // 關聯資訊
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    card: {
      type: Schema.Types.ObjectId,
      ref: 'Card',
      required: true,
    },
    deck: {
      type: Schema.Types.ObjectId,
      ref: 'Deck',
      required: true,
    },

    // 複習資訊
    quality: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
    },

    // 回答時間（秒）
    timeSpent: {
      type: Number,
      required: true,
      min: 0,
    },

    // 複習前的狀態
    beforeReview: {
      status: String,
      easeFactor: Number,
      interval: Number,
      repetitions: Number,
    },

    // 複習後的狀態
    afterReview: {
      status: String,
      easeFactor: Number,
      interval: Number,
      repetitions: Number,
      nextDueDate: Date,
    },

    // 複習類型
    reviewType: {
      type: String,
      enum: ['new', 'learning', 'review', 'relearning'] as ReviewType[],
      required: true,
    },

    // 是否答對
    isCorrect: {
      type: Boolean,
      required: true,
    },

    // 複習日期
    reviewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// 索引
reviewSchema.index({ user: 1 });

// 靜態方法：獲取用戶學習統計
reviewSchema.statics.getUserStats = async function (
  userId: Types.ObjectId,
  startDate: Date,
  endDate: Date
) {
  const stats = await this.aggregate([
    {
      $match: {
        user: new Types.ObjectId(userId),
        reviewedAt: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$reviewedAt' },
        },
        totalReviews: { $sum: 1 },
        correctReviews: {
          $sum: { $cond: ['$isCorrect', 1, 0] },
        },
        totalTime: { $sum: '$timeSpent' },
        avgQuality: { $avg: '$quality' },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  return stats;
};

// 靜態方法：獲取卡組學習統計
reviewSchema.statics.getDeckStats = async function (
  deckId: Types.ObjectId,
  startDate: Date,
  endDate: Date
) {
  const stats = await this.aggregate([
    {
      $match: {
        deck: new Types.ObjectId(deckId),
        reviewedAt: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        correctReviews: {
          $sum: { $cond: ['$isCorrect', 1, 0] },
        },
        totalTime: { $sum: '$timeSpent' },
        avgQuality: { $avg: '$quality' },
        uniqueCards: { $addToSet: '$card' },
      },
    },
    {
      $project: {
        _id: 0,
        totalReviews: 1,
        correctReviews: 1,
        totalTime: 1,
        avgQuality: 1,
        uniqueCardsCount: { $size: '$uniqueCards' },
        accuracy: {
          $multiply: [{ $divide: ['$correctReviews', '$totalReviews'] }, 100],
        },
      },
    },
  ]);

  return (
    stats[0] || {
      totalReviews: 0,
      correctReviews: 0,
      totalTime: 0,
      avgQuality: 0,
      uniqueCardsCount: 0,
      accuracy: 0,
    }
  );
};

const Review: Model<IReview> & IReviewModel = mongoose.model<
  IReview,
  Model<IReview> & IReviewModel
>('Review', reviewSchema);

export default Review;
