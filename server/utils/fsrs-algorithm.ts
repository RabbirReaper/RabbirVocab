/**
 * FSRS-6 Algorithm Implementation
 * Free Spaced Repetition Scheduler v6
 *
 * 核心概念：
 * - Stability (S): 記憶穩定度，表示可提取性降至指定閾值所需的時間（天）
 * - Difficulty (D): 卡片難度，範圍 1-10
 * - Retrievability (R): 可提取性，範圍 0-1
 *
 * 參考: https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm
 */

/**
 * FSRS-6 配置介面
 */
export interface IFSRSConfig {
  /**
   * 19 個權重參數，用於計算穩定度和難度
   * FSRS-6 需要 19 個參數（FSRS-5 為 17 個）
   */
  weights: number[];

  /**
   * 期望的保留率（可提取性目標）
   * 範圍: 0.7 - 0.97
   * 預設: 0.9 (90% 記住)
   */
  desiredRetention: number;

  /**
   * 學習步驟（分鐘）
   * 用於新卡片的初始學習階段
   */
  learningSteps: number[];

  /**
   * 重新學習步驟（分鐘）
   * 用於遺忘後的重新學習
   */
  relearningSteps: number[];

  /**
   * 最大間隔天數
   * 預設: 36500 (100年)
   */
  maximumInterval: number;

  /**
   * 低效卡閾值
   * 遺忘次數達到此值時標記為低效卡
   */
  leechThreshold: number;
}

/**
 * FSRS 狀態介面
 */
export interface IFSRSState {
  /**
   * 穩定度（天）
   * 表示記憶持久性
   */
  stability: number;

  /**
   * 難度 (1-10)
   * 1 = 最簡單, 10 = 最困難
   */
  difficulty: number;

  /**
   * 學習步驟索引
   * -1 表示已畢業（進入複習階段）
   * >= 0 表示在學習階段
   */
  learningStep: number;

  /**
   * 遺忘次數
   */
  lapseCount: number;

  /**
   * 下次複習日期
   */
  dueDate: Date;

  /**
   * 上次複習日期
   */
  lastReviewed: Date | null;
}

/**
 * 複習結果介面
 */
export interface IReviewResult {
  state: IFSRSState;
  scheduledDays: number;
}

/**
 * 預設的 FSRS-6 配置
 * 基於用戶提供的參數 + FSRS-6 新增的兩個參數
 */
export const DEFAULT_FSRS_WEIGHTS = [
  0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61,
  0.0, 0.0  // FSRS-6 新增的參數
];

export const DEFAULT_FSRS_CONFIG: IFSRSConfig = {
  weights: DEFAULT_FSRS_WEIGHTS,
  desiredRetention: 0.9,
  learningSteps: [1, 10],  // 1分鐘, 10分鐘
  relearningSteps: [10],   // 10分鐘
  maximumInterval: 36500,
  leechThreshold: 8,
};

/**
 * 計算初始難度
 * 根據首次評分計算卡片的初始難度
 *
 * @param rating 評分 (0=Again, 1=Hard, 2=Good, 3=Easy)
 * @param w 權重參數
 * @returns 難度值 (1-10)
 */
function calculateInitialDifficulty(rating: number, w: number[]): number {
  // D_0(G) = w[4] - e^(w[5] * (G-1)) + 1
  // G 是評分 (1-4)，我們的系統使用 0-3，所以需要 +1
  const G = rating + 1;
  const difficulty = w[4] - Math.exp(w[5] * (G - 1)) + 1;

  // 限制在 [1, 10] 範圍內
  return Math.max(1, Math.min(10, difficulty));
}

/**
 * 計算初始穩定度
 * 根據首次評分計算卡片的初始穩定度
 *
 * @param rating 評分 (0-3)
 * @param w 權重參數
 * @returns 穩定度（天）
 */
function calculateInitialStability(rating: number, w: number[]): number {
  // S_0(G) = w[G]
  // G 是評分，直接使用對應的權重
  return Math.max(0.1, w[rating]);
}

/**
 * 計算可提取性
 * R = e^(ln(0.9) * t / S)
 *
 * @param elapsedDays 經過的天數
 * @param stability 當前穩定度
 * @param desiredRetention 期望保留率（預設 0.9）
 * @returns 可提取性 (0-1)
 */
function calculateRetrievability(
  elapsedDays: number,
  stability: number,
  desiredRetention: number = 0.9
): number {
  // R(t, S) = e^(ln(r) * t / S)
  // 其中 r 是 desiredRetention
  const retrievability = Math.exp(Math.log(desiredRetention) * elapsedDays / stability);

  // 限制在 [0, 1] 範圍內
  return Math.max(0, Math.min(1, retrievability));
}

/**
 * 計算複習後的難度
 * 根據當前難度和評分計算新難度
 *
 * @param currentDifficulty 當前難度
 * @param rating 評分 (0-3)
 * @param w 權重參數
 * @returns 新難度 (1-10)
 */
function calculateNextDifficulty(
  currentDifficulty: number,
  rating: number,
  w: number[]
): number {
  // D' = D - w[6] * (G - 3)
  // G 是評分 (1-4)，我們的系統使用 0-3，所以需要 +1
  const G = rating + 1;
  const nextDifficulty = currentDifficulty - w[6] * (G - 3);

  // 使用平均回歸
  // D' = w[7] * D_0(3) + (1-w[7]) * D'
  const initialDifficulty = calculateInitialDifficulty(2, w); // rating=2 (Good)
  const meanRevertedDifficulty = w[7] * initialDifficulty + (1 - w[7]) * nextDifficulty;

  // 限制在 [1, 10] 範圍內
  return Math.max(1, Math.min(10, meanRevertedDifficulty));
}

/**
 * 計算複習後的穩定度（成功）
 * 當評分 >= 2 (Good) 時使用
 *
 * @param currentStability 當前穩定度
 * @param currentDifficulty 當前難度
 * @param retrievability 當前可提取性
 * @param rating 評分 (2-3)
 * @param w 權重參數
 * @returns 新穩定度
 */
function calculateStabilityAfterSuccess(
  currentStability: number,
  currentDifficulty: number,
  retrievability: number,
  rating: number,
  w: number[]
): number {
  // S' = S * (e^(w[8]) * (11 - D) * S^(-w[9]) * (e^(w[10] * (1 - R)) - 1) * hardPenalty + 1)

  // Hard penalty: 當評分為 Hard (1) 時應用懲罰
  let hardPenalty = 1.0;
  if (rating === 1) {
    hardPenalty = w[15];
  }

  // Easy bonus: 當評分為 Easy (3) 時應用獎勵
  let easyBonus = 1.0;
  if (rating === 3) {
    easyBonus = w[16];
  }

  const newStability = currentStability * (
    Math.exp(w[8]) *
    (11 - currentDifficulty) *
    Math.pow(currentStability, -w[9]) *
    (Math.exp(w[10] * (1 - retrievability)) - 1) *
    hardPenalty +
    1
  ) * easyBonus;

  return Math.max(0.1, newStability);
}

/**
 * 計算複習後的穩定度（失敗）
 * 當評分 = 0 (Again) 時使用
 *
 * @param currentDifficulty 當前難度
 * @param currentStability 當前穩定度
 * @param retrievability 當前可提取性
 * @param w 權重參數
 * @returns 新穩定度
 */
function calculateStabilityAfterFailure(
  currentDifficulty: number,
  currentStability: number,
  retrievability: number,
  w: number[]
): number {
  // S' = w[11] * D^(-w[12]) * ((S+1)^w[13] - 1) * e^(w[14] * (1 - R))

  const newStability =
    w[11] *
    Math.pow(currentDifficulty, -w[12]) *
    (Math.pow(currentStability + 1, w[13]) - 1) *
    Math.exp(w[14] * (1 - retrievability));

  return Math.max(0.1, newStability);
}

/**
 * 計算下次複習的間隔天數
 *
 * @param stability 穩定度
 * @param desiredRetention 期望保留率
 * @param maximumInterval 最大間隔
 * @returns 間隔天數
 */
function calculateInterval(
  stability: number,
  desiredRetention: number,
  maximumInterval: number
): number {
  // I = S * ln(r) / ln(0.9)
  // 其中 r 是 desiredRetention
  const interval = stability * Math.log(desiredRetention) / Math.log(0.9);

  // 限制在最大間隔內，且至少 1 天
  return Math.max(1, Math.min(maximumInterval, Math.round(interval)));
}

/**
 * 創建初始 FSRS 狀態（用於新卡片）
 *
 * @param rating 首次評分 (0-3)
 * @param config FSRS 配置
 * @returns 初始狀態
 */
export function createInitialState(rating: number, config: IFSRSConfig): IFSRSState {
  const w = config.weights;

  const stability = calculateInitialStability(rating, w);
  const difficulty = calculateInitialDifficulty(rating, w);

  // 計算間隔
  const scheduledDays = calculateInterval(stability, config.desiredRetention, config.maximumInterval);

  const now = new Date();
  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + scheduledDays);

  return {
    stability,
    difficulty,
    learningStep: -1,  // 直接畢業
    lapseCount: 0,
    dueDate,
    lastReviewed: now,
  };
}

/**
 * 處理學習階段的複習
 *
 * @param currentState 當前狀態
 * @param rating 評分 (0-3)
 * @param config FSRS 配置
 * @returns 新狀態和間隔
 */
function reviewInLearning(
  currentState: IFSRSState,
  rating: number,
  config: IFSRSConfig
): IReviewResult {
  const w = config.weights;
  const now = new Date();

  // 如果評分為 Again (0)，重置到第一步
  if (rating === 0) {
    const nextDueDate = new Date(now);
    nextDueDate.setMinutes(nextDueDate.getMinutes() + config.learningSteps[0]);

    return {
      state: {
        ...currentState,
        learningStep: 0,
        lapseCount: currentState.lapseCount + 1,
        dueDate: nextDueDate,
        lastReviewed: now,
      },
      scheduledDays: config.learningSteps[0] / 1440,  // 轉換為天數
    };
  }

  // 如果評分為 Easy (3)，直接畢業
  if (rating === 3) {
    const stability = calculateInitialStability(rating, w);
    const difficulty = calculateInitialDifficulty(rating, w);
    const scheduledDays = calculateInterval(stability, config.desiredRetention, config.maximumInterval);

    const nextDueDate = new Date(now);
    nextDueDate.setDate(nextDueDate.getDate() + scheduledDays);

    return {
      state: {
        stability,
        difficulty,
        learningStep: -1,  // 畢業
        lapseCount: currentState.lapseCount,
        dueDate: nextDueDate,
        lastReviewed: now,
      },
      scheduledDays,
    };
  }

  // Good (2) 或 Hard (1): 前進到下一步
  const nextStep = currentState.learningStep + 1;

  // 檢查是否完成所有學習步驟
  if (nextStep >= config.learningSteps.length) {
    // 畢業
    const stability = calculateInitialStability(rating, w);
    const difficulty = calculateInitialDifficulty(rating, w);
    const scheduledDays = calculateInterval(stability, config.desiredRetention, config.maximumInterval);

    const nextDueDate = new Date(now);
    nextDueDate.setDate(nextDueDate.getDate() + scheduledDays);

    return {
      state: {
        stability,
        difficulty,
        learningStep: -1,  // 畢業
        lapseCount: currentState.lapseCount,
        dueDate: nextDueDate,
        lastReviewed: now,
      },
      scheduledDays,
    };
  }

  // 繼續學習階段
  const nextDueDate = new Date(now);
  nextDueDate.setMinutes(nextDueDate.getMinutes() + config.learningSteps[nextStep]);

  return {
    state: {
      ...currentState,
      learningStep: nextStep,
      dueDate: nextDueDate,
      lastReviewed: now,
    },
    scheduledDays: config.learningSteps[nextStep] / 1440,
  };
}

/**
 * 處理複習階段的複習
 *
 * @param currentState 當前狀態
 * @param rating 評分 (0-3)
 * @param config FSRS 配置
 * @returns 新狀態和間隔
 */
function reviewInReview(
  currentState: IFSRSState,
  rating: number,
  config: IFSRSConfig
): IReviewResult {
  const w = config.weights;
  const now = new Date();

  // 計算經過的天數
  const elapsedDays = currentState.lastReviewed
    ? (now.getTime() - currentState.lastReviewed.getTime()) / (1000 * 60 * 60 * 24)
    : 0;

  // 計算當前可提取性
  const retrievability = calculateRetrievability(
    elapsedDays,
    currentState.stability,
    config.desiredRetention
  );

  // 如果評分為 Again (0)，進入重新學習
  if (rating === 0) {
    const newStability = calculateStabilityAfterFailure(
      currentState.difficulty,
      currentState.stability,
      retrievability,
      w
    );

    const newDifficulty = calculateNextDifficulty(currentState.difficulty, rating, w);

    // 重新學習階段
    const nextDueDate = new Date(now);
    nextDueDate.setMinutes(nextDueDate.getMinutes() + config.relearningSteps[0]);

    return {
      state: {
        stability: newStability,
        difficulty: newDifficulty,
        learningStep: 0,  // 進入重新學習
        lapseCount: currentState.lapseCount + 1,
        dueDate: nextDueDate,
        lastReviewed: now,
      },
      scheduledDays: config.relearningSteps[0] / 1440,
    };
  }

  // 成功的複習 (Hard, Good, Easy)
  const newStability = calculateStabilityAfterSuccess(
    currentState.stability,
    currentState.difficulty,
    retrievability,
    rating,
    w
  );

  const newDifficulty = calculateNextDifficulty(currentState.difficulty, rating, w);

  const scheduledDays = calculateInterval(newStability, config.desiredRetention, config.maximumInterval);

  const nextDueDate = new Date(now);
  nextDueDate.setDate(nextDueDate.getDate() + scheduledDays);

  return {
    state: {
      stability: newStability,
      difficulty: newDifficulty,
      learningStep: -1,
      lapseCount: currentState.lapseCount,
      dueDate: nextDueDate,
      lastReviewed: now,
    },
    scheduledDays,
  };
}

/**
 * 執行 FSRS 複習
 * 這是主要的複習函數
 *
 * @param currentState 當前狀態
 * @param rating 評分 (0=Again, 1=Hard, 2=Good, 3=Easy)
 * @param config FSRS 配置
 * @returns 新狀態和間隔
 */
export function review(
  currentState: IFSRSState,
  rating: number,
  config: IFSRSConfig
): IReviewResult {
  // 驗證評分
  if (rating < 0 || rating > 3) {
    throw new Error('Rating must be between 0 and 3');
  }

  // 根據當前階段選擇處理函數
  if (currentState.learningStep >= 0) {
    // 學習或重新學習階段
    return reviewInLearning(currentState, rating, config);
  } else {
    // 複習階段
    return reviewInReview(currentState, rating, config);
  }
}

/**
 * 獲取所有四個評分選項的預測結果
 * 用於前端顯示不同選項的效果
 *
 * @param currentState 當前狀態
 * @param config FSRS 配置
 * @returns 四個選項的預測結果
 */
export function getSchedulingInfo(
  currentState: IFSRSState,
  config: IFSRSConfig
): {
  again: IReviewResult;
  hard: IReviewResult;
  good: IReviewResult;
  easy: IReviewResult;
} {
  return {
    again: review(currentState, 0, config),
    hard: review(currentState, 1, config),
    good: review(currentState, 2, config),
    easy: review(currentState, 3, config),
  };
}

// TODO: 實作參數優化功能
// 根據用戶的複習歷史，使用機器學習優化 FSRS 參數
// 需要至少 400 條複習記錄才能進行有效優化
// 參考: https://github.com/open-spaced-repetition/fsrs-optimizer
