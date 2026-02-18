'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Monitor, Smartphone, Tablet, Eye } from 'lucide-react'
import { LoginEmulator } from './LoginEmulator'
import { SignupEmulator } from './SignupEmulator'
import { LoginConfig } from './LoginConfigTypes'

interface LoginConfigEmulatorProps {
  config: Partial<LoginConfig>
  emulatorMode: 'login' | 'signup'
  deviceMode: 'desktop' | 'mobile' | 'tablet'
  platformMode: 'web-desktop' | 'web-mobile' | 'mobile-app'
  onEmulatorModeChange: (mode: 'login' | 'signup') => void
  onDeviceModeChange: (mode: 'desktop' | 'mobile' | 'tablet') => void
}

// Get the native pixel width of the DeviceFrame for each platform/device combo
function getFrameWidth(platformMode: string, deviceMode: string): number {
  if (platformMode === 'web-desktop') return 1200
  if (platformMode === 'web-mobile') return 375 + 16 // frame padding
  if (platformMode === 'mobile-app') {
    if (deviceMode === 'tablet') return 768
    return 375
  }
  return 1200
}

export function LoginConfigEmulator({ 
  config, 
  emulatorMode, 
  deviceMode, 
  platformMode,
  onEmulatorModeChange, 
  onDeviceModeChange 
}: LoginConfigEmulatorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  const updateScale = useCallback(() => {
    if (!containerRef.current) return
    const availableWidth = containerRef.current.clientWidth - 32 // minus some padding
    const frameWidth = getFrameWidth(platformMode, deviceMode)
    const newScale = Math.min(1, availableWidth / frameWidth)
    setScale(newScale)
  }, [platformMode, deviceMode])

  useEffect(() => {
    updateScale()
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(() => updateScale())
    observer.observe(el)
    return () => observer.disconnect()
  }, [updateScale])
  
  return (
    <Card className="h-full border-l-0 rounded-l-none">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Live Preview
          </CardTitle>
          
          <div className="flex gap-4">
            {/* Device Mode Selector - conditional based on platform */}
            {platformMode === 'web-desktop' && (
              <div className="flex items-center gap-2">
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <Button
                    variant={deviceMode === 'desktop' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => onDeviceModeChange('desktop')}
                    className="h-8 w-8 p-0"
                    title="Desktop"
                  >
                    <Monitor className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={deviceMode === 'tablet' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => onDeviceModeChange('tablet')}
                    className="h-8 w-8 p-0"
                    title="Tablet"
                  >
                    <Tablet className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={deviceMode === 'mobile' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => onDeviceModeChange('mobile')}
                    className="h-8 w-8 p-0"
                    title="Mobile"
                  >
                    <Smartphone className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            {(platformMode === 'mobile-app' || platformMode === 'web-mobile') && (
              <div className="flex items-center gap-2">
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <Button
                    variant={deviceMode === 'mobile' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => onDeviceModeChange('mobile')}
                    className="h-8 w-8 p-0"
                    title="Mobile"
                  >
                    <Smartphone className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={deviceMode === 'tablet' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => onDeviceModeChange('tablet')}
                    className="h-8 w-8 p-0"
                    title="Tablet"
                  >
                    <Tablet className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Emulator Mode Selector */}
            <div className="flex items-center gap-2">
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <Button
                  variant={emulatorMode === 'login' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => onEmulatorModeChange('login')}
                  className="px-3 h-8"
                >
                  Login
                </Button>
                <Button
                  variant={emulatorMode === 'signup' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => onEmulatorModeChange('signup')}
                  className="px-3 h-8"
                >
                  Signup
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent 
        ref={containerRef} 
        className="p-0 bg-gray-50 h-[calc(100vh-280px)] overflow-auto"
      >
        <div 
          className="flex items-start justify-center p-4"
          style={{ minHeight: '100%' }}
        >
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
            }}
          >
            {emulatorMode === 'login' ? (
              <LoginEmulator 
                config={config} 
                deviceMode={deviceMode} 
                platformMode={platformMode}
              />
            ) : (
              <SignupEmulator 
                config={config} 
                deviceMode={deviceMode}
                platformMode={platformMode} 
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
