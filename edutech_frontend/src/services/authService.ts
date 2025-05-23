import { api } from './api'

export interface User {
  id: number
  name: string
  email: string
  is_admin: boolean
  created_at: string
}

interface LoginResponse {
  access_token: string
  token_type: string
}

export const authService = {
  async login(email: string, password: string): Promise<{ user: User, token: string }> {
    try {
      // First try OAuth2 form-encoded login
      const formData = new URLSearchParams()
      formData.append('username', email) // FastAPI OAuth2 uses 'username' field
      formData.append('password', password)

      const response = await api.post<LoginResponse>('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
      
      const { access_token } = response.data
      localStorage.setItem('auth_token', access_token)
      
      // After login, fetch the user profile
      const userResponse = await this.getCurrentUser()
      
      return { 
        user: userResponse,
        token: access_token
      }
    } catch (error) {
      // If form login fails, try JSON login
      if (error.response?.status === 422 || error.response?.status === 415) {
        return this.loginWithJson(email, password);
      }
      throw error;
    }
  },
  
  async loginWithJson(email: string, password: string): Promise<{ user: User, token: string }> {
    // Alternative JSON-based login
    const response = await api.post<LoginResponse>('/auth/login-json', {
      email,
      password
    })
    
    const { access_token } = response.data
    localStorage.setItem('auth_token', access_token)
    
    // After login, fetch the user profile
    const userResponse = await this.getCurrentUser()
    
    return { 
      user: userResponse,
      token: access_token
    }
  },
  
  async register(name: string, email: string, password: string): Promise<User> {
    const response = await api.post<User>('/auth/register', {
      name,
      email,
      password
    })
    
    // If registration includes a token in the response or headers, save it
    if (response.headers?.authorization) {
      const token = response.headers.authorization.replace('Bearer ', '');
      localStorage.setItem('auth_token', token);
    }
    
    return response.data
  },
  
  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/auth/me')
    return response.data
  },
  
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.put<User>(`/users/me`, data)
    return response.data
  },
  
  getToken(): string | null {
    return localStorage.getItem('auth_token')
  },
  
  async logout(): Promise<void> {
    localStorage.removeItem('auth_token')
    // No backend logout endpoint needed with JWT
  },
  
  isAuthenticated(): boolean {
    return !!this.getToken()
  }
}
