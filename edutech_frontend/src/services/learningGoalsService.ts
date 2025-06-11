import { api } from '@/lib/api'

export interface LearningGoal {
  id: number
  user_id: number
  title: string
  description?: string
  target_date?: string
  is_completed: boolean
  created_at: string
  updated_at: string
}

export interface CreateLearningGoal {
  title: string
  description?: string
  target_date?: string
}

export interface UpdateLearningGoal {
  title?: string
  description?: string
  target_date?: string
  is_completed?: boolean
}

export const learningGoalsService = {
  // Create a new learning goal
  async createGoal(goalData: CreateLearningGoal): Promise<LearningGoal> {
    const response = await api.post('/learning-goals', goalData)
    return response.data
  },

  // Get all learning goals for the user
  async getGoals(completed?: boolean, limit?: number): Promise<LearningGoal[]> {
    const params = new URLSearchParams()
    if (completed !== undefined) params.append('completed', completed.toString())
    if (limit !== undefined) params.append('limit', limit.toString())
    
    const response = await api.get(`/learning-goals?${params.toString()}`)
    return response.data
  },

  // Get today's active learning goals (max 3)
  async getTodayGoals(): Promise<LearningGoal[]> {
    const response = await api.get('/learning-goals/today')
    return response.data
  },

  // Get a specific learning goal
  async getGoal(goalId: number): Promise<LearningGoal> {
    const response = await api.get(`/learning-goals/${goalId}`)
    return response.data
  },

  // Update a learning goal
  async updateGoal(goalId: number, goalData: UpdateLearningGoal): Promise<LearningGoal> {
    const response = await api.put(`/learning-goals/${goalId}`, goalData)
    return response.data
  },

  // Mark a goal as completed
  async completeGoal(goalId: number): Promise<LearningGoal> {
    const response = await api.put(`/learning-goals/${goalId}/complete`)
    return response.data
  },

  // Delete a learning goal
  async deleteGoal(goalId: number): Promise<void> {
    await api.delete(`/learning-goals/${goalId}`)
  }
} 