// Admin Console API Service
import { API_BASE_URL } from './apiConfig'

export interface AdminUser {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  avatar?: string
  role: 'super_admin' | 'admin' | 'editor' | 'viewer'
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  isVerified: boolean
  lastLogin?: string
  createdAt: string
  updatedAt: string
  permissions: string[]
  department?: string
  timezone?: string
}

export interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  color: string
  isSystem: boolean
}

export interface Permission {
  id: string
  name: string
  description: string
  category: string
}

export interface UserGroup {
  id: string
  name: string
  description: string
  memberCount: number
  permissions: string[]
  color: string
}

export interface Application {
  id: string
  name: string
  slug: string
  description?: string
  is_active?: boolean
  branding?: any
  settings?: {
    google_analytics_id?: string
    [key: string]: any
  }
}

export interface Circle {
  id: string
  name: string
  description?: string
  type: 'Circle' | 'friends' | 'sharehouse'
  inviteCode?: string
  createdAt: string
  updatedAt: string
  ownerId: string
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  memberCount: number
  owner?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  members?: CircleMember[]
  settings?: Record<string, any>
}

export interface CircleMember {
  userId: string
  role: 'owner' | 'admin' | 'member'
  joinedAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    avatarUrl?: string
  }
}

export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalFamilies: number
  activeSubscriptions: number
  totalScreens: number
  recentUsers: number
  recentFamilies: number
  recentAlerts: number
  recentMessages: number
  revenue: {
    totalRevenue: number
    avgRevenue: number
    subscriptionCount: number
  }
}

class AdminService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const token = localStorage.getItem('admin_token')
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
      signal: AbortSignal.timeout(15000) // 15s timeout
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
    } catch (error) {
      console.error('API request failed:', error)
      // Return empty data instead of throwing error for better UX
      if (endpoint.includes('/admin/admin-users')) {
        return [] as T
      }
      if (endpoint.includes('/admin/roles')) {
        return [] as T
      }
      if (endpoint.includes('/admin/permissions')) {
        return [] as T
      }
      if (endpoint.includes('/admin/user-groups')) {
        return [] as T
      }
      throw error
    }
  }

  // Impersonation (stub - depends on backend session support)
  async impersonateUser(userId: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE_URL}/admin/impersonate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    try { localStorage.setItem('impersonate_user_id', userId) } catch {}
    return data
  }

  async stopImpersonation(): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE_URL}/admin/stop-impersonate`, { method: 'POST' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    try { localStorage.removeItem('impersonate_user_id') } catch {}
    return data
  }

  // Dashboard Stats
  async getDashboardStats(period: string = '30'): Promise<DashboardStats> {
    const response = await this.request<{ stats: DashboardStats }>(`/admin/dashboard?period=${period}`)
    return response.stats
  }

  // Admin Users
  async getAdminUsers(): Promise<AdminUser[]> {
    const response = await this.request<{ users: any[] }>('/admin/admin-users')
    // Backend now returns camelCase directly
    return (response.users || []).map(u => ({
      id: u.id,
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      email: u.email,
      role: u.role || 'admin',
      status: u.status || 'active',
      isVerified: true,
      lastLogin: u.lastLogin,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      permissions: u.permissions || [],
    })) as AdminUser[]
  }

  async getAdminUser(id: string): Promise<AdminUser> {
    return this.request<AdminUser>(`/admin/admin-users/${id}`)
  }

  async createAdminUser(userData: { email: string; password: string; firstName?: string; lastName?: string; roleId?: string }): Promise<AdminUser> {
    return this.request<AdminUser>('/admin/admin-users', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async updateAdminUser(id: string, userData: Partial<AdminUser>): Promise<AdminUser> {
    return this.request<AdminUser>(`/admin/admin-users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    })
  }

  async deleteAdminUser(id: string): Promise<void> {
    return this.request<void>(`/admin/admin-users/${id}`, {
      method: 'DELETE',
    })
  }

  async updateAdminUserStatus(id: string, status: string): Promise<AdminUser> {
    return this.request<AdminUser>(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  }

  // Roles
  async getRoles(): Promise<Role[]> {
    const response = await this.request<{ roles: any[] }>('/admin/roles')
    return (response.roles || []).map(r => ({
      id: r.id,
      name: r.name,
      description: r.description || '',
      permissions: r.permissions || [],
      color: '#3B82F6',
      isSystem: false,
    })) as Role[]
  }

  async getRole(id: string): Promise<Role> {
    return this.request<Role>(`/admin/roles/${id}`)
  }

  async createRole(roleData: Partial<Role>): Promise<Role> {
    return this.request<Role>('/admin/roles', {
      method: 'POST',
      body: JSON.stringify(roleData),
    })
  }

  async updateRole(id: string, roleData: Partial<Role>): Promise<Role> {
    return this.request<Role>(`/admin/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(roleData),
    })
  }

  async deleteRole(id: string): Promise<void> {
    return this.request<void>(`/admin/roles/${id}`, {
      method: 'DELETE',
    })
  }

  // Permissions
  async getPermissions(): Promise<Permission[]> {
    return this.request<Permission[]>('/admin/permissions')
  }

  // User Groups
  async getUserGroups(): Promise<UserGroup[]> {
    return this.request<UserGroup[]>('/admin/user-groups')
  }

  async getUserGroup(id: string): Promise<UserGroup> {
    return this.request<UserGroup>(`/admin/user-groups/${id}`)
  }

  async createUserGroup(groupData: Partial<UserGroup>): Promise<UserGroup> {
    return this.request<UserGroup>('/admin/user-groups', {
      method: 'POST',
      body: JSON.stringify(groupData),
    })
  }

  async updateUserGroup(id: string, groupData: Partial<UserGroup>): Promise<UserGroup> {
    return this.request<UserGroup>(`/admin/user-groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(groupData),
    })
  }

  async deleteUserGroup(id: string): Promise<void> {
    return this.request<void>(`/admin/user-groups/${id}`, {
      method: 'DELETE',
    })
  }

  // Application Settings
  async getApplications(): Promise<{ applications: Application[] }> {
    return this.request<{ applications: Application[] }>('/admin/applications')
  }

  async getApplicationSettings(): Promise<{ settings: any[] }> {
    return this.request<{ settings: any[] }>('/admin/application-settings')
  }

  async upsertApplicationSetting(payload: {
    setting_key: string
    setting_value: any
    setting_type?: string
    category?: string
    description?: string
    is_public?: boolean
    is_editable?: boolean
  }): Promise<{ setting: any }> {
    return this.request<{ setting: any }>('/admin/application-settings', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  }

  async updateApplication(id: string, data: Partial<Application>): Promise<Application> {
      return this.request<Application>(`/admin/applications/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
      })
  }

  async seedScreens(appId?: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/mobile/inventory/seed', {
      method: 'POST',
      body: JSON.stringify({ appId })
    })
  }

  async uploadBrandingAsset(appId: string, formData: FormData): Promise<{ url: string }> {
    const token = localStorage.getItem('admin_token')
    const response = await fetch(`${API_BASE_URL}/admin/applications/${appId}/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: formData
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Upload failed')
    }
    
    return response.json()
  }

  // Application Versioning
  async getApplicationVersions(appId: string): Promise<{ versions: any[] }> {
    return this.request<{ versions: any[] }>(`/admin/applications/${appId}/versions`)
  }

  async createApplicationVersion(appId: string, data?: { branding?: any, settings?: any }): Promise<any> {
    return this.request<any>(`/admin/applications/${appId}/versions`, {
      method: 'POST',
      body: JSON.stringify(data || {})
    })
  }

  async updateApplicationVersion(appId: string, versionId: string, data: { branding?: any, settings?: any, status?: string }): Promise<any> {
    return this.request<any>(`/admin/applications/${appId}/versions/${versionId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async publishApplicationVersion(appId: string, versionId: string): Promise<any> {
    return this.request<any>(`/admin/applications/${appId}/versions/${versionId}/publish`, {
      method: 'POST'
    })
  }

  // Authentication
  async login(email: string, password: string): Promise<{ token: string; user: AdminUser }> {
    return this.request<{ token: string; user: AdminUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async logout(): Promise<void> {
    return this.request<void>('/auth/logout', {
      method: 'POST',
    })
  }

  async getCurrentUser(): Promise<AdminUser> {
    return this.request<AdminUser>('/auth/me')
  }

  // Families Management
  async getFamilies(): Promise<Circle[]> {
    const response = await this.request<{ families: Circle[] }>('/admin/families')
    return response.families || []
  }

  async getCircle(id: string): Promise<Circle> {
    return this.request<Circle>(`/admin/families/${id}`)
  }

  async createCircle(CircleData: {
    name: string
    description?: string
    type: 'Circle' | 'friends' | 'sharehouse'
  }): Promise<Circle> {
    return this.request<Circle>('/admin/families', {
      method: 'POST',
      body: JSON.stringify(CircleData),
    })
  }

  async updateCircle(id: string, CircleData: Partial<Circle>): Promise<Circle> {
    return this.request<Circle>(`/admin/families/${id}`, {
      method: 'PUT',
      body: JSON.stringify(CircleData),
    })
  }

  async deleteCircle(id: string): Promise<void> {
    return this.request<void>(`/admin/families/${id}`, {
      method: 'DELETE',
    })
  }

  async getCircleMembers(CircleId: string): Promise<CircleMember[]> {
    return this.request<CircleMember[]>(`/api/v1/circles/${CircleId}/members`)
  }

  async addCircleMember(CircleId: string, memberData: {
    user_id: string
    role: 'admin' | 'member'
  }): Promise<CircleMember> {
    return this.request<CircleMember>(`/api/v1/circles/${CircleId}/members`, {
      method: 'POST',
      body: JSON.stringify(memberData),
    })
  }

  async removeCircleMember(CircleId: string, userId: string): Promise<void> {
    return this.request<void>(`/api/v1/circles/${CircleId}/members/${userId}`, {
      method: 'DELETE',
    })
  }

  async updateCircleMemberRole(CircleId: string, userId: string, role: 'admin' | 'member'): Promise<CircleMember> {
    return this.request<CircleMember>(`/api/v1/circles/${CircleId}/members/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    })
  }

  // Social Posts
  async getSocialPosts(): Promise<any[]> {
    const response = await this.request<{ success: boolean; posts: any[] }>('/admin/social-posts')
    return response.posts || []
  }

  async deleteSocialPost(id: string): Promise<void> {
     await this.request<{ success: boolean }>(`/admin/social-posts/${id}`, {
      method: 'DELETE'
    })
  }

  // Safety Alerts
  async getSafetyAlertsCount(): Promise<number> {
    try {
      const response = await this.request<{ alerts: any[]; activeAlerts: number }>('/api/v1/safety/alerts')
      return response.activeAlerts || 0
    } catch (error) {
      console.error('Error fetching safety alerts count:', error)
      return 0
    }
  }

  // Safety Incidents
  async getSafetyIncidents(CircleId?: string): Promise<any[]> {
    try {
      const endpoint = CircleId ? `/api/v1/safety/incidents?Circle_id=${CircleId}` : '/api/v1/safety/incidents'
      const response = await this.request<{ incidents: any[] }>(endpoint)
      return response.incidents || []
    } catch (error) {
      console.error('Error fetching safety incidents:', error)
      return []
    }
  }

  async getSafetyIncident(id: string): Promise<any> {
    try {
      const response = await this.request<any>(`/api/v1/safety/incidents/${id}`)
      return response
    } catch (error) {
      console.error('Error fetching safety incident:', error)
      throw error
    }
  }

  async acknowledgeSafetyIncident(id: string): Promise<any> {
    try {
      const response = await this.request<any>(`/api/v1/safety/incidents/${id}/acknowledge`, {
        method: 'PATCH'
      })
      return response
    } catch (error) {
      console.error('Error acknowledging safety incident:', error)
      throw error
    }
  }

  async resolveSafetyIncident(id: string): Promise<any> {
    try {
      const response = await this.request<any>(`/api/v1/safety/incidents/${id}/resolve`, {
        method: 'PATCH'
      })
      return response
    } catch (error) {
      console.error('Error resolving safety incident:', error)
      throw error
    }
  }

  // View Preferences
  async getViewPreference(key: string): Promise<any> {
    try {
      return await this.request<any>(`/admin/preferences/${key}`)
    } catch {
      return null
    }
  }

  async saveViewPreference(key: string, value: any): Promise<any> {
    return this.request<any>(`/admin/preferences/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value })
    })
  }

  // Entity Types (Collection Schemas)
  async getEntityTypes(applicationId?: string): Promise<any[]> {
    const params = applicationId ? `?applicationId=${applicationId}` : ''
    const response = await this.request<{ types: any[] }>(`/admin/entities/types${params}`)
    return response.types || []
  }

  async getEntityType(id: string): Promise<any> {
    const response = await this.request<{ entityType: any }>(`/admin/entities/types/${id}`)
    return response.entityType
  }

  async createEntityType(data: {
    name: string
    displayName: string
    description?: string
    applicationId?: string
    schema?: any
    icon?: string
    category?: string
  }): Promise<any> {
    const response = await this.request<{ entityType: any }>('/admin/entities/types', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    return response.entityType
  }

  async updateEntityType(id: string, data: {
    displayName?: string
    description?: string
    schema?: any
    icon?: string
    category?: string
  }): Promise<any> {
    const response = await this.request<{ entityType: any }>(`/admin/entities/types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
    return response.entityType
  }

  async deleteEntityType(id: string): Promise<void> {
    await this.request<{ success: boolean }>(`/admin/entities/types/${id}`, {
      method: 'DELETE'
    })
  }

  // Generic Entity Fetch
  async getEntities(endpoint: string): Promise<any> {
    return this.request<any>(endpoint)
  }

  // Tickets (placeholder - no backend endpoint yet)
  async getTicketsCount(): Promise<number> {
    // TODO: Implement when ticket management backend is ready
    // For now, return 0 to hide the badge
    return 0
  }
  // File Upload
  async uploadFile(file: File): Promise<{ file: { id: string, url: string, mime_type: string, file_name: string } }> {
    const formData = new FormData()
    formData.append('file', file)

    const url = `${API_BASE_URL}/storage/upload`
    const token = localStorage.getItem('admin_token')

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    })

    if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
    }

    return await response.json()
  }

  async sendBroadcast(payload: {
      title: string
      message: string
      type: 'notification' | 'email' | 'both'
      target?: 'all' | 'active' | 'premium'
  }): Promise<any> {
      return this.request<any>('/admin/broadcast', {
          method: 'POST',
          body: JSON.stringify(payload)
      })
  }

  // Generic Entity Operations
  async createEntity(endpoint: string, data: any): Promise<any> {
      return this.request<any>(endpoint, {
          method: 'POST',
          body: JSON.stringify(data)
      })
  }

  async updateEntity(endpoint: string, id: string, data: any): Promise<any> {
      return this.request<any>(`${endpoint}/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
      })
  }

  async deleteEntity(endpoint: string, id: string): Promise<void> {
      return this.request<void>(`${endpoint}/${id}`, {
          method: 'DELETE'
      })
  }

  // Component Studio
  async getComponentStudioSidebar(): Promise<{ sections: any[] }> {
      return this.request<{ sections: any[] }>('/component-studio/sidebar')
  }

  async updateComponentStyle(id: string, data: { styles?: any, config?: any }): Promise<any> {
      return this.request<any>(`/component-studio/styles/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
      })
  }

  async createComponentStyle(data: { categoryId: string, definitionId: string, name: string, styles: any, config?: any }): Promise<any> {
      return this.request<any>('/component-studio/styles', {
          method: 'POST',
          body: JSON.stringify(data)
      })
  }

  async duplicateComponentStyle(id: string): Promise<any> {
      return this.request<any>(`/component-studio/styles/${id}/duplicate`, {
          method: 'POST'
      })
  }
}

export const adminService = new AdminService()

