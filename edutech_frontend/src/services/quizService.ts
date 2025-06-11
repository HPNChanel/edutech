import { api } from '@/lib/api'
import { AxiosResponse } from 'axios'

// Quiz Question Interfaces
export interface QuizOption {
  id: string
  text: string
  isCorrect?: boolean // Only available after submission
}

export interface QuizQuestion {
  id: string
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay'
  question: string
  options?: QuizOption[]
  points: number
  timeLimit?: number // in seconds
  explanation?: string
  correctAnswer?: string | number // Only available after submission
  order: number
}

// Quiz Interfaces
export interface Quiz {
  id: string
  title: string
  description?: string
  lessonId: string
  lessonTitle?: string
  instructions?: string
  timeLimit?: number // in minutes
  passingScore: number // percentage (0-100)
  maxAttempts?: number
  shuffleQuestions: boolean
  shuffleOptions: boolean
  showResults: boolean
  allowReview: boolean
  questions: QuizQuestion[]
  totalQuestions: number
  totalPoints: number
  difficulty: 'easy' | 'medium' | 'hard'
  createdAt: string
  updatedAt?: string
  isActive: boolean
}

// Quiz Attempt Interfaces
export interface QuizAttempt {
  id: string
  quizId: string
  userId: string
  startedAt: string
  submittedAt?: string
  completedAt?: string
  status: 'in_progress' | 'submitted' | 'completed' | 'abandoned' | 'expired'
  timeSpent?: number // in seconds
  score?: number // percentage (0-100)
  pointsEarned?: number
  totalPoints: number
  passed?: boolean
  answers: { [questionId: string]: QuizAnswer }
  attemptNumber: number
  isReviewable: boolean
}

export interface QuizAnswer {
  questionId: string
  answer: string | string[] | number | boolean
  timeSpent?: number // in seconds
  isCorrect?: boolean // Only available after submission
  pointsEarned?: number
  submittedAt?: string
}

// Quiz Result Interfaces
export interface QuizResult {
  attemptId: string
  quizId: string
  userId: string
  score: number // percentage (0-100)
  pointsEarned: number
  totalPoints: number
  correctAnswers: number
  totalQuestions: number
  passed: boolean
  timeSpent: number // in seconds
  submittedAt: string
  completedAt: string
  answers: QuizResultAnswer[]
  feedback?: string
  nextAttemptAllowed?: boolean
  nextAttemptAvailableAt?: string
}

export interface QuizResultAnswer {
  questionId: string
  question: string
  userAnswer: string | string[] | number | boolean
  correctAnswer: string | string[] | number | boolean
  isCorrect: boolean
  pointsEarned: number
  maxPoints: number
  explanation?: string
  timeSpent?: number
}

// Request/Response Interfaces
export interface StartQuizData {
  quiz_id: string
  settings?: {
    shuffle_questions?: boolean
    shuffle_options?: boolean
  }
}

export interface StartQuizResponse {
  success: boolean
  attempt: QuizAttempt
  quiz: Quiz
  message: string
  timeRemaining?: number // in seconds
}

export interface SubmitQuizData {
  attempt_id: string
  answers: { [questionId: string]: any }
  time_spent?: number
  force_submit?: boolean // For auto-submit when time expires
}

export interface SubmitQuizResponse {
  success: boolean
  result: QuizResult
  message: string
  achievements?: {
    id: string
    title: string
    description: string
    type: string
    earnedAt: string
  }[]
}

// Query Parameters
export interface GetQuizzesParams {
  lesson_id?: string
  status?: 'active' | 'inactive' | 'all'
  difficulty?: 'easy' | 'medium' | 'hard'
  page?: number
  limit?: number
  sort_by?: 'created_at' | 'title' | 'difficulty' | 'passing_score'
  sort_order?: 'asc' | 'desc'
}

export interface GetAttemptsParams {
  quiz_id?: string
  user_id?: string
  status?: QuizAttempt['status']
  page?: number
  limit?: number
  sort_by?: 'started_at' | 'score' | 'time_spent'
  sort_order?: 'asc' | 'desc'
}

// Error Interfaces
export interface QuizServiceError {
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
  errors?: QuizServiceError[]
}

// Optimistic Update Types
type OptimisticUpdateCallback<T> = (data: T) => void
type RollbackCallback = () => void

/**
 * Quiz Service Class
 * Handles all quiz-related API operations
 */
class QuizService {
  private readonly baseEndpoint = '/quiz'
  private readonly attemptsEndpoint = '/quiz/attempts'

  /**
   * Get a quiz by ID with all questions and details
   * @param quizId - The quiz ID to fetch
   * @param includeAnswers - Whether to include correct answers (for review mode)
   * @returns Promise<Quiz>
   */
  async getQuiz(quizId: string, includeAnswers: boolean = false): Promise<Quiz> {
    try {
      if (!quizId || quizId.trim() === '') {
        throw new Error('Quiz ID is required')
      }

      const params = new URLSearchParams()
      if (includeAnswers) {
        params.append('include_answers', 'true')
      }

      const response: AxiosResponse<ApiResponse<Quiz>> = await api.get(
        `${this.baseEndpoint}/${quizId}?${params.toString()}`
      )

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch quiz')
      }

      return response.data.data
    } catch (error: any) {
      console.error('Get quiz error:', error)
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.')
      }
      
      if (error.response?.status === 404) {
        throw new Error('Quiz not found. It may have been removed or you may not have access.')
      }
      
      if (error.response?.status === 403) {
        throw new Error('Access denied. You do not have permission to view this quiz.')
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch quiz. Please try again.'
      )
    }
  }

  /**
   * Get quiz by lesson ID
   * @param lessonId - The lesson ID to get quiz for
   * @returns Promise<Quiz>
   */
  async getQuizByLesson(lessonId: string): Promise<Quiz> {
    try {
      const response: AxiosResponse<ApiResponse<Quiz>> = await api.get(
        `${this.baseEndpoint}/lesson/${lessonId}`
      )

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch quiz')
      }

      return response.data.data
    } catch (error: any) {
      console.error('Get quiz by lesson error:', error)
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.')
      }
      
      if (error.response?.status === 404) {
        throw new Error('Quiz not found for this lesson.')
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch quiz. Please try again.'
      )
    }
  }

  /**
   * Start a quiz attempt
   * @param quizData - Quiz start data
   * @returns Promise<StartQuizResponse>
   */
  async startQuiz(quizData: StartQuizData): Promise<StartQuizResponse> {
    try {
      const response: AxiosResponse<StartQuizResponse> = await api.post(
        `${this.baseEndpoint}/start`,
        quizData
      )

      return response.data
    } catch (error: any) {
      console.error('Start quiz error:', error)
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.')
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to start quiz. Please try again.'
      )
    }
  }

  /**
   * Submit quiz answers
   * @param submitData - Quiz submission data
   * @returns Promise<SubmitQuizResponse>
   */
  async submitQuiz(submitData: SubmitQuizData): Promise<SubmitQuizResponse> {
    try {
      const response: AxiosResponse<SubmitQuizResponse> = await api.post(
        `${this.baseEndpoint}/submit`,
        submitData
      )

      return response.data
    } catch (error: any) {
      console.error('Submit quiz error:', error)
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.')
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to submit quiz. Please try again.'
      )
    }
  }

  /**
   * Submit quiz answers and complete the attempt
   * @param submitData - Quiz submission data
   * @param onOptimisticUpdate - Callback for optimistic UI update
   * @param onRollback - Callback to rollback optimistic update on failure
   * @returns Promise<SubmitQuizResponse>
   */
  async submitQuiz(
    submitData: SubmitQuizData,
    onOptimisticUpdate?: OptimisticUpdateCallback<{ status: 'submitted' }>,
    onRollback?: RollbackCallback
  ): Promise<SubmitQuizResponse> {
    // Perform optimistic update
    if (onOptimisticUpdate) {
      onOptimisticUpdate({ status: 'submitted' })
    }

    try {
      if (!submitData.attempt_id || submitData.attempt_id.trim() === '') {
        throw new Error('Attempt ID is required')
      }

      if (!submitData.answers || Object.keys(submitData.answers).length === 0) {
        throw new Error('At least one answer is required')
      }

      const response: AxiosResponse<SubmitQuizResponse> = await api.post(
        `${this.baseEndpoint}/submit`,
        submitData
      )

      return response.data
    } catch (error: any) {
      console.error('Submit quiz error:', error)
      
      // Rollback optimistic update on failure
      if (onRollback) {
        onRollback()
      }
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.')
      }
      
      if (error.response?.status === 404) {
        throw new Error('Quiz attempt not found.')
      }
      
      if (error.response?.status === 403) {
        throw new Error('Access denied. You may not have permission to submit this attempt.')
      }
      
      if (error.response?.status === 409) {
        throw new Error('This quiz attempt has already been submitted.')
      }
      
      if (error.response?.status === 410) {
        throw new Error('This quiz attempt has expired.')
      }
      
      if (error.response?.status === 400) {
        const validationErrors = error.response.data?.errors
        if (validationErrors && validationErrors.length > 0) {
          throw new Error(validationErrors.map((err: QuizServiceError) => err.message).join(', '))
        }
        throw new Error('Invalid answers format. Please check your responses.')
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to submit quiz. Please try again.'
      )
    }
  }

  /**
   * Get quiz result by attempt ID
   * @param attemptId - The quiz attempt ID
   * @returns Promise<QuizResult>
   */
  async getQuizResult(attemptId: string): Promise<QuizResult> {
    try {
      if (!attemptId || attemptId.trim() === '') {
        throw new Error('Attempt ID is required')
      }

      const response: AxiosResponse<ApiResponse<QuizResult>> = await api.get(
        `${this.attemptsEndpoint}/${attemptId}/result`
      )

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch quiz result')
      }

      return response.data.data
    } catch (error: any) {
      console.error('Get quiz result error:', error)
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.')
      }
      
      if (error.response?.status === 404) {
        throw new Error('Quiz result not found.')
      }
      
      if (error.response?.status === 403) {
        throw new Error('Access denied. You do not have permission to view this result.')
      }
      
      if (error.response?.status === 409) {
        throw new Error('Quiz attempt is not yet completed. Please submit your answers first.')
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch quiz result. Please try again.'
      )
    }
  }

  /**
   * Get quiz attempt by ID
   * @param attemptId - The attempt ID to fetch
   * @returns Promise<QuizAttempt>
   */
  async getQuizAttempt(attemptId: string): Promise<QuizAttempt> {
    try {
      if (!attemptId || attemptId.trim() === '') {
        throw new Error('Attempt ID is required')
      }

      const response: AxiosResponse<ApiResponse<QuizAttempt>> = await api.get(
        `${this.attemptsEndpoint}/${attemptId}`
      )

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch quiz attempt')
      }

      return response.data.data
    } catch (error: any) {
      console.error('Get quiz attempt error:', error)
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.')
      }
      
      if (error.response?.status === 404) {
        throw new Error('Quiz attempt not found.')
      }
      
      if (error.response?.status === 403) {
        throw new Error('Access denied. You do not have permission to view this attempt.')
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch quiz attempt. Please try again.'
      )
    }
  }

  /**
   * Get all quiz attempts for a quiz
   * @param quizId - The quiz ID
   * @param params - Query parameters for filtering
   * @returns Promise<QuizAttempt[]>
   */
  async getQuizAttempts(quizId: string, params: GetAttemptsParams = {}): Promise<QuizAttempt[]> {
    try {
      if (!quizId || quizId.trim() === '') {
        throw new Error('Quiz ID is required')
      }

      const queryParams = new URLSearchParams()
      queryParams.append('quiz_id', quizId)
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString())
        }
      })

      const response: AxiosResponse<ApiResponse<{ attempts: QuizAttempt[]; total: number }>> = await api.get(
        `${this.attemptsEndpoint}?${queryParams.toString()}`
      )

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch quiz attempts')
      }

      return response.data.data.attempts
    } catch (error: any) {
      console.error('Get quiz attempts error:', error)
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.')
      }
      
      if (error.response?.status === 404) {
        throw new Error('Quiz not found.')
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch quiz attempts. Please try again.'
      )
    }
  }

  /**
   * Save answer for a question (auto-save functionality)
   * @param attemptId - The attempt ID
   * @param questionId - The question ID
   * @param answer - The answer to save
   * @returns Promise<void>
   */
  async saveAnswer(attemptId: string, questionId: string, answer: any): Promise<void> {
    try {
      if (!attemptId || attemptId.trim() === '') {
        throw new Error('Attempt ID is required')
      }

      if (!questionId || questionId.trim() === '') {
        throw new Error('Question ID is required')
      }

      await api.post(
        `${this.attemptsEndpoint}/${attemptId}/answers`,
        {
          question_id: questionId,
          answer: answer,
          timestamp: new Date().toISOString()
        }
      )
    } catch (error: any) {
      console.error('Save answer error:', error)
      
      // Don't throw error for auto-save failures to avoid disrupting user experience
      if (error.response?.status !== 409) { // Allow duplicate saves
        console.warn('Failed to auto-save answer:', error.message)
      }
    }
  }

  /**
   * Abandon/cancel a quiz attempt
   * @param attemptId - The attempt ID to abandon
   * @returns Promise<void>
   */
  async abandonQuizAttempt(attemptId: string): Promise<void> {
    try {
      if (!attemptId || attemptId.trim() === '') {
        throw new Error('Attempt ID is required')
      }

      const response: AxiosResponse<ApiResponse<{ message: string }>> = await api.post(
        `${this.attemptsEndpoint}/${attemptId}/abandon`
      )

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to abandon quiz attempt')
      }
    } catch (error: any) {
      console.error('Abandon quiz attempt error:', error)
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.')
      }
      
      if (error.response?.status === 404) {
        throw new Error('Quiz attempt not found.')
      }
      
      if (error.response?.status === 409) {
        throw new Error('Cannot abandon a completed quiz attempt.')
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to abandon quiz attempt. Please try again.'
      )
    }
  }

  /**
   * Get quiz statistics for a user
   * @param quizId - The quiz ID (optional, for specific quiz stats)
   * @returns Promise<QuizStats>
   */
  async getQuizStats(quizId?: string): Promise<{
    totalAttempts: number
    averageScore: number
    bestScore: number
    timeSpent: number
    passRate: number
    lastAttemptAt?: string
  }> {
    try {
      const params = new URLSearchParams()
      if (quizId) {
        params.append('quiz_id', quizId)
      }

      const response: AxiosResponse<ApiResponse<any>> = await api.get(
        `${this.baseEndpoint}/stats?${params.toString()}`
      )

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch quiz statistics')
      }

      return response.data.data
    } catch (error: any) {
      console.error('Get quiz stats error:', error)
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.')
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch quiz statistics. Please try again.'
      )
    }
  }

  /**
   * Calculate quiz progress based on current answers
   * @param quiz - The quiz object
   * @param answers - Current answers
   * @returns Progress information
   */
  calculateProgress(quiz: Quiz, answers: { [questionId: string]: any }): {
    answeredQuestions: number
    totalQuestions: number
    percentage: number
    unansweredQuestions: string[]
  } {
    const answeredQuestions = Object.keys(answers).filter(
      questionId => answers[questionId] !== undefined && answers[questionId] !== null && answers[questionId] !== ''
    ).length

    const unansweredQuestions = quiz.questions
      .filter(q => !answers[q.id] || answers[q.id] === undefined || answers[q.id] === null || answers[q.id] === '')
      .map(q => q.id)

    return {
      answeredQuestions,
      totalQuestions: quiz.totalQuestions,
      percentage: Math.round((answeredQuestions / quiz.totalQuestions) * 100),
      unansweredQuestions
    }
  }

  /**
   * Calculate remaining time for a quiz attempt
   * @param attempt - The quiz attempt
   * @param quiz - The quiz object
   * @returns Remaining time in seconds (null if no time limit)
   */
  calculateRemainingTime(attempt: QuizAttempt, quiz: Quiz): number | null {
    if (!quiz.timeLimit) return null

    const startTime = new Date(attempt.startedAt).getTime()
    const currentTime = Date.now()
    const timeLimit = quiz.timeLimit * 60 * 1000 // Convert minutes to milliseconds
    const elapsed = currentTime - startTime
    const remaining = timeLimit - elapsed

    return Math.max(0, Math.floor(remaining / 1000)) // Return seconds
  }

  /**
   * Validate answers before submission
   * @param quiz - The quiz object
   * @param answers - The answers to validate
   * @returns Validation result
   */
  validateAnswers(quiz: Quiz, answers: { [questionId: string]: any }): {
    isValid: boolean
    errors: string[]
    missingAnswers: string[]
  } {
    const errors: string[] = []
    const missingAnswers: string[] = []

    quiz.questions.forEach(question => {
      const answer = answers[question.id]

      if (answer === undefined || answer === null || answer === '') {
        missingAnswers.push(question.id)
        errors.push(`Question ${question.order}: Answer is required`)
        return
      }

      // Type-specific validation
      if (question.type === 'multiple_choice' && question.options) {
        const validOptionIds = question.options.map(opt => opt.id)
        if (Array.isArray(answer)) {
          const invalidOptions = answer.filter(opt => !validOptionIds.includes(opt))
          if (invalidOptions.length > 0) {
            errors.push(`Question ${question.order}: Invalid option(s) selected`)
          }
        } else if (!validOptionIds.includes(answer)) {
          errors.push(`Question ${question.order}: Invalid option selected`)
        }
      }

      if (question.type === 'short_answer' && typeof answer === 'string' && answer.length > 1000) {
        errors.push(`Question ${question.order}: Answer is too long (maximum 1000 characters)`)
      }

      if (question.type === 'essay' && typeof answer === 'string' && answer.length > 5000) {
        errors.push(`Question ${question.order}: Answer is too long (maximum 5000 characters)`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors,
      missingAnswers
    }
  }
}

// Export singleton instance
export const quizService = new QuizService()

// Export types for use in components
export type {
  Quiz,
  QuizQuestion,
  QuizOption,
  QuizAttempt,
  QuizAnswer,
  QuizResult,
  QuizResultAnswer,
  StartQuizData,
  StartQuizResponse,
  SubmitQuizData,
  SubmitQuizResponse,
  GetQuizzesParams,
  GetAttemptsParams,
  QuizServiceError
}

// Export utility constants
export const QUIZ_DIFFICULTY_COLORS = {
  easy: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  hard: 'bg-red-100 text-red-800 border-red-200'
} as const

export const QUIZ_STATUS_COLORS = {
  in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  submitted: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  abandoned: 'bg-gray-100 text-gray-800 border-gray-200',
  expired: 'bg-red-100 text-red-800 border-red-200'
} as const

// Export utility functions
export const formatQuizTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export const calculatePassingGrade = (score: number, passingScore: number): 'pass' | 'fail' => {
  return score >= passingScore ? 'pass' : 'fail'
}

export const getScoreColor = (score: number, passingScore: number): string => {
  if (score >= passingScore) {
    return 'text-green-600'
  } else if (score >= passingScore * 0.7) {
    return 'text-yellow-600'
  }
  return 'text-red-600'
}

// Export default
export default quizService
