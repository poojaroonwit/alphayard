
import { API_BASE_URL } from './apiConfig'
import { Circle } from './adminService'

export interface UserAttribute {
    key: string;
    value: string;
}

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    avatarUrl?: string; // Changed from avatar to match backend avatar_url mapping
    status: 'active' | 'inactive' | 'pending' | 'suspended' | 'banned';
    role: string;
    userType: 'circle' | 'children' | 'seniors'; // Updated hourse to circle
    subscriptionTier?: 'free' | 'premium' | 'elite';
    isVerified: boolean;
    isOnboardingComplete: boolean;
    source: string;
    circleId?: string;
    circleIds?: string[];
    dateOfBirth?: string;
    lastLogin?: string;
    preferences?: any;
    permissions: string[];
    createdAt: string;
    updatedAt?: string;
    tags?: string[];
    attributes?: Record<string, string>;
    circles?: { id: string, name: string }[];
    apps?: {
        appId: string;
        appName: string;
        joinedAt: string;
        role: string;
    }[];
}

export interface Application {
    id: string;
    name: string;
    slug: string;
    description?: string;
    logoUrl?: string;
}

export interface GlobalUser extends User {}

class UserService {
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
        }

        const response = await fetch(url, config)
        
        if (response.status === 401) {
            localStorage.removeItem('admin_token')
            localStorage.removeItem('admin_user')
            if (typeof window !== 'undefined') {
                window.location.href = '/login'
            }
            throw new Error('Unauthorized')
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({}))
            throw new Error(error.message || `HTTP error! status: ${response.status}`)
        }
        
        return await response.json()
    }

    private mapBackendUser(u: any): GlobalUser {
        return {
            id: u.id,
            email: u.email,
            firstName: u.firstName || '',
            lastName: u.lastName || '',
            phone: u.phone,
            avatarUrl: u.avatarUrl,
            status: u.status || (u.isActive ? 'active' : 'inactive'),
            role: u.metadata?.role || 'user',
            userType: u.metadata?.userType || 'circle',
            isVerified: u.metadata?.isVerified || false,
            isOnboardingComplete: u.metadata?.isOnboardingComplete || false,
            source: u.metadata?.source || 'email',
            createdAt: u.createdAt,
            updatedAt: u.updatedAt,
            permissions: u.metadata?.permissions || [],
            tags: u.metadata?.tags || [],
            attributes: u.metadata?.attributes || {},
            circles: u.circles || [],
            apps: u.apps || u.metadata?.apps || []
        }
    }

    async getUsers(params: any = {}): Promise<{ users: GlobalUser[], total: number, totalPages: number, currentPage: number }> {
        const query = new URLSearchParams()
        if (params.search) query.append('search', params.search)
        if (params.page) query.append('page', params.page)
        if (params.limit) query.append('limit', params.limit)
        if (params.app) query.append('app', params.app)
        if (params.status) query.append('status', params.status)
        if (params.attribute) query.append('attribute', params.attribute)
        if (params.role) query.append('role', params.role)
        
        const response = await this.request<{ users: any[], total: number, totalPages: number, currentPage: number }>(`/admin/users?${query.toString()}`)
        return {
            users: (response.users || []).map(u => this.mapBackendUser(u)),
            total: response.total || 0,
            totalPages: response.totalPages || 0,
            currentPage: response.currentPage || 1
        }
    }

    async getUserById(id: string): Promise<GlobalUser | undefined> {
        const response = await this.request<{ user: any }>(`/admin/users/${id}`)
        return response.user ? this.mapBackendUser(response.user) : undefined
    }

    async createUser(userData: any): Promise<GlobalUser> {
        const response = await this.request<any>('/admin/identity/users', {
            method: 'POST',
            body: JSON.stringify(userData),
        })
        return this.mapBackendUser(response.user || response)
    }

    async updateUser(id: string, updates: Partial<GlobalUser>): Promise<GlobalUser> {
        // Map frontend updates back to backend expected format if necessary
        const backendUpdates: any = { ...updates }
        if (updates.firstName !== undefined) backendUpdates.firstName = updates.firstName
        if (updates.lastName !== undefined) backendUpdates.lastName = updates.lastName
        if (updates.status !== undefined) backendUpdates.is_active = (updates.status === 'active')
        
        const response = await this.request<any>(`/admin/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(backendUpdates),
        })
        return this.mapBackendUser(response.user || response)
    }

    async deleteUser(id: string): Promise<void> {
        await this.request(`/admin/users/${id}`, {
            method: 'DELETE',
        })
    }

    async getCircles(): Promise<Circle[]> {
        const response = await this.request<{ families: Circle[] }>('/admin/families')
        return response.families || []
    }

    async getApplications(): Promise<Application[]> {
        const response = await this.request<{ applications: Application[] }>('/admin/applications')
        return response.applications || []
    }

    async getGlobalUsers(): Promise<GlobalUser[]> {
        const response = await this.getUsers({ limit: 1000 })
        return response.users || []
    }
}

export const userService = new UserService()

