import { api } from './api';
import type { Category } from '../types/lesson';

export interface Lesson {
  id: number;
  title: string;
  content: string;
  summary?: string;
  description?: string;
  category_id?: number;
  category?: Category;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface LessonCreate {
  title: string;
  content: string;
  summary?: string;
  description?: string;
  category_id?: number;
}

export interface LessonUpdate {
  title?: string;
  content?: string;
  summary?: string;
  description?: string;
  category_id?: number;
}

export const lessonService = {
  async getAll(categoryId?: number): Promise<Lesson[]> {
    const params = categoryId ? { category_id: categoryId } : {};
    const response = await api.get('/lessons', { params });
    return response.data;
  },

  async getById(id: number): Promise<Lesson> {
    const response = await api.get(`/lessons/${id}`);
    return response.data;
  },

  async create(lesson: LessonCreate): Promise<Lesson> {
    const response = await api.post('/lessons', lesson);
    return response.data;
  },

  async update(id: number, lesson: LessonUpdate): Promise<Lesson> {
    const response = await api.put(`/lessons/${id}`, lesson);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/lessons/${id}`);
  },

  async uploadDocument(title: string, file: File, categoryId?: number, description?: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    if (categoryId) formData.append('category_id', categoryId.toString());
    if (description) formData.append('description', description);

    const response = await api.post('/lessons/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};
