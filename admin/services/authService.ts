// Authentication Service
import { API_BASE_URL } from './apiConfig'

export interface LoginCredentials {
  email: string
  password: string
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
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Demo credentials validation
    const DEMO_EMAIL = 'admin@bondarys.com'
    const DEMO_PASSWORD = 'admin123'
    
    // Check if credentials match demo account
    if (credentials.email === DEMO_EMAIL && credentials.password === DEMO_PASSWORD) {
      const mockUser: AuthUser = {
        id: 'admin-1',
        email: credentials.email,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        permissions: ['read', 'write', 'delete', 'admin']
      }
      
      const mockToken = 'demo-admin-token-' + Date.now()
      
      // Store token in localStorage
      localStorage.setItem('admin_token', mockToken)
      localStorage.setItem('admin_user', JSON.stringify(mockUser))

      return {
        token: mockToken,
        user: mockUser
      }
    }

    // Try real API for non-demo credentials
    try {
      const response = await this.request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      })

      // Store token in localStorage
      localStorage.setItem('admin_token', response.token)
      localStorage.setItem('admin_user', JSON.stringify(response.user))

      return response
    } catch (error) {
      console.error('Login failed:', error)
      throw new Error('Invalid email or password')
    }
  }

  async logout(): Promise<void> {
    try {
      const token = this.getToken()
      if (token) {
        await this.request('/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      }
    } catch (error) {
      console.error('Logout request failed:', error)
    } finally {
      // Clear local storage regardless of API call success
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
    }
  }

  getToken(): string | null {
    return localStorage.getItem('admin_token')
  }

  getUser(): AuthUser | null {
    const userStr = localStorage.getItem('admin_user')
    return userStr ? JSON.parse(userStr) : null
  }

  isAuthenticated(): boolean {
    return !!this.getToken()
  }

  async getCurrentUser(): Promise<AuthUser> {
    const token = this.getToken()
    if (!token) {
      throw new Error('No authentication token found')
    }

    return this.request<AuthUser>('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  }

  async refreshToken(): Promise<AuthResponse> {
    const token = this.getToken()
    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await this.request<AuthResponse>('/auth/refresh', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    // Update stored token
    localStorage.setItem('admin_token', response.token)
    localStorage.setItem('admin_user', JSON.stringify(response.user))

    return response
  }
}

export const authService = new AuthService()
