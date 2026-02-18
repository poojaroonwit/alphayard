'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { authService, AuthUser } from '../services/authService'

interface AuthContextType {
    user: AuthUser | null
    token: string | null
    isAuthenticated: boolean
    isLoading: boolean
    login: (email: string, password: string) => Promise<void>
    logout: () => Promise<void>
    hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
    children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Initialize auth state from localStorage
    useEffect(() => {
        const storedToken = authService.getToken()
        const storedUser = authService.getUser()

        if (storedToken && storedUser) {
            setToken(storedToken)
            setUser(storedUser)
        }

        setIsLoading(false)
    }, [])

    const login = useCallback(async (email: string, password: string) => {
        setIsLoading(true)
        try {
            const response = await authService.login({ email, password })
            setToken(response.token)
            setUser(response.user)
        } finally {
            setIsLoading(false)
        }
    }, [])

    const logout = useCallback(async () => {
        setIsLoading(true)
        try {
            await authService.logout()
            setToken(null)
            setUser(null)
        } finally {
            setIsLoading(false)
        }
    }, [])

    const hasPermission = useCallback((permission: string): boolean => {
        if (!user || !user.permissions) return false

        // Super admins have all permissions
        if (user.permissions.includes('*')) return true

        // Check for specific permission
        return user.permissions.includes(permission)
    }, [user])

    const value: AuthContextType = {
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        hasPermission
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export default AuthContext
