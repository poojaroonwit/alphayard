'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { adminService, Application } from '../services/adminService'

// ============================================================================
// Types
// ============================================================================

interface AppContextType {
    currentApp: Application | null
    setCurrentApp: (app: Application | null) => void
    applications: Application[]
    isLoading: boolean
    error: string | null
    refreshApplications: () => Promise<void>
    // Multi-tenant additions
    switchApp: (appId: string) => void
    hasAppAccess: (appId: string) => boolean
    getCurrentAppId: () => string | null
    getAppHeader: () => Record<string, string>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

// ============================================================================
// Storage Key
// ============================================================================

const STORAGE_KEY = 'selected_app_id'

// ============================================================================
// Provider
// ============================================================================

export function AppProvider({ children }: { children: ReactNode }) {
    const [currentApp, setCurrentAppState] = useState<Application | null>(null)
    const [applications, setApplications] = useState<Application[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const pathname = usePathname()

    // Enhanced setCurrentApp that also saves to localStorage
    const setCurrentApp = useCallback((app: Application | null) => {
        setCurrentAppState(app)
        if (app) {
            localStorage.setItem(STORAGE_KEY, app.id)
        } else {
            localStorage.removeItem(STORAGE_KEY)
        }
    }, [])

    // Switch app by ID
    const switchApp = useCallback((appId: string) => {
        const app = applications.find(a => a.id === appId)
        if (app) {
            setCurrentApp(app)
        } else {
            console.warn(`[AppContext] Application ${appId} not found`)
        }
    }, [applications, setCurrentApp])

    // Check if admin has access to an app
    const hasAppAccess = useCallback((appId: string): boolean => {
        return applications.some(a => a.id === appId)
    }, [applications])

    // Get current app ID
    const getCurrentAppId = useCallback((): string | null => {
        return currentApp?.id || null
    }, [currentApp])

    // Get header object for API calls
    const getAppHeader = useCallback((): Record<string, string> => {
        if (currentApp?.id) {
            return { 'X-App-ID': currentApp.id }
        }
        return {}
    }, [currentApp])

    // Refresh applications from API
    const refreshApplications = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        
        try {
            const response = await adminService.getApplications()
            const apps = response.applications || []
            setApplications(apps)
            
            // Try to restore current app from localStorage or pick default
            const savedAppId = localStorage.getItem(STORAGE_KEY)
            if (savedAppId) {
                const savedApp = apps.find((a: Application) => a.id === savedAppId)
                if (savedApp) {
                    setCurrentAppState(savedApp)
                } else {
                    selectDefaultApp(apps)
                }
            } else {
                selectDefaultApp(apps)
            }
        } catch (err: any) {
            console.error('Failed to fetch applications:', err)
            setError(err.message || 'Failed to load applications')
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Select default app (bondarys or first available)
    const selectDefaultApp = (apps: Application[]) => {
        if (apps.length === 0) {
            setCurrentAppState(null)
            return
        }

        // Try to find appkit app (new) or bondarys app (legacy)
        const defaultApp = apps.find(a => a.slug === 'appkit') || apps.find(a => a.slug === 'bondarys')
        if (defaultApp) {
            setCurrentAppState(defaultApp)
            localStorage.setItem(STORAGE_KEY, defaultApp.id)
            return
        }

        // Fall back to first active app
        const firstApp = apps.find(a => a.is_active) || apps[0]
        if (firstApp) {
            setCurrentAppState(firstApp)
            localStorage.setItem(STORAGE_KEY, firstApp.id)
        }
    }

    // Initial load
    useEffect(() => {
        const token = localStorage.getItem('admin_token')
        if (token && (applications.length === 0 || pathname !== '/login')) {
            refreshApplications()
        } else if (!token) {
            setIsLoading(false)
        }

        // Listen for storage changes (for other tabs)
        const handleStorage = () => {
            const newToken = localStorage.getItem('admin_token')
            if (newToken && applications.length === 0) {
                refreshApplications()
            } else if (!newToken) {
                setApplications([])
                setCurrentAppState(null)
            }
        }
        window.addEventListener('storage', handleStorage)
        return () => window.removeEventListener('storage', handleStorage)
    }, [pathname, applications.length, refreshApplications])

    const value: AppContextType = {
        currentApp,
        setCurrentApp,
        applications,
        isLoading,
        error,
        refreshApplications,
        switchApp,
        hasAppAccess,
        getCurrentAppId,
        getAppHeader
    }

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}

// ============================================================================
// Hook
// ============================================================================

export function useApp() {
    const context = useContext(AppContext)
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider')
    }
    return context
}

// ============================================================================
// Re-export for backward compatibility
// ============================================================================

export { AppContext }
export type { AppContextType }
