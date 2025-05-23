import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useUserStore } from './store/useUserStore'

// Pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import LessonPage from './pages/LessonPage'
import UploadPage from './pages/UploadPage'
import CreateLessonPage from './pages/CreateLessonPage'
import QuizPage from './pages/QuizPage'
import MyNotesPage from './pages/MyNotesPage'
import CategoryPage from './pages/CategoryPage'
import ProfilePage from './pages/ProfilePage'
import NotFoundPage from './pages/NotFoundPage'

// Layout
import Layout from './components/Layout'

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useUserStore((state) => !!state.user)
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

const AppRouter: React.FC = () => {
  const isAuthenticated = useUserStore((state) => !!state.user)

  return (
    <Routes>
      {/* Public routes */}
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
      />
      <Route 
        path="/register" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />} 
      />

      {/* Protected routes */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/lessons/:id" 
        element={
          <ProtectedRoute>
            <Layout>
              <LessonPage />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/upload" 
        element={
          <ProtectedRoute>
            <Layout>
              <UploadPage />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/create-lesson" 
        element={
          <ProtectedRoute>
            <Layout>
              <CreateLessonPage />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/quiz/:id" 
        element={
          <ProtectedRoute>
            <Layout>
              <QuizPage />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/notes" 
        element={
          <ProtectedRoute>
            <Layout>
              <MyNotesPage />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/categories" 
        element={
          <ProtectedRoute>
            <Layout>
              <CategoryPage />
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Layout>
              <ProfilePage />
            </Layout>
          </ProtectedRoute>
        } 
      />

      {/* 404 Not Found route */}
      <Route 
        path="*" 
        element={
          isAuthenticated ? (
            <Layout>
              <NotFoundPage />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
    </Routes>
  )
}

export default AppRouter
