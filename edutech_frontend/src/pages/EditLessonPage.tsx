import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { lessonService, Lesson, LessonUpdateRequest } from '@/services/lessonService'
import { LessonForm } from '@/components/LessonForm'

export default function EditLessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLesson = async () => {
      if (!lessonId) {
        setError('Invalid lesson ID')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        
        const lessonData = await lessonService.getLessonById(lessonId)
        setLesson(lessonData)
      } catch (error: unknown) {
        console.error('Failed to fetch lesson:', error)
        setError(error instanceof Error ? error.message : 'Failed to load lesson')
        toast({
          title: "Error",
          description: "Failed to load lesson. Please try again.",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchLesson()
  }, [lessonId, toast])

  const handleSubmit = async (data: LessonUpdateRequest) => {
    if (!lessonId) return

    setIsSubmitting(true)
    
    try {
      await lessonService.updateLesson(lessonId, data)
      
      toast({
        title: "Success",
        description: "Lesson updated successfully!"
      })
      
      navigate(`/lessons/${lessonId}`)
      
    } catch (error: unknown) {
      console.error('Update lesson error:', error)
      throw error // Let LessonForm handle the error display
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (lessonId) {
      navigate(`/lessons/${lessonId}`)
    } else {
      navigate('/lessons')
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Loading lesson...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !lesson) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/lessons')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Lesson</h1>
          </div>
        </div>
        
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {error || 'Lesson not found'}
            </h2>
            <p className="text-gray-600 mb-4">
              {error || 'The lesson you are trying to edit could not be found.'}
            </p>
            <Button onClick={() => navigate('/lessons')}>
              Back to Lessons
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Lesson</h1>
          <p className="text-muted-foreground">Make changes to your lesson content and settings</p>
        </div>
      </div>

      {/* Lesson Form */}
      <LessonForm
        mode="edit"
        initialData={lesson}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
      />
    </div>
  )
} 