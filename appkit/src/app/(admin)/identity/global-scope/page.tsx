'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../../../components/ui'
import { Badge } from '../../../../components/ui'
import { Button } from '../../../../components/ui'
import { useToast } from '@/hooks/use-toast'
import { 
  GlobeAltIcon, 
  ShieldCheckIcon,
  UsersIcon,
  KeyIcon,
  BuildingOfficeIcon,
  CogIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

interface GlobalScopeConfig {
  id: string
  name: string
  description: string
  enabled: boolean
  settings: {
    allowCrossDomainAuth: boolean
    defaultSessionTimeout: number
    maxConcurrentSessions: number
    passwordPolicy: {
      minLength: number
      requireUppercase: boolean
      requireLowercase: boolean
      requireNumbers: boolean
      requireSpecialChars: boolean
    }
    mfaPolicy: {
      enabled: boolean
      requiredForAdmins: boolean
      requiredForUsers: boolean
      allowedMethods: string[]
    }
    ipWhitelist: string[]
    allowedOrigins: string[]
    sessionSettings: {
      secureCookies: boolean
      sameSite: 'strict' | 'lax' | 'none'
      httpOnly: boolean
    }
  }
  createdAt: string
  updatedAt: string
}

export default function GlobalIdentityScopePage() {
  const [config, setConfig] = useState<GlobalScopeConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadGlobalScopeConfig()
  }, [])

  const loadGlobalScopeConfig = async () => {
    try {
      setLoading(true)
      // Mock data for now - in real implementation, this would call the API
      const mockConfig: GlobalScopeConfig = {
        id: 'global-scope-1',
        name: 'Global Identity Scope',
        description: 'Global identity configuration that applies across all applications',
        enabled: true,
        settings: {
          allowCrossDomainAuth: true,
          defaultSessionTimeout: 3600, // 1 hour
          maxConcurrentSessions: 5,
          passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: false
          },
          mfaPolicy: {
            enabled: true,
            requiredForAdmins: true,
            requiredForUsers: false,
            allowedMethods: ['totp', 'sms', 'authenticator']
          },
          ipWhitelist: ['127.0.0.1', '::1'],
          allowedOrigins: ['http://localhost:3000', 'https://appkit.example.com'],
          sessionSettings: {
            secureCookies: true,
            sameSite: 'strict',
            httpOnly: true
          }
        },
        createdAt: '2024-02-24T10:30:00Z',
        updatedAt: '2024-02-24T10:30:00Z'
      }
      
      setConfig(mockConfig)
    } catch (err: any) {
      console.error('Failed to load global scope configuration:', err)
      setError('Failed to load global scope configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!config) return

    setSaving(true)
    setError('')

    try {
      // Mock save - in real implementation, this would call the API
      const updatedConfig: GlobalScopeConfig = {
        ...config,
        updatedAt: new Date().toISOString()
      }
      
      setConfig(updatedConfig)
      setIsEditing(false)
      
      toast({
        title: 'Success',
        description: 'Global identity scope configuration saved successfully'
      })
    } catch (err: any) {
      console.error('Failed to save global scope configuration:', err)
      setError('Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleEnabled = async () => {
    if (!config) return

    try {
      const updatedConfig: GlobalScopeConfig = {
        ...config,
        enabled: !config.enabled,
        updatedAt: new Date().toISOString()
      }
      
      setConfig(updatedConfig)
      
      toast({
        title: 'Success',
        description: `Global identity scope ${updatedConfig.enabled ? 'enabled' : 'disabled'}`
      })
    } catch (err: any) {
      console.error('Failed to toggle global scope:', err)
      setError('Failed to toggle global scope')
    }
  }

  const getStatusBadge = (enabled: boolean) => {
    return enabled 
      ? <Badge className="bg-green-100 text-green-700">Enabled</Badge>
      : <Badge className="bg-gray-100 text-gray-700">Disabled</Badge>
  }

  const getStatusIcon = (enabled: boolean) => {
    return enabled 
      ? <CheckCircleIcon className="w-5 h-5 text-green-500" />
      : <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <GlobeAltIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Global Identity Scope</h3>
          <p className="text-gray-500">Loading configuration...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2 uppercase tracking-tight">
            <GlobeAltIcon className="w-6 h-6 text-blue-600" />
            Global Identity Scope
          </h1>
          <p className="text-gray-500 text-xs mt-1">Configure global identity settings that apply across all applications.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleToggleEnabled}
            variant={config.enabled ? "outline" : "primary"}
            className={config.enabled ? "border-gray-300 text-gray-700" : ""}
          >
            {config.enabled ? 'Disable' : 'Enable'}
          </Button>
          <Button
            onClick={() => setIsEditing(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <CogIcon className="w-4 h-4" />
            Edit Configuration
          </Button>
        </div>
      </div>

      {/* Status Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon(config.enabled)}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Global Identity Scope Status
                </h3>
                <p className="text-sm text-gray-500">
                  {config.enabled 
                    ? 'Global identity scope is active and enforcing policies across all applications'
                    : 'Global identity scope is disabled - applications use individual settings'
                  }
                </p>
              </div>
            </div>
            {getStatusBadge(config.enabled)}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Details */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Details</CardTitle>
          <CardDescription>
            Review and modify global identity settings that affect all applications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Settings */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
              <BuildingOfficeIcon className="w-5 h-5 text-gray-500" />
              Basic Settings
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="scope-name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  id="scope-name"
                  type="text"
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!isEditing}
                  placeholder="Enter scope name"
                  title="Global identity scope name"
                  aria-label="Global identity scope name"
                />
              </div>
              <div>
                <label htmlFor="scope-description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  id="scope-description"
                  value={config.description}
                  onChange={(e) => setConfig({ ...config, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!isEditing}
                  rows={3}
                  placeholder="Enter scope description"
                  title="Description of the global identity scope"
                  aria-label="Description of the global identity scope"
                />
              </div>
            </div>
          </div>

          {/* Authentication Settings */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
              <ShieldCheckIcon className="w-5 h-5 text-gray-500" />
              Authentication Settings
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Cross-Domain Authentication</label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setConfig({
                      ...config,
                      settings: {
                        ...config.settings,
                        allowCrossDomainAuth: !config.settings.allowCrossDomainAuth
                      }
                    })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      config.settings.allowCrossDomainAuth
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                    role="switch"
                    aria-checked={config.settings.allowCrossDomainAuth ? 'true' : 'false'}
                    aria-label="Cross-Domain Authentication"
                    title="Toggle cross-domain authentication"
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full ${
                        config.settings.allowCrossDomainAuth
                          ? 'bg-white translate-x-[-1px]'
                          : 'bg-gray-300 translate-x-[1px]'
                      }`}
                    />
                  </button>
                  <span className="text-sm text-gray-600">
                    {config.settings.allowCrossDomainAuth ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <label htmlFor="session-timeout" className="text-sm font-medium text-gray-700">Default Session Timeout</label>
                <div className="flex items-center space-x-2">
                  <input
                    id="session-timeout"
                    type="number"
                    min={300}
                    max={86400}
                    value={config.settings.defaultSessionTimeout}
                    onChange={(e) => setConfig({
                      ...config,
                      settings: {
                        ...config.settings,
                        defaultSessionTimeout: parseInt(e.target.value)
                      }
                    })}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!isEditing}
                    placeholder="300"
                    title="Default session timeout in seconds"
                    aria-label="Default session timeout in seconds"
                  />
                  <span className="text-sm text-gray-600">seconds</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Max Concurrent Sessions</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={config.settings.maxConcurrentSessions}
                    onChange={(e) => setConfig({
                      ...config,
                      settings: {
                        ...config.settings,
                        maxConcurrentSessions: parseInt(e.target.value)
                      }
                    })}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!isEditing}
                  />
                  <span className="text-sm text-gray-600">sessions</span>
                </div>
              </div>
            </div>
          </div>

          {/* Password Policy */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
              <KeyIcon className="w-5 h-5 text-gray-500" />
              Password Policy
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Minimum Length</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min={4}
                    max={128}
                    value={config.settings.passwordPolicy.minLength}
                    onChange={(e) => setConfig({
                      ...config,
                      settings: {
                        ...config.settings,
                        passwordPolicy: {
                          ...config.settings.passwordPolicy,
                          minLength: parseInt(e.target.value)
                        }
                      }
                    })}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!isEditing}
                  />
                  <span className="text-sm text-gray-600">characters</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Require Uppercase</label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setConfig({
                      ...config,
                      settings: {
                        ...config.settings,
                        passwordPolicy: {
                          ...config.settings.passwordPolicy,
                          requireUppercase: !config.settings.passwordPolicy.requireUppercase
                        }
                      }
                    })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      config.settings.passwordPolicy.requireUppercase
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full ${
                        config.settings.passwordPolicy.requireUppercase
                          ? 'bg-white'
                          : 'bg-gray-300'
                      }`}
                      style={{
                        transform: config.settings.passwordPolicy.requireUppercase ? 'translateX(-1px)' : 'translateX(1px)'
                      }}
                    />
                  </button>
                  <span className="text-sm text-gray-600">
                    {config.settings.passwordPolicy.requireUppercase ? 'Required' : 'Not Required'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Require Lowercase</label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setConfig({
                      ...config,
                      settings: {
                        ...config.settings,
                        passwordPolicy: {
                          ...config.settings.passwordPolicy,
                          requireLowercase: !config.settings.passwordPolicy.requireLowercase
                        }
                      }
                    })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      config.settings.passwordPolicy.requireLowercase
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full ${
                        config.settings.passwordPolicy.requireLowercase
                          ? 'bg-white'
                          : 'bg-gray-300'
                      }`}
                      style={{
                        transform: config.settings.passwordPolicy.requireLowercase ? 'translateX(-1px)' : 'translateX(1px)'
                      }}
                    />
                  </button>
                  <span className="text-sm text-gray-600">
                    {config.settings.passwordPolicy.requireLowercase ? 'Required' : 'Not Required'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Require Numbers</label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setConfig({
                      ...config,
                      settings: {
                        ...config.settings,
                        passwordPolicy: {
                          ...config.settings.passwordPolicy,
                          requireNumbers: !config.settings.passwordPolicy.requireNumbers
                        }
                      }
                    })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      config.settings.passwordPolicy.requireNumbers
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full ${
                        config.settings.passwordPolicy.requireNumbers
                          ? 'bg-white'
                          : 'bg-gray-300'
                      }`}
                      style={{
                        transform: config.settings.passwordPolicy.requireNumbers ? 'translateX(-1px)' : 'translateX(1px)'
                      }}
                    />
                  </button>
                  <span className="text-sm text-gray-600">
                    {config.settings.passwordPolicy.requireNumbers ? 'Required' : 'Not Required'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Require Special Characters</label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setConfig({
                      ...config,
                      settings: {
                        ...config.settings,
                        passwordPolicy: {
                          ...config.settings.passwordPolicy,
                          requireSpecialChars: !config.settings.passwordPolicy.requireSpecialChars
                        }
                      }
                    })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      config.settings.passwordPolicy.requireSpecialChars
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full ${
                        config.settings.passwordPolicy.requireSpecialChars
                          ? 'bg-white'
                          : 'bg-gray-300'
                      }`}
                      style={{
                        transform: config.settings.passwordPolicy.requireSpecialChars ? 'translateX(-1px)' : 'translateX(1px)'
                      }}
                    />
                  </button>
                  <span className="text-sm text-gray-600">
                    {config.settings.passwordPolicy.requireSpecialChars ? 'Required' : 'Not Required'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* MFA Policy */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
              <ShieldCheckIcon className="w-5 h-5 text-gray-500" />
              MFA Policy
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Enable MFA</label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setConfig({
                      ...config,
                      settings: {
                        ...config.settings,
                        mfaPolicy: {
                          ...config.settings.mfaPolicy,
                          enabled: !config.settings.mfaPolicy.enabled
                        }
                      }
                    })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      config.settings.mfaPolicy.enabled
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full ${
                        config.settings.mfaPolicy.enabled
                          ? 'bg-white'
                          : 'bg-gray-300'
                      }`}
                      style={{
                        transform: config.settings.mfaPolicy.enabled ? 'translateX(-1px)' : 'translateX(1px)'
                      }}
                    />
                  </button>
                  <span className="text-sm text-gray-600">
                    {config.settings.mfaPolicy.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Required for Admins</label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setConfig({
                      ...config,
                      settings: {
                        ...config.settings,
                        mfaPolicy: {
                          ...config.settings.mfaPolicy,
                          requiredForAdmins: !config.settings.mfaPolicy.requiredForAdmins
                        }
                      }
                    })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      config.settings.mfaPolicy.requiredForAdmins
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full ${
                        config.settings.mfaPolicy.requiredForAdmins
                          ? 'bg-white'
                          : 'bg-gray-300'
                      }`}
                      style={{
                        transform: config.settings.mfaPolicy.requiredForAdmins ? 'translateX(-1px)' : 'translateX(1px)'
                      }}
                    />
                  </button>
                  <span className="text-sm text-gray-600">
                    {config.settings.mfaPolicy.requiredForAdmins ? 'Required' : 'Optional'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Required for Users</label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setConfig({
                      ...config,
                      settings: {
                        ...config.settings,
                        mfaPolicy: {
                          ...config.settings.mfaPolicy,
                          requiredForUsers: !config.settings.mfaPolicy.requiredForUsers
                        }
                      }
                    })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      config.settings.mfaPolicy.requiredForUsers
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full ${
                        config.settings.mfaPolicy.requiredForUsers
                          ? 'bg-white'
                          : 'bg-gray-300'
                      }`}
                      style={{
                        transform: config.settings.mfaPolicy.requiredForUsers ? 'translateX(-1px)' : 'translateX(1px)'
                      }}
                    />
                  </button>
                  <span className="text-sm text-gray-600">
                    {config.settings.mfaPolicy.requiredForUsers ? 'Required' : 'Optional'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Allowed Methods</label>
                <div className="flex flex-wrap gap-2">
                  {['totp', 'sms', 'authenticator'].map(method => (
                    <span
                      key={method}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        config.settings.mfaPolicy.allowedMethods.includes(method)
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {method.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
              <InformationCircleIcon className="w-5 h-5 text-gray-500" />
              Security Settings
            </h4>
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">IP Whitelist</label>
                <textarea
                  value={config.settings.ipWhitelist.join('\n')}
                  onChange={(e) => setConfig({
                    ...config,
                    settings: {
                      ...config.settings,
                      ipWhitelist: e.target.value.split('\n').filter(ip => ip.trim())
                    }
                  })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="127.0.0.1&#10;::1"
                  disabled={!isEditing}
                />
                <p className="text-xs text-gray-500">
                  Enter one IP address per line. Only whitelisted IPs can access the identity system.
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Allowed Origins</label>
                <textarea
                  value={config.settings.allowedOrigins.join('\n')}
                  onChange={(e) => setConfig({
                    ...config,
                    settings: {
                      ...config.settings,
                      allowedOrigins: e.target.value.split('\n').filter(origin => origin.trim())
                    }
                  })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="http://localhost:3000"
                  disabled={!isEditing}
                />
                <p className="text-xs text-gray-500">
                  Enter one origin per line. Only allowed origins can make cross-origin requests.
                </p>
              </div>
            </div>
          </div>

          {/* Session Settings */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
              <CogIcon className="w-5 h-5 text-gray-500" />
              Session Settings
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Secure Cookies</label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setConfig({
                      ...config,
                      settings: {
                        ...config.settings,
                        sessionSettings: {
                          ...config.settings.sessionSettings,
                          secureCookies: !config.settings.sessionSettings.secureCookies
                        }
                      }
                    })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      config.settings.sessionSettings.secureCookies
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full ${
                        config.settings.sessionSettings.secureCookies
                          ? 'bg-white'
                          : 'bg-gray-300'
                      }`}
                      style={{
                        transform: config.settings.sessionSettings.secureCookies ? 'translateX(-1px)' : 'translateX(1px)'
                      }}
                    />
                  </button>
                  <span className="text-sm text-gray-600">
                    {config.settings.sessionSettings.secureCookies ? 'Secure' : 'Standard'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">SameSite Policy</label>
                <select
                  value={config.settings.sessionSettings.sameSite}
                  onChange={(e) => setConfig({
                    ...config,
                    settings: {
                      ...config.settings,
                      sessionSettings: {
                        ...config.settings.sessionSettings,
                        sameSite: e.target.value as 'strict' | 'lax' | 'none'
                      }
                    }
                  })}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!isEditing}
                >
                  <option value="strict">Strict</option>
                  <option value="lax">Lax</option>
                  <option value="none">None</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Http Only</label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setConfig({
                      ...config,
                      settings: {
                        ...config.settings,
                        sessionSettings: {
                          ...config.settings.sessionSettings,
                          httpOnly: !config.settings.sessionSettings.httpOnly
                        }
                      }
                    })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      config.settings.sessionSettings.httpOnly
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full ${
                        config.settings.sessionSettings.httpOnly
                          ? 'bg-white'
                          : 'bg-gray-300'
                      }`}
                      style={{
                        transform: config.settings.sessionSettings.httpOnly ? 'translateX(-1px)' : 'transformX(1px)'
                      }}
                    />
                  </button>
                  <span className="text-sm text-gray-600">
                    {config.settings.sessionSettings.httpOnly ? 'HTTP Only' : 'All Requests'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          {isEditing && (
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false)
                  setConfig(config) // Reset to original
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>About Global Identity Scope</CardTitle>
          <CardDescription>
            Understand how global identity settings affect your applications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3">
            <InformationCircleIcon className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Global vs Application Settings</h4>
              <p className="text-sm text-gray-600">
                Global identity settings override individual application settings. When enabled, these policies apply to all applications regardless of their individual configuration.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <UsersIcon className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <h4 className="h4 font-medium text-gray-900">Priority Order</h4>
              <p className="text-sm text-gray-600">
                Application settings take precedence over global settings, except for security-related policies which always use the global configuration.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <KeyIcon className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div>
              <h4 className="h4 font-medium text-gray-900">Security First</h4>
              <p className="text-sm text-gray-600">
                Password policies, MFA requirements, and security settings always use global configuration for maximum security.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
