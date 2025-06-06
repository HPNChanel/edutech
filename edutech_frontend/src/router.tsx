import React, { Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'

// Import components
import Layout from '@/components/Layout/Layout'

// Lazy load page components
const Login = React.lazy(() => import('@/pages/Auth/Login'))
const Register = React.lazy(() => import('@/pages/Auth/Register'))
const ForgotPassword = React.lazy(() => import('@/pages/Auth/ForgotPassword'))
const DashboardPage = React.lazy(() => import('@/pages/DashboardPage'))
const LessonPage = React.lazy(() => import('@/pages/LessonPage'))
const CreateLessonPage = React.lazy(() => import('@/pages/CreateLessonPage'))
const CategoryPage = React.lazy(() => import('@/pages/CategoryPage'))
const CategoryManagement = React.lazy(() => import('@/pages/Admin/CategoryManagement'))
const CategoriesPage = React.lazy(() => import('@/pages/CategoriesPage'))
const MyNotesPage = React.lazy(() => import('@/pages/MyNotesPage'))
const QuizPage = React.lazy(() => import('@/pages/QuizPage'))
const ProfilePage = React.lazy(() => import('@/pages/ProfilePage'))
const MyLessonsPage = React.lazy(() => import('@/pages/MyLessonsPage'))
const LessonDetailPage = React.lazy(() => import('@/pages/LessonDetailPage'))
const SettingsPage = React.lazy(() => import('@/pages/SettingsPage'))

// Simple loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-96">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
)

const SuspenseWrapper = ({ 
  children, 
  fallback = <LoadingSpinner />
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) => (
  <Suspense fallback={fallback}>
    {children}
  </Suspense>
)

// Authentication routes
export const authRouter = createBrowserRouter([
  {
    path: "/login",
    element: (
      <SuspenseWrapper>
        <Login />
      </SuspenseWrapper>
    ),
  },
  {
    path: "/register",
    element: (
      <SuspenseWrapper>
        <Register />
      </SuspenseWrapper>
    ),
  },
  {
    path: "/forgot-password",
    element: (
      <SuspenseWrapper>
        <ForgotPassword />
      </SuspenseWrapper>
    ),
  },
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
])

// Main application routes
export const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: (
          <SuspenseWrapper>
            <DashboardPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: "lessons/:id",
        element: (
          <SuspenseWrapper>
            <LessonDetailPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: "my-lessons",
        element: (
          <SuspenseWrapper>
            <MyLessonsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: "lessons/create",
        element: (
          <SuspenseWrapper>
            <CreateLessonPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: "lessons/:lessonId/edit",
        element: (
          <SuspenseWrapper>
            <div className="p-6">Edit Lesson - Coming Soon</div>
          </SuspenseWrapper>
        ),
      },
      {
        path: "lessons",
        element: (
          <SuspenseWrapper>
            <MyLessonsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: "categories",
        element: (
          <SuspenseWrapper>
            <CategoriesPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: "categories/:categoryId",
        element: (
          <SuspenseWrapper>
            <CategoryPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: "admin/categories",
        element: (
          <SuspenseWrapper>
            <CategoryManagement />
          </SuspenseWrapper>
        ),
      },
      {
        path: "notes",
        element: (
          <SuspenseWrapper>
            <MyNotesPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: "quizzes/:lessonId",
        element: (
          <SuspenseWrapper>
            <QuizPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: "quizzes",
        element: (
          <SuspenseWrapper>
            <div className="p-6">Quizzes - Coming Soon</div>
          </SuspenseWrapper>
        ),
      },
      {
        path: "profile",
        element: (
          <SuspenseWrapper>
            <ProfilePage />
          </SuspenseWrapper>
        ),
      },
      {
        path: "settings",
        element: (
          <SuspenseWrapper>
            <SettingsPage />
          </SuspenseWrapper>
        ),
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
])
