'use client'

import React, { useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'

interface ProtectedRouteProps {
    children: ReactNode
    requiredPermission?: string
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    requiredPermission
}) => {
    const router = useRouter()
    const pathname = usePathname()
    const { isAuthenticated, isLoading, hasPermission } = useAuth()

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                // Redirect to login, preserving the intended destination
                router.push(`/login?redirect=${encodeURIComponent(pathname || '/')}`)
            } else if (requiredPermission && !hasPermission(requiredPermission)) {
                // User is authenticated but doesn't have permission
                router.push('/unauthorized')
            }
        }
    }, [isAuthenticated, isLoading, hasPermission, requiredPermission, router, pathname])

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    // Don't render children if not authenticated
    if (!isAuthenticated) {
        return null
    }

    // Don't render children if missing required permission
    if (requiredPermission && !hasPermission(requiredPermission)) {
        return null
    }

    return <>{children}</>
}

export default ProtectedRoute
