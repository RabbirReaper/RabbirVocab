import { Document, Types } from 'mongoose';

// ============================================
// FSRS-6 演算法配置
// ============================================
export interface ISRSConfig {
  /**
   * FSRS-6 權重參數（19 個）
   * 用於計算穩定度和難度
   */
  weights?: number[];

  /**
   * 期望的保留率（可提取性目標）
   * 範圍: 0.7 - 0.97
   * 預設: 0.9 (90% 記住率)
   */
  desiredRetention?: number;

  /**
   * 學習步驟（分鐘）
   * 用於新卡片的初始學習階段
   * 預設: [1, 10]
   */
  learningSteps?: number[];

  /**
   * 重新學習步驟（分鐘）
   * 用於遺忘後的重新學習
   * 預設: [10]
   */
  relearningSteps?: number[];

  /**
   * 最大間隔天數
   * 預設: 36500 (100年)
   */
  maximumInterval?: number;

  /**
   * 低效卡閾值
   * 遺忘次數達到此值時標記為低效卡
   * 預設: 8
   */
  leechThreshold?: number;
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

/**
 * FSRS-6 卡片狀態
 */
export interface ICardSRS {
  /**
   * 穩定度（天）
   * 表示記憶的持久性，即可提取性降至期望保留率所需的時間
   */
  stability: number;

  /**
   * 難度 (1-10)
   * 1 = 最簡單, 10 = 最困難
   */
  difficulty: number;

  /**
   * 下次複習日期
   */
  dueDate: Date;

  /**
   * 上次複習日期
   */
  lastReviewed: Date | null;

  /**
   * 學習步驟索引
   * -1 表示已畢業（進入複習階段）
   * >= 0 表示在學習階段
   */
  learningStep: number;

  /**
   * 遺忘次數
   * 用於低效卡檢測
   */
  lapseCount: number;
}

// 複習歷史類型
export type ReviewHistoryType = 'learning' | 'review' | 'relearning';

// 複習歷史記錄
export interface IReviewHistoryEntry {
  date: Date;                    // 複習日期時間
  type: ReviewHistoryType;       // 複習類型：學習/複習/重新學習
  rating: number;                // 評等 (0-3)
  interval: number;              // 與上次複習的時間間隔（秒）
  stability?: number;            // 複習後的穩定度（FSRS-6）
  difficulty?: number;           // 複習後的難度（FSRS-6）
  duration: number;              // 耗時（秒）
}

export interface ICard extends Document {
  _id: Types.ObjectId;
  deck: Types.ObjectId;

  // 卡片內容（使用 markdown）
  front: string;              // 正面：單字
  back: {
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

/**
 * FSRS-6 複習狀態快照
 * 用於記錄複習前後的狀態
 */
export interface IReviewState {
  status: string;
  stability: number;
  difficulty: number;
  learningStep: number;
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
