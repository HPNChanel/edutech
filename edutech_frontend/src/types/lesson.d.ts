export interface Category {
  id: number
  name: string
}

export interface Lesson {
  id: number
  title: string
  description?: string
  content: string
  category_id?: number
  category?: Category
  created_at?: string
  updated_at?: string
}

export interface Note {
  id: number
  lesson_id: number
  user_id: number
  content: string
  selected_text: string
  position: number
  created_at: string
  updated_at: string
}

export interface Highlight {
  id: number
  lesson_id: number
  content: string
  color: string
  start_position: number
  end_position: number
  created_at?: string
}

export interface Document {
  id: number
  title: string
  file_path: string
  file_type: string
  upload_date: string
  processed: boolean
  lesson_id?: number
}

export interface QuizQuestion {
  id: number
  lesson_id: number
  question: string
  options: string[]
  correct_answer: string
  explanation?: string
}

export interface Quiz {
  id: number
  lesson_id: number
  title: string
  description?: string
  questions: QuizQuestion[]
  created_at?: string
}
