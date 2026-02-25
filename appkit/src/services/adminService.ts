import { API_BASE_URL } from './apiConfig'

export interface AdminUser {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isSuperAdmin?: boolean;
  isActive?: boolean;
  status: string;
  avatar?: string;
  phone?: string;
  department?: string;
  permissions: string[];
  lastLogin?: string;
  isVerified?: boolean;
  createdAt: string;
  updatedAt?: string;
  user_count?: number;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  color?: string;
  is_system?: boolean;
  permissions: string[];
  user_count?: number;
  permission_count?: number;
}

export interface Permission {
  id: string;
  name: string;
  module?: string;
  action?: string;
  description?: string;
}

export interface RoleWithPermissions extends Role {
  permissionsStrings: string[];
  permission_details?: Permission[];
  priority?: number;
}

export interface PermissionsByModule {
  [module: string]: Permission[];
}

export interface Application {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_active?: boolean;
  branding?: any;
  settings?: {
    google_analytics_id?: string;
    [key: string]: any;
  };
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalFamilies: number;
  activeSubscriptions: number;
  totalScreens: number;
  recentUsers: number;
  recentFamilies: number;
  recentAlerts: number;
  recentMessages: number;
}

export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  topLocations: { country: string; count: number }[];
}

export interface LoginHistoryEntry {
  id: string;
  userId: string;
  action: string;
  status: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  socialProvider?: string;
}

class AdminService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('admin_token');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (response.status === 401) {
      // Only redirect if NOT already on login page and NOT calling login endpoint
      const isLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login';
      const isAuthEndpoint = endpoint.includes('/auth/login');

      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');

      if (!isLoginPage && !isAuthEndpoint && typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
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
  }

  // Authentication
  async login(credentials: { email: string; password: string }): Promise<{ user: AdminUser; token: string }> {
    return this.request<{ user: AdminUser; token: string }>('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout(): Promise<void> {
    return this.request<void>('/admin/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser(): Promise<AdminUser> {
    return this.request<AdminUser>('/admin/auth/me');
  }

  // Admin Users
  async getAdminUsers(params: any = {}): Promise<{ users: AdminUser[], pagination: any }> {
    const query = new URLSearchParams(params).toString();
    return this.request<{ users: AdminUser[], pagination: any }>(`/admin/admin-users?${query}`);
  }

  async getAdminUser(id: string): Promise<AdminUser> {
    return this.request<AdminUser>(`/admin/admin-users/${id}`);
  }

  async createAdminUser(data: any): Promise<AdminUser> {
    return this.request<AdminUser>('/admin/admin-users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAdminUser(id: string, data: any): Promise<AdminUser> {
    return this.request<AdminUser>(`/admin/admin-users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateAdminUserStatus(id: string, status: string): Promise<AdminUser> {
    return this.request<AdminUser>(`/admin/admin-users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async deleteAdminUser(id: string): Promise<void> {
    return this.request<void>(`/admin/admin-users/${id}`, {
      method: 'DELETE',
    });
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    return this.request<void>(`/admin/admin-users/${userId}/role`, {
      method: 'POST',
      body: JSON.stringify({ roleId }),
    });
  }

  // Applications
  async getApplications(): Promise<Application[]> {
    const response = await this.request<{ applications: Application[] }>('/admin/applications');
    return response.applications || [];
  }

  async getApplication(id: string): Promise<Application> {
    return this.request<Application>(`/admin/applications/${id}`);
  }

  async createApplication(data: Partial<Application>): Promise<Application> {
    return this.request<Application>('/admin/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateApplication(id: string, data: Partial<Application>): Promise<Application> {
    return this.request<Application>(`/admin/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteApplication(id: string): Promise<void> {
    return this.request<void>(`/admin/applications/${id}`, {
      method: 'DELETE',
    });
  }

  async getApplicationVersions(appId: string): Promise<any[]> {
    const response = await this.request<{ versions: any[] }>(`/admin/applications/${appId}/versions`);
    return response.versions || [];
  }

  async createApplicationVersion(appId: string, data: any = {}): Promise<any> {
    return this.request<any>(`/admin/applications/${appId}/versions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async publishApplicationVersion(appId: string, versionId: string): Promise<any> {
    return this.request<any>(`/admin/applications/${appId}/versions/${versionId}/publish`, {
      method: 'POST',
    });
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/admin/dashboard/stats');
  }

  // Roles & Permissions
  async getRoles(): Promise<Role[]> {
    return this.request<Role[]>('/admin/roles');
  }

  async getRole(id: string): Promise<RoleWithPermissions> {
    return this.request<RoleWithPermissions>(`/admin/roles/${id}`);
  }

  async createRole(data: any): Promise<Role> {
    return this.request<Role>('/admin/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRole(id: string, data: any): Promise<Role> {
    return this.request<Role>(`/admin/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRole(id: string): Promise<void> {
    return this.request<void>(`/admin/roles/${id}`, {
      method: 'DELETE',
    });
  }

  async getPermissions(): Promise<Permission[]> {
    return this.request<Permission[]>('/admin/permissions');
  }

  async getPermissionsGrouped(): Promise<PermissionsByModule> {
    return this.request<PermissionsByModule>('/admin/permissions/grouped');
  }

  // Audit Logs
  async getAuditLogs(params: any = {}): Promise<{ logs: any[], total: number }> {
    const query = new URLSearchParams(params).toString();
    return this.request<{ logs: any[], total: number }>(`/admin/audit/logs?${query}`);
  }

  async getAuditStats(params: any = {}): Promise<any[]> {
    const query = new URLSearchParams(params).toString();
    return this.request<any[]>(`/admin/audit/stats?${query}`);
  }

  async exportAuditLogs(params: any = {}): Promise<Blob> {
    const query = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/admin/audit/export?${query}`;
    const token = localStorage.getItem('admin_token');
    
    const response = await fetch(url, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    
    if (!response.ok) throw new Error('Export failed');
    return await response.blob();
  }

  // Identity Groups
  async getUserGroups(applicationId?: string): Promise<{ groups: any[] }> {
    const params = applicationId ? `?applicationId=${applicationId}` : '';
    return this.request<{ groups: any[] }>(`/identity/groups${params}`);
  }

  async getUserGroup(id: string): Promise<{ group: any, members: any[] }> {
    return this.request<{ group: any, members: any[] }>(`/identity/groups/${id}`);
  }

  async createUserGroup(data: any): Promise<{ group: any }> {
    return this.request<{ group: any }>('/identity/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUserGroup(id: string, data: any): Promise<{ group: any }> {
    return this.request<{ group: any }>(`/identity/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUserGroup(id: string): Promise<{ success: true }> {
    return this.request<{ success: true }>(`/identity/groups/${id}`, {
      method: 'DELETE',
    });
  }

  async addUserToGroup(groupId: string, userId: string, role: string = 'member'): Promise<{ success: true }> {
    return this.request<{ success: true }>(`/identity/groups/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId, role }),
    });
  }

  async removeUserFromGroup(groupId: string, userId: string): Promise<{ success: true }> {
    return this.request<{ success: true }>(`/identity/groups/${groupId}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  async getUserGroupMemberships(userId: string): Promise<{ groups: any[] }> {
    return this.request<{ groups: any[] }>(`/identity/users/${userId}/groups`);
  }

  // Identity Audit & Analytics
  async getIdentityAuditLog(params: any = {}): Promise<{ entries: any[], total: number }> {
    const query = new URLSearchParams(params).toString();
    return this.request<{ entries: any[], total: number }>(`/identity/audit-log?${query}`);
  }

  async getIdentityAnalytics(params: any = {}): Promise<any> {
    const query = new URLSearchParams(params).toString();
    return this.request<any>(`/identity/analytics?${query}`);
  }

  // App Configuration
  async getAppConfig(appId: string): Promise<{ config: any }> {
    return this.request<{ config: any }>(`/v1/admin/config?appId=${appId}`);
  }

  async getScreenConfig(appId: string, screenKey: string): Promise<{ config: any }> {
    return this.request<{ config: any }>(`/admin/config/screens/${screenKey}?appId=${appId}`);
  }

  async updateScreenConfig(appId: string, screenKey: string, config: any): Promise<{ setting: any }> {
    return this.request<{ setting: any }>(`/admin/config/screens/${screenKey}`, {
      method: 'PUT',
      body: JSON.stringify({ appId, config }),
    });
  }

  async getThemes(): Promise<{ themes: any[] }> {
    return this.request<{ themes: any[] }>('/admin/config/themes');
  }

  async updateTheme(appId: string, themeName: string, themeConfig: any): Promise<{ setting: any }> {
    return this.request<{ setting: any }>(`/admin/config/themes/${themeName}`, {
      method: 'PUT',
      body: JSON.stringify({ appId, themeConfig }),
    });
  }

  async getFeatureFlags(): Promise<{ flags: any }> {
    return this.request<{ flags: any }>('/admin/config/features');
  }

  async updateFeatureFlag(appId: string, flag: string, value: any): Promise<{ setting: any }> {
    return this.request<{ setting: any }>(`/admin/config/features/${flag}`, {
      method: 'PATCH',
      body: JSON.stringify({ appId, value }),
    });
  }

  async getConfigValue(configKey: string): Promise<{ value: any }> {
    return this.request<{ value: any }>(`/admin/config/values/${configKey}`);
  }

  async updateConfigValue(appId: string, key: string, value: any): Promise<{ setting: any }> {
    return this.request<{ setting: any }>(`/admin/config/values/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ appId, value }),
    });
  }

  async getAsset(id: string): Promise<{ asset: any }> {
    return this.request<{ asset: any }>(`/admin/config/assets/${id}`);
  }

  async getAssetsByType(type: string): Promise<{ assets: any[] }> {
    return this.request<{ assets: any[] }>(`/admin/config/assets/type/${type}`);
  }

  // Entity Types (for Collections)
  async getEntityTypes(applicationId?: string): Promise<any[]> {
    const params = applicationId ? `?applicationId=${applicationId}` : '';
    const response = await this.request<{ entityTypes: any[] }>(`/admin/entities/types${params}`);
    return response.entityTypes || [];
  }

  async getEntityType(typeName: string): Promise<any> {
    return this.request<any>(`/admin/entities/types/${typeName}`);
  }

  async createEntityType(data: any): Promise<any> {
    return this.request<any>('/admin/entities/types', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteEntityType(entityTypeId: string): Promise<void> {
    return this.request<void>(`/admin/entities/types/${entityTypeId}`, {
      method: 'DELETE',
    });
  }

  async updateEntityType(entityTypeId: string, data: any): Promise<any> {
    return this.request<any>(`/admin/entities/types/${entityTypeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Dynamic Entities
  async getEntities(typeName: string, params: any = {}): Promise<any[]> {
    const query = new URLSearchParams(params).toString();
    const response = await this.request<{ entities: any[] }>(`/admin/entities/${typeName}?${query}`);
    return response.entities || [];
  }

  async createEntity(typeName: string, data: any): Promise<any> {
    return this.request<any>(`/admin/entities/${typeName}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEntity(typeName: string, id: string, data: any): Promise<any> {
    return this.request<any>(`/admin/entities/${typeName}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEntity(typeName: string, id: string): Promise<void> {
    return this.request<void>(`/admin/entities/${typeName}/${id}`, {
      method: 'DELETE',
    });
  }

  // Broadcast/Notifications
  async sendBroadcast(data: {
    title: string;
    message: string;
    type: 'notification' | 'email' | 'both';
    target: 'all' | 'active' | 'premium';
  }): Promise<{ results: { successful: number; failed: number } }> {
    return this.request<{ results: { successful: number; failed: number } }>('/admin/broadcast', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Screens Management
  async seedScreens(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/admin/screens/seed', {
      method: 'POST',
    });
  }

  // View Preferences
  async getViewPreference(key: string): Promise<any> {
    return this.request<any>(`/admin/view-preference/${key}`);
  }

  async saveViewPreference(key: string, value: any): Promise<void> {
    return this.request<void>(`/admin/view-preference/${key}`, {
      method: 'POST',
      body: JSON.stringify(value),
    });
  }

  // File Upload
  async uploadFile(file: File, type?: string): Promise<{ file: { url: string; filename: string; id: string; mime_type?: string } }> {
    const formData = new FormData();
    formData.append('file', file);
    if (type) formData.append('type', type);
    
    return this.request<any>('/admin/upload', {
      method: 'POST',
      body: formData,
    });
  }

  // Permissions
  async getCurrentUserPermissions(): Promise<{ permissions: any[], is_super_admin: boolean }> {
    // AdminUserController.getCurrentUser (mounted at /admin/auth/me) returns permissions
    const result = await this.request<any>('/admin/auth/me');
    return {
      permissions: result.permissions || [],
      is_super_admin: result.isSuperAdmin || false
    };
  }

  async getUserPermissions(userId: string): Promise<{ permissions: any[], is_super_admin: boolean }> {
    // AdminUserController attributes permissions to users
    const result = await this.request<any>(`/admin/admin-users/${userId}`);
    return {
      permissions: result.permissions || [],
      is_super_admin: result.isSuperAdmin || false
    };
  }

  // Application Settings
  async getApplicationSettings(): Promise<{ settings: any[] }> {
    return this.request<any>('/admin/application-settings');
  }

  // Component Styles
  async getComponentStudioSidebar(): Promise<any> {
    return this.request<any>('/admin/styles/sidebar');
  }

  async createComponentStyle(data: any): Promise<any> {
    return this.request<any>('/admin/styles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateComponentStyle(id: string, data: any): Promise<any> {
    return this.request<any>(`/admin/styles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async duplicateComponentStyle(id: string): Promise<any> {
    return this.request<any>(`/admin/styles/${id}/duplicate`, {
      method: 'POST',
    });
  }

  // Branding
  async uploadBrandingAsset(appId: string, fileOrData: File | FormData, type?: string): Promise<{ url: string }> {
    let formData: FormData;
    if (fileOrData instanceof FormData) {
      formData = fileOrData;
    } else {
      formData = new FormData();
      formData.append('file', fileOrData);
      if (type) formData.append('type', type);
    }
    
    return this.request<{ url: string }>(`/admin/applications/${appId}/branding/upload`, {
      method: 'POST',
      body: formData,
    });
  }

  async upsertApplicationSetting(data: { 
    appId?: string, 
    key?: string, 
    value?: any, 
    setting_key?: string, 
    setting_value?: any, 
    category?: string, 
    setting_type?: string, 
    description?: string, 
    is_public?: boolean,
    [key: string]: any 
  }): Promise<any> {
    const { 
      appId, 
      key, 
      value, 
      setting_key, 
      setting_value, 
      category, 
      setting_type, 
      description, 
      is_public,
      ...rest 
    } = data;
    
    return this.request<any>('/admin/config/values', {
      method: 'POST',
      body: JSON.stringify({ 
        appId, 
        key: key || setting_key, 
        value: value || setting_value, 
        category, 
        type: setting_type, 
        description, 
        is_public,
        ...rest 
      }),
    });
  }

  // Database Explorer
  async getDatabaseStats(): Promise<any> {
    return this.request<any>('/admin/database/stats');
  }

  async getDatabaseTables(): Promise<{ tables: any[] }> {
    return this.request<{ tables: any[] }>('/admin/database/tables');
  }

  async getTableDetails(tableName: string): Promise<any> {
    return this.request<any>(`/admin/database/tables/${tableName}`);
  }

  async getTableColumns(tableName: string): Promise<{ columns: any[] }> {
    return this.request<{ columns: any[] }>(`/admin/database/tables/${tableName}/columns`);
  }

  async getTableData(tableName: string, params: any = {}): Promise<any> {
    const query = new URLSearchParams(params).toString();
    return this.request<any>(`/admin/database/tables/${tableName}/data?${query}`);
  }

  async executeSQLQuery(sql: string, readOnly: boolean = true): Promise<any> {
    return this.request<any>('/admin/database/query', {
      method: 'POST',
      body: JSON.stringify({ sql, readOnly }),
    });
  }

  async getSavedQueries(): Promise<{ queries: any[] }> {
    return this.request<{ queries: any[] }>('/admin/database/saved-queries');
  }

  async saveQuery(name: string, sql: string): Promise<any> {
    return this.request<any>('/admin/database/saved-queries', {
      method: 'POST',
      body: JSON.stringify({ name, sql }),
    });
  }

  async deleteSavedQuery(id: string): Promise<any> {
    return this.request<any>(`/admin/database/saved-queries/${id}`, {
      method: 'DELETE',
    });
  }

  async getSchemas(): Promise<{ schemas: string[] }> {
    return this.request<{ schemas: string[] }>('/admin/database/schemas');
  }

  async createSchema(name: string): Promise<any> {
    return this.request<any>('/admin/database/schemas', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async createTable(data: { schema: string, tableName: string, columns: any[] }): Promise<any> {
    return this.request<any>('/admin/database/tables', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async dropTable(schema: string, tableName: string): Promise<any> {
    return this.request<any>(`/admin/database/tables/${schema}/${tableName}`, {
      method: 'DELETE',
    });
  }

  async insertRow(schema: string, tableName: string, data: any): Promise<any> {
    return this.request<any>(`/admin/database/tables/${schema}/${tableName}/rows`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRow(schema: string, tableName: string, id: string, data: any): Promise<any> {
    return this.request<any>(`/admin/database/tables/${schema}/${tableName}/rows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRow(schema: string, tableName: string, id: string): Promise<any> {
    return this.request<any>(`/admin/database/tables/${schema}/${tableName}/rows/${id}`, {
      method: 'DELETE',
    });
  }

  // ===================== Default Config APIs =====================

  // Auth Methods defaults
  async getDefaultAuthMethods(): Promise<{ methods: any[] }> {
    return this.request<{ methods: any[] }>('/v1/admin/config/auth-methods');
  }

  async saveDefaultAuthMethods(methods: any[]): Promise<any> {
    return this.request<any>('/admin/config/auth-methods', {
      method: 'PUT',
      body: JSON.stringify({ methods }),
    });
  }

  // User Attributes defaults
  async getDefaultUserAttributes(): Promise<{ attributes: any[] }> {
    return this.request<{ attributes: any[] }>('/v1/admin/config/user-attributes');
  }

  async saveDefaultUserAttributes(attributes: any[]): Promise<any> {
    return this.request<any>('/admin/config/user-attributes', {
      method: 'PUT',
      body: JSON.stringify({ attributes }),
    });
  }

  // Communication defaults
  async getDefaultCommConfig(): Promise<{ config: any }> {
    return this.request<{ config: any }>('/v1/admin/config/communication');
  }

  async saveDefaultCommConfig(config: any): Promise<any> {
    return this.request<any>('/admin/config/communication', {
      method: 'PUT',
      body: JSON.stringify({ config }),
    });
  }

  // Legal defaults
  async getDefaultLegalConfig(): Promise<{ config: any }> {
    return this.request<{ config: any }>('/v1/admin/config/legal');
  }

  async saveDefaultLegalConfig(config: any): Promise<any> {
    return this.request<any>('/admin/config/legal', {
      method: 'PUT',
      body: JSON.stringify({ config }),
    });
  }

  // Per-app config overrides
  async getAppConfigOverride(appId: string, configType: string): Promise<{ useDefault: boolean; config: any }> {
    return this.request<{ useDefault: boolean; config: any }>(`/v1/admin/applications/config?appId=${appId}&configType=${configType}`);
  }

  async saveAppConfig(appId: string, configType: string, config: any): Promise<any> {
    return this.request<any>('/v1/admin/applications/config', {
      method: 'PUT',
      body: JSON.stringify({ appId, configType, config }),
    });
  }

  async deleteAppConfig(appId: string, configType: string): Promise<any> {
    return this.request<any>(`/v1/admin/applications/config?appId=${appId}&configType=${configType}`, {
      method: 'DELETE',
    });
  }
}

export const adminService = new AdminService();
