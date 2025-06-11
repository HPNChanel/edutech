import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { lessonService, LessonCreateRequest } from '@/services/lessonService'
import { LessonForm } from '@/components/LessonForm'

export default function CreateLessonPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: LessonCreateRequest) => {
    setIsSubmitting(true)
    
    try {
      await lessonService.createLesson(data)
      
      toast({
        title: "Success",
        description: "Lesson created successfully!"
      })
      
      navigate('/lessons')
      
    } catch (error: unknown) {
      console.error('Create lesson error:', error)
      throw error // Let LessonForm handle the error display
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate('/lessons')
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
          <h1 className="text-3xl font-bold text-gray-900">Create New Lesson</h1>
          <p className="text-muted-foreground">Share your knowledge and create engaging learning content</p>
        </div>
      </div>

      {/* Lesson Form */}
      <LessonForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
