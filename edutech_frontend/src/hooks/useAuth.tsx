import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService, LoginCredentials, RegisterData } from '@/services/authService'
import { userService, User, UserPreferences, UserStats, UpdateProfileData, UpdatePreferencesData, ChangePasswordData, AvatarUploadResponse, LearningStreak, UserActivity, UserServiceError } from '@/services/userService'
import { getAuthToken, clearTokens } from '@/lib/api'

// Auth Context Types
interface AuthUser {
  id: string
  email: string
  name: string
  avatar?: string
}

interface AuthContextType {
  // State
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => Promise<void>
  getCurrentUser: () => Promise<void>
  clearError: () => void
  
  // Helpers
  checkAuthStatus: () => boolean
  refreshUser: () => Promise<void>
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Auth Provider Props
interface AuthProviderProps {
  children: ReactNode
}

// Auth Provider Component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  // Computed state
  const isAuthenticated = !!user && !!getAuthToken()

  /**
   * Check if user has valid authentication
   */
  const checkAuthStatus = (): boolean => {
    const token = getAuthToken()
    return !!token && !!user
  }

  /**
   * Get current user data from API
   */
  const getCurrentUser = async (): Promise<void> => {
    try {
      setIsLoading(true)
      setError(null)

      // Check if we have any tokens first
      if (!authService.hasValidTokens()) {
        setUser(null)
        return
      }

      // Try to verify auth and get user data
      const authUser = await authService.verifyAuth()
      
      // Set user data from auth response
      setUser({
        id: authUser.id,
        email: authUser.email,
        name: authUser.name,
        avatar: authUser.avatar
      })

    } catch (err: any) {
      console.error('Get current user error:', err)
      
      // Handle authentication errors (401/403)
      if (err.response?.status === 401 || err.response?.status === 403) {
        // Check if we should attempt a token refresh for 401 errors
        const hasRefreshToken = !!localStorage.getItem('refresh_token')
        
        if (hasRefreshToken && err.response?.status === 401) {
          try {
            // Attempt token refresh
            console.log('Attempting token refresh...')
            await authService.refreshToken()
            
            // Retry getting current user after refresh
            const authUser = await authService.verifyAuth()
            
            setUser({
              id: authUser.id,
              email: authUser.email,
              name: authUser.name,
              avatar: authUser.avatar
            })
            
            console.log('Token refresh successful, user authenticated')
            return
            
          } catch (refreshError: any) {
            console.error('Token refresh failed:', refreshError)
            // Fall through to clear auth state
          }
        }
        
        // Clear auth state for all 401/403 errors that can't be resolved
        console.log('Clearing auth state due to authentication failure')
        setUser(null)
        clearTokens()
        
        // Show appropriate message
        if (err.response?.status === 403) {
          setError('Your account has been disabled. Please contact support.')
        } else {
          setError('Your session has expired. Please login again.')
        }
        
        // Auto-redirect to login after a short delay
        setTimeout(() => {
          navigate('/login', { replace: true })
        }, 2000)
        
        return
      }
      
      // For 404 errors or other non-auth errors, don't clear user state if we have a user
      if (err.response?.status === 404 && user) {
        console.warn('User profile endpoint not found, but user session maintained')
        setError('Some features may not be available. Please contact support if this persists.')
        return
      }
      
      // For other errors, set error message but don't clear auth state
      setError(err.message || 'Failed to load user data')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Refresh user data without changing loading state
   */
  const refreshUser = async (): Promise<void> => {
    try {
      if (!authService.hasValidTokens()) return

      const authUser = await authService.verifyAuth()
      
      setUser({
        id: authUser.id,
        email: authUser.email,
        name: authUser.name,
        avatar: authUser.avatar
      })
    } catch (err: any) {
      console.error('Refresh user error:', err)
      
      // Handle authentication errors
      if (err.response?.status === 401 || err.response?.status === 403) {
        // Try refresh token only for 401 errors
        if (err.response?.status === 401) {
          try {
            await authService.refreshToken()
            // Retry after refresh
            const authUser = await authService.verifyAuth()
            
            setUser({
              id: authUser.id,
              email: authUser.email,
              name: authUser.name,
              avatar: authUser.avatar
            })
            return
          } catch (refreshError) {
            console.error('Refresh during user refresh failed:', refreshError)
            // Fall through to clear auth state
          }
        }
        
        // Clear auth state for 403 or failed 401 refresh
        setUser(null)
        clearTokens()
        
        // Redirect to login for auth failures
        navigate('/login', { replace: true })
      } else if (err.response?.status === 404) {
        // Don't clear user for 404 errors
        console.warn('User profile endpoint not found during refresh')
      } else {
        // Only set error for non-auth errors
        setError(err.message || 'Failed to refresh user data')
      }
    }
  }

  /**
   * Login user with credentials
   */
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setIsLoading(true)
      setError(null)

      // Validate credentials before sending
      if (!credentials.email || !credentials.password) {
        throw new Error('Email and password are required')
      }

      // Call auth service
      const response = await authService.login(credentials)
      
      if (response.success) {
        // Set user data from response
        setUser({
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
          avatar: response.user.avatar
        })

        // Navigate to dashboard
        navigate('/dashboard', { replace: true })
      } else {
        throw new Error(response.message || 'Login failed')
      }
    } catch (err: any) {
      console.error('Login error:', err)
      
      // Enhanced error message extraction
      let errorMessage = 'Login failed. Please try again.'
      
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.message) {
        errorMessage = err.message
      }
      
      // Handle specific HTTP status codes
      if (err.response?.status === 401) {
        errorMessage = 'Invalid email or password. Please check your credentials.'
      } else if (err.response?.status === 400) {
        errorMessage = 'Please provide valid email and password.'
      } else if (err.response?.status === 422) {
        errorMessage = 'Invalid email format. Please enter a valid email address.'
      } else if (err.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.'
      }
      
      setError(errorMessage)
      throw new Error(errorMessage) // Re-throw for component error handling
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Register new user
   */
  const register = async (userData: RegisterData): Promise<void> => {
    try {
      setIsLoading(true)
      setError(null)

      // Validate required fields
      if (!userData.email || !userData.password || !userData.full_name) {
        throw new Error('All fields are required')
      }

      // Call auth service
      const response = await authService.register(userData)
      
      if (response.success) {
        // Set user data from response
        setUser({
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
          avatar: response.user.avatar
        })

        // Navigate to dashboard
        navigate('/dashboard', { replace: true })
      } else {
        throw new Error(response.message || 'Registration failed')
      }
    } catch (err: any) {
      console.error('Registration error:', err)
      setError(err.message || 'Registration failed. Please try again.')
      throw err // Re-throw for component error handling
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Logout user and clear state
   */
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true)
      
      // Call logout API (best effort - don't fail if it errors)
      try {
        await authService.logout()
      } catch (logoutError) {
        console.warn('Logout API call failed:', logoutError)
      }

      // Clear local state
      setUser(null)
      setError(null)
      clearTokens()

      // Navigate to login
      navigate('/login', { replace: true })
    } catch (err: any) {
      console.error('Logout error:', err)
      setError('Logout failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Clear error state
   */
  const clearError = (): void => {
    setError(null)
  }

  // Initialize auth state on mount
  useEffect(() => {
    getCurrentUser()
  }, [])

  // Listen for storage changes (logout from another tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token' && !e.newValue && !localStorage.getItem('refresh_token')) {
        // Both tokens were removed in another tab
        setUser(null)
        setError(null)
        navigate('/login', { replace: true })
      } else if (e.key === 'auth_token' && e.newValue && !user) {
        // Token was added in another tab, refresh current user
        getCurrentUser()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [navigate, user])

  // Auto-refresh user data periodically - reduce frequency and add error handling
  useEffect(() => {
    if (!isAuthenticated) return

    const interval = setInterval(() => {
      if (getAuthToken()) {
        refreshUser().catch(error => {
          console.warn('Periodic user refresh failed:', error)
          // Don't show error to user for background refresh failures
        })
      }
    }, 10 * 60 * 1000) // Refresh every 10 minutes instead of 5

    return () => clearInterval(interval)
  }, [isAuthenticated])

  // Context value
  const value: AuthContextType = {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    
    // Actions
    login,
    register,
    logout,
    getCurrentUser,
    clearError,
    
    // Helpers
    checkAuthStatus,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// useAuth Hook
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

// HOC for protected routes
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.ComponentType<P> {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth()

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )
    }

    if (!isAuthenticated) {
      return <div>Access denied. Please log in.</div>
    }

    return <WrappedComponent {...props} />
  }
}

// Helper hook for auth loading states
export function useAuthState() {
  const { isLoading, error, clearError } = useAuth()
  
  return {
    isLoading,
    error,
    clearError,
    hasError: !!error
  }
}

// Helper hook for user data
export function useCurrentUser() {
  const { user, refreshUser, isAuthenticated } = useAuth()
  
  return {
    user,
    refreshUser,
    isLoggedIn: isAuthenticated,
    userName: user?.name || '',
    userEmail: user?.email || '',
    userAvatar: user?.avatar
  }
}

// Export types for use in components
export type { AuthUser, AuthContextType }

// Export default hook
export default useAuth
