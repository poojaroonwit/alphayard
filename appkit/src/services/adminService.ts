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
  is_system: boolean
  priority: number
  permission_count?: number
  user_count?: number
  created_at?: string
  updated_at?: string
}

export interface RoleWithPermissions extends Role {
  permission_details: Permission[]
}

export interface Permission {
  id: string
  module: string
  action: string
  description: string
  created_at?: string
}

export interface PermissionsByModule {
  [module: string]: Permission[]
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

// Storage key for current application (must match AppContext)
const APP_STORAGE_KEY = 'selected_app_id'

class AdminService {
  /**
   * Get the current application ID from localStorage
   * Used to include X-App-ID header in API requests
   */
  private getCurrentAppId(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(APP_STORAGE_KEY)
  }

  /**
   * Get auth headers including X-App-ID for multi-tenant requests
   */
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('admin_token')
    const appId = this.getCurrentAppId()
    
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(appId && { 'X-App-ID': appId })
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        ...this.getAuthHeaders(),
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
        // Try to get error message from response
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage
        }
        const error = new Error(errorMessage) as any
        error.status = response.status
        throw error
      }
      
      return await response.json()
    } catch (error: any) {
      console.error('API request failed:', error)
      // Return empty data instead of throwing error for better UX (only for list endpoints)
      if (endpoint.includes('/admin/admin-users') && error.status !== 500) {
        return [] as T
      }
      if (endpoint.includes('/admin/roles') && error.status !== 500) {
        return [] as T
      }
      if (endpoint.includes('/admin/permissions') && error.status !== 500) {
        return [] as T
      }
      if (endpoint.includes('/admin/user-groups') && error.status !== 500) {
        return [] as T
      }
      // For 500 errors or other critical errors, always throw
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
      color: r.color || '#3B82F6',
      is_system: r.is_system || false,
      priority: r.priority || 0,
      permission_count: r.permission_count || 0,
      user_count: r.user_count || 0,
      created_at: r.created_at,
      updated_at: r.updated_at,
    })) as Role[]
  }

  async getRole(id: string): Promise<RoleWithPermissions> {
    const response = await this.request<{ role: RoleWithPermissions }>(`/admin/roles/${id}`)
    return response.role
  }

  async createRole(roleData: { 
    name: string
    description?: string
    color?: string
    priority?: number
    permission_ids?: string[]
  }): Promise<RoleWithPermissions> {
    const response = await this.request<{ role: RoleWithPermissions }>('/admin/roles', {
      method: 'POST',
      body: JSON.stringify(roleData),
    })
    return response.role
  }

  async updateRole(id: string, roleData: { 
    name?: string
    description?: string
    color?: string
    priority?: number
    permission_ids?: string[]
  }): Promise<RoleWithPermissions> {
    const response = await this.request<{ role: RoleWithPermissions }>(`/admin/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(roleData),
    })
    return response.role
  }

  async deleteRole(id: string): Promise<void> {
    return this.request<void>(`/admin/roles/${id}`, {
      method: 'DELETE',
    })
  }

  async getRoleStatistics(): Promise<{
    total_roles: number
    total_permissions: number
    permissions_by_module: { module: string; count: number }[]
  }> {
    const response = await this.request<{ statistics: any }>('/admin/roles/statistics')
    return response.statistics
  }

  // Permissions
  async getPermissions(): Promise<Permission[]> {
    const response = await this.request<{ permissions: Permission[] }>('/admin/permissions')
    return response.permissions || []
  }

  async getPermissionsGrouped(): Promise<PermissionsByModule> {
    const response = await this.request<{ permissions: PermissionsByModule }>('/admin/permissions/grouped')
    return response.permissions || {}
  }

  // Role Permissions
  async setRolePermissions(roleId: string, permissionIds: string[]): Promise<Permission[]> {
    const response = await this.request<{ permissions: Permission[] }>(`/admin/roles/${roleId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permission_ids: permissionIds }),
    })
    return response.permissions || []
  }

  // User Role Assignment
  async assignRoleToUser(userId: string, roleId: string): Promise<any> {
    const response = await this.request<{ userRole: any }>(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role_id: roleId }),
    })
    return response.userRole
  }

  async getUserPermissions(userId: string): Promise<{ permissions: { module: string; action: string }[]; is_super_admin: boolean }> {
    return this.request<{ permissions: { module: string; action: string }[]; is_super_admin: boolean }>(`/admin/users/${userId}/permissions`)
  }

  async getCurrentUserPermissions(): Promise<{ permissions: { module: string; action: string }[]; is_super_admin: boolean }> {
    return this.request<{ permissions: { module: string; action: string }[]; is_super_admin: boolean }>('/admin/me/permissions')
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
    return this.request<{ token: string; user: AdminUser }>('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async logout(): Promise<void> {
    return this.request<void>('/admin/auth/logout', {
      method: 'POST',
    })
  }

  async getCurrentUser(): Promise<AdminUser> {
    return this.request<AdminUser>('/admin/auth/me')
  }

  // Families Management (Circles Collection)
  // @deprecated Use getEntities('/admin/entities/circles') instead - these methods use custom endpoints
  // TODO: Migrate all usages to use generic collection system via getEntities()
  async getFamilies(): Promise<Circle[]> {
    // DEPRECATED: Use getEntities('/admin/entities/circles') instead
    const response = await this.request<{ families: Circle[] }>('/admin/families')
    return response.families || []
  }

  // @deprecated Use getEntities('/admin/entities/circles/{id}') instead
  async getCircle(id: string): Promise<Circle> {
    return this.request<Circle>(`/admin/families/${id}`)
  }

  // @deprecated Use generic collection create via POST /admin/entities/circles instead
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

  // @deprecated Use generic collection update via PUT /admin/entities/circles/{id} instead
  async updateCircle(id: string, CircleData: Partial<Circle>): Promise<Circle> {
    return this.request<Circle>(`/admin/families/${id}`, {
      method: 'PUT',
      body: JSON.stringify(CircleData),
    })
  }

  // @deprecated Use generic collection delete via DELETE /admin/entities/circles/{id} instead
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

  // Social Posts Collection
  // @deprecated Use getEntities('/admin/entities/social-posts') instead - these methods use custom endpoints
  // TODO: Migrate all usages to use generic collection system via getEntities()
  async getSocialPosts(): Promise<any[]> {
    // DEPRECATED: Use getEntities('/admin/entities/social-posts') instead
    const response = await this.request<{ success: boolean; posts: any[] }>('/admin/social-posts')
    return response.posts || []
  }

  // @deprecated Use generic collection delete via DELETE /admin/entities/social-posts/{id} instead
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
    const response = await this.request<{ types?: any[], success?: boolean }>(`/admin/entities/types${params}`)
    // Handle both response formats: { types: [...] } and { success: true, types: [...] }
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
  async getEntities(endpoint: string, options?: RequestInit): Promise<any> {
    return this.request<any>(endpoint, options || {})
  }

  // Generic Entity CRUD operations for collections
  async getCollectionItems(collectionName: string, params?: { page?: number, limit?: number, search?: string }): Promise<{ entities: any[], total: number }> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.search) queryParams.append('search', params.search)
    const queryString = queryParams.toString()
    return this.request<any>(`/admin/entities/${collectionName}${queryString ? `?${queryString}` : ''}`)
  }

  async getCollectionItem(collectionName: string, id: string): Promise<any> {
    const response = await this.request<{ entity: any }>(`/admin/entities/${collectionName}/${id}`)
    return response.entity
  }

  async createCollectionItem(collectionName: string, attributes: any, metadata?: any): Promise<any> {
    const response = await this.request<{ entity: any }>(`/admin/entities/${collectionName}`, {
      method: 'POST',
      body: JSON.stringify({ attributes, metadata })
    })
    return response.entity
  }

  async updateCollectionItem(collectionName: string, id: string, attributes: any, metadata?: any): Promise<any> {
    const response = await this.request<{ entity: any }>(`/admin/entities/${collectionName}/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ attributes, metadata })
    })
    return response.entity
  }

  async deleteCollectionItem(collectionName: string, id: string, hard?: boolean): Promise<void> {
    await this.request<void>(`/admin/entities/${collectionName}/${id}${hard ? '?hard=true' : ''}`, {
      method: 'DELETE'
    })
  }

  // Tickets
  async getTicketsCount(): Promise<number> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/tickets/count/open`, {
        headers: this.getAuthHeaders(),
      })
      if (response.ok) {
        const data = await response.json()
        return data.count || 0
      }
      return 0
    } catch (error) {
      console.warn('Could not fetch ticket count:', error)
      return 0
    }
  }

  async getTickets(params?: { status?: string; type?: string; priority?: string; search?: string; limit?: number; offset?: number }) {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.set('status', params.status)
    if (params?.type) queryParams.set('type', params.type)
    if (params?.priority) queryParams.set('priority', params.priority)
    if (params?.search) queryParams.set('search', params.search)
    if (params?.limit) queryParams.set('limit', String(params.limit))
    if (params?.offset) queryParams.set('offset', String(params.offset))

    const response = await fetch(`${API_BASE_URL}/admin/tickets?${queryParams}`, {
      headers: this.getAuthHeaders(),
    })
    return response.json()
  }

  async getTicketById(id: string) {
    const response = await fetch(`${API_BASE_URL}/admin/tickets/${id}`, {
      headers: this.getAuthHeaders(),
    })
    return response.json()
  }

  async getTicketStats() {
    const response = await fetch(`${API_BASE_URL}/admin/tickets/stats`, {
      headers: this.getAuthHeaders(),
    })
    return response.json()
  }

  async createTicket(data: { title: string; description: string; type: string; priority: string; reporterId?: string; circleId?: string; tags?: string[] }) {
    const response = await fetch(`${API_BASE_URL}/admin/tickets`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return response.json()
  }

  async updateTicket(id: string, data: Partial<{ title: string; description: string; type: string; priority: string; status: string; assignedTo: string; tags: string[] }>) {
    const response = await fetch(`${API_BASE_URL}/admin/tickets/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return response.json()
  }

  async assignTicket(id: string, assignedTo: string) {
    const response = await fetch(`${API_BASE_URL}/admin/tickets/${id}/assign`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ assignedTo }),
    })
    return response.json()
  }

  async addTicketComment(id: string, content: string, isInternal: boolean = false) {
    const response = await fetch(`${API_BASE_URL}/admin/tickets/${id}/comments`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ content, isInternal }),
    })
    return response.json()
  }

  async deleteTicket(id: string) {
    const response = await fetch(`${API_BASE_URL}/admin/tickets/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    })
    return response.json()
  }
  // File Upload
  async uploadFile(file: File): Promise<{ file: { id: string, url: string, mime_type: string, file_name: string } }> {
    const formData = new FormData()
    formData.append('file', file)

    const url = `${API_BASE_URL}/storage/upload`
    const token = localStorage.getItem('admin_token')

    if (!token) {
      throw new Error('No authentication token found. Please log in again.')
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type header - let browser set it with boundary for FormData
        },
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `Upload failed: ${response.statusText}`
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.message || errorJson.error || errorMessage
        } catch {
          // If not JSON, use the text
          if (errorText) errorMessage = errorText
        }
        throw new Error(errorMessage)
      }

      return await response.json()
    } catch (error: any) {
      // Handle network errors (connection refused, etc.)
      if (error.message?.includes('Failed to fetch') || 
          error.message?.includes('ERR_CONNECTION_REFUSED') ||
          error.name === 'TypeError') {
        throw new Error('Cannot connect to server. Please ensure the backend server is running.')
      }
      throw error
    }
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

