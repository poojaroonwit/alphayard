import { API_BASE_URL } from './apiConfig'

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
}

export const auditService = new AuditService()


