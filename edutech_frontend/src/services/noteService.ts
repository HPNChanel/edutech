import { api } from '@/lib/api'
import { AxiosResponse } from 'axios'

// Note Interfaces
export interface Note {
  id: string
  lessonId: string
  userId: string
  content: string
  selectedText?: string
  position?: number
  lineNumber?: number
  createdAt: string
  updatedAt: string
}

// Create Note Interfaces
export interface CreateNoteData {
  lesson_id: string
  content: string
  selected_text?: string
  position?: number
  line_number?: number
}

export interface CreateNoteResponse {
  success: boolean
  note: Note
  message: string
}

// Update Note Interfaces
export interface UpdateNoteData {
  content?: string
  selected_text?: string
  position?: number
  line_number?: number
}

export interface UpdateNoteResponse {
  success: boolean
  note: Note
  message: string
}

// Notes List Response
export interface NotesListResponse {
  notes: Note[]
  pagination?: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
  }
}

// Query Parameters
export interface GetNotesParams {
  lesson_id?: string
  page?: number
  limit?: number
  sort_by?: 'created_at' | 'updated_at'
  sort_order?: 'asc' | 'desc'
}

// Error Interfaces
export interface NoteServiceError {
  message: string
  code: string
  field?: string
  details?: any
}

// API Response wrapper
interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  errors?: NoteServiceError[]
}

// Optimistic Update Types
type OptimisticUpdateCallback<T> = (data: T) => void
type RollbackCallback = () => void

/**
 * Note Service Class
 * Handles all note-related API operations with optimistic updates
 */
class NoteService {
  private readonly baseEndpoint = '/notes' // ! DO NOT CHANGE THIS, IT IS USED IN BACKEND

  /**
   * Get all notes for the current user
   * @param params - Query parameters for filtering and pagination
   * @returns Promise<Note[]>
   */
  async getAllNotes(params: GetNotesParams = {}): Promise<Note[]> {
    try {
      const queryParams = new URLSearchParams()
      
      // Add query parameters
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString())
        }
      })

      const url = queryParams.toString() 
        ? `${this.baseEndpoint}?${queryParams.toString()}`
        : this.baseEndpoint

      const response: AxiosResponse<Note[]> = await api.get(url)

      // Backend returns array directly, not wrapped in ApiResponse
      return response.data || []
    } catch (error: any) {
      console.error('Get all notes error:', error)
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.')
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch notes. Please try again.'
      )
    }
  }

  /**
   * Get notes by lesson ID
   * @param lessonId - The lesson ID to fetch notes for
   * @returns Promise<Note[]>
   */
  async getNotesByLesson(lessonId: string): Promise<Note[]> {
    try {
      if (!lessonId || lessonId.trim() === '') {
        throw new Error('Lesson ID is required')
      }

      const response: AxiosResponse<Note[]> = await api.get(
        `${this.baseEndpoint}/lesson/${lessonId}`
      )

      return response.data || []
    } catch (error) {
      console.error('Get notes by lesson error:', error)
      throw error
    }
  }

  /**
   * Create a new note with optimistic update
   * @param noteData - The note data to create
   * @param onOptimisticUpdate - Callback for optimistic UI update
   * @param onRollback - Callback to rollback optimistic update on failure
   * @returns Promise<Note>
   */
  async createNote(
    noteData: CreateNoteData,
    onOptimisticUpdate?: OptimisticUpdateCallback<Note>,
    onRollback?: RollbackCallback
  ): Promise<Note> {
    // Generate temporary note for optimistic update
    const optimisticNote: Note = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lessonId: noteData.lesson_id,
      userId: 'current_user',
      content: noteData.content,
      selectedText: noteData.selected_text,
      position: noteData.position,
      lineNumber: noteData.line_number,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Perform optimistic update
    if (onOptimisticUpdate) {
      onOptimisticUpdate(optimisticNote)
    }

    try {
      // Validate required fields
      if (!noteData.lesson_id || noteData.lesson_id.trim() === '') {
        throw new Error('Lesson ID is required')
      }
      
      if (!noteData.content || noteData.content.trim() === '') {
        throw new Error('Note content is required')
      }

      const response: AxiosResponse<Note> = await api.post(
        this.baseEndpoint,
        noteData
      )

      return response.data
    } catch (error: any) {
      console.error('Create note error:', error)
      
      // Rollback optimistic update on failure
      if (onRollback) {
        onRollback()
      }
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.')
      }
      
      if (error.response?.status === 404) {
        throw new Error('Lesson not found.')
      }
      
      if (error.response?.status === 400) {
        const validationErrors = error.response.data?.errors
        if (validationErrors && validationErrors.length > 0) {
          throw new Error(validationErrors.map((err: NoteServiceError) => err.message).join(', '))
        }
        throw new Error('Invalid note data. Please check your inputs.')
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to create note. Please try again.'
      )
    }
  }

  /**
   * Update an existing note with optimistic update
   * @param noteId - The note ID to update
   * @param updateData - The updated note data
   * @param onOptimisticUpdate - Callback for optimistic UI update
   * @param onRollback - Callback to rollback optimistic update on failure
   * @returns Promise<Note>
   */
  async updateNote(
    noteId: string,
    updateData: UpdateNoteData,
    onOptimisticUpdate?: OptimisticUpdateCallback<Partial<Note>>,
    onRollback?: RollbackCallback
  ): Promise<Note> {
    // Perform optimistic update
    if (onOptimisticUpdate) {
      const optimisticUpdate = {
        ...updateData,
        content: updateData.content,
        selectedText: updateData.selected_text,
        position: updateData.position,
        lineNumber: updateData.line_number,
        updatedAt: new Date().toISOString()
      }
      onOptimisticUpdate(optimisticUpdate)
    }

    try {
      if (!noteId || noteId.trim() === '') {
        throw new Error('Note ID is required')
      }

      // Validate that at least one field is being updated
      const hasUpdates = Object.values(updateData).some(value => 
        value !== undefined && value !== null && value !== ''
      )
      
      if (!hasUpdates) {
        throw new Error('At least one field must be updated')
      }

      const response: AxiosResponse<Note> = await api.put(
        `${this.baseEndpoint}/${noteId}`,
        updateData
      )

      return response.data
    } catch (error: any) {
      console.error('Update note error:', error)
      
      // Rollback optimistic update on failure
      if (onRollback) {
        onRollback()
      }
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.')
      }
      
      if (error.response?.status === 404) {
        throw new Error('Note not found.')
      }
      
      if (error.response?.status === 403) {
        throw new Error('Access denied. You do not have permission to update this note.')
      }
      
      if (error.response?.status === 400) {
        const validationErrors = error.response.data?.errors
        if (validationErrors && validationErrors.length > 0) {
          throw new Error(validationErrors.map((err: NoteServiceError) => err.message).join(', '))
        }
        throw new Error('Invalid update data. Please check your inputs.')
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to update note. Please try again.'
      )
    }
  }

  /**
   * Delete a note with optimistic update
   * @param noteId - The note ID to delete
   * @param onOptimisticUpdate - Callback for optimistic UI update
   * @param onRollback - Callback to rollback optimistic update on failure
   * @returns Promise<void>
   */
  async deleteNote(
    noteId: string,
    onOptimisticUpdate?: OptimisticUpdateCallback<string>,
    onRollback?: RollbackCallback
  ): Promise<void> {
    // Perform optimistic update
    if (onOptimisticUpdate) {
      onOptimisticUpdate(noteId)
    }

    try {
      if (!noteId || noteId.trim() === '') {
        throw new Error('Note ID is required')
      }

      const response: AxiosResponse<{ message: string }> = await api.delete(
        `${this.baseEndpoint}/${noteId}`
      )

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete note')
      }
    } catch (error: any) {
      console.error('Delete note error:', error)
      
      // Rollback optimistic update on failure
      if (onRollback) {
        onRollback()
      }
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.')
      }
      
      if (error.response?.status === 404) {
        throw new Error('Note not found.')
      }
      
      if (error.response?.status === 403) {
        throw new Error('Access denied. You do not have permission to delete this note.')
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to delete note. Please try again.'
      )
    }
  }

  /**
   * Get a specific note by ID
   * @param noteId - The note ID to fetch
   * @returns Promise<Note>
   */
  async getNoteById(noteId: string): Promise<Note> {
    try {
      if (!noteId || noteId.trim() === '') {
        throw new Error('Note ID is required')
      }

      const response: AxiosResponse<Note> = await api.get(
        `${this.baseEndpoint}/${noteId}`
      )

      return response.data
    } catch (error: any) {
      console.error('Get note by ID error:', error)
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.')
      }
      
      if (error.response?.status === 404) {
        throw new Error('Note not found.')
      }
      
      if (error.response?.status === 403) {
        throw new Error('Access denied. You do not have permission to view this note.')
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch note. Please try again.'
      )
    }
  }

  /**
   * Bulk delete notes
   * @param noteIds - Array of note IDs to delete
   * @param onOptimisticUpdate - Callback for optimistic UI update
   * @param onRollback - Callback to rollback optimistic update on failure
   * @returns Promise<void>
   */
  async bulkDeleteNotes(
    noteIds: string[],
    onOptimisticUpdate?: OptimisticUpdateCallback<string[]>,
    onRollback?: RollbackCallback
  ): Promise<void> {
    // Perform optimistic update
    if (onOptimisticUpdate) {
      onOptimisticUpdate(noteIds)
    }

    try {
      if (!noteIds || noteIds.length === 0) {
        throw new Error('At least one note ID is required')
      }

      const response: AxiosResponse<{ message: string; deletedCount: number }> = await api.delete(
        `${this.baseEndpoint}/bulk`,
        {
          data: { note_ids: noteIds }
        }
      )

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete notes')
      }
    } catch (error: any) {
      console.error('Bulk delete notes error:', error)
      
      // Rollback optimistic update on failure
      if (onRollback) {
        onRollback()
      }
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.')
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to delete notes. Please try again.'
      )
    }
  }

  /**
   * Validate note data before creating
   * @param noteData - The note data to validate
   * @returns validation result
   */
  validateNoteData(noteData: CreateNoteData): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!noteData.lesson_id || noteData.lesson_id.trim() === '') {
      errors.push('Lesson ID is required')
    }

    if (!noteData.content || noteData.content.trim() === '') {
      errors.push('Note content is required')
    }

    if (noteData.content && noteData.content.length > 10000) {
      errors.push('Note content is too long (maximum 10000 characters)')
    }

    if (noteData.position !== undefined && 
        (typeof noteData.position !== 'number' || noteData.position < 0)) {
      errors.push('Position must be a non-negative number')
    }

    if (noteData.line_number !== undefined && 
        (typeof noteData.line_number !== 'number' || noteData.line_number < 1)) {
      errors.push('Line number must be a positive number')
    }

    if (noteData.selected_text && noteData.selected_text.length > 5000) {
      errors.push('Selected text is too long (maximum 5000 characters)')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// Export singleton instance
export const noteService = new NoteService()

// Export types for use in components
export type {
  Note,
  CreateNoteData,
  CreateNoteResponse,
  UpdateNoteData,
  UpdateNoteResponse,
  NotesListResponse,
  GetNotesParams,
  NoteServiceError
}

// Export default
export default noteService
