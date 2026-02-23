// Authentication Service - Database-based
import { API_BASE_URL } from './apiConfig'
import { databaseAuthService, DatabaseAuthSession } from './databaseAuthService'

export interface LoginCredentials {
  email: string
  password: string
}

export interface SSOLoginCredentials {
  provider: string
  idToken?: string
  accessToken?: string
}

export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  permissions: string[]
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

class AuthService {
  private currentSession: DatabaseAuthSession | null = null
  private sessionCacheExpiry: number = 5 * 60 * 1000 // 5 minutes
  private lastSessionCheck: number = 0

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const token = this.getToken()

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (response.status === 401) {
        // Only redirect if NOT already on login page and NOT calling auth endpoints
        const isLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login'
        const isAuthEndpoint = endpoint.includes('/auth/') // All auth endpoints

        // Clear database session locally without calling API to avoid infinite loop
        const token = this.getToken()
        if (token) {
          try {
            const session = await databaseAuthService.getSessionByToken(token)
            if (session) {
              await databaseAuthService.revokeSession(session.id)
            }
          } catch (error) {
            console.warn('Failed to revoke database session:', error)
          }
        }

        // Clear cache and token
        this.currentSession = null
        this.lastSessionCheck = 0
        if (typeof window !== 'undefined') {
          localStorage.removeItem('admin_token')
        }

        if (!isLoginPage && !isAuthEndpoint && typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        throw new Error('Unauthorized')
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      // Handle empty responses or invalid JSON
      const text = await response.text();
      if (!text) {
        return {} as T; // Return empty object for empty responses
      }
      
      try {
        return JSON.parse(text);
      } catch (error) {
        console.error('Invalid JSON response:', text);
        throw new Error('Invalid JSON response from server');
      }
    } catch (error: any) {
      console.error('API request failed:', error)
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Unable to connect to server. Please ensure the backend is running.')
      }
      throw error
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Call real API
    const response = await this.request<AuthResponse>('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    })

    // Store session in database
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

    try {
      await databaseAuthService.createSession(
        response.user.id,
        response.token,
        response.token, // Use same token for refresh for now
        expiresAt
      )
    } catch (error) {
      console.error('Failed to store session in database:', error)
      // Continue anyway - the user is logged in, we'll handle session issues later
    }

    return response
  }

  async ssoLogin(credentials: SSOLoginCredentials): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>(`/admin/auth/sso/${credentials.provider}`, {
      method: 'POST',
      body: JSON.stringify({
        provider: credentials.provider,
        idToken: credentials.idToken,
        accessToken: credentials.accessToken
      }),
    })

    // Store session in database
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

    try {
      await databaseAuthService.createSession(
        response.user.id,
        response.token,
        response.token, // Use same token for refresh for now
        expiresAt
      )
    } catch (error) {
      console.error('Failed to store session in database:', error)
      // Continue anyway - the user is logged in, we'll handle session issues later
    }

    return response
  }

  async logout(): Promise<void> {
    try {
      // Call API to logout
      await this.request<void>('/admin/auth/logout', {
        method: 'POST',
      })
    } catch (error) {
      // Continue with local logout even if API call fails
      console.warn('API logout failed:', error)
    }

    // Clear database session
    const token = this.getToken()
    if (token) {
      try {
        const session = await databaseAuthService.getSessionByToken(token)
        if (session) {
          await databaseAuthService.revokeSession(session.id)
        }
      } catch (error) {
        console.warn('Failed to revoke database session:', error)
      }
    }

    // Clear cache
    this.currentSession = null
    this.lastSessionCheck = 0
  }

  getToken(): string | null {
    // For now, we'll still use localStorage for the token itself
    // In a full implementation, you might want to use HTTP-only cookies
    return typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null
  }

  private async getCurrentSession(): Promise<DatabaseAuthSession | null> {
    const now = Date.now()
    
    // Use cache if still valid
    if (this.currentSession && (now - this.lastSessionCheck) < this.sessionCacheExpiry) {
      return this.currentSession
    }

    const token = this.getToken()
    if (!token) {
      return null
    }

    try {
      const session = await databaseAuthService.getSessionByToken(token)
      this.currentSession = session
      this.lastSessionCheck = now
      return session
    } catch (error) {
      console.error('Failed to get session from database:', error)
      // Clear invalid token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token')
      }
      this.currentSession = null
      return null
    }
  }

  async getUser(): Promise<AuthUser | null> {
    const session = await this.getCurrentSession()
    return session ? session.user : null
  }

  isAuthenticated(): boolean {
    // Quick check without database call
    return !!this.getToken()
  }

  async getCurrentUser(): Promise<AuthUser> {
    const session = await this.getCurrentSession()
    if (!session) {
      throw new Error('No active session found')
    }
    return session.user
  }

  async refreshToken(): Promise<AuthResponse> {
    const token = this.getToken()
    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await this.request<AuthResponse>('/admin/auth/refresh', {
      method: 'POST',
    })

    // Update session in database
    try {
      const currentSession = await this.getCurrentSession()
      if (currentSession) {
        await databaseAuthService.revokeSession(currentSession.id)
        
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7)
        
        await databaseAuthService.createSession(
          response.user.id,
          response.token,
          response.token,
          expiresAt
        )
      }
    } catch (error) {
      console.error('Failed to update session in database:', error)
    }

    // Update localStorage token
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_token', response.token)
    }

    return response
  }

  // Get all active sessions for the current user
  async getActiveSessions(): Promise<DatabaseAuthSession[]> {
    const session = await this.getCurrentSession()
    if (!session) {
      return []
    }

    return await databaseAuthService.getUserActiveSessions(session.userId)
  }

  // Revoke a specific session
  async revokeSession(sessionId: string): Promise<void> {
    await databaseAuthService.revokeSession(sessionId)
    
    // If we revoked our own session, clear cache
    if (this.currentSession?.id === sessionId) {
      this.currentSession = null
      this.lastSessionCheck = 0
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token')
      }
    }
  }

  // Revoke all sessions except current
  async revokeOtherSessions(): Promise<void> {
    const session = await this.getCurrentSession()
    if (!session) {
      return
    }

    const allSessions = await databaseAuthService.getUserActiveSessions(session.userId)
    const otherSessions = allSessions.filter(s => s.id !== session.id)

    for (const otherSession of otherSessions) {
      await databaseAuthService.revokeSession(otherSession.id)
    }
  }
}

export const authService = new AuthService()
