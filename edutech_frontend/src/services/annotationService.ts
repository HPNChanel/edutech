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
  category_id?: number
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
    // Validate required fields before sending
    if (!data.text || data.text.trim().length === 0) {
      throw new Error("Text is required and cannot be empty")
    }
    
    if (data.start_offset === undefined || data.end_offset === undefined) {
      throw new Error("Start and end offsets are required")
    }
    
    if (data.start_offset < 0 || data.end_offset < 0) {
      throw new Error("Offsets cannot be negative")
    }
    
    if (data.start_offset >= data.end_offset) {
      throw new Error("Start offset must be less than end offset")
    }

    // Ensure color is a simple string value
    const payload = {
      text: data.text.trim(),
      color: data.color as string, // Convert enum to string if needed
      start_offset: data.start_offset,
      end_offset: data.end_offset,
      ...(data.category_id && { category_id: data.category_id })
    }

    console.log('📤 Sending highlight payload:', payload)
    
    const response = await api.post(`/lessons/${lessonId}/highlights`, payload)
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