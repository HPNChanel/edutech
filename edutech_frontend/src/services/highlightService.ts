import { api } from '@/lib/api'
import { AxiosResponse } from 'axios'

// Highlight Interfaces
export interface Highlight {
  id: string
  lessonId: string
  userId: string
  content: string
  selectedText: string
  position: number
  fromChar: number
  toChar: number
  color: string
  createdAt: string
  updatedAt?: string
}

// Create Highlight Interfaces
export interface CreateHighlightData {
  lesson_id: string
  selected_text: string
  position: number
  from_char?: number
  to_char?: number
  color?: string
  note_content?: string
}

export interface CreateHighlightResponse {
  success: boolean
  highlight: Highlight
  message: string
}

// Update Highlight Interfaces
export interface UpdateHighlightData {
  content?: string
  color?: string
  from_char?: number
  to_char?: number
}

export interface UpdateHighlightResponse {
  success: boolean
  highlight: Highlight
  message: string
}

// Highlights List Response
export interface HighlightsListResponse {
  highlights: Highlight[]
  pagination?: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
  }
}

// Query Parameters
export interface GetHighlightsParams {
  lesson_id?: string
  page?: number
  limit?: number
  color?: string
  sort_by?: 'created_at' | 'updated_at' | 'position'
  sort_order?: 'asc' | 'desc'
}

// Error Interfaces
export interface HighlightServiceError {
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
  errors?: HighlightServiceError[]
}

// Optimistic Update Types
type OptimisticUpdateCallback<T> = (data: T) => void
type RollbackCallback = () => void

/**
 * Highlight Service Class
 * Handles all highlight-related API operations with optimistic updates
 */
class HighlightService {
  private readonly baseEndpoint = '/highlights'

  /**
   * Get highlights by lesson ID
   * @param lessonId - The lesson ID to fetch highlights for
   * @returns Promise<Highlight[]>
   */
  async getHighlightsByLesson(lessonId: string): Promise<Highlight[]> {
    try {
      if (!lessonId || lessonId.trim() === '') {
        throw new Error('Lesson ID is required')
      }

      const response: AxiosResponse<ApiResponse<HighlightsListResponse>> = await api.get(
        `${this.baseEndpoint}`,
        {
          params: { lesson_id: lessonId }
        }
      )

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch highlights')
      }

      return response.data.data.highlights
    } catch (error: any) {
      console.error('Get highlights by lesson error:', error)
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.')
      }
      
      if (error.response?.status === 404) {
        throw new Error('Lesson not found.')
      }
      
      if (error.response?.status === 403) {
        throw new Error('Access denied. You do not have permission to view these highlights.')
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch highlights. Please try again.'
      )
    }
  }

  /**
   * Get all highlights for the current user
   * @param params - Query parameters for filtering and pagination
   * @returns Promise<HighlightsListResponse>
   */
  async getAllHighlights(params: GetHighlightsParams = {}): Promise<HighlightsListResponse> {
    try {
      const queryParams = new URLSearchParams()
      
      // Add query parameters
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString())
        }
      })

      const response: AxiosResponse<ApiResponse<HighlightsListResponse>> = await api.get(
        `${this.baseEndpoint}?${queryParams.toString()}`
      )

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch highlights')
      }

      return response.data.data
    } catch (error: any) {
      console.error('Get all highlights error:', error)
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.')
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch highlights. Please try again.'
      )
    }
  }

  /**
   * Create a new highlight with optimistic update
   * @param highlightData - The highlight data to create
   * @param onOptimisticUpdate - Callback for optimistic UI update
   * @param onRollback - Callback to rollback optimistic update on failure
   * @returns Promise<Highlight>
   */
  async createHighlight(
    highlightData: CreateHighlightData,
    onOptimisticUpdate?: OptimisticUpdateCallback<Highlight>,
    onRollback?: RollbackCallback
  ): Promise<Highlight> {
    // Generate temporary highlight for optimistic update
    const optimisticHighlight: Highlight = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lessonId: highlightData.lesson_id,
      userId: 'current_user', // Will be replaced by actual user ID from API
      content: highlightData.selected_text,
      selectedText: highlightData.selected_text,
      position: highlightData.position,
      fromChar: highlightData.from_char || 0,
      toChar: highlightData.to_char || highlightData.selected_text.length,
      color: highlightData.color || 'yellow',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Perform optimistic update
    if (onOptimisticUpdate) {
      onOptimisticUpdate(optimisticHighlight)
    }

    try {
      // Validate required fields
      if (!highlightData.lesson_id || highlightData.lesson_id.trim() === '') {
        throw new Error('Lesson ID is required')
      }
      
      if (!highlightData.selected_text || highlightData.selected_text.trim() === '') {
        throw new Error('Selected text is required')
      }

      if (typeof highlightData.position !== 'number' || highlightData.position < 0) {
        throw new Error('Valid position is required')
      }

      const response: AxiosResponse<ApiResponse<CreateHighlightResponse>> = await api.post(
        this.baseEndpoint,
        highlightData
      )

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create highlight')
      }

      return response.data.data.highlight
    } catch (error: any) {
      console.error('Create highlight error:', error)
      
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
      
      if (error.response?.status === 403) {
        throw new Error('Access denied. You do not have permission to highlight in this lesson.')
      }
      
      if (error.response?.status === 400) {
        const validationErrors = error.response.data?.errors
        if (validationErrors && validationErrors.length > 0) {
          throw new Error(validationErrors.map((err: HighlightServiceError) => err.message).join(', '))
        }
        throw new Error('Invalid highlight data. Please check your inputs.')
      }
      
      if (error.response?.status === 409) {
        throw new Error('This text is already highlighted.')
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to create highlight. Please try again.'
      )
    }
  }

  /**
   * Create highlight with note
   * @param highlightData - The highlight data including note content
   * @param onOptimisticUpdate - Callback for optimistic UI update
   * @param onRollback - Callback to rollback optimistic update on failure
   * @returns Promise<Highlight>
   */
  async createHighlightWithNote(
    highlightData: CreateHighlightData,
    onOptimisticUpdate?: OptimisticUpdateCallback<Highlight>,
    onRollback?: RollbackCallback
  ): Promise<Highlight> {
    try {
      // Use the with-note endpoint if note_content is provided
      const endpoint = highlightData.note_content 
        ? `${this.baseEndpoint}/with-note`
        : this.baseEndpoint

      return this.createHighlight(highlightData, onOptimisticUpdate, onRollback)
    } catch (error) {
      throw error
    }
  }

  /**
   * Update an existing highlight with optimistic update
   * @param highlightId - The highlight ID to update
   * @param updateData - The updated highlight data
   * @param onOptimisticUpdate - Callback for optimistic UI update
   * @param onRollback - Callback to rollback optimistic update on failure
   * @returns Promise<Highlight>
   */
  async updateHighlight(
    highlightId: string,
    updateData: UpdateHighlightData,
    onOptimisticUpdate?: OptimisticUpdateCallback<Partial<Highlight>>,
    onRollback?: RollbackCallback
  ): Promise<Highlight> {
    // Perform optimistic update
    if (onOptimisticUpdate) {
      const optimisticUpdate = {
        ...updateData,
        updatedAt: new Date().toISOString()
      }
      onOptimisticUpdate(optimisticUpdate)
    }

    try {
      if (!highlightId || highlightId.trim() === '') {
        throw new Error('Highlight ID is required')
      }

      // Validate that at least one field is being updated
      const hasUpdates = Object.values(updateData).some(value => 
        value !== undefined && value !== null && value !== ''
      )
      
      if (!hasUpdates) {
        throw new Error('At least one field must be updated')
      }

      const response: AxiosResponse<ApiResponse<UpdateHighlightResponse>> = await api.put(
        `${this.baseEndpoint}/${highlightId}`,
        updateData
      )

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update highlight')
      }

      return response.data.data.highlight
    } catch (error: any) {
      console.error('Update highlight error:', error)
      
      // Rollback optimistic update on failure
      if (onRollback) {
        onRollback()
      }
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.')
      }
      
      if (error.response?.status === 404) {
        throw new Error('Highlight not found.')
      }
      
      if (error.response?.status === 403) {
        throw new Error('Access denied. You do not have permission to update this highlight.')
      }
      
      if (error.response?.status === 400) {
        const validationErrors = error.response.data?.errors
        if (validationErrors && validationErrors.length > 0) {
          throw new Error(validationErrors.map((err: HighlightServiceError) => err.message).join(', '))
        }
        throw new Error('Invalid update data. Please check your inputs.')
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to update highlight. Please try again.'
      )
    }
  }

  /**
   * Delete a highlight with optimistic update
   * @param highlightId - The highlight ID to delete
   * @param onOptimisticUpdate - Callback for optimistic UI update
   * @param onRollback - Callback to rollback optimistic update on failure
   * @returns Promise<void>
   */
  async deleteHighlight(
    highlightId: string,
    onOptimisticUpdate?: OptimisticUpdateCallback<string>,
    onRollback?: RollbackCallback
  ): Promise<void> {
    // Perform optimistic update
    if (onOptimisticUpdate) {
      onOptimisticUpdate(highlightId)
    }

    try {
      if (!highlightId || highlightId.trim() === '') {
        throw new Error('Highlight ID is required')
      }

      const response: AxiosResponse<ApiResponse<{ message: string }>> = await api.delete(
        `${this.baseEndpoint}/${highlightId}`
      )

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete highlight')
      }
    } catch (error: any) {
      console.error('Delete highlight error:', error)
      
      // Rollback optimistic update on failure
      if (onRollback) {
        onRollback()
      }
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.')
      }
      
      if (error.response?.status === 404) {
        throw new Error('Highlight not found.')
      }
      
      if (error.response?.status === 403) {
        throw new Error('Access denied. You do not have permission to delete this highlight.')
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to delete highlight. Please try again.'
      )
    }
  }

  /**
   * Get a specific highlight by ID
   * @param highlightId - The highlight ID to fetch
   * @returns Promise<Highlight>
   */
  async getHighlightById(highlightId: string): Promise<Highlight> {
    try {
      if (!highlightId || highlightId.trim() === '') {
        throw new Error('Highlight ID is required')
      }

      const response: AxiosResponse<ApiResponse<Highlight>> = await api.get(
        `${this.baseEndpoint}/${highlightId}`
      )

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch highlight')
      }

      return response.data.data
    } catch (error: any) {
      console.error('Get highlight by ID error:', error)
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.')
      }
      
      if (error.response?.status === 404) {
        throw new Error('Highlight not found.')
      }
      
      if (error.response?.status === 403) {
        throw new Error('Access denied. You do not have permission to view this highlight.')
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch highlight. Please try again.'
      )
    }
  }

  /**
   * Change highlight color
   * @param highlightId - The highlight ID
   * @param color - New color for the highlight
   * @param onOptimisticUpdate - Callback for optimistic UI update
   * @param onRollback - Callback to rollback optimistic update on failure
   * @returns Promise<Highlight>
   */
  async changeHighlightColor(
    highlightId: string,
    color: string,
    onOptimisticUpdate?: OptimisticUpdateCallback<{ color: string }>,
    onRollback?: RollbackCallback
  ): Promise<Highlight> {
    return this.updateHighlight(
      highlightId,
      { color },
      onOptimisticUpdate,
      onRollback
    )
  }

  /**
   * Get highlights by color
   * @param lessonId - The lesson ID
   * @param color - The color to filter by
   * @returns Promise<Highlight[]>
   */
  async getHighlightsByColor(lessonId: string, color: string): Promise<Highlight[]> {
    try {
      const response = await this.getAllHighlights({
        lesson_id: lessonId,
        color: color
      })
      
      return response.highlights
    } catch (error) {
      console.error('Get highlights by color error:', error)
      throw error
    }
  }

  /**
   * Bulk delete highlights
   * @param highlightIds - Array of highlight IDs to delete
   * @param onOptimisticUpdate - Callback for optimistic UI update
   * @param onRollback - Callback to rollback optimistic update on failure
   * @returns Promise<void>
   */
  async bulkDeleteHighlights(
    highlightIds: string[],
    onOptimisticUpdate?: OptimisticUpdateCallback<string[]>,
    onRollback?: RollbackCallback
  ): Promise<void> {
    // Perform optimistic update
    if (onOptimisticUpdate) {
      onOptimisticUpdate(highlightIds)
    }

    try {
      if (!highlightIds || highlightIds.length === 0) {
        throw new Error('At least one highlight ID is required')
      }

      const response: AxiosResponse<ApiResponse<{ message: string; deletedCount: number }>> = await api.delete(
        `${this.baseEndpoint}/bulk`,
        {
          data: { highlight_ids: highlightIds }
        }
      )

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete highlights')
      }
    } catch (error: any) {
      console.error('Bulk delete highlights error:', error)
      
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
        'Failed to delete highlights. Please try again.'
      )
    }
  }

  /**
   * Validate highlight data before creating
   * @param highlightData - The highlight data to validate
   * @returns boolean
   */
  validateHighlightData(highlightData: CreateHighlightData): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!highlightData.lesson_id || highlightData.lesson_id.trim() === '') {
      errors.push('Lesson ID is required')
    }

    if (!highlightData.selected_text || highlightData.selected_text.trim() === '') {
      errors.push('Selected text is required')
    }

    if (highlightData.selected_text && highlightData.selected_text.length > 5000) {
      errors.push('Selected text is too long (maximum 5000 characters)')
    }

    if (typeof highlightData.position !== 'number' || highlightData.position < 0) {
      errors.push('Valid position is required')
    }

    if (highlightData.from_char !== undefined && 
        (typeof highlightData.from_char !== 'number' || highlightData.from_char < 0)) {
      errors.push('from_char must be a non-negative number')
    }

    if (highlightData.to_char !== undefined && 
        (typeof highlightData.to_char !== 'number' || highlightData.to_char < 0)) {
      errors.push('to_char must be a non-negative number')
    }

    if (highlightData.from_char !== undefined && 
        highlightData.to_char !== undefined && 
        highlightData.from_char >= highlightData.to_char) {
      errors.push('from_char must be less than to_char')
    }

    if (highlightData.color && 
        !['yellow', 'blue', 'green', 'red', 'purple', 'orange'].includes(highlightData.color)) {
      errors.push('Invalid color. Must be one of: yellow, blue, green, red, purple, orange')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// Export singleton instance
export const highlightService = new HighlightService()

// Export types for use in components
export type {
  Highlight,
  CreateHighlightData,
  CreateHighlightResponse,
  UpdateHighlightData,
  UpdateHighlightResponse,
  HighlightsListResponse,
  GetHighlightsParams,
  HighlightServiceError
}

// Export utility functions
export const HIGHLIGHT_COLORS = [
  { name: 'Yellow', value: 'yellow', class: 'bg-yellow-200 border-yellow-300' },
  { name: 'Blue', value: 'blue', class: 'bg-blue-200 border-blue-300' },
  { name: 'Green', value: 'green', class: 'bg-green-200 border-green-300' },
  { name: 'Red', value: 'red', class: 'bg-red-200 border-red-300' },
  { name: 'Purple', value: 'purple', class: 'bg-purple-200 border-purple-300' },
  { name: 'Orange', value: 'orange', class: 'bg-orange-200 border-orange-300' }
] as const

export const getHighlightColorClass = (color: string): string => {
  const colorConfig = HIGHLIGHT_COLORS.find(c => c.value === color)
  return colorConfig?.class || 'bg-yellow-200 border-yellow-300'
}

// Export default
export default highlightService
