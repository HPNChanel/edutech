import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowLeft, Clock, User, Calendar, BookOpen, Download, Play, FileText } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { lessonService, type Lesson } from '@/services/lessonService'

const LessonDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLesson = async () => {
      if (!id) {
        setError('Lesson ID is required')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const lessonData = await lessonService.getLessonById(id)
        setLesson(lessonData)
      } catch (err: any) {
        console.error('Error fetching lesson:', err)
        setError(err.message || 'Failed to load lesson')
      } finally {
        setLoading(false)
      }
    }

    fetchLesson()
  }, [id])

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

  const getDifficultyColor = (difficulty?: string) => {
    if (!difficulty) return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800 hover:bg-green-200'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
      case 'advanced':
        return 'bg-red-100 text-red-800 hover:bg-red-200'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    }
  }

  const getResourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <FileText className="h-4 w-4" />
      case 'video':
        return <Play className="h-4 w-4" />
      default:
        return <Download className="h-4 w-4" />
    }
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
      {/* Navigation */}
      <div className="mb-6">
        <Button onClick={handleBack} variant="outline" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Lessons
        </Button>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {lesson.category && (
              <Link to={`/categories/${lesson.category_id}`}>
                <Badge variant="outline" className="hover:bg-primary hover:text-primary-foreground">
                  {lesson.category.name}
                </Badge>
              </Link>
            )}
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
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
                  <p className="font-medium">User #{lesson.user_id}</p>
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
        </div>

        <Separator className="my-8" />

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle>Lesson Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-code:text-pink-600 prose-code:bg-pink-50 prose-pre:bg-gray-900 prose-pre:text-gray-100">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => <h1 className="text-3xl font-bold mt-8 mb-4 first:mt-0">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-2xl font-semibold mt-6 mb-3">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-xl font-medium mt-4 mb-2">{children}</h3>,
                  p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="mb-4 ml-6 list-disc">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-4 ml-6 list-decimal">{children}</ol>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  code: ({ inline, children }) => 
                    inline ? (
                      <code className="px-2 py-1 bg-gray-100 text-pink-600 rounded text-sm font-mono">
                        {children}
                      </code>
                    ) : (
                      <code className="block">{children}</code>
                    ),
                  pre: ({ children }) => (
                    <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto mb-4">
                      {children}
                    </pre>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-gray-600">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {lesson.content || 'No content available for this lesson.'}
              </ReactMarkdown>
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
