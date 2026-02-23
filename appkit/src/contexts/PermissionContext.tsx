'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { adminService } from '../services/adminService'
import { authService } from '../services/authService'

// Permission types
interface UserPermission {
    module: string
    action: string
}

interface PermissionContextValue {
    permissions: UserPermission[]
    isSuperAdmin: boolean
    isLoading: boolean
    hasPermission: (module: string, action: string) => boolean
    hasAnyPermission: (permissions: [string, string][]) => boolean
    hasAllPermissions: (permissions: [string, string][]) => boolean
    canAccess: (module: string) => boolean
    refreshPermissions: () => Promise<void>
}

const PermissionContext = createContext<PermissionContextValue | null>(null)

// Permission Provider Props
interface PermissionProviderProps {
    children: ReactNode
}

/**
 * Permission Provider Component
 * Wraps the app and provides permission checking functionality
 */
export function PermissionProvider({ children }: PermissionProviderProps) {
    const [permissions, setPermissions] = useState<UserPermission[]>([])
    const [isSuperAdmin, setIsSuperAdmin] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    // Load user permissions
    const loadPermissions = useCallback(async () => {
        const user = await authService.getUser()
        if (!user?.id) {
            setPermissions([])
            setIsSuperAdmin(false)
            setIsLoading(false)
            return
        }

        try {
            // Use the /me/permissions endpoint for current user
            const result = await adminService.getCurrentUserPermissions()
            setPermissions(result.permissions || [])
            setIsSuperAdmin(result.is_super_admin || false)
        } catch (error) {
            console.error('Failed to load permissions:', error)
            // Fallback: try to load via user ID
            try {
                const result = await adminService.getUserPermissions(user.id)
                setPermissions(result.permissions || [])
                setIsSuperAdmin(result.is_super_admin || false)
            } catch (fallbackError) {
                console.error('Failed to load permissions via user ID:', fallbackError)
                setPermissions([])
                setIsSuperAdmin(false)
            }
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Load permissions on mount
    useEffect(() => {
        loadPermissions()
    }, [loadPermissions])

    // Check if user has a specific permission
    const hasPermission = useCallback((module: string, action: string): boolean => {
        if (isSuperAdmin) return true
        return permissions.some(p => p.module === module && p.action === action)
    }, [permissions, isSuperAdmin])

    // Check if user has any of the specified permissions
    const hasAnyPermission = useCallback((perms: [string, string][]): boolean => {
        if (isSuperAdmin) return true
        return perms.some(([module, action]) => hasPermission(module, action))
    }, [hasPermission, isSuperAdmin])

    // Check if user has all of the specified permissions
    const hasAllPermissions = useCallback((perms: [string, string][]): boolean => {
        if (isSuperAdmin) return true
        return perms.every(([module, action]) => hasPermission(module, action))
    }, [hasPermission, isSuperAdmin])

    // Check if user can access a module (has any permission for that module)
    const canAccess = useCallback((module: string): boolean => {
        if (isSuperAdmin) return true
        return permissions.some(p => p.module === module)
    }, [permissions, isSuperAdmin])

    // Refresh permissions
    const refreshPermissions = useCallback(async () => {
        setIsLoading(true)
        await loadPermissions()
    }, [loadPermissions])

    const value: PermissionContextValue = {
        permissions,
        isSuperAdmin,
        isLoading,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        canAccess,
        refreshPermissions,
    }

    return (
        <PermissionContext.Provider value={value}>
            {children}
        </PermissionContext.Provider>
    )
}

/**
 * Hook to access permission context
 */
export function usePermissions(): PermissionContextValue {
    const context = useContext(PermissionContext)
    if (!context) {
        // Return a default context if not wrapped in provider
        return {
            permissions: [],
            isSuperAdmin: false,
            isLoading: false,
            hasPermission: () => false,
            hasAnyPermission: () => false,
            hasAllPermissions: () => false,
            canAccess: () => false,
            refreshPermissions: async () => {},
        }
    }
    return context
}

/**
 * HOC to protect components based on permissions
 */
export function withPermission<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    module: string,
    action: string,
    FallbackComponent?: React.ComponentType
) {
    return function PermissionGuard(props: P) {
        const { hasPermission, isLoading } = usePermissions()

        if (isLoading) {
            return <div className="p-4 text-center text-gray-500">Loading...</div>
        }

        if (!hasPermission(module, action)) {
            if (FallbackComponent) {
                return <FallbackComponent />
            }
            return (
                <div className="p-8 text-center">
                    <div className="text-gray-400 text-4xl mb-4">🔒</div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Access Denied</h2>
                    <p className="text-gray-500">You don&apos;t have permission to view this content.</p>
                </div>
            )
        }

        return <WrappedComponent {...props} />
    }
}

/**
 * Component to conditionally render children based on permissions
 */
interface PermissionGateProps {
    module: string
    action: string
    children: ReactNode
    fallback?: ReactNode
}

export function PermissionGate({ module, action, children, fallback }: PermissionGateProps) {
    const { hasPermission, isLoading } = usePermissions()

    if (isLoading) {
        return null
    }

    if (!hasPermission(module, action)) {
        return fallback ? <>{fallback}</> : null
    }

    return <>{children}</>
}

/**
 * Component to conditionally render based on any permission
 */
interface AnyPermissionGateProps {
    permissions: [string, string][]
    children: ReactNode
    fallback?: ReactNode
}

export function AnyPermissionGate({ permissions, children, fallback }: AnyPermissionGateProps) {
    const { hasAnyPermission, isLoading } = usePermissions()

    if (isLoading) {
        return null
    }

    if (!hasAnyPermission(permissions)) {
        return fallback ? <>{fallback}</> : null
    }

    return <>{children}</>
}

/**
 * Component to conditionally render based on module access
 */
interface ModuleGateProps {
    module: string
    children: ReactNode
    fallback?: ReactNode
}

export function ModuleGate({ module, children, fallback }: ModuleGateProps) {
    const { canAccess, isLoading } = usePermissions()

    if (isLoading) {
        return null
    }

    if (!canAccess(module)) {
        return fallback ? <>{fallback}</> : null
    }

    return <>{children}</>
}

export default PermissionContext
