import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { Box, CircularProgress, Alert } from '@mui/material'
import CssBaseline from '@mui/material/CssBaseline'
import theme from './theme'
import { useUserStore } from './store/useUserStore'
import { authService } from './services/authService'

// Pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import LessonPage from './pages/LessonPage'
import UploadPage from './pages/UploadPage'
import CreateLessonPage from './pages/CreateLessonPage'
import QuizPage from './pages/QuizPage'
import ProfilePage from './pages/ProfilePage'
import NotFoundPage from './pages/NotFoundPage'
import CategoryPage from './pages/CategoryPage'
import MyNotesPage from './pages/MyNotesPage'

// Layout
import Layout from './components/Layout'

// RequireAuth component for protected routes
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useUserStore()
  const location = useLocation()
  
  // Show loading while checking authentication
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }
  
  if (!user) {
    // Redirect to login page but save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  
  return <>{children}</>
}

function App() {
  const { user, setUser } = useUserStore()
  const [initialCheckDone, setInitialCheckDone] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  // Check for authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (authService.isAuthenticated() && !user) {
          const currentUser = await authService.getCurrentUser()
          setUser(currentUser)
        }
      } catch (error) {
        console.error('Authentication check failed:', error)
        // If token is invalid, clear it
        authService.logout()
        setAuthError('Your session has expired. Please log in again.')
      } finally {
        setInitialCheckDone(true)
      }
    }

    checkAuth()
  }, [user, setUser])

  if (!initialCheckDone) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </Box>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      {authError && (
        <Alert 
          severity="warning" 
          sx={{ position: 'fixed', top: 0, width: '100%', zIndex: 9999 }}
          onClose={() => setAuthError(null)}
        >
          {authError}
        </Alert>
      )}
      
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
        />
        <Route 
          path="/register" 
          element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} 
        />

        {/* Protected routes */}
        <Route path="/" element={<RequireAuth><Layout><DashboardPage /></Layout></RequireAuth>} />
        <Route path="/dashboard" element={<RequireAuth><Layout><DashboardPage /></Layout></RequireAuth>} />
        <Route path="/lessons/:id" element={<RequireAuth><Layout><LessonPage /></Layout></RequireAuth>} />
        <Route path="/upload" element={<RequireAuth><Layout><UploadPage /></Layout></RequireAuth>} />
        <Route path="/create-lesson" element={<RequireAuth><Layout><CreateLessonPage /></Layout></RequireAuth>} />
        <Route path="/quiz/:id" element={<RequireAuth><Layout><QuizPage /></Layout></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><Layout><ProfilePage /></Layout></RequireAuth>} />
        <Route path="/categories" element={<RequireAuth><Layout><CategoryPage /></Layout></RequireAuth>} />
        <Route path="/notes" element={<RequireAuth><Layout><MyNotesPage /></Layout></RequireAuth>} />

        {/* 404 Not Found route */}
        <Route 
          path="*" 
          element={
            user ? (
              <Layout>
                <NotFoundPage />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
      </Routes>
    </ThemeProvider>
  )
}

export default App
