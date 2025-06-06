import { api } from '@/lib/api'
import { AxiosResponse } from 'axios'

// Login/Register interfaces
export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  full_name: string
}

// Auth response interfaces
export interface AuthUser {
  id: string
  email: string
  name: string
  avatar?: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface AuthResponse {
  success: boolean
  user: AuthUser
  tokens: AuthTokens
  message: string
}

export interface AuthVerifyResponse {
  success: boolean
  user: AuthUser
}

/**
 * Authentication Service Class
 * Handles login, register, logout, token management
 */
class AuthService {
  private readonly baseEndpoint = '/auth' // ! DO NOT CHANGE THIS, IT IS USED IN BACKEND

  /**
   * Login user with credentials
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await api.post(
        `${this.baseEndpoint}/login`,
        credentials
      )

      if (response.data.success && response.data.tokens) {
        // Store tokens
        localStorage.setItem('auth_token', response.data.tokens.accessToken)
        localStorage.setItem('refresh_token', response.data.tokens.refreshToken)
      }

      return response.data
    } catch (error: any) {
      console.error('Login error:', error)
      throw error
    }
  }

  /**
   * Register new user
   */
  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await api.post(
        `${this.baseEndpoint}/register`,
        userData
      )

      if (response.data.success && response.data.tokens) {
        // Store tokens
        localStorage.setItem('auth_token', response.data.tokens.accessToken)
        localStorage.setItem('refresh_token', response.data.tokens.refreshToken)
      }

      return response.data
    } catch (error: any) {
      console.error('Register error:', error)
      throw error
    }
  }

  /**
   * Verify current authentication and get user data
   */
  async verifyAuth(): Promise<AuthUser> {
    try {
      const response: AxiosResponse<AuthVerifyResponse> = await api.get(
        `${this.baseEndpoint}/me`
      )

      if (!response.data.success) {
        throw new Error('Authentication verification failed')
      }

      return response.data.user
    } catch (error: any) {
      console.error('Auth verification error:', error)
      throw error
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<AuthTokens> {
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      const response: AxiosResponse<AuthTokens> = await api.post(
        `${this.baseEndpoint}/refresh`,
        { refresh_token: refreshToken }
      )

      // Store new tokens
      localStorage.setItem('auth_token', response.data.accessToken)
      if (response.data.refreshToken) {
        localStorage.setItem('refresh_token', response.data.refreshToken)
      }

      return response.data
    } catch (error: any) {
      console.error('Token refresh error:', error)
      // Clear invalid tokens
      localStorage.removeItem('auth_token')
      localStorage.removeItem('refresh_token')
      throw error
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await api.post(`${this.baseEndpoint}/logout`)
    } catch (error: any) {
      console.warn('Logout API call failed:', error)
      // Continue with local logout even if API fails
    } finally {
      // Always clear local tokens
      localStorage.removeItem('auth_token')
      localStorage.removeItem('refresh_token')
    }
  }

  /**
   * Check if user has valid tokens
   */
  hasValidTokens(): boolean {
    const accessToken = localStorage.getItem('auth_token')
    const refreshToken = localStorage.getItem('refresh_token')
    return !!(accessToken || refreshToken)
  }
}

// Export singleton instance
export const authService = new AuthService()

// Export types
export type {
  LoginCredentials,
  RegisterData,
  AuthUser,
  AuthTokens,
  AuthResponse,
  AuthVerifyResponse
}

export default authService
