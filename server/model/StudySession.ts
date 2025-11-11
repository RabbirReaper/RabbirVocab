import mongoose, { Schema, Model, Types } from 'mongoose';
import { IStudySession, IStudySessionModel, SessionType } from './types';

const studySessionSchema = new Schema<IStudySession>(
  {
    // 使用者
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // 卡組
    deck: {
      type: Schema.Types.ObjectId,
      ref: 'Deck',
      required: true,
    },

    // 會話開始和結束時間
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endTime: {
      type: Date,
      default: null,
    },

    // 會話統計
    stats: {
      // 複習的卡片
      cardsReviewed: {
        type: Number,
        default: 0,
      },

      // 新學習的卡片
      newCardsLearned: {
        type: Number,
        default: 0,
      },

      // 答對數
      correctAnswers: {
        type: Number,
        default: 0,
      },

      // 答錯數
      wrongAnswers: {
        type: Number,
        default: 0,
      },

      // 總學習時間（秒）
      totalTime: {
        type: Number,
        default: 0,
      },

      // 平均每卡時間（秒）
      averageTimePerCard: {
        type: Number,
        default: 0,
      },
    },

    // 複習的卡片ID列表
    reviewedCards: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Card',
      },
    ],

    // 會話類型
    sessionType: {
      type: String,
      enum: ['regular', 'cram', 'custom'] as SessionType[],
      default: 'regular',
    },

    // 是否完成
    isCompleted: {
      type: Boolean,
      default: false,
    },

    // 裝置資訊
    device: {
      type: String,
      default: 'web',
    },
  },
  {
    timestamps: true,
  }
);

// 索引
studySessionSchema.index({ user: 1 });

// 計算準確率
studySessionSchema.virtual('accuracy').get(function () {
  const total = this.stats.correctAnswers + this.stats.wrongAnswers;
  if (total === 0) return 0;
  return (this.stats.correctAnswers / total) * 100;
});

// 完成學習會話
studySessionSchema.methods.completeSession = function (): Promise<IStudySession> {
  this.endTime = new Date();
  this.isCompleted = true;

  if (this.stats.cardsReviewed > 0) {
    this.stats.averageTimePerCard =
      this.stats.totalTime / this.stats.cardsReviewed;
  }

  return this.save();
};

// 添加複習記錄
studySessionSchema.methods.addReview = function (
  cardId: Types.ObjectId,
  isCorrect: boolean,
  timeSpent: number,
  isNewCard: boolean = false
): void {
  this.reviewedCards.push(cardId);
  this.stats.cardsReviewed += 1;
  this.stats.totalTime += timeSpent;

  if (isNewCard) {
    this.stats.newCardsLearned += 1;
  }

  if (isCorrect) {
    this.stats.correctAnswers += 1;
  } else {
    this.stats.wrongAnswers += 1;
  }
};

// 靜態方法：獲取用戶的學習時間統計
studySessionSchema.statics.getStudyTimeStats = async function (
  userId: Types.ObjectId,
  days: number = 7
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const stats = await this.aggregate([
    {
      $match: {
        user: new Types.ObjectId(userId),
        startTime: { $gte: startDate },
        isCompleted: true,
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$startTime' },
        },
        totalTime: { $sum: '$stats.totalTime' },
        cardsReviewed: { $sum: '$stats.cardsReviewed' },
        sessions: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  return stats;
};

const StudySession: Model<IStudySession> & IStudySessionModel = mongoose.model<
  IStudySession,
  Model<IStudySession> & IStudySessionModel
>('StudySession', studySessionSchema);

export default StudySession;
