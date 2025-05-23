import { api } from './api';
import type { Category, CategoryCreate, CategoryUpdate } from '../types/lesson';

export const categoryService = {
  async getAll(): Promise<Category[]> {
    const response = await api.get('/categories');
    return response.data;
  },

  async getById(id: number): Promise<Category> {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  async create(category: CategoryCreate): Promise<Category> {
    const response = await api.post('/categories', category);
    return response.data;
  },

  async update(id: number, category: CategoryUpdate): Promise<Category> {
    const response = await api.put(`/categories/${id}`, category);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/categories/${id}`);
  }
};
