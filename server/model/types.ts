import { Document, Types } from 'mongoose';

// ============================================
// SRS 演算法配置（可選，用於自訂算法參數）
// ============================================
export interface ISRSConfig {
  // 學習階段（分鐘）
  learningSteps?: number[];          // 預設 [15, 1440, 8640] (15m, 1d, 6d)
  graduatingInterval?: number;       // 畢業間隔（天），預設 15
  easyInterval?: number;             // 簡單間隔（天），預設 60

  // 遺忘設定
  relearningSteps?: number[];        // 重新學習階段（分鐘），預設 [20]
  minimumInterval?: number;          // 最短間隔（天），預設 2
  leechThreshold?: number;           // 低效卡臨界值，預設 8

  // 間隔修飾符
  easyBonus?: number;                // 容易加成，預設 1.3
  hardInterval?: number;             // 困難間隔倍數，預設 1.2

  // 難度係數
  minEaseFactor?: number;            // 最小難度係數，預設 1.3
  maxEaseFactor?: number;            // 最大難度係數，預設 2.5
}

// ============================================
// User 相關類型
// ============================================
export type UserRole = 'user' | 'pro' | 'admin' | 'super_admin';

export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  password: string;
  stats: {
    totalCards: number;
    cardsLearned: number;
    totalReviews: number;
    studyStreak: number;
    lastStudyDate?: Date;
  };
  isActive: boolean;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;

  // 權限角色
  role: UserRole;

  // 訂閱資訊（如果需要付費功能）
  subscription?: {
    plan: 'free' | 'pro';
    startDate?: Date;
    endDate?: Date;
    isActive: boolean;
  };

  // AI 使用額度（可選）
  aiQuota?: {
    daily: {               // 日額度（free 用戶使用）
      limit: number;       // 每日額度上限
      used: number;        // 已使用
      resetDate: Date;     // 重置日期（隔天 00:00）
    };
    monthly: {             // 月額度（pro 用戶使用）
      limit: number;       // 每月額度上限
      used: number;        // 已使用
      resetDate: Date;     // 重置日期（下個月 1 號）
    };
  };

  // 方法
  comparePassword(candidatePassword: string): Promise<boolean>;
  updateStudyStats(): void;
}

// ============================================
// Deck 相關類型
// ============================================
export interface IDeck extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  user: Types.ObjectId;
  settings: {
    newCardsPerDay: number;
    reviewCardsPerDay: number;
    isPublic: boolean;
    // SRS 演算法參數（可由前端調整，每個牌組獨立設定）
    srsConfig?: ISRSConfig;
  };
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Card 相關類型
// ============================================
export type CardStatus = 'new' | 'learning' | 'review';

// 圖片資訊
export interface ICardImage {
  url: string;      // R2 公網地址
  key: string;      // R2 object key（用於刪除）
  alt?: string;     // img alt 屬性
}

// 音檔資訊
export interface ICardAudio {
  url: string;      // R2 公網地址
  key: string;      // R2 object key
  duration?: number; // 音檔長度（秒）
}

export interface ICardSRS {
  easeFactor: number;
  interval: number;
  repetitions: number;
  dueDate: Date;
  lastReviewed?: Date;
  learningStep: number;
  lapseCount: number;           // 遺忘次數（用於低效卡檢測）
}

// 複習歷史類型
export type ReviewHistoryType = 'learning' | 'review' | 'relearning';

// 複習歷史記錄
export interface IReviewHistoryEntry {
  date: Date;                    // 複習日期時間
  type: ReviewHistoryType;       // 複習類型：學習/複習/重新學習
  rating: number;                // 評等 (0-3)
  interval: number;              // 與上次複習的時間間隔（秒）
  easeFactor?: number;           // 輕鬆度（學習階段可為空，學習最後一階段會有）
  duration: number;              // 耗時（秒）
}

export interface ICard extends Document {
  _id: Types.ObjectId;
  deck: Types.ObjectId;

  // 卡片內容（使用 markdown）
  front: string;              // 正面：單字
  back: {
    word: string;             // 單字
    image?: ICardImage;       // 圖片
    content: string;          // 內容說明（markdown）
  };

  // 多媒體
  audio?: ICardAudio;         // 音檔

  tags: Types.ObjectId[];
  status: CardStatus;
  srs: ICardSRS;
  reviewHistory: IReviewHistoryEntry[];  // 複習歷史記錄
  user: Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;

  // 方法（使用 Deck 的 SRS 配置）
  calculateNextReview(quality: number, config: Required<ISRSConfig>, duration?: number): void;
  isDue(): boolean;
  isLeech(threshold?: number): boolean;
}

// ============================================
// Review 相關類型
// ============================================
export type ReviewType = 'new' | 'learning' | 'review' | 'relearning';

export interface IReviewState {
  status: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextDueDate?: Date;
}

export interface IReview extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  card: Types.ObjectId;
  deck: Types.ObjectId;
  quality: number;
  timeSpent: number;
  beforeReview: IReviewState;
  afterReview: IReviewState;
  reviewType: ReviewType;
  isCorrect: boolean;
  reviewedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReviewModel {
  getUserStats(
    userId: Types.ObjectId,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{
    _id: string;
    totalReviews: number;
    correctReviews: number;
    totalTime: number;
    avgQuality: number;
  }>>;
  
  getDeckStats(
    deckId: Types.ObjectId,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalReviews: number;
    correctReviews: number;
    totalTime: number;
    avgQuality: number;
    uniqueCardsCount: number;
    accuracy: number;
  }>;
}

// ============================================
// StudySession 相關類型
// ============================================
export type SessionType = 'regular' | 'cram' | 'custom';

export interface IStudySessionStats {
  cardsReviewed: number;
  newCardsLearned: number;
  correctAnswers: number;
  wrongAnswers: number;
  totalTime: number;
  averageTimePerCard: number;
}

export interface IStudySession extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  deck: Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  stats: IStudySessionStats;
  reviewedCards: Types.ObjectId[];
  sessionType: SessionType;
  isCompleted: boolean;
  device: string;
  createdAt: Date;
  updatedAt: Date;
  accuracy: number; // virtual
  
  // 方法
  completeSession(): Promise<IStudySession>;
  addReview(cardId: Types.ObjectId, isCorrect: boolean, timeSpent: number, isNewCard?: boolean): void;
}

export interface IStudySessionModel {
  getStudyTimeStats(
    userId: Types.ObjectId,
    days?: number
  ): Promise<Array<{
    _id: string;
    totalTime: number;
    cardsReviewed: number;
    sessions: number;
  }>>;
}

// ============================================
// Tag 相關類型
// ============================================
export interface ITag extends Document {
  _id: Types.ObjectId;
  name: string;
  color: string;
  description?: string;
  user: Types.ObjectId;
  usageCount: number;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;

  // 方法
  incrementUsage(): Promise<ITag>;
  decrementUsage(): Promise<ITag | undefined>;
}

export interface ITagModel {
  getPopularTags(limit?: number): Promise<ITag[]>;
}
