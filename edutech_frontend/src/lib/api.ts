import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'

// Create axios instance with base configuration
export const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api', // Include /api prefix
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Token management functions
export const getAccessToken = (): string | null => {
  return localStorage.getItem('auth_token')
}

export const setAccessToken = (token: string): void => {
  localStorage.setItem('auth_token', token)
}

export const getRefreshToken = (): string | null => {
  return localStorage.getItem('refresh_token')
}

export const setRefreshToken = (token: string): void => {
  localStorage.setItem('refresh_token', token)
}

export const clearTokens = (): void => {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('refresh_token')
}

// Logout function to clear tokens and redirect
export const logoutUser = (showToast: boolean = true): void => {
  clearTokens()
  
  // Optional: Show toast notification
  if (showToast && typeof window !== 'undefined') {
    // You can integrate with your toast system here
    console.warn('Session expired. Please log in again.')
  }
  
  // Redirect to login page
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
}

// Flag to prevent multiple refresh attempts
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: any) => void
  reject: (error?: any) => void
}> = []

// Process the queue of failed requests after token refresh
const processQueue = (error: any = null, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })
  
  failedQueue = []
}

// Request interceptor to automatically attach access token
api.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = getAccessToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response interceptor for handling authentication errors and token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    // Handle 403 Forbidden errors (account disabled/inactive)
    if (error.response?.status === 403) {
      console.warn('User account is inactive or disabled')
      
      // Show specific message for disabled account
      if (typeof window !== 'undefined') {
        alert('Your account has been disabled. Please contact support.')
      }
      
      // Clear tokens and logout
      logoutUser(false) // Don't show generic "session expired" message
      return Promise.reject(error)
    }

    // Handle 401 Unauthorized errors (invalid token, user not found)
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Don't retry refresh endpoint requests to prevent infinite loops
      if (originalRequest.url?.includes('/auth/refresh')) {
        console.warn('Refresh token is invalid or expired')
        logoutUser(true)
        return Promise.reject(error)
      }

      originalRequest._retry = true

      // If we're already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          if (originalRequest.headers && token) {
            originalRequest.headers.Authorization = `Bearer ${token}`
          }
          return api(originalRequest)
        }).catch(err => {
          return Promise.reject(err)
        })
      }

      isRefreshing = true

      try {
        const refreshToken = getRefreshToken()
        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        console.log('Attempting to refresh access token...')

        // Attempt to refresh the access token
        const response = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          { refresh_token: refreshToken },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          }
        )

        // Extract new tokens from response
        const { access_token, refresh_token: newRefreshToken } = response.data
        
        if (!access_token) {
          throw new Error('No access token received from refresh endpoint')
        }

        // Store new tokens
        setAccessToken(access_token)
        if (newRefreshToken) {
          setRefreshToken(newRefreshToken)
        }

        console.log('Access token refreshed successfully')

        // Process the queue of failed requests with new token
        processQueue(null, access_token)

        // Retry the original request with the new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`
        }
        return api(originalRequest)

      } catch (refreshError) {
        console.warn('Token refresh failed:', refreshError)
        
        // Process the queue with error
        processQueue(refreshError)
        
        // Clear tokens and logout user
        logoutUser(true)
        
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // For other errors, just reject without special handling
    return Promise.reject(error)
  }
)

// Legacy token management functions for backward compatibility
export const getAuthToken = getAccessToken
export const setAuthToken = setAccessToken

export default api
