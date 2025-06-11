import { api } from '@/lib/api'

export interface FocusSession {
  id?: number
  user_id?: number
  duration_minutes: number
  actual_duration_minutes?: number
  started_at?: string
  completed_at?: string
  is_completed?: boolean
  session_type: 'focus' | 'break' | 'long_break'
  notes?: string
}

export interface FocusSettings {
  id?: number
  user_id?: number
  default_focus_duration: number
  default_short_break: number
  default_long_break: number
  sessions_until_long_break: number
  auto_start_breaks: boolean
  auto_start_focus: boolean
  sound_enabled: boolean
}

export interface FocusStats {
  total_sessions: number
  total_focus_time: number
  completed_sessions: number
  current_streak: number
  today_sessions: number
  today_focus_time: number
  weekly_sessions: number
  weekly_focus_time: number
}

export interface CreateFocusSessionRequest {
  duration_minutes: number
  session_type: 'focus' | 'break' | 'long_break'
  notes?: string
}

export interface UpdateFocusSessionRequest {
  actual_duration_minutes?: number
  completed_at?: string
  is_completed?: boolean
  notes?: string
}

export interface UpdateFocusSettingsRequest {
  default_focus_duration?: number
  default_short_break?: number
  default_long_break?: number
  sessions_until_long_break?: number
  auto_start_breaks?: boolean
  auto_start_focus?: boolean
  sound_enabled?: boolean
}

class FocusService {
  private baseURL = '/focus'

  // Focus Sessions
  async createSession(sessionData: CreateFocusSessionRequest) {
    return api.post(`${this.baseURL}/sessions`, sessionData)
  }

  async getSessions(limit = 50, offset = 0) {
    return api.get(`${this.baseURL}/sessions?limit=${limit}&offset=${offset}`)
  }

  async getSession(sessionId: number) {
    return api.get(`${this.baseURL}/sessions/${sessionId}`)
  }

  async updateSession(sessionId: number, sessionData: UpdateFocusSessionRequest) {
    return api.put(`${this.baseURL}/sessions/${sessionId}`, sessionData)
  }

  async completeSession(sessionId: number, actualDurationMinutes: number) {
    return api.post(`${this.baseURL}/sessions/${sessionId}/complete`, {
      actual_duration_minutes: actualDurationMinutes
    })
  }

  async deleteSession(sessionId: number) {
    return api.delete(`${this.baseURL}/sessions/${sessionId}`)
  }

  // Focus Settings
  async getSettings() {
    return api.get(`${this.baseURL}/settings`)
  }

  async updateSettings(settingsData: UpdateFocusSettingsRequest) {
    return api.put(`${this.baseURL}/settings`, settingsData)
  }

  // Statistics
  async getStats() {
    return api.get(`${this.baseURL}/stats`)
  }
}

export const focusService = new FocusService() 