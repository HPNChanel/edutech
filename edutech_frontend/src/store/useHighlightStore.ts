import { create } from 'zustand'
import { highlightService } from '../services/highlightService'
import type { Highlight } from '../types/highlight'

interface HighlightState {
  highlights: Highlight[]
  lessonHighlights: Record<number, Highlight[]>
  loading: boolean
  error: string | null
  fetchHighlights: () => Promise<void>
  fetchHighlightsByLessonId: (lessonId: number) => Promise<void>
  createHighlight: (highlight: Partial<Highlight>) => Promise<void>
  updateHighlight: (id: number, highlight: Partial<Highlight>) => Promise<void>
  deleteHighlight: (id: number) => Promise<void>
}

export const useHighlightStore = create<HighlightState>((set, get) => ({
  highlights: [],
  lessonHighlights: {},
  loading: false,
  error: null,

  fetchHighlights: async () => {
    set({ loading: true, error: null })
    try {
      const highlights = await highlightService.getAll()
      set({ highlights, loading: false })
    } catch (error) {
      console.error('Error fetching highlights:', error)
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch highlights' 
      })
    }
  },

  fetchHighlightsByLessonId: async (lessonId) => {
    set({ loading: true, error: null })
    try {
      const highlights = await highlightService.getByLessonId(lessonId)
      set((state) => ({ 
        lessonHighlights: { ...state.lessonHighlights, [lessonId]: highlights },
        loading: false 
      }))
    } catch (error) {
      console.error(`Error fetching highlights for lesson ${lessonId}:`, error)
      set({
        loading: false,
        error: error instanceof Error ? error.message : `Failed to fetch highlights for lesson ${lessonId}`
      })
    }
  },

  createHighlight: async (highlight) => {
    set({ loading: true, error: null })
    try {
      const newHighlight = await highlightService.create(highlight)
      set((state) => {
        // Update global highlights array
        const highlights = [...state.highlights, newHighlight]
        
        // Update lesson-specific highlights if this highlight belongs to a lesson we've already loaded
        const lessonHighlights = { ...state.lessonHighlights }
        if (highlight.lesson_id && lessonHighlights[highlight.lesson_id]) {
          lessonHighlights[highlight.lesson_id] = [...lessonHighlights[highlight.lesson_id], newHighlight]
        }
        
        return { highlights, lessonHighlights, loading: false }
      })
    } catch (error) {
      console.error('Error creating highlight:', error)
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to create highlight'
      })
    }
  },

  updateHighlight: async (id, highlight) => {
    set({ loading: true, error: null })
    try {
      const updatedHighlight = await highlightService.update(id, highlight)
      set((state) => {
        // Update global highlights array
        const highlights = state.highlights.map(h => h.id === id ? updatedHighlight : h)
        
        // Update lesson-specific highlights if needed
        const lessonHighlights = { ...state.lessonHighlights }
        Object.keys(lessonHighlights).forEach(lessonId => {
          const lessonIdNum = Number(lessonId)
          if (lessonHighlights[lessonIdNum].some(h => h.id === id)) {
            lessonHighlights[lessonIdNum] = lessonHighlights[lessonIdNum].map(h => 
              h.id === id ? updatedHighlight : h
            )
          }
        })
        
        return { highlights, lessonHighlights, loading: false }
      })
    } catch (error) {
      console.error(`Error updating highlight ${id}:`, error)
      set({
        loading: false,
        error: error instanceof Error ? error.message : `Failed to update highlight ${id}`
      })
    }
  },

  deleteHighlight: async (id) => {
    set({ loading: true, error: null })
    try {
      await highlightService.delete(id)
      set((state) => {
        // Remove from global highlights array
        const highlights = state.highlights.filter(h => h.id !== id)
        
        // Remove from lesson-specific highlights arrays
        const lessonHighlights = { ...state.lessonHighlights }
        Object.keys(lessonHighlights).forEach(lessonId => {
          const lessonIdNum = Number(lessonId)
          if (lessonHighlights[lessonIdNum].some(h => h.id === id)) {
            lessonHighlights[lessonIdNum] = lessonHighlights[lessonIdNum].filter(h => h.id !== id)
          }
        })
        
        return { highlights, lessonHighlights, loading: false }
      })
    } catch (error) {
      console.error(`Error deleting highlight ${id}:`, error)
      set({
        loading: false,
        error: error instanceof Error ? error.message : `Failed to delete highlight ${id}`
      })
    }
  }
}))
