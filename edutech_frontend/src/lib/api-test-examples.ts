// This file contains examples of how the refactored API client handles different scenarios
// You can use these examples to test the token refresh functionality

import { api, getAccessToken, setAccessToken, setRefreshToken, getRefreshToken, logoutUser } from './api'

// Example: Test expired access token scenario
export const testExpiredAccessToken = async () => {
  try {
    console.log('🧪 Testing expired access token scenario...')
    
    // Set a fake expired token
    setAccessToken('expired.jwt.token')
    setRefreshToken('valid.refresh.token')
    
    // Try to make a request that requires authentication
    const response = await api.get('/api/auth/me')
    console.log('✅ Request succeeded after token refresh:', response.data)
    
  } catch (error) {
    console.error('❌ Request failed:', error)
  }
}

// Example: Test when both tokens are expired
export const testExpiredRefreshToken = async () => {
  try {
    console.log('🧪 Testing expired refresh token scenario...')
    
    // Set fake expired tokens
    setAccessToken('expired.jwt.token')
    setRefreshToken('expired.refresh.token')
    
    // Try to make a request - should trigger logout
    await api.get('/api/auth/me')
    console.log('This should not be reached if refresh token is expired')
    
  } catch (error) {
    console.log('✅ Expected behavior: User should be logged out automatically')
    console.error('Error (expected):', error)
  }
}

// Example: Test normal authenticated request
export const testNormalAuthenticatedRequest = async () => {
  try {
    console.log('🧪 Testing normal authenticated request...')
    
    const token = getAccessToken()
    if (!token) {
      console.log('❌ No access token found. Please login first.')
      return
    }
    
    // Make a normal request with valid token
    const response = await api.get('/api/auth/me')
    console.log('✅ Normal request succeeded:', response.data)
    
  } catch (error) {
    console.error('❌ Normal request failed:', error)
  }
}

// Example: Test manual logout
export const testManualLogout = () => {
  console.log('🧪 Testing manual logout...')
  
  // This will clear tokens and redirect to login
  logoutUser(true)
  
  console.log('✅ User logged out successfully')
}

// Example: Test multiple concurrent requests during token refresh
export const testConcurrentRequests = async () => {
  console.log('🧪 Testing concurrent requests during token refresh...')
  
  // Set an expired token to trigger refresh
  setAccessToken('expired.jwt.token')
  setRefreshToken('valid.refresh.token')
  
  // Make multiple concurrent requests
  const requests = [
    api.get('/api/auth/me'),
    api.get('/api/categories'),
    api.get('/api/lessons'),
    api.get('/api/notes'),
  ]
  
  try {
    const responses = await Promise.all(requests)
    console.log('✅ All concurrent requests succeeded:', responses.length)
  } catch (error) {
    console.error('❌ Some concurrent requests failed:', error)
  }
}

// Example: How to integrate with your toast system
export const setupToastIntegration = () => {
  // If you're using a toast library like react-hot-toast or similar,
  // you can modify the logoutUser function in api.ts to show proper toasts:
  
  /*
  // In api.ts, replace the console.warn with:
  import { toast } from 'react-hot-toast' // or your toast library
  
  export const logoutUser = (showToast: boolean = true): void => {
    clearTokens()
    
    if (showToast && typeof window !== 'undefined') {
      toast.error('Session expired. Please log in again.', {
        duration: 4000,
        position: 'top-right',
      })
    }
    
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }
  */
}

// Example: How to check if user is authenticated
export const isUserAuthenticated = (): boolean => {
  const accessToken = getAccessToken()
  const refreshToken = getRefreshToken()
  
  // User is considered authenticated if they have at least a refresh token
  // The access token will be automatically refreshed if needed
  return !!(accessToken || refreshToken)
}

interface LessonData {
  title: string
  content?: string
  summary?: string
  category_id?: number
}

interface NoteData {
  content: string
  lesson_id: number
  text?: string
  start_offset?: number
  end_offset?: number
}

// Example: How to make API calls in your components
export const exampleApiUsage = {
  // Get current user
  getCurrentUser: () => api.get('/api/auth/me'),
  
  // Get lessons
  getLessons: (categoryId?: number) => 
    api.get('/api/lessons', { params: { category_id: categoryId } }),
  
  // Create a lesson
  createLesson: (lessonData: LessonData) => 
    api.post('/api/lessons', lessonData),
  
  // Update a lesson
  updateLesson: (lessonId: number, lessonData: Partial<LessonData>) => 
    api.put(`/api/lessons/${lessonId}`, lessonData),
  
  // Delete a lesson
  deleteLesson: (lessonId: number) => 
    api.delete(`/api/lessons/${lessonId}`),
  
  // Get categories
  getCategories: () => 
    api.get('/api/categories'),
  
  // Create a note
  createNote: (noteData: NoteData) => 
    api.post('/api/notes', noteData),
  
  // Get notes
  getNotes: () => 
    api.get('/api/notes'),
}

// Example: Error handling in components
export const handleApiError = (error: unknown) => {
  // Simple error logging - in real app you'd want more sophisticated error handling
  console.error('API Error:', error)
  
  // You can expand this based on your specific error handling needs
  // For example, showing different toast messages based on error type
}

/*
Usage example in a React component:

import { api, isUserAuthenticated, logoutUser } from '@/lib/api'
import { exampleApiUsage, handleApiError } from '@/lib/api-test-examples'

const MyComponent = () => {
  const [lessons, setLessons] = useState([])
  
  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const response = await exampleApiUsage.getLessons()
        setLessons(response.data)
      } catch (error) {
        handleApiError(error)
      }
    }
    
    if (isUserAuthenticated()) {
      fetchLessons()
    }
  }, [])
  
  const handleLogout = () => {
    logoutUser(true) // Will show toast and redirect
  }
  
  return (
    // Your component JSX
  )
}
*/ 