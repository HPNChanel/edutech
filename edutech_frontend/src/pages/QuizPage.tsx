import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { 
  quizService, 
  Quiz, 
  QuizAttempt, 
  QuizQuestion,
  SubmitQuizData,
  StartQuizData 
} from '@/services/quizService'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Trophy,
  Target,
  RefreshCw,
  AlertTriangle,
  FileX,
  BookOpen
} from 'lucide-react'

interface QuizPageState {
  quiz: Quiz | null
  attempt: QuizAttempt | null
  currentQuestionIndex: number
  answers: Record<string, string | string[]>
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
  timeRemaining: number | null
  isCompleted: boolean
}

export default function QuizPage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [state, setState] = useState<QuizPageState>({
    quiz: null,
    attempt: null,
    currentQuestionIndex: 0,
    answers: {},
    isLoading: true,
    isSubmitting: false,
    error: null,
    timeRemaining: null,
    isCompleted: false
  })

  const fetchQuizData = async () => {
    if (!lessonId) {
      setState(prev => ({ 
        ...prev, 
        error: 'Lesson ID is required',
        isLoading: false 
      }))
      return
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      // Get quiz for lesson
      const quizData = await quizService.getQuizByLesson(lessonId)
      
      if (!quizData) {
        setState(prev => ({
          ...prev,
          error: 'No quiz found for this lesson',
          isLoading: false
        }))
        return
      }

      // Start new attempt
      const startData: StartQuizData = {
        quiz_id: quizData.id
      }
      const attemptData = await quizService.startQuiz(startData)

      setState(prev => ({
        ...prev,
        quiz: quizData,
        attempt: attemptData.attempt,
        timeRemaining: quizData.timeLimit ? quizData.timeLimit * 60 : null, // Convert minutes to seconds
        isLoading: false
      }))

    } catch (error: any) {
      console.error('Quiz fetch error:', error)
      
      if (error.response?.status === 401) {
        setState(prev => ({
          ...prev,
          error: 'Please log in to take this quiz',
          isLoading: false
        }))
      } else if (error.response?.status === 404) {
        setState(prev => ({
          ...prev,
          error: 'Quiz not found for this lesson',
          isLoading: false
        }))
      } else {
        setState(prev => ({
          ...prev,
          error: error.message || 'Failed to load quiz',
          isLoading: false
        }))
      }
    }
  }

  useEffect(() => {
    fetchQuizData()
  }, [lessonId])

  // Timer effect
  useEffect(() => {
    if (state.timeRemaining === null || state.timeRemaining <= 0 || state.isCompleted) {
      return
    }

    const timer = setInterval(() => {
      setState(prev => {
        const newTime = prev.timeRemaining! - 1
        
        if (newTime <= 0) {
          // Auto-submit when time runs out
          handleSubmitQuiz()
          return { ...prev, timeRemaining: 0 }
        }
        
        return { ...prev, timeRemaining: newTime }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [state.timeRemaining, state.isCompleted])

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handleAnswerChange = (questionId: string, answer: string | string[]) => {
    setState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: answer
      }
    }))
  }

  const handleSubmitQuiz = async () => {
    if (!state.attempt) return

    try {
      setState(prev => ({ ...prev, isSubmitting: true }))

      const submitData: SubmitQuizData = {
        attempt_id: state.attempt.id,
        answers: state.answers,
        time_spent: state.quiz?.timeLimit ? (state.quiz.timeLimit * 60) - (state.timeRemaining || 0) : undefined
      }

      const result = await quizService.submitQuiz(submitData)

      setState(prev => ({
        ...prev,
        isCompleted: true,
        isSubmitting: false
      }))

      toast({
        title: "Quiz Completed!",
        description: `Quiz submitted successfully.`,
      })

    } catch (error: any) {
      console.error('Submit quiz error:', error)
      
      setState(prev => ({ ...prev, isSubmitting: false }))
      
      toast({
        title: "Error",
        description: error.message || "Failed to submit quiz",
        variant: "destructive"
      })
    }
  }

  const getAnsweredQuestionsCount = (): number => {
    return Object.keys(state.answers).length
  }

  const isCurrentQuestionAnswered = (): boolean => {
    const currentQuestion = state.quiz?.questions[state.currentQuestionIndex]
    return currentQuestion ? !!state.answers[currentQuestion.id] : false
  }

  if (state.isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Progress Skeleton */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          </CardContent>
        </Card>

        {/* Question Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{state.error}</span>
            <div className="flex gap-2 ml-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/lessons')}
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                Back to Lessons
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchQuizData}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!state.quiz || state.quiz.questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <FileX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No Quiz Available</h3>
        <p className="text-muted-foreground mb-4">
          This lesson doesn't have a quiz yet. Check back later or explore other lessons.
        </p>
        <Button onClick={() => navigate('/lessons')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Lessons
        </Button>
      </div>
    )
  }

  const currentQuestion = state.quiz.questions[state.currentQuestionIndex]
  const progress = ((state.currentQuestionIndex + 1) / state.quiz.questions.length) * 100
  const answeredCount = getAnsweredQuestionsCount()

  // Quiz completed view
  if (state.isCompleted && state.attempt) {
    const scorePercentage = state.attempt.totalPoints ? 
      (state.attempt.pointsEarned || 0) / state.attempt.totalPoints * 100 : 0
    const passed = scorePercentage >= (state.quiz.passingScore || 70)

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Results Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            {passed ? (
              <div className="p-4 bg-green-100 rounded-full">
                <Trophy className="h-12 w-12 text-green-600" />
              </div>
            ) : (
              <div className="p-4 bg-orange-100 rounded-full">
                <Target className="h-12 w-12 text-orange-600" />
              </div>
            )}
          </div>
          
          <div>
            <h1 className="text-3xl font-bold">
              {passed ? 'Congratulations!' : 'Quiz Completed'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {passed 
                ? 'You passed the quiz successfully!'
                : 'You can review and retake the quiz if needed.'
              }
            </p>
          </div>
        </div>

        {/* Results Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Quiz Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score Display */}
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold">
                {state.attempt.pointsEarned || 0} / {state.attempt.totalPoints}
              </div>
              <p className="text-muted-foreground">
                {scorePercentage.toFixed(1)}% Score
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Score</span>
                <span>{scorePercentage.toFixed(1)}%</span>
              </div>
              <Progress value={scorePercentage} className="h-3" />
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{state.quiz.questions.length}</div>
                <p className="text-sm text-muted-foreground">Total Questions</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{answeredCount}</div>
                <p className="text-sm text-muted-foreground">Answered</p>
              </div>
            </div>

            {/* Pass/Fail Status */}
            <div className="text-center">
              <Badge 
                variant={passed ? "default" : "secondary"}
                className={`text-sm px-4 py-2 ${
                  passed 
                    ? 'bg-green-100 text-green-800 border-green-200' 
                    : 'bg-orange-100 text-orange-800 border-orange-200'
                }`}
              >
                {passed ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Passed
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Needs Improvement
                  </>
                )}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                Passing score: {state.quiz.passingScore || 70}%
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                variant="outline" 
                onClick={() => navigate(`/lessons/${lessonId}`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Lesson
              </Button>
              <Button onClick={fetchQuizData}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Retake Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Quiz Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{state.quiz.title}</h1>
          {state.timeRemaining !== null && (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
              state.timeRemaining < 300 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
            }`}>
              <Clock className="h-4 w-4" />
              <span className="font-mono">
                {formatTime(state.timeRemaining)}
              </span>
            </div>
          )}
        </div>
        <p className="text-muted-foreground">{state.quiz.description}</p>
      </div>

      {/* Progress Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Question {state.currentQuestionIndex + 1} of {state.quiz.questions.length}</span>
              <span>{answeredCount} answered</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {currentQuestion.question}
          </CardTitle>
          {currentQuestion.points && (
            <p className="text-sm text-muted-foreground">
              Worth {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Answer Options */}
          {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
            <RadioGroup 
              value={state.answers[currentQuestion.id] as string || ''}
              onValueChange={(value) => {
                handleAnswerChange(currentQuestion.id, value)
              }}
            >
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.text} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {currentQuestion.type === 'true_false' && (
            <RadioGroup 
              value={state.answers[currentQuestion.id] as string || ''}
              onValueChange={(value) => {
                handleAnswerChange(currentQuestion.id, value)
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="true" />
                <Label htmlFor="true" className="cursor-pointer">True</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="false" />
                <Label htmlFor="false" className="cursor-pointer">False</Label>
              </div>
            </RadioGroup>
          )}

          {/* Answer Status */}
          {isCurrentQuestionAnswered() && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              Answer saved
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={handlePreviousQuestion}
          disabled={state.currentQuestionIndex === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex gap-2">
          {state.currentQuestionIndex === state.quiz.questions.length - 1 ? (
            <Button 
              onClick={handleSubmitQuiz}
              disabled={state.isSubmitting || answeredCount === 0}
              className="min-w-32"
            >
              {state.isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Submit Quiz
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={handleNextQuestion}
              disabled={state.currentQuestionIndex === state.quiz.questions.length - 1}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Quiz Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>Questions: {state.quiz.questions.length}</span>
            {state.quiz.timeLimit && <span>Time Limit: {state.quiz.timeLimit} minutes</span>}
            {state.quiz.passingScore && <span>Passing Score: {state.quiz.passingScore}%</span>}
            <span>Attempts: {state.attempt?.attemptNumber || 1}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
