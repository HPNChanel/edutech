export interface Category {
  id: number;
  name: string;
  description?: string;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryCreate {
  name: string;
  description?: string;
}

export interface CategoryUpdate {
  name?: string;
  description?: string;
}

export interface Quiz {
  id: number;
  title: string;
  description?: string;
  lesson_id: number;
  created_at?: string;
  updated_at?: string;
}

export interface QuizQuestion {
  id: number;
  quiz_id: number;
  question: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
  lesson_id?: number;
  created_at?: string;
  updated_at?: string;
}

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

export interface Note {
  id: number;
  content: string;
  selected_text: string;
  lesson_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
}