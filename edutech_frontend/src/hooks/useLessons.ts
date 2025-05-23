import { useEffect } from 'react'
import { useLessonStore } from '../store/useLessonStore'

export const useLessons = () => {
  const { lessons, loading, error, fetchLessons } = useLessonStore()

  useEffect(() => {
    fetchLessons()
  }, [fetchLessons])

  return { lessons, loading, error }
}
