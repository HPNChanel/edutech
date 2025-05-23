import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Stack,
  LinearProgress,
  Divider,
  Alert,
  Card,
  CardContent,
  Grid
} from '@mui/material'
import {
  ArrowBack,
  ArrowForward,
  Check,
  Close,
  Refresh
} from '@mui/icons-material'
import { quizService } from '../services/quizService'
import { lessonService } from '../services/lessonService'
import type { QuizQuestion, Lesson } from '../types/lesson'
import Layout from '../components/Layout'

const QuizPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [answerLoading, setAnswerLoading] = useState(false)

  useEffect(() => {
    const fetchQuizData = async () => {
      if (!id) return
      
      try {
        // Fetch questions for this lesson
        const questionsData = await quizService.getQuestionsByLessonId(parseInt(id))
        setQuestions(questionsData)
        
        // Fetch lesson details
        const lessonData = await lessonService.getById(parseInt(id))
        setLesson(lessonData)
      } catch (err: any) {
        setError(err.message || 'Failed to load quiz')
      } finally {
        setLoading(false)
      }
    }

    fetchQuizData()
  }, [id])

  const handleAnswerSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedAnswer(event.target.value)
  }

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer) return
    
    setAnswerLoading(true)
    try {
      const currentQ = questions[currentQuestion]
      const result = await quizService.submitQuizAnswer(currentQ.id, selectedAnswer)
      
      if (result.isCorrect) {
        setScore(score + 1)
      }
      
      setIsSubmitted(true)
    } catch (error) {
      setError('Failed to check answer. Please try again.')
      console.error(error)
    } finally {
      setAnswerLoading(false)
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer('')
      setIsSubmitted(false)
    } else {
      setQuizCompleted(true)
    }
  }

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
      setSelectedAnswer('')
      setIsSubmitted(false)
    }
  }

  const handleRestartQuiz = () => {
    setCurrentQuestion(0)
    setSelectedAnswer('')
    setIsSubmitted(false)
    setScore(0)
    setQuizCompleted(false)
  }

  if (loading) {
    return (
      <Layout>
        <Container>
          <LinearProgress />
          <Typography sx={{ mt: 2 }}>Loading quiz...</Typography>
        </Container>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <Container>
          <Alert severity="error">{error}</Alert>
          <Button 
            onClick={() => navigate(`/lessons/${id}`)} 
            startIcon={<ArrowBack />}
            sx={{ mt: 2 }}
          >
            Back to Lesson
          </Button>
        </Container>
      </Layout>
    )
  }

  if (questions.length === 0) {
    return (
      <Layout>
        <Container>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              No quiz questions available
            </Typography>
            <Typography paragraph color="textSecondary">
              There are no quiz questions generated for this lesson yet.
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => navigate(`/lessons/${id}`)}
              startIcon={<ArrowBack />}
            >
              Back to Lesson
            </Button>
          </Paper>
        </Container>
      </Layout>
    )
  }

  if (quizCompleted) {
    const percentage = Math.round((score / questions.length) * 100)
    return (
      <Layout>
        <Container maxWidth="md">
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom>
              Quiz Completed!
            </Typography>
            
            <Typography variant="h5" gutterBottom>
              Your Score: {score} / {questions.length} ({percentage}%)
            </Typography>
            
            <Box sx={{ mt: 3, mb: 4 }}>
              <LinearProgress 
                variant="determinate" 
                value={percentage} 
                sx={{ 
                  height: 10, 
                  borderRadius: 5,
                  backgroundColor: '#e0e0e0',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: percentage >= 70 ? '#4caf50' : 
                                      percentage >= 40 ? '#ff9800' : '#f44336'
                  }
                }}
              />
            </Box>
            
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button 
                variant="outlined" 
                onClick={handleRestartQuiz}
                startIcon={<Refresh />}
              >
                Restart Quiz
              </Button>
              <Button 
                variant="contained" 
                onClick={() => navigate(`/lessons/${id}`)}
                startIcon={<ArrowBack />}
              >
                Back to Lesson
              </Button>
            </Stack>
          </Paper>
        </Container>
      </Layout>
    )
  }

  const question = questions[currentQuestion]

  return (
    <Layout>
      <Container maxWidth="md">
        <Box sx={{ mb: 3 }}>
          <Button 
            onClick={() => navigate(`/lessons/${id}`)} 
            startIcon={<ArrowBack />}
          >
            Back to Lesson
          </Button>
        </Box>
        
        <Paper elevation={3} sx={{ p: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" color="textSecondary" gutterBottom>
              Quiz: {lesson?.title}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={(currentQuestion / questions.length) * 100} 
              sx={{ height: 8, borderRadius: 4 }} 
            />
            <Typography variant="body2" align="right" sx={{ mt: 1 }}>
              Question {currentQuestion + 1} of {questions.length}
            </Typography>
          </Box>
          
          <Typography variant="h5" component="h2" gutterBottom>
            {question.question}
          </Typography>
          
          <Box sx={{ my: 3 }}>
            <FormControl component="fieldset" fullWidth>
              <RadioGroup value={selectedAnswer} onChange={handleAnswerSelect}>
                {question.options.map((option, index) => (
                  <FormControlLabel
                    key={index}
                    value={option}
                    control={<Radio />}
                    label={option}
                    disabled={isSubmitted}
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      ...(isSubmitted && option === question.correct_answer && {
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                      }),
                      ...(isSubmitted && selectedAnswer === option && option !== question.correct_answer && {
                        backgroundColor: 'rgba(244, 67, 54, 0.1)',
                      }),
                    }}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          </Box>
          
          {isSubmitted && (
            <Card variant="outlined" sx={{ mb: 3, bgcolor: selectedAnswer === question.correct_answer ? 'rgba(76, 175, 80, 0.05)' : 'rgba(244, 67, 54, 0.05)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {selectedAnswer === question.correct_answer ? (
                    <Check color="success" />
                  ) : (
                    <Close color="error" />
                  )}
                  <Typography variant="subtitle1" sx={{ ml: 1 }}>
                    {selectedAnswer === question.correct_answer ? 'Correct!' : 'Incorrect'}
                  </Typography>
                </Box>
                
                {question.explanation && (
                  <Typography variant="body2">
                    {question.explanation}
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button 
              onClick={handlePrevQuestion} 
              disabled={currentQuestion === 0}
              startIcon={<ArrowBack />}
            >
              Previous
            </Button>
            
            {!isSubmitted ? (
              <Button 
                variant="contained" 
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswer}
              >
                Check Answer
              </Button>
            ) : (
              <Button 
                variant="contained" 
                onClick={handleNextQuestion}
                endIcon={<ArrowForward />}
              >
                {currentQuestion === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
              </Button>
            )}
          </Box>
        </Paper>
      </Container>
    </Layout>
  )
}

export default QuizPage
