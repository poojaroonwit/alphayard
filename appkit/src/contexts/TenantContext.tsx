'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useAuth } from './AuthContext'

// ============================================================================
// Types
// ============================================================================

export interface Application {
    id: string
    name: string
    slug: string
    description: string | null
    branding: Record<string, any>
    settings: Record<string, any>
    is_active: boolean
    created_at: string
    updated_at: string
    // Admin-specific fields
    admin_role?: 'viewer' | 'editor' | 'admin' | 'super_admin'
    admin_permissions?: string[]
    is_primary?: boolean
}

interface TenantContextType {
    currentApp: Application | null
    applications: Application[]
    isLoading: boolean
    error: string | null
    switchApp: (appId: string) => void
    refreshApplications: () => Promise<void>
    hasAppAccess: (appId: string) => boolean
    getCurrentAppId: () => string | null
}

const TenantContext = createContext<TenantContextType | undefined>(undefined)

// ============================================================================
// Local Storage Keys
// ============================================================================

const STORAGE_KEY_CURRENT_APP = 'admin_current_app_id'

// ============================================================================
// API Functions
// ============================================================================

const API_BASE_URL = typeof window !== 'undefined' ? '/api/v1' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api/v1')

async function fetchAdminApplications(token: string): Promise<Application[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/applications/my-apps`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })

        if (!response.ok) {
            // If endpoint doesn't exist yet, return empty array
            if (response.status === 404) {
                console.warn('[TenantContext] /my-apps endpoint not found, falling back to /applications')
                return fetchAllApplications(token)
            }
            throw new Error('Failed to fetch applications')
        }

        const data = await response.json()
        return data.applications || data.data || []
    } catch (error) {
        console.error('[TenantContext] Error fetching admin applications:', error)
        // Fallback to fetching all applications
        return fetchAllApplications(token)
    }
}

async function fetchAllApplications(token: string): Promise<Application[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/applications`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })

        if (!response.ok) {
            throw new Error('Failed to fetch applications')
        }

        const data = await response.json()
        return data.applications || data.data || []
    } catch (error) {
        console.error('[TenantContext] Error fetching all applications:', error)
        return []
    }
}

// ============================================================================
// Provider Component
// ============================================================================

interface TenantProviderProps {
    children: ReactNode
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
    const { token, isAuthenticated, user } = useAuth()
    const [currentApp, setCurrentApp] = useState<Application | null>(null)
    const [applications, setApplications] = useState<Application[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Load applications when authenticated
    const refreshApplications = useCallback(async () => {
        if (!token || !isAuthenticated) {
            setApplications([])
            setCurrentApp(null)
            setIsLoading(false)
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            const apps = await fetchAdminApplications(token)
            setApplications(apps)

            // Restore previously selected app from localStorage
            const storedAppId = localStorage.getItem(STORAGE_KEY_CURRENT_APP)
            
            if (storedAppId) {
                const storedApp = apps.find(a => a.id === storedAppId)
                if (storedApp) {
                    setCurrentApp(storedApp)
                } else {
                    // Stored app not available, select first or primary
                    selectDefaultApp(apps)
                }
            } else {
                selectDefaultApp(apps)
            }
        } catch (err: any) {
            console.error('[TenantContext] Error loading applications:', err)
            setError(err.message || 'Failed to load applications')
        } finally {
            setIsLoading(false)
        }
    }, [token, isAuthenticated])

    // Select default app (primary or first active)
    const selectDefaultApp = (apps: Application[]) => {
        if (apps.length === 0) {
            setCurrentApp(null)
            return
        }

        // Find primary app
        const primaryApp = apps.find(a => a.is_primary)
        if (primaryApp) {
            setCurrentApp(primaryApp)
            localStorage.setItem(STORAGE_KEY_CURRENT_APP, primaryApp.id)
            return
        }

        // Find default app (appkit or legacy bondarys)
        const defaultApp = apps.find(a => a.slug === 'appkit') || apps.find(a => a.slug === 'bondarys')
        if (defaultApp) {
            setCurrentApp(defaultApp)
            localStorage.setItem(STORAGE_KEY_CURRENT_APP, defaultApp.id)
            return
        }

        // Select first active app
        const firstActiveApp = apps.find(a => a.is_active)
        if (firstActiveApp) {
            setCurrentApp(firstActiveApp)
            localStorage.setItem(STORAGE_KEY_CURRENT_APP, firstActiveApp.id)
        }
    }

    // Switch to a different application
    const switchApp = useCallback((appId: string) => {
        const app = applications.find(a => a.id === appId)
        if (app) {
            setCurrentApp(app)
            localStorage.setItem(STORAGE_KEY_CURRENT_APP, appId)
            
            // Optionally trigger a page refresh or state reset
            // window.location.reload()
        } else {
            console.warn(`[TenantContext] Application ${appId} not found in available apps`)
        }
    }, [applications])

    // Check if admin has access to a specific app
    const hasAppAccess = useCallback((appId: string): boolean => {
        // Super admins have access to all apps
        if (user?.permissions?.includes('*')) {
            return true
        }
        return applications.some(a => a.id === appId)
    }, [applications, user])

    // Get current app ID (for API calls)
    const getCurrentAppId = useCallback((): string | null => {
        return currentApp?.id || null
    }, [currentApp])

    // Load applications on mount and when auth changes
    useEffect(() => {
        refreshApplications()
    }, [refreshApplications])

    // Clear state on logout
    useEffect(() => {
        if (!isAuthenticated) {
            setApplications([])
            setCurrentApp(null)
            localStorage.removeItem(STORAGE_KEY_CURRENT_APP)
        }
    }, [isAuthenticated])

    const value: TenantContextType = {
        currentApp,
        applications,
        isLoading,
        error,
        switchApp,
        refreshApplications,
        hasAppAccess,
        getCurrentAppId
    }

    return (
        <TenantContext.Provider value={value}>
            {children}
        </TenantContext.Provider>
    )
}

// ============================================================================
// Hook
// ============================================================================

export const useTenant = (): TenantContextType => {
    const context = useContext(TenantContext)
    if (context === undefined) {
        throw new Error('useTenant must be used within a TenantProvider')
    }
    return context
}

// ============================================================================
// HOC for requiring app context
// ============================================================================

export function withTenant<P extends object>(
    WrappedComponent: React.ComponentType<P & { currentApp: Application }>
): React.FC<P> {
    return function WithTenantComponent(props: P) {
        const { currentApp, isLoading } = useTenant()

        if (isLoading) {
            return (
                <div className="flex items-center justify-center min-h-[200px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
            )
        }

        if (!currentApp) {
            return (
                <div className="flex items-center justify-center min-h-[200px]">
                    <div className="text-center">
                        <p className="text-gray-500">No application selected</p>
                        <p className="text-sm text-gray-400">Please select an application from the header</p>
                    </div>
                </div>
            )
        }

        return <WrappedComponent {...props} currentApp={currentApp} />
    }
}

export default TenantContext
