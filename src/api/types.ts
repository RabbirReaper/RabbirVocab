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
  learningSteps: number[] // 學習步驟（分鐘）
  graduatingInterval: number // 畢業間隔（天）
  easyInterval: number // 簡單間隔（天）
  relearningSteps: number[] // 重新學習步驟（分鐘）
  minimumInterval: number // 最短間隔（天）
  leechThreshold: number // 低效卡臨界值
  easyBonus: number // 簡單加成
  hardInterval: number // 困難間隔倍數
  minEaseFactor: number // 最小難度係數
  maxEaseFactor: number // 最大難度係數
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
  word: string
  image?: CardImage
  content?: string
}

export interface CardSRS {
  easeFactor: number
  interval: number
  repetitions: number
  dueDate: string
  lastReviewed: string | null
  learningStep: number
  lapseCount: number
}

export interface ReviewHistoryItem {
  date: string
  type: 'learning' | 'review' | 'relearning'
  rating: number // 0-3
  interval: number
  easeFactor?: number
  duration: number
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
  reviewHistory: ReviewHistoryItem[]
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
