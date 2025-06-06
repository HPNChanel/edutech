import { api } from '@/lib/api'
import { AxiosResponse } from 'axios'

// Dashboard Statistics Interfaces
export interface DashboardStats {
  user: {
    name: string
    avatar?: string
    currentStreak: number
    totalHours: number
    joinedDate: string
  }
  learning: {
    totalCourses: number
    completedCourses: number
    inProgressCourses: number
    totalLessons: number
    completedLessons: number
    averageProgress: number
    todayProgress: number
    weeklyGoal: number
    weeklyProgress: number
  }
  achievements: {
    totalAchievements: number
    recentAchievements: Achievement[]
    nextMilestone?: {
      title: string
      description: string
      progress: number
      target: number
    }
  }
  activity: {
    dailyActivity: DailyActivity[]
    weeklyStats: WeeklyStats
    monthlyStats: MonthlyStats
  }
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  type: 'completion' | 'streak' | 'time' | 'score' | 'social'
  earnedAt: string
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary'
}

export interface DailyActivity {
  date: string
  lessonsCompleted: number
  timeSpent: number // in minutes
  notesCreated: number
  quizzesPassed: number
  score: number // 0-100 activity score
}

export interface WeeklyStats {
  totalTime: number
  lessonsCompleted: number
  averageDaily: number
  streak: number
  improvement: number // percentage change from previous week
}

export interface MonthlyStats {
  totalTime: number
  coursesCompleted: number
  lessonsCompleted: number
  averageDaily: number
  topCategories: {
    categoryId: string
    categoryName: string
    timeSpent: number
    lessonsCompleted: number
  }[]
}

// Course Recommendations Interfaces
export interface CourseRecommendation {
  course: RecommendedCourse
  reason: RecommendationReason
  confidence: number // 0-100
  estimatedTime: number // in hours
  prerequisites?: string[]
  tags: string[]
}

export interface RecommendedCourse {
  id: string
  title: string
  description: string
  thumbnail?: string
  instructor: string
  duration: number // in hours
  totalLessons: number
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  rating: number
  totalReviews: number
  category: {
    id: string
    name: string
    slug: string
  }
  price?: {
    amount: number
    currency: string
    originalAmount?: number
  }
  isFree: boolean
  isPopular: boolean
  isNew: boolean
  languages: string[]
  lastUpdated: string
}

export interface RecommendationReason {
  type: 'similar_content' | 'user_behavior' | 'trending' | 'continuation' | 'skill_gap' | 'personalized'
  title: string
  description: string
  weight: number
}

// Course Progress Interfaces
export interface CourseProgress {
  courseId: string
  courseTitle: string
  courseThumbnail?: string
  instructor: string
  category: {
    id: string
    name: string
  }
  enrollment: {
    enrolledAt: string
    lastAccessedAt?: string
    status: 'active' | 'completed' | 'paused' | 'dropped'
  }
  progress: {
    percentage: number
    completedLessons: number
    totalLessons: number
    timeSpent: number // in hours
    estimatedTimeRemaining: number // in hours
  }
  performance: {
    averageQuizScore?: number
    totalQuizzesTaken: number
    totalQuizzesPassed: number
    notesCount: number
    highlightsCount: number
  }
  milestones: {
    nextMilestone?: {
      type: 'lesson' | 'quiz' | 'project' | 'completion'
      title: string
      progress: number
      target: number
    }
    completedMilestones: number
    totalMilestones: number
  }
  certificate?: {
    isEligible: boolean
    completionDate?: string
    certificateUrl?: string
  }
}

// API Response wrapper
interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  errors?: any[]
}

/**
 * Dashboard Service Class
 * Handles dashboard statistics, recommendations, and progress tracking
 */
class DashboardService {
  private readonly baseEndpoint = '/dashboard' // ! DO NOT CHANGE THIS, IT IS USED IN BACKEND
  private readonly recommendationsEndpoint = '/dashboard/recommendations' // ! DO NOT CHANGE THIS, IT IS USED IN BACKEND
  private readonly progressEndpoint = '/dashboard/progress' // ! DO NOT CHANGE THIS, IT IS USED IN BACKEND

  /**
   * Get comprehensive dashboard statistics and overview
   * @returns Promise<DashboardStats>
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response: AxiosResponse<{
        totalNotes: number
        totalLessons: number
        totalCategories: number
        recentActivity: Array<{
          id: number
          title: string
          lessonTitle: string
          createdAt: string
        }>
      }> = await api.get(this.baseEndpoint)

      // Transform backend response to frontend DashboardStats format
      const backendData = response.data
      
      return {
        user: {
          name: "User", // This will be populated from auth context
          currentStreak: 0,
          totalHours: 0,
          joinedDate: new Date().toISOString()
        },
        learning: {
          totalCourses: backendData.totalLessons,
          completedCourses: 0,
          inProgressCourses: backendData.totalLessons,
          totalLessons: backendData.totalLessons,
          completedLessons: 0,
          averageProgress: 0,
          todayProgress: 0,
          weeklyGoal: 100,
          weeklyProgress: 0
        },
        achievements: {
          totalAchievements: 0,
          recentAchievements: []
        },
        activity: {
          dailyActivity: [],
          weeklyStats: {
            totalTime: 0,
            lessonsCompleted: 0,
            averageDaily: 0,
            streak: 0,
            improvement: 0
          },
          monthlyStats: {
            totalTime: 0,
            coursesCompleted: 0,
            lessonsCompleted: backendData.totalLessons,
            averageDaily: 0,
            topCategories: []
          }
        }
      }
    } catch (error: any) {
      console.error('Get dashboard stats error:', error)
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.')
      }
      
      // Return fallback data instead of throwing
      console.warn('Returning fallback dashboard data due to error:', error.message)
      return {
        user: {
          name: "User",
          currentStreak: 0,
          totalHours: 0,
          joinedDate: new Date().toISOString()
        },
        learning: {
          totalCourses: 0,
          completedCourses: 0,
          inProgressCourses: 0,
          totalLessons: 0,
          completedLessons: 0,
          averageProgress: 0,
          todayProgress: 0,
          weeklyGoal: 100,
          weeklyProgress: 0
        },
        achievements: {
          totalAchievements: 0,
          recentAchievements: []
        },
        activity: {
          dailyActivity: [],
          weeklyStats: {
            totalTime: 0,
            lessonsCompleted: 0,
            averageDaily: 0,
            streak: 0,
            improvement: 0
          },
          monthlyStats: {
            totalTime: 0,
            coursesCompleted: 0,
            lessonsCompleted: 0,
            averageDaily: 0,
            topCategories: []
          }
        }
      }
    }
  }

  /**
   * Get personalized course recommendations
   * @param limit - Number of recommendations to return
   * @returns Promise<CourseRecommendation[]>
   */
  async getRecommendations(limit: number = 5): Promise<CourseRecommendation[]> {
    try {
      const response: AxiosResponse<ApiResponse<{ recommendations: CourseRecommendation[] }>> = await api.get(
        `${this.recommendationsEndpoint}/courses`,
        {
          params: { limit }
        }
      )

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch course recommendations')
      }

      return response.data.data.recommendations
    } catch (error: any) {
      console.error('Get recommendations error:', error)
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.')
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch course recommendations. Please try again.'
      )
    }
  }

  /**
   * Get progress for all enrolled courses
   * @param status - Filter by enrollment status
   * @returns Promise<CourseProgress[]>
   */
  async getProgressByCourse(status?: 'active' | 'completed' | 'all'): Promise<{
    courses: CourseProgress[]
    totalCount: number
  }> {
    try {
      const params = status ? { status } : {}
      
      const response: AxiosResponse<ApiResponse<{
        courses: CourseProgress[]
        totalCount: number
      }>> = await api.get(
        `${this.progressEndpoint}/courses`,
        { params }
      )

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch course progress')
      }

      return response.data.data
    } catch (error: any) {
      console.error('Get progress by course error:', error)
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.')
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch course progress. Please try again.'
      )
    }
  }
}

// Export singleton instance
export const dashboardService = new DashboardService()

// Export types for use in components
export type {
  DashboardStats,
  Achievement,
  DailyActivity,
  WeeklyStats,
  MonthlyStats,
  CourseRecommendation,
  RecommendedCourse,
  RecommendationReason,
  CourseProgress
}

// Export default
export default dashboardService
