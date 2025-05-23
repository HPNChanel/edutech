import { api } from './api'

export interface Highlight {
  id: number
  content: string
  lesson_id: number
  user_id: number
  color: string
  from_char: number
  to_char: number
  created_at: string
}

export interface HighlightCreate {
  content: string
  lesson_id: number
  color?: string
  from_char: number
  to_char: number
}

export interface HighlightWithNoteCreate extends HighlightCreate {
  note_content?: string
}

export interface HighlightUpdate {
  content?: string
  color?: string
  from_char?: number
  to_char?: number
}

export const highlightService = {
  async getLessonHighlights(lessonId: number): Promise<Highlight[]> {
    const response = await api.get(`/highlights/lesson/${lessonId}`)
    return response.data
  },

  async getById(id: number): Promise<Highlight> {
    const response = await api.get(`/highlights/${id}`)
    return response.data
  },

  async create(highlight: HighlightCreate): Promise<Highlight> {
    const response = await api.post('/highlights', highlight)
    return response.data
  },

  async createWithNote(highlightWithNote: HighlightWithNoteCreate): Promise<Highlight> {
    const response = await api.post('/highlights/with-note', highlightWithNote)
    return response.data
  },

  async update(id: number, highlight: HighlightUpdate): Promise<Highlight> {
    const response = await api.put(`/highlights/${id}`, highlight)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/highlights/${id}`)
  }
}
