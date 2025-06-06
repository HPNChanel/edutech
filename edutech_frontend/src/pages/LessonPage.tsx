import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Plus, BookOpen, Calendar, Folder, AlertCircle } from 'lucide-react'

import { lessonService, Lesson } from '@/services/lessonService'
import { useAuth } from '@/hooks/useAuth'

const LessonPage: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  const navigate = useNavigate()
  const { user } = useAuth()

  // Fetch lessons on component mount
  useEffect(() => {
    fetchLessons()
  }, [])

  // Filter lessons when search term or category changes
  useEffect(() => {
    filterLessons()
  }, [lessons, searchTerm, selectedCategory])

  const fetchLessons = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await lessonService.getLessons()
      setLessons(data)
    } catch (err: any) {
      console.error('Failed to fetch lessons:', err)
      setError(err.message || 'Failed to load lessons')
    } finally {
      setIsLoading(false)
    }
  }

  const filterLessons = () => {
    let filtered = lessons

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(lesson =>
        lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lesson.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lesson.summary?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(lesson =>
        lesson.category?.name === selectedCategory
      )
    }

    setFilteredLessons(filtered)
  }

  const handleLessonClick = (lessonId: number) => {
    navigate(`/lessons/${lessonId}`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Get unique categories for filter dropdown
  const categories = Array.from(
    new Set(lessons.map(lesson => lesson.category?.name).filter(Boolean))
  )

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Loading lessons...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Lessons</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchLessons}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Lessons</h1>
          <p className="text-gray-600">
            {lessons.length} lesson{lessons.length !== 1 ? 's' : ''} available
          </p>
        </div>
        <Link
          to="/lessons/create"
          className="mt-4 sm:mt-0 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>New Lesson</span>
        </Link>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search lessons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {categories.length > 0 && (
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Lessons Grid */}
      {filteredLessons.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchTerm || selectedCategory ? 'No lessons found' : 'No lessons yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedCategory 
              ? 'Try adjusting your search or filter criteria'
              : 'Create your first lesson to get started'
            }
          </p>
          {!searchTerm && !selectedCategory && (
            <Link
              to="/lessons/create"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create First Lesson</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLessons.map((lesson) => (
            <div
              key={lesson.id}
              onClick={() => handleLessonClick(lesson.id)}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {lesson.title}
                  </h3>
                  <BookOpen className="h-5 w-5 text-blue-600 flex-shrink-0 ml-2" />
                </div>

                {lesson.summary && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {lesson.summary}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    {lesson.category && (
                      <div className="flex items-center space-x-1">
                        <Folder className="h-4 w-4" />
                        <span>{lesson.category.name}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(lesson.created_at)}</span>
                    </div>
                  </div>
                </div>

                {lesson.content && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      {lesson.content.length} characters
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default LessonPage
