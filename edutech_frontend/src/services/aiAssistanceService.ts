import api from '@/lib/api'

export interface AIInlineRequest {
  text: string
  action: 'explanation' | 'summary' | 'translate_vi' | 'translate_en' | 'ask_questions'
  lesson_id: number
  context?: string
}

export interface AIInlineResponse {
  result: string
  action: string
  tokens_used: number
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PersonalizedLearningRequest {}

export interface PersonalizedLearningResponse {
  next_lesson_suggestion: string
  learning_tips: string
  knowledge_gaps: string
  user_progress_summary: string
  tokens_used: number
}

export interface UserLearningData {
  name: string
  user_id: number
  stats: {
    total_lessons: number
    total_notes: number
    total_categories: number
    learning_streak: number
  }
  recent_lessons: string[]
  category_distribution: Array<{
    id: number
    name: string
    note_count: number
  }>
  learning_goals: Array<{
    id: number
    description: string
    is_active: boolean
    progress: number
    target_date?: string
  }>
  quiz_performance: {
    average_score: number
    total_quizzes: number
    recent_trend: string
  }
  study_patterns: {
    most_active_day: string
    weekly_activity: Record<string, number>
    total_recent_activity: number
  }
}

class AIAssistanceService {
  async getInlineAssistance(request: AIInlineRequest): Promise<AIInlineResponse> {
    try {
      const response = await api.post('/ai/inline-assistance', request)
      return response.data
    } catch (error: unknown) {
      console.error('AI inline assistance error:', error)
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 
          'Failed to generate AI assistance. Please try again.'
      throw new Error(errorMessage)
    }
  }

  async getPersonalizedLearning(request: PersonalizedLearningRequest = {}): Promise<PersonalizedLearningResponse> {
    try {
      const response = await api.post('/ai/personalized-learning', request)
      return response.data
    } catch (error: unknown) {
      console.error('Personalized learning error:', error)
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 
          'Failed to generate learning suggestions. Please try again.'
      throw new Error(errorMessage)
    }
  }

  async getUserLearningData(): Promise<UserLearningData> {
    try {
      const response = await api.get('/ai/learning-data')
      return response.data.data
    } catch (error: unknown) {
      console.error('User learning data error:', error)
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 
          'Failed to retrieve learning data. Please try again.'
      throw new Error(errorMessage)
    }
  }
}

export const aiAssistanceService = new AIAssistanceService() 