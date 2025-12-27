// ==================== 通用類型 ====================

export interface ApiResponse<T = unknown> {
  message: string
  data: T
}

export interface ApiErrorResponse {
  message: string
  error: {
    message: string
  }
}

export interface ApiError {
  message: string
  statusCode: number
  originalError?: unknown
}

// ==================== 用戶相關類型 ====================

export interface UserDto {
  id: string
  username: string
  email: string
  role: 'user' | 'pro' | 'admin' | 'super_admin'
  stats?: {
    totalCards: number
    cardsLearned: number
    totalReviews: number
    studyStreak: number
  }
}

// ==================== 認證相關類型 ====================

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface AuthResponse {
  user: UserDto
}

// ==================== Deck 相關類型 ====================

export interface SRSConfig {
  weights: number[] // FSRS-6 權重參數（19個）
  desiredRetention: number // 期望保留率 (0.7-0.97)
  learningSteps: number[] // 學習步驟（分鐘）
  relearningSteps: number[] // 重新學習步驟（分鐘）
  maximumInterval: number // 最大間隔（天）
  leechThreshold: number // 低效卡臨界值
}

export interface DeckSettings {
  newCardsPerDay: number
  reviewCardsPerDay: number
  isPublic: boolean
  srsConfig: SRSConfig
}

export interface DeckDto {
  _id: string
  name: string
  description: string
  user: string
  settings: DeckSettings
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateDeckRequest {
  name: string
  description?: string
  settings?: Partial<DeckSettings>
}

export interface UpdateDeckRequest {
  name: string
  description?: string
  settings?: Partial<DeckSettings>
}

export interface GetDecksResponse {
  decks: DeckDto[]
  count: number
}

export interface GetDeckResponse {
  deck: DeckDto
}

// ==================== Card 相關類型 ====================

export type CardStatus = 'new' | 'learning' | 'review'

export interface CardImage {
  url?: string
  key?: string
  alt?: string
}

export interface CardAudio {
  url?: string
  key?: string
  duration?: number
}

export interface CardBack {
  image?: CardImage
  content: string
}

export interface CardSRS {
  stability: number // 穩定度（天）
  difficulty: number // 難度 (1-10)
  dueDate: string
  lastReviewed: string | null
  learningStep: number // -1 表示已畢業
  lapseCount: number // 遺忘次數
}

export interface CardDto {
  _id: string
  deck: string
  front: string
  back: CardBack
  audio: CardAudio
  tags: string[]
  status: CardStatus
  srs: CardSRS
  user: string
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateCardRequest {
  deck: string
  front: string
  back: CardBack
  audio?: CardAudio
  tags?: string[]
}

export interface UpdateCardRequest {
  front: string
  back: CardBack
  audio?: CardAudio
  tags?: string[]
}

export interface GetCardsResponse {
  cards: CardDto[]
  count: number
}

export interface GetCardResponse {
  card: CardDto
}

export interface ReviewCardRequest {
  quality: number // 1-4: 1=Again, 2=Hard, 3=Good, 4=Easy
}

export interface ReviewCardResponse {
  card: CardDto
}

export interface SchedulingState {
  status: CardStatus
  learningStep: number
  stability: number
  difficulty: number
  dueDate: string
}

export interface SchedulingOption {
  interval: string // 格式化的間隔字符串 (例如 "10m", "1d")
  intervalDays: number // 間隔天數
  nextState: SchedulingState
}

export interface SchedulingInfoResponse {
  currentState: SchedulingState
  schedulingOptions: {
    again: SchedulingOption
    hard: SchedulingOption
    good: SchedulingOption
    easy: SchedulingOption
  }
}

// ==================== AI 相關類型 ====================

export interface GenerateContentRequest {
  model: string
  input: string
  stream: boolean
}

export interface GenerateContentResponse {
  id: string
  object: string
  created_at: number
  status: string
  model: string
  output: Array<{
    id: string
    type: string
    role: string
    status: string
    content: Array<{
      type: string
      text: string
    }>
  }>
  usage: {
    input_tokens: number
    output_tokens: number
    total_tokens: number
    output_tokens_details: {
      reasoning_tokens: number
    }
  }
  previous_response_id: string | null
}
