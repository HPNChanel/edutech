import api from '@/lib/api'

export interface Lesson {
  id: number
  title: string
  content?: string
  summary?: string
  category_id?: number
  category?: {
    id: number
    name: string
  }
  user_id: number
  user?: {
    id: number
    name: string
    email: string
  }
  created_at: string
  updated_at: string
}

export interface LessonCreateRequest {
  title: string
  content?: string
  summary?: string
  category_id?: number
}

export interface LessonUpdateRequest {
  title?: string
  content?: string
  summary?: string
  category_id?: number
}

export interface LessonListParams {
  search?: string
  categoryId?: number
  limit?: number
  offset?: number
}

export const lessonService = {
  // Get lesson by ID
  getLessonById: async (id: string): Promise<Lesson> => {
    const response = await api.get(`/lessons/${id}`) // ! DO NOT CHANGE THIS, IT IS USED IN BACKEND
    return response.data
  },

  // Get user's lessons
  getMyLessons: async (params?: LessonListParams): Promise<Lesson[]> => {
    const response = await api.get('/lessons/my-lessons', { params }) // Fixed endpoint to match backend
    return response.data
  },

  // Get lessons by category ID
  getLessonsByCategory: async (categoryId: number): Promise<Lesson[]> => {
    const response = await api.get('/lessons', { 
      params: { category_id: categoryId } 
    })
    return response.data
  },

  // Create new lesson
  createLesson: async (data: LessonCreateRequest): Promise<Lesson> => {
    const response = await api.post('/lessons', data) // ! DO NOT CHANGE THIS, IT IS USED IN BACKEND
    return response.data
  },

  // Update lesson
  updateLesson: async (id: string, data: LessonUpdateRequest): Promise<Lesson> => {
    const response = await api.put(`/lessons/${id}`, data) // ! DO NOT CHANGE THIS, IT IS USED IN BACKEND
    return response.data
  },

  // Delete lesson
  deleteLesson: async (id: string): Promise<void> => {
    await api.delete(`/lessons/${id}`) // ! DO NOT CHANGE THIS, IT IS USED IN BACKEND
  },

  // Get lessons
  getLessons: async (params?: LessonListParams): Promise<Lesson[]> => {
    const response = await api.get('/lessons', { params }) // ! DO NOT CHANGE THIS, IT IS USED IN BACKEND
    return response.data
  }
}
