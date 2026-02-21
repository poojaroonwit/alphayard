import { API_BASE_URL } from './apiConfig'

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
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
    
    return await response.json();
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

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/admin/dashboard/stats');
  }

  // Entity Types (for Collections)
  async getEntityTypes(applicationId?: string): Promise<any[]> {
    const params = applicationId ? `?applicationId=${applicationId}` : '';
    const response = await this.request<{ entityTypes: any[] }>(`/admin/entity-types${params}`);
    return response.entityTypes || [];
  }

  async deleteEntityType(entityTypeId: string): Promise<void> {
    return this.request<void>(`/admin/entity-types/${entityTypeId}`, {
      method: 'DELETE',
    });
  }

  async updateEntityType(entityTypeId: string, data: any): Promise<any> {
    return this.request<any>(`/admin/entity-types/${entityTypeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
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
  async uploadFile(file: File, type?: string): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);
    if (type) formData.append('type', type);
    
    return this.request<{ url: string; filename: string }>('/admin/upload', {
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
  async upsertApplicationSetting(data: {
    setting_key: string;
    setting_value: any;
    setting_type?: string;
    category?: string;
    description?: string;
    is_public?: boolean;
    application_id?: string;
  }): Promise<any> {
    return this.request<any>('/admin/application-settings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const adminService = new AdminService();
