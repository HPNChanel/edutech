import React from 'react'
import {
  Typography,
  Button,
  Box,
  Container,
  Divider,
  Card,
  CardContent
} from '@mui/material'
import Grid from '@mui/material/Grid'
import { useNavigate } from 'react-router-dom'
import { useLessons } from '../hooks/useLessons'
import LessonCard from '../components/LessonCard'
import DashboardCharts from '../components/DashboardCharts'

const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { lessons, loading, error } = useLessons()

  const recentLessons = lessons.slice(0, 6)

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary">
                Total Lessons
              </Typography>
              <Typography variant="h4">
                {lessons.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary">
                Categories
              </Typography>
              <Typography variant="h4">
                {new Set(lessons.map(l => l.category_id)).size}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary">
                Notes
              </Typography>
              <Typography variant="h4">
                0
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary">
                Quizzes
              </Typography>
              <Typography variant="h4">
                0
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Analytics
        </Typography>
        <DashboardCharts />
      </Box>

      <Divider sx={{ my: 4 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Recent Lessons
        </Typography>
        <Box>
          <Button 
            variant="contained" 
            onClick={() => navigate('/upload')}
            sx={{ mr: 2 }}
          >
            Upload Document
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/create-lesson')}
          >
            Create Lesson
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Typography>Loading lessons...</Typography>
      ) : error ? (
        <Typography color="error">Error loading lessons: {error}</Typography>
      ) : (
        <Grid container spacing={3}>
          {recentLessons.map((lesson) => (
            <Grid item xs={12} sm={6} md={4} key={lesson.id}>
              <LessonCard lesson={lesson} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  )
}

export default DashboardPage
