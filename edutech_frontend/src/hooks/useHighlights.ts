import { useEffect } from 'react'
import { useHighlightStore } from '../store/useHighlightStore'

export const useHighlights = (lessonId?: number) => {
  const { 
    highlights, 
    lessonHighlights, 
    loading, 
    error, 
    fetchHighlights, 
    fetchHighlightsByLessonId 
  } = useHighlightStore()

  useEffect(() => {
    if (lessonId) {
      fetchHighlightsByLessonId(lessonId)
    } else {
      fetchHighlights()
    }
  }, [lessonId, fetchHighlights, fetchHighlightsByLessonId])

  return { 
    highlights: lessonId ? (lessonHighlights[lessonId] || []) : highlights, 
    loading, 
    error 
  }
}
