import { API_BASE_URL } from './apiConfig'

export enum AuditAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  ACCESS_DENIED = 'ACCESS_DENIED',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  MFA_ENABLED = 'MFA_ENABLED',
  MFA_DISABLED = 'MFA_DISABLED',
  SESSION_REVOKED = 'SESSION_REVOKED',
  PERMISSION_GRANTED = 'PERMISSION_GRANTED',
  PERMISSION_REVOKED = 'PERMISSION_REVOKED'
}

export interface AuditLogItem {
  id: string
  userId?: string | null
  action: string
  category: string
  level: 'info' | 'warning' | 'error' | 'critical'
  description: string
  details?: Record<string, any>
  resourceId?: string | null
  resourceType?: string | null
  timestamp: string
}

export interface AuditLogsResponse {
  logs: AuditLogItem[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

class AuditService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}/audit${endpoint}`
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    }
    const res = await fetch(url, config)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()) as T
  }

  async list(params: { userId?: string; action?: string; category?: string; level?: string; startDate?: string; endDate?: string; limit?: number; offset?: number } = {}): Promise<AuditLogsResponse> {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null) as any)
    return this.request<AuditLogsResponse>(`/logs?${qs.toString()}`)
  }

  async stats(params: { startDate?: string; endDate?: string } = {}): Promise<any> {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null) as any)
    return this.request<any>(`/stats?${qs.toString()}`)
  }

  async export(format: 'json' | 'csv' = 'csv', params: { startDate?: string; endDate?: string } = {}): Promise<{ data: string; filename: string; format: string }> {
    const qs = new URLSearchParams({ format, ...(params as any) }).toString()
    return this.request<{ data: string; filename: string; format: string }>(`/export?${qs}`)
  }

  async logAuthenticationEvent(userId: string, action: AuditAction, metadata?: { ip?: string; userAgent?: string }): Promise<void> {
    try {
      await this.request('/log', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          action,
          category: 'authentication',
          metadata: metadata || {}
        })
      })
    } catch (error) {
      console.error('Failed to log authentication event:', error)
    }
  }
}

export const auditService = new AuditService()


