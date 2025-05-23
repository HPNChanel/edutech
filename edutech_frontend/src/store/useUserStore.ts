import { create } from 'zustand'
import { authService } from '../services/authService'

interface User {
  id: number
  name: string
  email: string
  is_admin: boolean
  created_at: string
}

interface UserState {
  user: User | null
  loading: boolean
  error: string | null
  setUser: (user: User | null) => void
  clearUser: () => void
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  loading: false,
  error: null,
  
  setUser: (user) => set({ user }),
  
  clearUser: () => set({ user: null }),
  
  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const { user } = await authService.login(email, password)
      set({ user, loading: false })
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to login' 
      })
      throw error
    }
  },
  
  register: async (name, email, password) => {
    set({ loading: true, error: null })
    try {
      const user = await authService.register(name, email, password)
      
      // If we have a token after registration, we can set the user directly
      if (authService.getToken()) {
        set({ user, loading: false })
      } else {
        // Otherwise just mark registration as complete
        set({ loading: false })
      }
      
      return user
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to register' 
      })
      throw error
    }
  },
  
  logout: async () => {
    try {
      await authService.logout()
      set({ user: null })
    } catch (error) {
      console.error('Logout failed:', error)
    }
  },
  
  updateProfile: async (data) => {
    set({ loading: true, error: null })
    try {
      const updatedUser = await authService.updateProfile(data)
      set({ user: updatedUser, loading: false })
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to update profile' 
      })
      throw error
    }
  }
}))
