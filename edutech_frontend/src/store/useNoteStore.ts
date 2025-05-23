import { create } from 'zustand'
import { noteService } from '../services/noteService'
import type { Note } from '../types/note'

interface NoteState {
  notes: Note[]
  lessonNotes: Record<number, Note[]>
  loading: boolean
  error: string | null
  fetchNotes: () => Promise<void>
  fetchNotesByLessonId: (lessonId: number) => Promise<void>
  createNote: (note: Partial<Note>) => Promise<void>
  updateNote: (id: number, note: Partial<Note>) => Promise<void>
  deleteNote: (id: number) => Promise<void>
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],
  lessonNotes: {},
  loading: false,
  error: null,

  fetchNotes: async () => {
    set({ loading: true, error: null })
    try {
      const notes = await noteService.getAll()
      set({ notes, loading: false })
    } catch (error) {
      console.error('Error fetching notes:', error)
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch notes' 
      })
    }
  },

  fetchNotesByLessonId: async (lessonId) => {
    set({ loading: true, error: null })
    try {
      const notes = await noteService.getByLessonId(lessonId)
      set((state) => ({ 
        lessonNotes: { ...state.lessonNotes, [lessonId]: notes },
        loading: false 
      }))
    } catch (error) {
      console.error(`Error fetching notes for lesson ${lessonId}:`, error)
      set({
        loading: false,
        error: error instanceof Error ? error.message : `Failed to fetch notes for lesson ${lessonId}`
      })
    }
  },

  createNote: async (note) => {
    set({ loading: true, error: null })
    try {
      const newNote = await noteService.create(note)
      set((state) => {
        // Update global notes array
        const notes = [...state.notes, newNote]
        
        // Update lesson-specific notes if this note belongs to a lesson we've already loaded
        const lessonNotes = { ...state.lessonNotes }
        if (note.lesson_id && lessonNotes[note.lesson_id]) {
          lessonNotes[note.lesson_id] = [...lessonNotes[note.lesson_id], newNote]
        }
        
        return { notes, lessonNotes, loading: false }
      })
    } catch (error) {
      console.error('Error creating note:', error)
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to create note'
      })
    }
  },

  updateNote: async (id, note) => {
    set({ loading: true, error: null })
    try {
      const updatedNote = await noteService.update(id, note)
      set((state) => {
        // Update global notes array
        const notes = state.notes.map(n => n.id === id ? updatedNote : n)
        
        // Update lesson-specific notes if needed
        const lessonNotes = { ...state.lessonNotes }
        Object.keys(lessonNotes).forEach(lessonId => {
          const lessonIdNum = Number(lessonId)
          if (lessonNotes[lessonIdNum].some(n => n.id === id)) {
            lessonNotes[lessonIdNum] = lessonNotes[lessonIdNum].map(n => 
              n.id === id ? updatedNote : n
            )
          }
        })
        
        return { notes, lessonNotes, loading: false }
      })
    } catch (error) {
      console.error(`Error updating note ${id}:`, error)
      set({
        loading: false,
        error: error instanceof Error ? error.message : `Failed to update note ${id}`
      })
    }
  },

  deleteNote: async (id) => {
    set({ loading: true, error: null })
    try {
      await noteService.delete(id)
      set((state) => {
        // Remove from global notes array
        const notes = state.notes.filter(n => n.id !== id)
        
        // Remove from lesson-specific notes arrays
        const lessonNotes = { ...state.lessonNotes }
        Object.keys(lessonNotes).forEach(lessonId => {
          const lessonIdNum = Number(lessonId)
          if (lessonNotes[lessonIdNum].some(n => n.id === id)) {
            lessonNotes[lessonIdNum] = lessonNotes[lessonIdNum].filter(n => n.id !== id)
          }
        })
        
        return { notes, lessonNotes, loading: false }
      })
    } catch (error) {
      console.error(`Error deleting note ${id}:`, error)
      set({
        loading: false,
        error: error instanceof Error ? error.message : `Failed to delete note ${id}`
      })
    }
  }
}))
