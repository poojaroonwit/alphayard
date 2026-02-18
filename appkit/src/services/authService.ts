// Authentication Service
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
      
      if (response.status === 401) {
        // Only redirect if NOT already on login page and NOT calling login endpoint
        const isLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login'
        const isAuthEndpoint = endpoint.includes('/auth/login')

        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')

        if (!isLoginPage && !isAuthEndpoint && typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        throw new Error('Unauthorized')
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error: any) {
      console.error('API request failed:', error)
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Unable to connect to server. Please ensure the backend is running.')
      }
      throw error
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Always call real API
    const response = await this.request<AuthResponse>('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password
      }),
    })

    // Store token in localStorage
    localStorage.setItem('admin_token', response.token)
    localStorage.setItem('admin_user', JSON.stringify(response.user))

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

    // Store token in localStorage
    localStorage.setItem('admin_token', response.token)
    localStorage.setItem('admin_user', JSON.stringify(response.user))

    return response
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

    return this.request<AuthUser>('/admin/auth/me', {
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
