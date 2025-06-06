import { api } from '@/lib/api'
import { AxiosResponse } from 'axios'

// Category Interfaces
export interface Category {
  id: number
  name: string
  description?: string
  user_id: number
  created_at: string
  updated_at: string
  lesson_count?: number
}

export interface CreateCategoryData {
  name: string
  description?: string
}

export interface UpdateCategoryData {
  name?: string
  description?: string
}

export interface CategoryQueryParams {
  search?: string
  skip?: number
  limit?: number
}

/**
 * Category Service
 * Handles category CRUD operations
 */
class CategoryService {
  private readonly baseEndpoint = '/categories' // ! DO NOT CHANGE THIS, IT IS USED IN BACKEND

  /**
   * Get all categories for the current user
   */
  async getCategories(params?: CategoryQueryParams): Promise<Category[]> {
    try {
      const response: AxiosResponse<Category[]> = await api.get(this.baseEndpoint, {
        params
      })
      return response.data
    } catch (error: any) {
      console.error('Get categories error:', error)
      throw new Error(
        error.response?.data?.detail || 
        error.response?.data?.message || 
        'Failed to fetch categories'
      )
    }
  }

  /**
   * Get a specific category by ID
   */
  async getCategoryById(categoryId: number): Promise<Category> {
    try {
      const response: AxiosResponse<Category> = await api.get(`${this.baseEndpoint}/${categoryId}`)
      return response.data
    } catch (error: any) {
      console.error('Get category by ID error:', error)
      throw new Error(
        error.response?.data?.detail || 
        error.response?.data?.message || 
        'Failed to fetch category'
      )
    }
  }

  /**
   * Create a new category
   */
  async createCategory(categoryData: CreateCategoryData): Promise<Category> {
    try {
      const response: AxiosResponse<Category> = await api.post(this.baseEndpoint, categoryData)
      return response.data
    } catch (error: any) {
      console.error('Create category error:', error)
      throw new Error(
        error.response?.data?.detail || 
        error.response?.data?.message || 
        'Failed to create category'
      )
    }
  }

  /**
   * Update a category
   */
  async updateCategory(categoryId: number, categoryData: UpdateCategoryData): Promise<Category> {
    try {
      const response: AxiosResponse<Category> = await api.put(`${this.baseEndpoint}/${categoryId}`, categoryData)
      return response.data
    } catch (error: any) {
      console.error('Update category error:', error)
      throw new Error(
        error.response?.data?.detail || 
        error.response?.data?.message || 
        'Failed to update category'
      )
    }
  }

  /**
   * Delete a category
   */
  async deleteCategory(categoryId: number): Promise<void> {
    try {
      await api.delete(`${this.baseEndpoint}/${categoryId}`)
    } catch (error: any) {
      console.error('Delete category error:', error)
      throw new Error(
        error.response?.data?.detail || 
        error.response?.data?.message || 
        'Failed to delete category'
      )
    }
  }
}

// Export singleton instance
export const categoryService = new CategoryService()

// Export default
export default categoryService
