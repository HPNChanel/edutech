import { api } from './api'
import type { Quiz, QuizQuestion } from '../types/lesson'

export const quizService = {
  async getAll(): Promise<Quiz[]> {
    const response = await api.get('/quizzes')
    return response.data
  },

  async getById(id: number): Promise<Quiz> {
    const response = await api.get(`/quizzes/${id}`)
    return response.data
  },

  async getByLessonId(lessonId: number): Promise<Quiz> {
    const response = await api.get(`/quizzes/lesson/${lessonId}`)
    return response.data
  },

  async getQuestionsByLessonId(lessonId: number): Promise<QuizQuestion[]> {
    const response = await api.get(`/lessons/${lessonId}/questions`)
    return response.data
  },

  async create(quiz: Partial<Quiz>): Promise<Quiz> {
    const response = await api.post('/quizzes', quiz)
    return response.data
  },

  async createQuestion(question: Partial<QuizQuestion>): Promise<QuizQuestion> {
    const response = await api.post('/questions', question)
    return response.data
  },

  async update(id: number, quiz: Partial<Quiz>): Promise<Quiz> {
    const response = await api.put(`/quizzes/${id}`, quiz)
    return response.data
  },

  async updateQuestion(id: number, question: Partial<QuizQuestion>): Promise<QuizQuestion> {
    const response = await api.put(`/questions/${id}`, question)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/quizzes/${id}`)
  },

  async deleteQuestion(id: number): Promise<void> {
    await api.delete(`/questions/${id}`)
  },

  async generateQuestionsForLesson(lessonId: number): Promise<QuizQuestion[]> {
    const response = await api.post(`/quizzes/generate/${lessonId}`)
    return response.data
  },

  async submitQuizAnswer(questionId: number, answer: string): Promise<{ isCorrect: boolean }> {
    const response = await api.post(`/questions/${questionId}/check-answer`, { answer })
    return response.data
  }
}
