import apiClient from '../client'
import type {
  ApiResponse,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  UserDto,
} from '../types'

export const authApi = {
  /**
   * 用戶註冊
   */
  register: async (data: RegisterRequest): Promise<UserDto> => {
    const response = (await apiClient.post('/auth/register', data)) as ApiResponse<AuthResponse>
    return response.data.user
  },

  /**
   * 用戶登入
   */
  login: async (data: LoginRequest): Promise<UserDto> => {
    const response = (await apiClient.post('/auth/login', data)) as ApiResponse<AuthResponse>
    return response.data.user
  },

  /**
   * 用戶登出
   */
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout')
  },

  /**
   * 獲取當前用戶資訊（驗證 session）
   */
  getMe: async (): Promise<UserDto> => {
    const response = (await apiClient.get('/auth/me')) as ApiResponse<AuthResponse>
    return response.data.user
  },
}
