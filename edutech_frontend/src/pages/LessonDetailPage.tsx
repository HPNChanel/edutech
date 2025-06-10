import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Clock, User, Calendar, BookOpen, Eye, Edit, StickyNote, Highlighter } from 'lucide-react'

// Import custom CSS for text selection
import '@/styles/lesson-content.css'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { lessonService, type Lesson } from '@/services/lessonService'
import { noteService, type Note } from '@/services/noteService'
import { annotationService, type Highlight } from '@/services/annotationService'
import { getLessonContentClasses, getLessonContentStyles } from '@/lib/textSelection'

import { HighlightableMarkdown } from '@/components/HighlightableMarkdown'

const LessonDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const contentRef = useRef<HTMLDivElement>(null)
  const restorationApplied = useRef(false)



  useEffect(() => {
    if (!id) return
    
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch lesson data
        const lessonData = await lessonService.getLessonById(id)
        setLesson(lessonData)
        
        // Fetch highlights and notes for this lesson
        const [highlightsData, notesData] = await Promise.all([
          annotationService.getHighlightsByLesson(parseInt(id)),
          noteService.getNotesByLesson(id)
        ])
        
        setHighlights(highlightsData)
        setNotes(notesData)
      } catch (err: unknown) {
        console.error('Error fetching lesson data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load lesson')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  // Restore notes and highlights after content is loaded
  useEffect(() => {
    if (!lesson || !contentRef.current || restorationApplied.current) return
    
    // Wait for content to be fully rendered
    const timer = setTimeout(() => {
      restoreNotesAndHighlights()
      restorationApplied.current = true
    }, 500)
    
    return () => clearTimeout(timer)
  }, [lesson, highlights, notes])







  // Note: Text offset functions temporarily removed due to interface conflicts
  // These will be reimplemented when backend interfaces are unified

  // Function to restore notes and highlights in the content
  const restoreNotesAndHighlights = () => {
    if (!contentRef.current) return
    
    const container = contentRef.current
    
    // Clear existing highlights and notes first
    container.querySelectorAll('[data-highlight], [data-note-highlight]').forEach(element => {
      const parent = element.parentNode
      if (parent) {
        // Replace the span with its text content
        while (element.firstChild) {
          parent.insertBefore(element.firstChild, element)
        }
        parent.removeChild(element)
      }
    })

    // Note: Restoration logic temporarily simplified due to interface differences
    // Between annotationService and noteService. This will be enhanced in a future iteration
    // to properly restore highlights and notes based on stored offsets.
    
    console.log('Would restore', highlights.length, 'highlights and', notes.length, 'notes')
    
    // TODO: Implement proper restoration logic when backend interfaces are unified
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error || !lesson) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Alert className="mb-6">
            <AlertDescription>
              {error || 'Lesson not found'}
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
      <div className="max-w-4xl mx-auto">
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
        </div>

        <Separator className="my-8" />

        {/* Lesson content */}
        <Card>
          <CardHeader>
            <CardTitle>Lesson Content</CardTitle>
            <p className="text-sm text-gray-600">
              {highlights.length} highlights • {notes.length} notes
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div
              ref={contentRef}
              className={`${getLessonContentClasses()} p-6`}
              style={getLessonContentStyles()}
            >
              <HighlightableMarkdown
                content={lesson.content || 'No content available for this lesson.'}
                highlights={highlights}
                className="highlightable-content"
              />
            </div>
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
