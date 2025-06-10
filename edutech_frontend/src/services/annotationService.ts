import api from '@/lib/api'

export type HighlightColor = 'yellow' | 'red' | 'green'

export interface Highlight {
  id: number
  user_id: number
  lesson_id: number
  category_id?: number
  text: string
  color: HighlightColor
  start_offset: number
  end_offset: number
  created_at: string
  updated_at: string
}

export interface Note {
  id: number
  user_id: number
  lesson_id: number
  category_id?: number
  content: string
  text?: string
  start_offset?: number
  end_offset?: number
  created_at: string
  updated_at: string
}

export interface HighlightCreateRequest {
  text: string
  color: HighlightColor
  start_offset: number
  end_offset: number
}

export interface NoteCreateRequest {
  content: string
  text?: string
  start_offset?: number
  end_offset?: number
}

export interface HighlightUpdateRequest {
  color?: HighlightColor
}

export interface AnnotationsResponse {
  highlights: Highlight[]
  notes: Note[]
}

export const annotationService = {
  // Get all annotations for a lesson
  getLessonAnnotations: async (lessonId: number): Promise<AnnotationsResponse> => {
    const response = await api.get(`/lessons/${lessonId}/annotations`)
    return response.data
  },

  // Get highlights for a lesson using the new query parameter endpoint
  getHighlightsByLesson: async (lessonId: number): Promise<Highlight[]> => {
    const response = await api.get(`/highlights/?lesson_id=${lessonId}`)
    return response.data
  },

  // Create a new highlight
  createHighlight: async (lessonId: number, data: HighlightCreateRequest): Promise<Highlight> => {
    const response = await api.post(`/lessons/${lessonId}/highlights`, data)
    return response.data
  },

  // Create a new note
  createNote: async (lessonId: number, data: NoteCreateRequest): Promise<Note> => {
    const response = await api.post(`/lessons/${lessonId}/notes`, data)
    return response.data
  },

  // Update a highlight
  updateHighlight: async (lessonId: number, highlightId: number, data: HighlightUpdateRequest): Promise<Highlight> => {
    const response = await api.put(`/lessons/${lessonId}/highlights/${highlightId}`, data)
    return response.data
  },

  // Delete a highlight
  deleteHighlight: async (lessonId: number, highlightId: number): Promise<void> => {
    await api.delete(`/lessons/${lessonId}/highlights/${highlightId}`)
  },

  // Delete a note
  deleteNote: async (lessonId: number, noteId: number): Promise<void> => {
    await api.delete(`/lessons/${lessonId}/notes/${noteId}`)
  }
} 