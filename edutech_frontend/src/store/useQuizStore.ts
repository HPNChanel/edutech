import { create } from 'zustand'
import { quizService } from '../services/quizService'
import type { Quiz, QuizQuestion } from '../types/lesson'

interface QuizState {
  quizzes: Quiz[]
  currentQuiz: Quiz | null
  questions: QuizQuestion[]
  lessonQuestions: Record<number, QuizQuestion[]>
  loading: boolean
  error: string | null
  fetchQuizzes: () => Promise<void>
  fetchQuizById: (id: number) => Promise<void>
  fetchQuizByLessonId: (lessonId: number) => Promise<void>
  fetchQuestionsByLessonId: (lessonId: number) => Promise<void>
  createQuiz: (quiz: Partial<Quiz>) => Promise<void>
  createQuestion: (question: Partial<QuizQuestion>) => Promise<void>
  updateQuiz: (id: number, quiz: Partial<Quiz>) => Promise<void>
  updateQuestion: (id: number, question: Partial<QuizQuestion>) => Promise<void>
  deleteQuiz: (id: number) => Promise<void>
  deleteQuestion: (id: number) => Promise<void>
  generateQuestionsForLesson: (lessonId: number) => Promise<void>
  submitQuizAnswer: (questionId: number, answer: string) => Promise<{ isCorrect: boolean }>
}

export const useQuizStore = create<QuizState>((set, get) => ({
  quizzes: [],
  currentQuiz: null,
  questions: [],
  lessonQuestions: {},
  loading: false,
  error: null,

  fetchQuizzes: async () => {
    set({ loading: true, error: null })
    try {
      const quizzes = await quizService.getAll()
      set({ quizzes, loading: false })
    } catch (error) {
      console.error('Error fetching quizzes:', error)
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch quizzes' 
      })
    }
  },

  fetchQuizById: async (id) => {
    set({ loading: true, error: null })
    try {
      const quiz = await quizService.getById(id)
      set({ currentQuiz: quiz, loading: false })
    } catch (error) {
      console.error(`Error fetching quiz ${id}:`, error)
      set({
        loading: false,
        error: error instanceof Error ? error.message : `Failed to fetch quiz ${id}`
      })
    }
  },

  fetchQuizByLessonId: async (lessonId) => {
    set({ loading: true, error: null })
    try {
      const quiz = await quizService.getByLessonId(lessonId)
      set({ currentQuiz: quiz, loading: false })
    } catch (error) {
      console.error(`Error fetching quiz for lesson ${lessonId}:`, error)
      set({
        loading: false,
        error: error instanceof Error ? error.message : `Failed to fetch quiz for lesson ${lessonId}`
      })
    }
  },

  fetchQuestionsByLessonId: async (lessonId) => {
    set({ loading: true, error: null })
    try {
      const questions = await quizService.getQuestionsByLessonId(lessonId)
      set((state) => ({ 
        lessonQuestions: { ...state.lessonQuestions, [lessonId]: questions },
        loading: false 
      }))
    } catch (error) {
      console.error(`Error fetching questions for lesson ${lessonId}:`, error)
      set({
        loading: false,
        error: error instanceof Error ? error.message : `Failed to fetch questions for lesson ${lessonId}`
      })
    }
  },

  createQuiz: async (quiz) => {
    set({ loading: true, error: null })
    try {
      const newQuiz = await quizService.create(quiz)
      set((state) => ({ 
        quizzes: [...state.quizzes, newQuiz],
        currentQuiz: newQuiz,
        loading: false 
      }))
    } catch (error) {
      console.error('Error creating quiz:', error)
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to create quiz'
      })
    }
  },

  createQuestion: async (question) => {
    set({ loading: true, error: null })
    try {
      const newQuestion = await quizService.createQuestion(question)
      set((state) => {
        // Update global questions array
        const questions = [...state.questions, newQuestion]
        
        // Update lesson-specific questions if this question belongs to a lesson we've already loaded
        const lessonQuestions = { ...state.lessonQuestions }
        if (question.lesson_id && lessonQuestions[question.lesson_id]) {
          lessonQuestions[question.lesson_id] = [...lessonQuestions[question.lesson_id], newQuestion]
        }
        
        return { questions, lessonQuestions, loading: false }
      })
    } catch (error) {
      console.error('Error creating question:', error)
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to create question'
      })
    }
  },

  updateQuiz: async (id, quiz) => {
    set({ loading: true, error: null })
    try {
      const updatedQuiz = await quizService.update(id, quiz)
      set((state) => ({ 
        quizzes: state.quizzes.map(q => q.id === id ? updatedQuiz : q),
        currentQuiz: state.currentQuiz?.id === id ? updatedQuiz : state.currentQuiz,
        loading: false 
      }))
    } catch (error) {
      console.error(`Error updating quiz ${id}:`, error)
      set({
        loading: false,
        error: error instanceof Error ? error.message : `Failed to update quiz ${id}`
      })
    }
  },

  updateQuestion: async (id, question) => {
    set({ loading: true, error: null })
    try {
      const updatedQuestion = await quizService.updateQuestion(id, question)
      set((state) => {
        // Update global questions array
        const questions = state.questions.map(q => q.id === id ? updatedQuestion : q)
        
        // Update lesson-specific questions if needed
        const lessonQuestions = { ...state.lessonQuestions }
        Object.keys(lessonQuestions).forEach(lessonId => {
          const lessonIdNum = Number(lessonId)
          if (lessonQuestions[lessonIdNum].some(q => q.id === id)) {
            lessonQuestions[lessonIdNum] = lessonQuestions[lessonIdNum].map(q => 
              q.id === id ? updatedQuestion : q
            )
          }
        })
        
        return { questions, lessonQuestions, loading: false }
      })
    } catch (error) {
      console.error(`Error updating question ${id}:`, error)
      set({
        loading: false,
        error: error instanceof Error ? error.message : `Failed to update question ${id}`
      })
    }
  },

  deleteQuiz: async (id) => {
    set({ loading: true, error: null })
    try {
      await quizService.delete(id)
      set((state) => ({ 
        quizzes: state.quizzes.filter(q => q.id !== id),
        currentQuiz: state.currentQuiz?.id === id ? null : state.currentQuiz,
        loading: false 
      }))
    } catch (error) {
      console.error(`Error deleting quiz ${id}:`, error)
      set({
        loading: false,
        error: error instanceof Error ? error.message : `Failed to delete quiz ${id}`
      })
    }
  },

  deleteQuestion: async (id) => {
    set({ loading: true, error: null })
    try {
      await quizService.deleteQuestion(id)
      set((state) => {
        // Update global questions array
        const questions = state.questions.filter(q => q.id !== id)
        
        // Update lesson-specific questions arrays
        const lessonQuestions = { ...state.lessonQuestions }
        Object.keys(lessonQuestions).forEach(lessonId => {
          const lessonIdNum = Number(lessonId)
          if (lessonQuestions[lessonIdNum].some(q => q.id === id)) {
            lessonQuestions[lessonIdNum] = lessonQuestions[lessonIdNum].filter(q => q.id !== id)
          }
        })
        
        return { questions, lessonQuestions, loading: false }
      })
    } catch (error) {
      console.error(`Error deleting question ${id}:`, error)
      set({
        loading: false,
        error: error instanceof Error ? error.message : `Failed to delete question ${id}`
      })
    }
  },

  generateQuestionsForLesson: async (lessonId) => {
    set({ loading: true, error: null })
    try {
      const questions = await quizService.generateQuestionsForLesson(lessonId)
      set((state) => ({ 
        lessonQuestions: { ...state.lessonQuestions, [lessonId]: questions },
        loading: false 
      }))
    } catch (error) {
      console.error(`Error generating questions for lesson ${lessonId}:`, error)
      set({
        loading: false,
        error: error instanceof Error ? error.message : `Failed to generate questions for lesson ${lessonId}`
      })
    }
  },

  submitQuizAnswer: async (questionId, answer) => {
    try {
      return await quizService.submitQuizAnswer(questionId, answer)
    } catch (error) {
      console.error(`Error submitting answer for question ${questionId}:`, error)
      throw error
    }
  }
}))
