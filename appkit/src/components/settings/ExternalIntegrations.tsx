'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Input } from '../ui/Input'
import { Label } from '../ui/Label'
import { Switch } from '../ui/switch'
import { 
  Plus, 
  Trash2, 
  Edit, 
  TestTube, 
  Copy, 
  Check,
  AlertCircle,
  Zap,
  BarChart,
  Settings,
  Activity,
  Globe,
  Database,
  Shield
} from 'lucide-react'

interface Integration {
  id: string
  name: string
  type: 'analytics' | 'marketing' | 'support' | 'custom'
  provider: string
  apiKey: string
  endpoint?: string
  events: string[]
  active: boolean
  settings: Record<string, any>
  createdAt: string
  lastSync?: string
  status: 'active' | 'inactive' | 'error'
}

interface ExternalIntegrationsProps {
  appId?: string
  onSave?: (integrations: Integration[]) => void
}

const AVAILABLE_INTEGRATIONS = [
  {
    id: 'mixpanel',
    name: 'Mixpanel',
    type: 'analytics' as const,
    description: 'Product analytics for web and mobile',
    icon: BarChart,
    color: 'bg-blue-500',
    requiredSettings: ['apiKey', 'token'],
    defaultEvents: ['user.signup', 'user.login', 'page.view', 'feature.used']
  },
  {
    id: 'segment',
    name: 'Segment',
    type: 'analytics' as const,
    description: 'Customer data platform',
    icon: Globe,
    color: 'bg-purple-500',
    requiredSettings: ['writeKey'],
    defaultEvents: ['user.signup', 'user.login', 'user.logout', 'page.view']
  },
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    type: 'analytics' as const,
    description: 'Web analytics and reporting',
    icon: BarChart,
    color: 'bg-green-500',
    requiredSettings: ['trackingId'],
    defaultEvents: ['page.view', 'user.signup', 'user.login']
  },
  {
    id: 'intercom',
    name: 'Intercom',
    type: 'support' as const,
    description: 'Customer messaging and support',
    icon: Shield,
    color: 'bg-indigo-500',
    requiredSettings: ['accessToken'],
    defaultEvents: ['user.signup', 'user.login', 'support.ticket.created']
  },
  {
    id: 'custom-webhook',
    name: 'Custom Webhook',
    type: 'custom' as const,
    description: 'Send data to your custom endpoint',
    icon: Zap,
    color: 'bg-gray-500',
    requiredSettings: ['endpoint', 'apiKey'],
    defaultEvents: ['user.signup', 'user.login', 'user.logout']
  }
]

const AVAILABLE_EVENTS = [
  { id: 'user.signup', label: 'User Signup', category: 'user' },
  { id: 'user.login', label: 'User Login', category: 'user' },
  { id: 'user.logout', label: 'User Logout', category: 'user' },
  { id: 'page.view', label: 'Page View', category: 'engagement' },
  { id: 'feature.used', label: 'Feature Used', category: 'engagement' },
  { id: 'support.ticket.created', label: 'Support Ticket Created', category: 'support' },
  { id: 'payment.completed', label: 'Payment Completed', category: 'business' },
  { id: 'subscription.created', label: 'Subscription Created', category: 'business' }
]

export function ExternalIntegrations({ appId, onSave }: ExternalIntegrationsProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null)
  const [testResults, setTestResults] = useState<Record<string, any>>({})
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('basic')
  const [selectedProvider, setSelectedProvider] = useState<string>('')

  // Form state for creating/editing integrations
  const [formData, setFormData] = useState({
    name: '',
    type: 'analytics' as 'analytics' | 'marketing' | 'support' | 'custom',
    provider: '',
    apiKey: '',
    endpoint: '',
    events: [] as string[],
    active: true,
    settings: {} as Record<string, any>
  })

  useEffect(() => {
    // Load existing integrations
    loadIntegrations()
  }, [appId])

  const loadIntegrations = async () => {
    // Mock data - replace with actual API call
    const mockIntegrations: Integration[] = [
      {
        id: '1',
        name: 'Production Analytics',
        type: 'analytics',
        provider: 'mixpanel',
        apiKey: 'mp_prod_1234567890abcdef',
        events: ['user.signup', 'user.login', 'page.view'],
        active: true,
        settings: { token: 'mixpanel_token', enableUserTracking: true },
        createdAt: '2024-01-15T10:30:00Z',
        lastSync: '2024-01-20T14:22:00Z',
        status: 'active'
      }
    ]
    setIntegrations(mockIntegrations)
  }

  const handleCreateIntegration = () => {
    setFormData({
      name: '',
      type: 'analytics',
      provider: '',
      apiKey: '',
      endpoint: '',
      events: [],
      active: true,
      settings: {}
    })
    setIsCreating(true)
    setEditingIntegration(null)
    setSelectedProvider('')
    setActiveTab('basic')
  }

  const handleEditIntegration = (integration: Integration) => {
    setFormData({
      name: integration.name,
      type: integration.type,
      provider: integration.provider,
      apiKey: integration.apiKey,
      endpoint: integration.endpoint || '',
      events: integration.events,
      active: integration.active,
      settings: integration.settings
    })
    setIsCreating(false)
    setEditingIntegration(integration)
    setSelectedProvider(integration.provider)
    setActiveTab('basic')
  }

  const handleProviderSelect = (providerId: string) => {
    const provider = AVAILABLE_INTEGRATIONS.find(p => p.id === providerId)
    if (provider) {
      setSelectedProvider(providerId)
      setFormData(prev => ({
        ...prev,
        provider: providerId,
        name: provider.name,
        type: provider.type,
        events: provider.defaultEvents,
        settings: {}
      }))
    }
  }

  const handleSaveIntegration = () => {
    if (!formData.name || !formData.provider || !formData.apiKey) {
      alert('Please fill in all required fields')
      return
    }

    const integrationData: Integration = {
      id: editingIntegration?.id || Date.now().toString(),
      ...formData,
      createdAt: editingIntegration?.createdAt || new Date().toISOString(),
      status: formData.active ? 'active' : 'inactive'
    }

    if (editingIntegration) {
      setIntegrations(prev => prev.map(i => i.id === editingIntegration.id ? integrationData : i))
    } else {
      setIntegrations(prev => [...prev, integrationData])
    }

    setIsCreating(false)
    setEditingIntegration(null)
    onSave?.(integrations)
  }

  const handleDeleteIntegration = (id: string) => {
    if (confirm('Are you sure you want to delete this integration?')) {
      setIntegrations(prev => prev.filter(i => i.id !== id))
    }
  }

  const handleToggleIntegration = (id: string) => {
    setIntegrations(prev => prev.map(i => 
      i.id === id ? { ...i, active: !i.active, status: !i.active ? 'active' : 'inactive' } : i
    ))
  }

  const handleTestIntegration = async (integration: Integration) => {
    setTestResults(prev => ({ ...prev, [integration.id]: { loading: true } }))
    
    try {
      // Mock test - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setTestResults(prev => ({
        ...prev,
        [integration.id]: {
          loading: false,
          success: true,
          message: 'Integration test successful',
          timestamp: new Date().toISOString()
        }
      }))
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [integration.id]: {
          loading: false,
          success: false,
          message: 'Integration test failed: Invalid API key',
          timestamp: new Date().toISOString()
        }
      }))
    }
  }

  const handleCopyKey = (key: string, integrationId: string) => {
    navigator.clipboard.writeText(key)
    setCopiedKey(integrationId)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleEventToggle = (eventId: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter(e => e !== eventId)
        : [...prev.events, eventId]
    }))
  }

  const handleSettingChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      settings: { ...prev.settings, [key]: value }
    }))
  }

  const TabButton = ({ id, label, isActive }: { id: string; label: string; isActive: boolean }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        isActive 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  )

  const selectedProviderData = AVAILABLE_INTEGRATIONS.find(p => p.id === selectedProvider)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">External Integrations</h3>
          <Badge variant="outline">{integrations.length} integrations</Badge>
        </div>
        <Button onClick={handleCreateIntegration} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Integration
        </Button>
      </div>

      {/* Integration List */}
      <div className="space-y-4">
        {integrations.map((integration) => {
          const providerData = AVAILABLE_INTEGRATIONS.find(p => p.id === integration.provider)
          const Icon = providerData?.icon || Zap
          
          return (
            <Card key={integration.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 rounded-lg ${providerData?.color || 'bg-gray-500'} flex items-center justify-center`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="font-medium">{integration.name}</h4>
                    <Badge variant={integration.active ? 'default' : 'outline'}>
                      {integration.status}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {integration.type}
                    </Badge>
                    {integration.lastSync && (
                      <span className="text-xs text-gray-500">
                        Last sync: {new Date(integration.lastSync).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Provider:</span>
                      <span>{providerData?.name || integration.provider}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Events:</span>
                      <div className="flex gap-1 flex-wrap">
                        {integration.events.slice(0, 3).map(event => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {AVAILABLE_EVENTS.find(e => e.id === event)?.label || event}
                          </Badge>
                        ))}
                        {integration.events.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{integration.events.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleIntegration(integration.id)}
                  >
                    {integration.active ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestIntegration(integration)}
                    disabled={testResults[integration.id]?.loading}
                  >
                    <TestTube className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditIntegration(integration)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteIntegration(integration.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Test Result */}
              {testResults[integration.id] && (
                <div className={`mt-3 p-2 rounded text-sm ${
                  testResults[integration.id].success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {testResults[integration.id].message}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Create/Edit Integration Modal */}
      {(isCreating || editingIntegration) && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {isCreating ? 'Add Integration' : 'Edit Integration'}
          </h3>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6">
            <TabButton id="basic" label="Basic" isActive={activeTab === 'basic'} />
            <TabButton id="events" label="Events" isActive={activeTab === 'events'} />
            <TabButton id="settings" label="Settings" isActive={activeTab === 'settings'} />
          </div>

          {/* Basic Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              {!editingIntegration && (
                <div>
                  <Label>Choose Integration Type</Label>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    {AVAILABLE_INTEGRATIONS.map((provider) => {
                      const Icon = provider.icon
                      return (
                        <button
                          key={provider.id}
                          onClick={() => handleProviderSelect(provider.id)}
                          className={`p-3 border rounded-lg text-left transition-colors ${
                            selectedProvider === provider.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-6 h-6 rounded ${provider.color} flex items-center justify-center`}>
                              <Icon className="h-3 w-3 text-white" />
                            </div>
                            <span className="font-medium text-sm">{provider.name}</span>
                          </div>
                          <p className="text-xs text-gray-500">{provider.description}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="name">Integration Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Production Analytics"
                />
              </div>

              <div>
                <Label htmlFor="apiKey">API Key / Token</Label>
                <div className="flex gap-2">
                  <Input
                    id="apiKey"
                    type="password"
                    value={formData.apiKey}
                    onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Enter your API key"
                  />
                  <Button
                    variant="outline"
                    onClick={() => handleCopyKey(formData.apiKey, editingIntegration?.id || 'new')}
                  >
                    {copiedKey === (editingIntegration?.id || 'new') ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {formData.type === 'custom' && (
                <div>
                  <Label htmlFor="endpoint">Webhook Endpoint</Label>
                  <Input
                    id="endpoint"
                    type="url"
                    value={formData.endpoint}
                    onChange={(e) => setFormData(prev => ({ ...prev, endpoint: e.target.value }))}
                    placeholder="https://your-api.com/webhooks"
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                />
                <Label htmlFor="active">Active</Label>
              </div>
            </div>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <div className="space-y-4">
              <div>
                <Label>Events to track</Label>
                <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                  {AVAILABLE_EVENTS.map((event) => (
                    <div key={event.id} className="flex items-start space-x-3 p-2 rounded hover:bg-gray-50">
                      <Switch
                        id={event.id}
                        checked={formData.events.includes(event.id)}
                        onCheckedChange={() => handleEventToggle(event.id)}
                      />
                      <div className="flex-1">
                        <Label htmlFor={event.id} className="font-medium">{event.label}</Label>
                        <p className="text-sm text-gray-500">Category: {event.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && selectedProviderData && (
            <div className="space-y-4">
              <div>
                <Label>Additional Settings</Label>
                <div className="mt-2 space-y-3">
                  {selectedProviderData.requiredSettings.map((setting) => (
                    <div key={setting}>
                      <Label htmlFor={setting}>
                        {setting.charAt(0).toUpperCase() + setting.slice(1)}
                      </Label>
                      <Input
                        id={setting}
                        value={formData.settings[setting] || ''}
                        onChange={(e) => handleSettingChange(setting, e.target.value)}
                        placeholder={`Enter ${setting}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreating(false)
                setEditingIntegration(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveIntegration} disabled={!selectedProvider && !editingIntegration}>
              {isCreating ? 'Add' : 'Update'} Integration
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
