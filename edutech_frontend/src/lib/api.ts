import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'

// Create axios instance with base configuration
export const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000', // Use backend URL
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Token management
export const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token')
}

export const setAuthToken = (token: string): void => {
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

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = getAuthToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response interceptor for handling auth errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    // If the error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      // Don't attempt refresh if we're already refreshing
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          if (originalRequest.headers) {
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

        // Use the configured API instance for refresh instead of hardcoded URL
        const response = await api.post('/api/auth/refresh', { 
          refresh_token: refreshToken 
        })

        const { accessToken, refreshToken: newRefreshToken } = response.data
        setAuthToken(accessToken)
        
        if (newRefreshToken) {
          setRefreshToken(newRefreshToken)
        }

        // Process the queue of failed requests
        processQueue(null, accessToken)

        // Retry the original request with the new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
        }
        return api(originalRequest)

      } catch (refreshError) {
        console.warn('Token refresh failed:', refreshError)
        
        // Process the queue with error
        processQueue(refreshError)
        
        // Only clear tokens if refresh actually failed
        clearTokens()
        
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // Don't auto-redirect for 404 errors or other non-auth errors
    if (error.response?.status === 404) {
      console.warn('Resource not found:', error.config?.url)
    }

    return Promise.reject(error)
  }
)

export default api
