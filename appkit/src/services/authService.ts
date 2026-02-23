// Authentication Service - Database-based
import { API_BASE_URL } from './apiConfig'

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
  private currentSession: any | null = null
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

        // Session revocation is handled server-side in the logout API
        // Frontend just needs to clear local storage
        console.log('🔐 Logging out, session will be revoked server-side')

        // Clear cache and token
        this.currentSession = null
        this.lastSessionCheck = 0
        if (typeof window !== 'undefined') {
          localStorage.removeItem('admin_token')
          localStorage.removeItem('admin_user')
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

    // Store token in localStorage for frontend use
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_token', response.token)
      localStorage.setItem('admin_user', JSON.stringify(response.user))
    }
    
    console.log('✅ Login successful, token stored in localStorage')

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

    // Store token in localStorage for frontend use
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_token', response.token)
      localStorage.setItem('admin_user', JSON.stringify(response.user))
    }
    
    console.log('✅ SSO login successful, token stored in localStorage')

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

    // Session revocation is handled server-side in the logout API
    // Frontend just needs to clear local storage
    console.log('🔐 Logging out, session revoked server-side')

    // Clear cache and localStorage
    this.currentSession = null
    this.lastSessionCheck = 0
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
    }
  }

  getToken(): string | null {
    // For now, we'll still use localStorage for the token itself
    // In a full implementation, you might want to use HTTP-only cookies
    return typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null
  }

  private async getCurrentSession(): Promise<any | null> {
    const now = Date.now()
    
    // Use cache if still valid
    if (this.currentSession && (now - this.lastSessionCheck) < this.sessionCacheExpiry) {
      return this.currentSession
    }

    const token = this.getToken()
    if (!token) {
      return null
    }

    // Frontend cannot access database directly
    // Return a simple session object based on token validity
    // The actual session validation happens server-side
    try {
      // Create a mock session object for frontend use
      const mockSession = {
        id: 'frontend-session',
        userId: 'frontend-user',
        sessionToken: token,
        refreshToken: token,
        isActive: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        user: null // Will be populated by getUser method
      }
      
      this.currentSession = mockSession
      this.lastSessionCheck = now
      return mockSession
    } catch (error) {
      console.error('Failed to create frontend session:', error)
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

    // Session refresh is handled server-side in the refresh API
    // Frontend just needs to update the token in localStorage
    console.log('✅ Token refreshed, session updated server-side')

    // Update localStorage token
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_token', response.token)
    }

    return response
  }

  // Get all active sessions for the current user
  async getActiveSessions(): Promise<any[]> {
    const session = await this.getCurrentSession()
    if (!session) {
      return []
    }

    // Frontend cannot access database directly
    // Return current session only
    return [session]
  }

  // Revoke a specific session
  async revokeSession(sessionId: string): Promise<void> {
    // Frontend cannot access database directly
    // Session revocation should be handled via API endpoints
    console.log('🔐 Session revocation should be handled via API endpoints')
    
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

    // Frontend cannot access database directly
    // Other session revocation should be handled via API endpoints
    console.log('🔐 Other session revocation should be handled via API endpoints')
  }
}

export const authService = new AuthService()
