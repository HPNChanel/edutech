import { useEffect } from 'react'
import { useNoteStore } from '../store/useNoteStore'

export const useNotes = (lessonId?: number) => {
  const { 
    notes, 
    lessonNotes, 
    loading, 
    error, 
    fetchNotes, 
    fetchNotesByLessonId 
  } = useNoteStore()

  useEffect(() => {
    if (lessonId) {
      fetchNotesByLessonId(lessonId)
    } else {
      fetchNotes()
    }
  }, [lessonId, fetchNotes, fetchNotesByLessonId])

  return { 
    notes: lessonId ? (lessonNotes[lessonId] || []) : notes, 
    loading, 
    error 
  }
}
