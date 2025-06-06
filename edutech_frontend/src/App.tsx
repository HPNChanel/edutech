import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Layout from './components/Layout/Layout'
import DashboardPage from './pages/DashboardPage'
import LessonDetailPage from './pages/LessonDetailPage' // Add this import
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import ForgotPassword from './pages/Auth/ForgotPassword'
import QuizPage from './pages/QuizPage'
import MyNotesPage from './pages/MyNotesPage'
import CreateLessonPage from './pages/CreateLessonPage'
import CategoryPage from './pages/CategoryPage'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'
import CategoryManagement from './pages/Admin/CategoryManagement'
import { Toaster } from './components/ui/toaster'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { Skeleton } from './components/ui/skeleton'
import { Alert, AlertDescription } from './components/ui/alert'
import { Button } from './components/ui/button'
import { Card, CardContent } from './components/ui/card'
import { AlertTriangle, BookOpen, RefreshCw } from 'lucide-react'
import CategoriesPage from './pages/CategoriesPage'
import MyLessonsPage from './pages/MyLessonsPage'

// Loading Component
function AuthLoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            {/* Logo/Icon */}
            <div className="flex justify-center">
              <div className="p-3 bg-primary/10 rounded-full">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
            </div>

            {/* Loading Content */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-6 w-32 mx-auto" />
                <Skeleton className="h-4 w-48 mx-auto" />
              </div>
              
              {/* Animated Spinner */}
              <div className="flex justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              </div>
              
              <p className="text-sm text-muted-foreground">
                Checking authentication...
              </p>
            </div>

            {/* Loading Progress Skeleton */}
            <div className="space-y-3">
              <Skeleton className="h-2 w-full" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Error Component
function AuthErrorScreen({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            {/* Error Icon */}
            <div className="flex justify-center">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>

            {/* Error Alert */}
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button onClick={onRetry} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/login'}
                className="w-full"
              >
                Go to Login
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// App Router Component
function AppRouter() {
  const { isAuthenticated, isLoading, error, getCurrentUser, clearError } = useAuth()

  // Loading state
  if (isLoading) {
    return <AuthLoadingScreen />
  }

  // Error state - only show error screen for critical auth errors
  if (error && !isAuthenticated) {
    return (
      <AuthErrorScreen 
        error={error} 
        onRetry={() => {
          clearError()
          getCurrentUser()
        }} 
      />
    )
  }

  // Not authenticated - show auth routes
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  // Authenticated - show main app (even if there are non-critical errors)
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="lessons/:id" element={<LessonDetailPage />} />
        <Route path="lessons" element={<MyLessonsPage />} />
        <Route path="my-lessons" element={<MyLessonsPage />} />
        <Route path="lessons/create" element={<CreateLessonPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="categories/:categoryId" element={<CategoryPage />} />
        <Route path="admin/categories" element={<CategoryManagement />} />
        <Route path="notes" element={<MyNotesPage />} />
        <Route path="quizzes/:lessonId" element={<QuizPage />} />
        <Route path="quizzes" element={<div className="p-6">Quizzes - Coming Soon</div>} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

// Main App Component
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
