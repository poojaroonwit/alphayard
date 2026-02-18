'use client'

import React from 'react'
import { AppProvider } from '../../contexts/AppContext'
import { AuthProvider } from '../../contexts/AuthContext'
import { Toaster } from '../ui/Toaster'
import { ThemeProvider } from './ThemeProvider'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          {children}
          <Toaster />
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
