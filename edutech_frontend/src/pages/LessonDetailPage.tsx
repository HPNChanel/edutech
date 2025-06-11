import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Clock, User, Calendar, BookOpen, Eye, Edit, StickyNote, Highlighter, Trash2 } from 'lucide-react'

// Import custom CSS for text selection
import '@/styles/lesson-content.css'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

import { lessonService, type Lesson } from '@/services/lessonService'
import { noteService, type Note } from '@/services/noteService'
import { annotationService, type Highlight } from '@/services/annotationService'
import { getLessonContentClasses, getLessonContentStyles } from '@/lib/textSelection'
import { processMarkdownWithHighlights } from '@/lib/highlightUtils'

import { SidebarNoteForm } from '@/components/SidebarNoteForm'
import { useTextSelectionData } from '@/hooks/useTextSelectionData'

const LessonDetailPage: React.FC = () => {
  // Extract lessonId from URL params with proper typing and validation
  const params = useParams<{ lessonId: string }>()
  const lessonId = params.lessonId
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  const contentRef = useRef<HTMLDivElement>(null)

  // Stable text selection for sidebar
  const {
    selectionData: currentSelection,
    captureSelection,
    clearSelection,
    hasSelection
  } = useTextSelectionData('.lesson-content')

  // Handle text selection on mouseup
  const handleTextSelection = (event: React.MouseEvent) => {
    console.log('Text selection event triggered at:', { x: event.clientX, y: event.clientY })
    
    // Small delay to ensure browser selection is ready
    setTimeout(() => {
      const selectionData = captureSelection()
      console.log('Selection data captured:', selectionData)
      
      if (selectionData && selectionData.selectedText.trim().length > 0) {
        console.log('Text selected for highlighting/notes:', selectionData.selectedText.substring(0, 50) + '...')
      } else {
        console.log('No valid text selected')
      }
    }, 50)
  }

  useEffect(() => {
    // Validate lessonId before making API calls
    if (!lessonId || lessonId.trim() === '') {
      console.error('LessonDetailPage: lessonId is missing from URL params', { params, lessonId })
      setError('Invalid lesson ID. Please check the URL and try again.')
      setLoading(false)
      return
    }

    // Validate that lessonId is a valid number
    if (isNaN(Number(lessonId))) {
      console.error('LessonDetailPage: lessonId is not a valid number', { lessonId })
      setError('Invalid lesson ID format. Please check the URL and try again.')
      setLoading(false)
      return
    }
    
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log('LessonDetailPage: Fetching data for lessonId:', lessonId)
        
        // Fetch lesson data
        const lessonData = await lessonService.getLessonById(lessonId)
        setLesson(lessonData)
        
        // Fetch highlights and notes for this lesson
        const [highlightsData, notesData] = await Promise.all([
          annotationService.getHighlightsByLesson(parseInt(lessonId)),
          noteService.getNotesByLesson(lessonId)
        ])
        
        setHighlights(highlightsData)
        setNotes(notesData)
      } catch (err: unknown) {
        console.error('Error fetching lesson data:', err)
        
        // Provide more specific error messages
        if (err instanceof Error) {
          if (err.message.includes('404')) {
            setError(`Lesson with ID "${lessonId}" was not found.`)
          } else if (err.message.includes('403')) {
            setError('You do not have permission to view this lesson.')
          } else if (err.message.includes('401')) {
            setError('Please log in to view this lesson.')
          } else {
            setError(err.message)
          }
        } else {
          setError('Failed to load lesson. Please try again.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [lessonId])

  // Function to refresh data after note/highlight creation
  const refreshData = async () => {
    if (!lessonId) return
    
    try {
      const [highlightsData, notesData] = await Promise.all([
        annotationService.getHighlightsByLesson(parseInt(lessonId)),
        noteService.getNotesByLesson(lessonId)
      ])
      
      setHighlights(highlightsData)
      setNotes(notesData)
    } catch (error) {
      console.error('Error refreshing data:', error)
    }
  }

  const handleBack = () => {
    navigate(-1)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleDeleteLesson = async () => {
    if (!lessonId) return

    setIsDeleting(true)
    
    try {
      await lessonService.deleteLesson(lessonId)
      
      toast({
        title: "Success",
        description: "Lesson deleted successfully!"
      })
      
      navigate('/lessons')
      
    } catch (error: unknown) {
      console.error('Delete lesson error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete lesson",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  // Show error state with more helpful information
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Alert className="mb-6">
            <AlertDescription>
              <strong>Error:</strong> {error}
              {lessonId && (
                <div className="mt-2 text-sm text-gray-600">
                  Lesson ID: {lessonId}
                </div>
              )}
            </AlertDescription>
          </Alert>
          <div className="flex gap-4">
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Show not found state if no lesson data
  if (!lesson) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Alert className="mb-6">
            <AlertDescription>
              Lesson not found. The lesson may have been deleted or you may not have permission to view it.
              {lessonId && (
                <div className="mt-2 text-sm text-gray-600">
                  Lesson ID: {lessonId}
                </div>
              )}
            </AlertDescription>
          </Alert>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Sidebar for note/highlight creation */}
      {lesson && (
        <SidebarNoteForm
          lessonId={lesson.id}
          lessonTitle={lesson.title}
          currentSelection={currentSelection}
          onNoteSaved={refreshData}
          onHighlightSaved={refreshData}
          onSelectionCleared={clearSelection}
        />
      )}
      
      <div className="max-w-4xl mx-auto md:mr-[340px]">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {lesson.title}
          </h1>
          
          {lesson.summary && (
            <p className="text-xl text-gray-600 leading-relaxed">
              {lesson.summary}
            </p>
          )}
        </div>

        {/* Metadata */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Author</p>
                  <p className="font-medium">
                    {lesson.user?.name || `User #${lesson.user_id}`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium">{formatDate(lesson.created_at)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="font-medium">{formatDate(lesson.updated_at)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Annotation Stats */}
        {(highlights.length > 0 || notes.length > 0) && (
          <Card className="mb-8">
            <CardContent className="p-4">
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Highlighter className="h-4 w-4 text-yellow-600" />
                  <span>{highlights.length} highlight{highlights.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StickyNote className="h-4 w-4 text-blue-600" />
                  <span>{notes.length} note{notes.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Link to={`/notes?lesson_id=${lesson.id}`}>
            <Button variant="outline">
              <BookOpen className="mr-2 h-4 w-4" />
              My Notes
            </Button>
          </Link>
          
          <Link to={`/quizzes/${lesson.id}`}>
            <Button>
              Take Quiz
            </Button>
          </Link>
          
          <Link to={`/lessons/${lesson.id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit Lesson
            </Button>
          </Link>



          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Lesson
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Lesson</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete "{lesson.title}"? This action cannot be undone.
                  All associated notes and highlights will also be deleted.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteLesson} disabled={isDeleting}>
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Lesson
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Separator className="my-8" />

        {/* Lesson content */}
        <Card>
          <CardHeader>
            <CardTitle>Lesson Content</CardTitle>
            <p className="text-sm text-gray-600">
              {highlights.length} highlights • {notes.length} notes
              {hasSelection && (
                <span className="ml-2 text-green-600">• Text selected</span>
              )}
              <br />
              <span className="text-xs text-gray-500">
                Select text to create highlights, notes, or get AI assistance from the sidebar
              </span>
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div
              ref={contentRef}
              className={`${getLessonContentClasses()} lesson-content p-6 prose max-w-none`}
              style={getLessonContentStyles()}
              onMouseUp={handleTextSelection}
              dangerouslySetInnerHTML={{
                __html: processMarkdownWithHighlights(
                  lesson.content || 'No content available for this lesson.',
                  highlights
                )
              }}
            />
          </CardContent>
        </Card>



        {/* Navigation Footer */}
        <div className="mt-12 pt-8 border-t">
          <div className="flex justify-between items-center">
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Lessons
            </Button>
            
            <div className="flex gap-4">
              <Link to={`/notes?lesson_id=${lesson.id}`}>
                <Button variant="outline">
                  <Eye className="mr-2 h-4 w-4" />
                  View Notes
                </Button>
              </Link>
              
              <Link to={`/quizzes/${lesson.id}`}>
                <Button>
                  Take Quiz
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LessonDetailPage
