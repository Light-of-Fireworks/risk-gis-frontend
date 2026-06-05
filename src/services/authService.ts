import { get, post } from '../utils/request'

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  password: string
  email: string
}

export interface LoginResponse {
  token: string
  username: string
  email: string
  roles: string[]
}

export interface UserInfo {
  id: number
  username: string
  email: string
  enabled: boolean
  roles: string[]
  createdAt: string
}

export const authService = {
  /**
   * 用户登录
   */
  login(request: LoginRequest): Promise<LoginResponse> {
    return post('/auth/login', request)
  },

  /**
   * 用户注册
   */
  register(request: RegisterRequest): Promise<UserInfo> {
    return post('/auth/register', request)
  },

  /**
   * 获取当前用户信息
   */
  getCurrentUser(): Promise<UserInfo> {
    return get('/auth/me')
  },
}

export default authService
