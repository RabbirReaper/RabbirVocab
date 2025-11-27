// ==================== 通用類型 ====================

export interface ApiResponse<T = any> {
  message: string
  data: T
}

export interface ApiError {
  message: string
  statusCode: number
  originalError?: any
}

// ==================== 用戶相關類型 ====================

export interface UserDto {
  id: string
  username: string
  email: string
  displayName: string
  avatar?: string
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
