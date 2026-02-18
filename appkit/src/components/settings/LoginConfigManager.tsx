'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useApp } from '../../contexts/AppContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Alert, AlertDescription } from '../ui/Alert'
import { 
  Settings, 
  RefreshCw, 
  Globe,
  Palette,
  Layout,
  User,
  Shield,
  Sparkles,
  Code,
  ChevronLeft
} from 'lucide-react'
import { LoginConfig, LoginConfigManagerProps } from './LoginConfigTypes'
import { LoginConfigTabs } from './LoginConfigTabs'
import { LoginConfigBranding } from './LoginConfigBranding'
import { LoginConfigBackground } from './LoginConfigBackground'
import { LoginConfigLayout } from './LoginConfigLayout'
import { LoginConfigForm } from './LoginConfigForm'
import { LoginConfigSecurity } from './LoginConfigSecurity'
import { LoginConfigAnimations } from './LoginConfigAnimations'
import { LoginConfigResponsive } from './LoginConfigResponsive'
import { PlatformConfigTabs } from './PlatformConfigTabs'
import { MobileDeviceTabs } from './MobileDeviceTabs'
import { DeviceConfigTabs } from './DeviceConfigTabs'
import { LoginConfigEmulator } from './LoginConfigEmulator'
import { LoginConfigAdvanced } from './LoginConfigAdvanced'
import { SignupConfigBranding } from './SignupConfigBranding'
import { SignupConfigForm } from './SignupConfigForm'
import { SignupConfigLayout } from './SignupConfigLayout'
import { DevGuideDrawer } from './DevGuideDrawer'
import { BookOpen } from 'lucide-react'

export function LoginConfigManager({ appId, onSave }: LoginConfigManagerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { applications } = useApp()
  const [selectedAppId, setSelectedAppId] = useState<string | null>(appId || null)
  const [config, setConfig] = useState<Partial<LoginConfig>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('branding')
  const [emulatorMode, setEmulatorMode] = useState<'login' | 'signup'>('login')
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile' | 'tablet'>('desktop')
  const [platformMode, setPlatformMode] = useState<'web-desktop' | 'web-mobile' | 'mobile-app'>('web-desktop')
  const [mobileDeviceMode, setMobileDeviceMode] = useState<'mobile' | 'tablet'>('mobile')
  const [isDevGuideOpen, setIsDevGuideOpen] = useState(false)

  useEffect(() => {
    if (selectedAppId) {
      loadConfig(selectedAppId)
    }
  }, [selectedAppId])

  useEffect(() => {
    if (appId) {
      setSelectedAppId(appId)
    }
  }, [appId])

  const loadConfig = async (id: string) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`/api/admin/applications/${id}/login-config`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      })
      const result = await response.json()
      if (result.success) {
        setConfig(result.data)
      } else {
        setError(result.message)
      }
    } catch (error) {
      setError('Failed to load configuration')
    } finally {
      setLoading(false)
    }
  }


  const handleSave = async () => {
    if (!selectedAppId) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`/api/admin/applications/${selectedAppId}/login-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(config)
      })

      const result = await response.json()
      if (result.success) {
        setSuccess('Configuration saved successfully!')
        onSave?.(config)
      } else {
        setError(result.message || 'Failed to save configuration')
      }
    } catch (error) {
      setError('Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!selectedAppId) return

    if (!confirm('Are you sure you want to reset to common configuration? This action cannot be undone.')) {
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`/api/admin/applications/${selectedAppId}/login-config/reset`, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      })

      const result = await response.json()
      if (result.success) {
        setConfig(result.data)
        setSuccess('Configuration reset to common successfully!')
      } else {
        setError(result.message || 'Failed to reset configuration')
      }
    } catch (error) {
      setError('Failed to reset configuration')
    } finally {
      setSaving(false)
    }
  }

  const handleClone = async (sourceAppId: string) => {
    if (!selectedAppId) return

    if (!confirm('Are you sure you want to clone configuration from another application? This will overwrite your current settings.')) {
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`/api/admin/applications/${selectedAppId}/login-config/clone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ sourceAppId })
      })

      const result = await response.json()
      if (result.success) {
        setConfig(result.data)
        setSuccess('Configuration cloned successfully!')
      } else {
        setError(result.message || 'Failed to clone configuration')
      }
    } catch (error) {
      setError('Failed to clone configuration')
    } finally {
      setSaving(false)
    }
  }

  // Helper to determine which config to display based on platform mode
  const getDisplayConfig = () => {
    if (platformMode === 'mobile-app') {
      const mobileApp = config.mobileApp || {} as any
      return {
        ...config,
        // Clear web-responsive configs to force fallback to merged root
        desktop: undefined,
        mobile: undefined,
        tablet: undefined, 
        branding: { ...config.branding, ...(mobileApp.branding || {}) },
        layout: { ...config.layout, ...(mobileApp.layout || {}) },
        form: { ...config.form, ...(mobileApp.form || {}) },
        background: { ...config.background, ...(mobileApp.background || {}) },
      } as unknown as LoginConfig
    }
    return config
  }

  const displayConfig = getDisplayConfig()

  const updateConfig = (section: keyof LoginConfig, field: string, value: any) => {
    setConfig(prev => {
      // Handle Mobile App overrides for specific sections
      if (platformMode === 'mobile-app' && ['branding', 'layout', 'form', 'background'].includes(section)) {
        const mobileApp = prev.mobileApp || {} as any
        const sectionConfig = mobileApp[section] || {}
        
        return {
          ...prev,
          mobileApp: {
            ...mobileApp,
            [section]: {
              ...sectionConfig,
              [field]: value
            }
          }
        }
      }

      // Default update logic for web platforms or non-override sections
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }
    })
  }


  const currentApp = applications?.find((app: any) => app.id === selectedAppId)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        {selectedAppId ? (
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-1 h-8 px-2" 
                onClick={() => router.push('/identity/login-config')}
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-2 text-gray-900 font-medium bg-blue-50 px-3 py-1 rounded-full">
                <Globe className="h-3.5 w-3.5 text-blue-600" />
                {currentApp?.name || 'Loading app...'}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReset} disabled={saving}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Reset
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <div className="w-px h-8 bg-gray-200 mx-1" />
              <Button variant="ghost" size="sm" onClick={() => setIsDevGuideOpen(true)} className="gap-2 font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                <BookOpen className="h-4 w-4" />
                Dev Guide
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Login Configuration</h1>
              <p className="text-gray-500">Configure login settings for your applications</p>
            </div>
            <Button 
                variant="outline" 
                className="gap-2 border-blue-200 text-blue-600 hover:bg-blue-50"
                onClick={() => window.location.href = '/dev-hub'}
            >
                <BookOpen className="h-4 w-4" />
                Go to Dev Hub
            </Button>
          </div>
        )}
      </div>

      {/* Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      {/* App Selector */}
      {!appId && (
        <Card>
          <CardHeader>
            <CardTitle>Select Application</CardTitle>
            <CardDescription>Choose an application to configure its login settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {applications?.map((app: any) => (
                <Card 
                  key={app.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow" 
                  onClick={() => router.push(`/identity/login-config/${app.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Globe className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{app.name}</h3>
                        <p className="text-sm text-gray-500">{app.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Tabs */}
      {selectedAppId && (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
          {/* Configuration Panel */}
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="sticky top-0 bg-white z-10 pb-4">
              <PlatformConfigTabs 
                activePlatform={platformMode} 
                onPlatformChange={setPlatformMode}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
              
              {/* Device-specific tabs */}
              {(platformMode === 'web-desktop' || platformMode === 'web-mobile') && config.responsive?.enableResponsiveConfig && (
                <DeviceConfigTabs 
                  activeDevice={deviceMode} 
                  onDeviceChange={setDeviceMode}
                  enableResponsive={config.responsive?.enableResponsiveConfig}
                />
              )}
              
              {platformMode === 'mobile-app' && config.mobile?.responsive?.enableResponsiveConfig && (
                <MobileDeviceTabs 
                  activeDevice={mobileDeviceMode} 
                  onDeviceChange={setMobileDeviceMode}
                  enableResponsive={config.mobile?.responsive?.enableResponsiveConfig}
                />
              )}
            </div>
            
            {/* Common Configuration */}
            {platformMode === 'web-desktop' && (
              <>
                {activeTab === 'branding' && (
                  <LoginConfigBranding config={displayConfig} updateConfig={updateConfig} />
                )}
                
                {activeTab === 'background' && (
                  <LoginConfigBackground config={displayConfig} updateConfig={updateConfig} />
                )}
                
                {activeTab === 'layout' && (
                  <LoginConfigLayout config={displayConfig} updateConfig={updateConfig} />
                )}
                
                {activeTab === 'form' && (
                  <LoginConfigForm config={displayConfig} updateConfig={updateConfig} />
                )}
                
                {activeTab === 'security' && (
                  <LoginConfigSecurity config={displayConfig} updateConfig={updateConfig} />
                )}
                
                {activeTab === 'animations' && (
                  <LoginConfigAnimations config={displayConfig} updateConfig={updateConfig} />
                )}

                {activeTab === 'responsive-config' && (
                  <LoginConfigResponsive config={config} updateConfig={updateConfig} />
                )}
                
                {activeTab === 'advanced' && (
                  <LoginConfigAdvanced config={config} updateConfig={updateConfig} />
                )}

                {activeTab === 'signup' && (
                  <div className="space-y-6">
                    <SignupConfigBranding config={config} updateConfig={updateConfig} />
                    <SignupConfigForm config={config} updateConfig={updateConfig} />
                    <SignupConfigLayout config={config} updateConfig={updateConfig} />
                  </div>
                )}
              </>
            )}
            
            {/* Web Mobile Configuration */}
            {platformMode === 'web-mobile' && (
              <>
                {activeTab === 'branding' && (
                  <LoginConfigBranding config={displayConfig} updateConfig={updateConfig} />
                )}
                
                {activeTab === 'background' && (
                  <LoginConfigBackground config={displayConfig} updateConfig={updateConfig} />
                )}
                
                {activeTab === 'layout' && (
                  <LoginConfigLayout config={displayConfig} updateConfig={updateConfig} />
                )}
                
                {activeTab === 'form' && (
                  <LoginConfigForm config={displayConfig} updateConfig={updateConfig} />
                )}
                
                {activeTab === 'security' && (
                  <LoginConfigSecurity config={displayConfig} updateConfig={updateConfig} />
                )}
                
                {activeTab === 'animations' && (
                  <LoginConfigAnimations config={displayConfig} updateConfig={updateConfig} />
                )}

                {activeTab === 'responsive-config' && (
                  <LoginConfigResponsive config={config} updateConfig={updateConfig} />
                )}
                
                {activeTab === 'advanced' && (
                  <LoginConfigAdvanced config={config} updateConfig={updateConfig} />
                )}

                {activeTab === 'signup' && (
                  <div className="space-y-6">
                    <SignupConfigBranding config={config} updateConfig={updateConfig} />
                    <SignupConfigForm config={config} updateConfig={updateConfig} />
                    <SignupConfigLayout config={config} updateConfig={updateConfig} />
                  </div>
                )}
              </>
            )}
            
            {/* Mobile App Configuration */}
            {platformMode === 'mobile-app' && (
              <>
                {activeTab === 'branding' && (
                  <LoginConfigBranding config={displayConfig} updateConfig={updateConfig} />
                )}
                
                {activeTab === 'background' && (
                  <LoginConfigBackground config={displayConfig} updateConfig={updateConfig} />
                )}
                
                {activeTab === 'layout' && (
                  <LoginConfigLayout config={displayConfig} updateConfig={updateConfig} />
                )}
                
                {activeTab === 'form' && (
                  <LoginConfigForm config={displayConfig} updateConfig={updateConfig} />
                )}
                
                {activeTab === 'security' && (
                  <LoginConfigSecurity config={displayConfig} updateConfig={updateConfig} />
                )}
                
                {activeTab === 'animations' && (
                  <LoginConfigAnimations config={displayConfig} updateConfig={updateConfig} />
                )}

                {activeTab === 'responsive-config' && (
                  <LoginConfigResponsive config={config} updateConfig={updateConfig} />
                )}
                
                {activeTab === 'advanced' && (
                  <LoginConfigAdvanced config={config} updateConfig={updateConfig} />
                )}

                {activeTab === 'signup' && (
                  <div className="space-y-6">
                    <SignupConfigBranding config={config} updateConfig={updateConfig} />
                    <SignupConfigForm config={config} updateConfig={updateConfig} />
                    <SignupConfigLayout config={config} updateConfig={updateConfig} />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Preview Panel */}
          <div className="lg:w-1/2 lg:sticky lg:top-0 lg:h-full">
            <LoginConfigEmulator
              config={displayConfig}
              emulatorMode={emulatorMode}
              platformMode={platformMode}
              deviceMode={platformMode === 'mobile-app' ? mobileDeviceMode : deviceMode}
              onEmulatorModeChange={setEmulatorMode}
              onDeviceModeChange={(mode) => {
                if (platformMode === 'mobile-app') {
                  if (mode !== 'desktop') {
                    setMobileDeviceMode(mode)
                  }
                } else {
                  setDeviceMode(mode)
                }
              }}
            />
          </div>
        </div>
      )}
      <DevGuideDrawer 
        isOpen={isDevGuideOpen} 
        onClose={() => setIsDevGuideOpen(false)} 
      />
    </div>
  )
}
