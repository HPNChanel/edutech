import { api } from '@/lib/api'
import { AxiosResponse } from 'axios'

// User Interfaces
export interface User {
  id: string
  email: string
  name: string
  firstName?: string
  lastName?: string
  avatar?: string
  bio?: string
  phone?: string
  dateOfBirth?: string
  location?: string
  timezone?: string
  language?: string
  emailVerified?: boolean
  phoneVerified?: boolean
  accountStatus?: 'active' | 'suspended' | 'pending'
  role?: 'student' | 'instructor' | 'admin'
  preferences?: UserPreferences
  stats?: UserStats
  createdAt?: string
  updatedAt?: string
  lastLoginAt?: string
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  emailNotifications: boolean
  pushNotifications: boolean
  weeklyDigest: boolean
  courseReminders: boolean
  marketingEmails: boolean
  autoplay: boolean
  playbackSpeed: number
  subtitles: boolean
  language: string
}

export interface UserStats {
  totalCourses: number
  completedCourses: number
  inProgressCourses: number
  totalLessons: number
  completedLessons: number
  totalHours: number
  currentStreak: number
  longestStreak: number
  averageSessionTime: number
  lastActivity: string
}

// Update Profile Interfaces
export interface UpdateProfileData {
  name?: string
  firstName?: string
  lastName?: string
  bio?: string
  phone?: string
  dateOfBirth?: string
  location?: string
  timezone?: string
  language?: string
}

export interface UpdatePreferencesData {
  theme?: UserPreferences['theme']
  emailNotifications?: boolean
  pushNotifications?: boolean
  weeklyDigest?: boolean
  courseReminders?: boolean
  marketingEmails?: boolean
  autoplay?: boolean
  playbackSpeed?: number
  subtitles?: boolean
  language?: string
}

// Password Change
export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
  confirmNewPassword: string
}

// Avatar Upload
export interface AvatarUploadResponse {
  success: boolean
  avatarUrl: string
  message: string
}

// Learning Streak
export interface LearningStreak {
  currentStreak: number
  longestStreak: number
  streakHistory: {
    date: string
    completed: boolean
    lessonsCompleted: number
  }[]
  nextMilestone: {
    days: number
    reward?: string
  }
}

// Activity Log
export interface UserActivity {
  id: string
  type: 'lesson_completed' | 'course_started' | 'quiz_passed' | 'note_created' | 'achievement_earned'
  title: string
  description: string
  metadata?: any
  createdAt: string
}

// Error Interfaces
export interface UserServiceError {
  message: string
  code: string
  field?: string
  details?: any
}

// API Response wrapper
interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  errors?: UserServiceError[]
}

// Optimistic Update Types
type OptimisticUpdateCallback<T> = (data: T) => void
type RollbackCallback = () => void

/**
 * User Service Class
 * Handles all user-related API operations
 */
class UserService {
  private readonly baseEndpoint = '/user' // ! DO NOT CHANGE THIS, IT IS USED IN BACKEND

  /**
   * Get current user profile
   * @returns Promise<User>
   */
  async getCurrentUser(): Promise<User> {
    try {
      // Use the auth endpoint which exists in backend
      const response: AxiosResponse<any> = await api.get('/auth/me') // ! DO NOT CHANGE THIS, IT IS USED IN BACKEND

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch user profile')
      }

      return response.data.user // Use user field from auth/me response
    } catch (error: any) {
      console.error('Get current user error:', error)
      
      // Don't throw auth errors here - let the auth context handle them
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw error // Re-throw for auth handling
      }
      
      if (error.response?.status === 404) {
        throw new Error('User profile not found. Please contact support.')
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch user profile. Please try again.'
      )
    }
  }

  /**
   * Update user profile with optimistic update
   * @param updateData - Profile data to update
   * @param onOptimisticUpdate - Callback for optimistic UI update
   * @param onRollback - Callback to rollback optimistic update on failure
   * @returns Promise<User>
   */
  async updateProfile(
    updateData: UpdateProfileData,
    onOptimisticUpdate?: OptimisticUpdateCallback<Partial<User>>,
    onRollback?: RollbackCallback
  ): Promise<User> {
    // Perform optimistic update
    if (onOptimisticUpdate) {
      onOptimisticUpdate({
        ...updateData,
        updatedAt: new Date().toISOString()
      })
    }

    try {
      const hasUpdates = Object.values(updateData).some(value => 
        value !== undefined && value !== null && value !== ''
      )
      
      if (!hasUpdates) {
        throw new Error('At least one field must be updated')
      }

      const response: AxiosResponse<User> = await api.put(
        `${this.baseEndpoint}/profile`,
        updateData
      )

      return response.data
    } catch (error: any) {
      console.error('Update profile error:', error)
      
      // Rollback optimistic update on failure
      if (onRollback) {
        onRollback()
      }
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.')
      }
      
      if (error.response?.status === 400) {
        const errorDetail = error.response.data?.detail
        if (errorDetail) {
          throw new Error(errorDetail)
        }
        throw new Error('Invalid profile data. Please check your inputs.')
      }
      
      throw new Error(
        error.response?.data?.detail || 
        error.message || 
        'Failed to update profile. Please try again.'
      )
    }
  }

  /**
   * Update user preferences
   * @param preferencesData - Preferences to update
   * @param onOptimisticUpdate - Callback for optimistic UI update
   * @param onRollback - Callback to rollback optimistic update on failure
   * @returns Promise<UserPreferences>
   */
  async updatePreferences(
    preferencesData: UpdatePreferencesData,
    onOptimisticUpdate?: OptimisticUpdateCallback<Partial<UserPreferences>>,
    onRollback?: RollbackCallback
  ): Promise<UserPreferences> {
    // Perform optimistic update
    if (onOptimisticUpdate) {
      onOptimisticUpdate(preferencesData)
    }

    try {
      const response: AxiosResponse<ApiResponse<{ preferences: UserPreferences }>> = await api.put(
        `${this.baseEndpoint}/me/preferences`,
        preferencesData
      )

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update preferences')
      }

      return response.data.data.preferences
    } catch (error: any) {
      console.error('Update preferences error:', error)
      
      // Rollback optimistic update on failure
      if (onRollback) {
        onRollback()
      }
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.')
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to update preferences. Please try again.'
      )
    }
  }

  /**
   * Change user password
   * @param passwordData - Current and new password data
   * @returns Promise<void>
   */
  async changePassword(passwordData: ChangePasswordData): Promise<void> {
    try {
      if (!passwordData.currentPassword || passwordData.currentPassword.trim() === '') {
        throw new Error('Current password is required')
      }

      if (!passwordData.newPassword || passwordData.newPassword.length < 8) {
        throw new Error('New password must be at least 8 characters long')
      }

      if (passwordData.newPassword !== passwordData.confirmNewPassword) {
        throw new Error('New passwords do not match')
      }

      const response: AxiosResponse<{ message: string }> = await api.post(
        `${this.baseEndpoint}/change-password`,
        {
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword,
          confirm_new_password: passwordData.confirmNewPassword
        }
      )

      // Response is successful if we get here
    } catch (error: any) {
      console.error('Change password error:', error)
      
      if (error.response?.status === 401) {
        const errorDetail = error.response.data?.detail
        if (errorDetail === 'Current password is incorrect') {
          throw new Error('Current password is incorrect')
        }
        throw new Error('Authentication required. Please log in again.')
      }
      
      if (error.response?.status === 400) {
        throw new Error('Invalid password data. Please check your inputs.')
      }
      
      throw new Error(
        error.response?.data?.detail || 
        error.message || 
        'Failed to change password. Please try again.'
      )
    }
  }

  /**
   * Upload user avatar
   * @param avatarFile - Avatar image file
   * @param onOptimisticUpdate - Callback for optimistic UI update
   * @param onRollback - Callback to rollback optimistic update on failure
   * @returns Promise<AvatarUploadResponse>
   */
  async uploadAvatar(
    avatarFile: File,
    onOptimisticUpdate?: OptimisticUpdateCallback<{ avatar: string }>,
    onRollback?: RollbackCallback
  ): Promise<AvatarUploadResponse> {
    // Perform optimistic update with temporary URL
    const tempAvatarUrl = URL.createObjectURL(avatarFile)
    if (onOptimisticUpdate) {
      onOptimisticUpdate({ avatar: tempAvatarUrl })
    }

    try {
      if (!avatarFile) {
        throw new Error('Avatar file is required')
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(avatarFile.type)) {
        throw new Error('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.')
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024
      if (avatarFile.size > maxSize) {
        throw new Error('File size too large. Please upload an image smaller than 5MB.')
      }

      const formData = new FormData()
      formData.append('avatar', avatarFile)

      const response: AxiosResponse<ApiResponse<AvatarUploadResponse>> = await api.post(
        `${this.baseEndpoint}/me/avatar`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to upload avatar')
      }

      // Clean up temporary URL
      URL.revokeObjectURL(tempAvatarUrl)

      return response.data.data
    } catch (error: any) {
      console.error('Upload avatar error:', error)
      
      // Rollback optimistic update on failure
      if (onRollback) {
        onRollback()
      }

      // Clean up temporary URL
      URL.revokeObjectURL(tempAvatarUrl)
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.')
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to upload avatar. Please try again.'
      )
    }
  }

  /**
   * Delete user avatar
   * @param onOptimisticUpdate - Callback for optimistic UI update
   * @param onRollback - Callback to rollback optimistic update on failure
   * @returns Promise<void>
   */
  async deleteAvatar(
    onOptimisticUpdate?: OptimisticUpdateCallback<{ avatar: null }>,
    onRollback?: RollbackCallback
  ): Promise<void> {
    // Perform optimistic update
    if (onOptimisticUpdate) {
      onOptimisticUpdate({ avatar: null })
    }

    try {
      const response: AxiosResponse<ApiResponse<{ message: string }>> = await api.delete(
        `${this.baseEndpoint}/me/avatar`
      )

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete avatar')
      }
    } catch (error: any) {
      console.error('Delete avatar error:', error)
      
      // Rollback optimistic update on failure
      if (onRollback) {
        onRollback()
      }
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.')
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to delete avatar. Please try again.'
      )
    }
  }

  /**
   * Get user learning streak data
   * @returns Promise<LearningStreak>
   */
  async getLearningStreak(): Promise<LearningStreak> {
    try {
      const response: AxiosResponse<ApiResponse<LearningStreak>> = await api.get(
        `${this.baseEndpoint}/me/streak`
      )

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch learning streak')
      }

      return response.data.data
    } catch (error: any) {
      console.error('Get learning streak error:', error)
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.')
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch learning streak. Please try again.'
      )
    }
  }

  /**
   * Get user activity history
   * @param limit - Number of activities to return
   * @param offset - Number of activities to skip
   * @returns Promise<UserActivity[]>
   */
  async getActivityHistory(limit: number = 20, offset: number = 0): Promise<UserActivity[]> {
    try {
      const response: AxiosResponse<ApiResponse<{ activities: UserActivity[] }>> = await api.get(
        `${this.baseEndpoint}/me/activity`,
        {
          params: { limit, offset }
        }
      )

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch activity history')
      }

      return response.data.data.activities
    } catch (error: any) {
      console.error('Get activity history error:', error)
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.')
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch activity history. Please try again.'
      )
    }
  }

  /**
   * Delete user account
   * @param password - Current password for confirmation
   * @returns Promise<void>
   */
  async deleteAccount(password: string): Promise<void> {
    try {
      if (!password || password.trim() === '') {
        throw new Error('Password is required to delete account')
      }

      const response: AxiosResponse<ApiResponse<{ message: string }>> = await api.delete(
        `${this.baseEndpoint}/me`,
        {
          data: { password }
        }
      )

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete account')
      }
    } catch (error: any) {
      console.error('Delete account error:', error)
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.')
      }
      
      if (error.response?.status === 400) {
        throw new Error('Incorrect password')
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to delete account. Please try again.'
      )
    }
  }

  /**
   * Get user statistics
   * @returns Promise<UserStats>
   */
  async getUserStats(): Promise<UserStats> {
    try {
      const response: AxiosResponse<ApiResponse<UserStats>> = await api.get(
        `${this.baseEndpoint}/me/stats`
      )

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch user statistics')
      }

      return response.data.data
    } catch (error: any) {
      console.error('Get user stats error:', error)
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.')
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch user statistics. Please try again.'
      )
    }
  }
}

// Export singleton instance
export const userService = new UserService()

// Export types for use in components
export type {
  User,
  UserPreferences,
  UserStats,
  UpdateProfileData,
  UpdatePreferencesData,
  ChangePasswordData,
  AvatarUploadResponse,
  LearningStreak,
  UserActivity,
  UserServiceError
}

// Export default
export default userService
