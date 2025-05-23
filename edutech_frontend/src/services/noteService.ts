import { api } from './api'

export interface Note {
  id: number
  content: string
  selected_text: string
  lesson_id: number
  user_id: number
  from_char?: number
  to_char?: number
  line_number?: number
  created_at: string
}

export interface NoteCreate {
  content: string
  lesson_id: number
  selected_text?: string
  from_char?: number
  to_char?: number
  line_number?: number
}

export interface NoteUpdate {
  content?: string
  selected_text?: string
  from_char?: number
  to_char?: number
  line_number?: number
}

export const noteService = {
  async getAll(): Promise<Note[]> {
    const response = await api.get('/notes')
    return response.data
  },

  async getById(id: number): Promise<Note> {
    const response = await api.get(`/notes/${id}`)
    return response.data
  },

  async getLessonNotes(lessonId: number): Promise<Note[]> {
    const response = await api.get(`/notes/lesson/${lessonId}`)
    return response.data
  },

  async create(note: NoteCreate): Promise<Note> {
    const response = await api.post('/notes', note)
    return response.data
  },

  async update(id: number, note: NoteUpdate): Promise<Note> {
    const response = await api.put(`/notes/${id}`, note)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/notes/${id}`)
  }
}
