import { create } from 'zustand'
import { lessonService } from '../services/lessonService'
import type { Lesson } from '../types/lesson'

interface LessonState {
  lessons: Lesson[]
  currentLesson: Lesson | null
  loading: boolean
  error: string | null
  fetchLessons: () => Promise<void>
  fetchLessonById: (id: number) => Promise<void>
  createLesson: (lesson: Partial<Lesson>) => Promise<void>
  updateLesson: (id: number, lesson: Partial<Lesson>) => Promise<void>
  deleteLesson: (id: number) => Promise<void>
}

export const useLessonStore = create<LessonState>((set) => ({
  lessons: [],
  currentLesson: null,
  loading: false,
  error: null,

  fetchLessons: async () => {
    set({ loading: true, error: null })
    try {
      const lessons = await lessonService.getAll()
      set({ lessons, loading: false })
    } catch (error) {
      console.error('Error fetching lessons:', error)
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch lessons' 
      })
    }
  },

  fetchLessonById: async (id) => {
    set({ loading: true, error: null })
    try {
      const lesson = await lessonService.getById(id)
      set({ currentLesson: lesson, loading: false })
    } catch (error) {
      console.error(`Error fetching lesson ${id}:`, error)
      set({
        loading: false,
        error: error instanceof Error ? error.message : `Failed to fetch lesson ${id}`
      })
    }
  },

  createLesson: async (lesson) => {
    set({ loading: true, error: null })
    try {
      const newLesson = await lessonService.create(lesson)
      set((state) => ({ 
        lessons: [...state.lessons, newLesson],
        currentLesson: newLesson,
        loading: false 
      }))
    } catch (error) {
      console.error('Error creating lesson:', error)
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to create lesson'
      })
    }
  },

  updateLesson: async (id, lesson) => {
    set({ loading: true, error: null })
    try {
      const updatedLesson = await lessonService.update(id, lesson)
      set((state) => ({ 
        lessons: state.lessons.map(l => l.id === id ? updatedLesson : l),
        currentLesson: state.currentLesson?.id === id ? updatedLesson : state.currentLesson,
        loading: false 
      }))
    } catch (error) {
      console.error(`Error updating lesson ${id}:`, error)
      set({
        loading: false,
        error: error instanceof Error ? error.message : `Failed to update lesson ${id}`
      })
    }
  },

  deleteLesson: async (id) => {
    set({ loading: true, error: null })
    try {
      await lessonService.delete(id)
      set((state) => ({ 
        lessons: state.lessons.filter(l => l.id !== id),
        currentLesson: state.currentLesson?.id === id ? null : state.currentLesson,
        loading: false 
      }))
    } catch (error) {
      console.error(`Error deleting lesson ${id}:`, error)
      set({
        loading: false,
        error: error instanceof Error ? error.message : `Failed to delete lesson ${id}`
      })
    }
  }
}))
