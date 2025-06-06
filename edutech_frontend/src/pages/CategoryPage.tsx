import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { categoryService, Category } from '@/services/categoryService'
import { lessonService, Lesson } from '@/services/lessonService'
import { 
  ArrowLeft, 
  BookOpen, 
  Calendar,
  Clock,
  User,
  PlayCircle,
  AlertTriangle,
  FileText,
  Edit,
  Eye
} from 'lucide-react'

export default function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const navigate = useNavigate()
  
  const [category, setCategory] = useState<Category | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingLessons, setIsLoadingLessons] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategoryData = async () => {
      if (!categoryId) {
        setError('Category ID is required')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        
        console.log('Fetching category:', categoryId)
        
        // Fetch category details from API
        const categoryData = await categoryService.getCategoryById(parseInt(categoryId))
        console.log('Category data received:', categoryData)
        
        setCategory(categoryData)
        
      } catch (err: any) {
        console.error('Category data fetch error:', err)
        setError(err.message || 'Failed to load category data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategoryData()
  }, [categoryId])

  useEffect(() => {
    const fetchLessons = async () => {
      if (!categoryId) return

      try {
        setIsLoadingLessons(true)
        
        console.log('Fetching lessons for category:', categoryId)
        
        // Fetch lessons for this category using the lesson service
        const lessonsData = await lessonService.getLessonsByCategory(parseInt(categoryId))
        console.log('Lessons data received:', lessonsData)
        
        setLessons(lessonsData)
        
      } catch (err: any) {
        console.error('Lessons data fetch error:', err)
        // Don't set main error state for lessons fetch failure
        console.warn('Failed to load lessons for category:', err.message)
        setLessons([]) // Set empty array on error
      } finally {
        setIsLoadingLessons(false)
      }
    }

    fetchLessons()
  }, [categoryId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDuration = (content?: string) => {
    if (!content) return '0m'
    const wordCount = content.split(' ').length
    const minutes = Math.max(1, Math.ceil(wordCount / 200)) // 200 words per minute
    return minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`
  }

  const handleStartLesson = (lessonId: number) => {
    navigate(`/lessons/${lessonId}`)
  }

  const handleEditLesson = (lessonId: number) => {
    navigate(`/lessons/${lessonId}/edit`)
  }

  const handleBackToCategories = () => {
    navigate('/categories')
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading category...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !category) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center min-h-96">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p>{error || 'Category not found'}</p>
                    <Button onClick={handleBackToCategories} variant="outline" size="sm">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Categories
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToCategories}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
            {category.description && (
              <p className="text-muted-foreground mt-1">{category.description}</p>
            )}
          </div>
        </div>

        {/* Category Stats */}
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            {isLoadingLessons ? 'Loading...' : `${lessons.length} lessons`}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Created {formatDate(category.created_at)}
          </span>
        </div>
      </div>

      {/* Lessons Grid */}
      {isLoadingLessons ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : lessons.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No lessons yet in this category</h3>
              <p className="text-muted-foreground mb-4">
                This category doesn't have any lessons yet. Create your first lesson to get started.
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => navigate('/lessons/create')}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Create First Lesson
                </Button>
                <Button onClick={handleBackToCategories} variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Browse Other Categories
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.map((lesson) => (
            <Card key={lesson.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <CardTitle className="text-lg leading-6 line-clamp-2">
                      {lesson.title}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        <FileText className="h-3 w-3 mr-1" />
                        {lesson.content ? `${lesson.content.split(' ').length} words` : 'No content'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Lesson Summary */}
                {lesson.summary && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {lesson.summary}
                  </p>
                )}

                {/* Lesson Metadata */}
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(lesson.created_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(lesson.content)}
                    </span>
                  </div>
                  {lesson.updated_at !== lesson.created_at && (
                    <div className="flex items-center gap-1">
                      <Edit className="h-3 w-3" />
                      Updated {formatDate(lesson.updated_at)}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button 
                    className="flex-1" 
                    size="sm"
                    onClick={() => handleStartLesson(lesson.id)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Lesson
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditLesson(lesson.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Category Summary */}
      {!isLoadingLessons && lessons.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                {lessons.length} lesson{lessons.length !== 1 ? 's' : ''} in {category.name}
              </p>
              <p className="text-xs text-muted-foreground">
                Total estimated reading time: {lessons.reduce((acc, lesson) => {
                  const wordCount = lesson.content ? lesson.content.split(' ').length : 0
                  return acc + Math.max(1, Math.ceil(wordCount / 200))
                }, 0)} minutes
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
