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
  Webhook,
  Clock,
  Settings,
  Activity
} from 'lucide-react'

interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  secret: string
  active: boolean
  retryCount: number
  timeout: number
  headers: Record<string, string>
  createdAt: string
  lastTriggered?: string
  status: 'active' | 'inactive' | 'error'
}

interface WebhookConfigProps {
  appId?: string
  onSave?: (webhooks: Webhook[]) => void
}

const AVAILABLE_EVENTS = [
  { id: 'user.signup', label: 'User Signup', description: 'When a new user registers' },
  { id: 'user.login', label: 'User Login', description: 'When a user successfully logs in' },
  { id: 'user.logout', label: 'User Logout', description: 'When a user logs out' },
  { id: 'user.password.reset', label: 'Password Reset', description: 'When a user requests password reset' },
  { id: 'user.email.verified', label: 'Email Verified', description: 'When user email is verified' },
  { id: 'auth.failed', label: 'Authentication Failed', description: 'When login attempt fails' },
  { id: 'account.created', label: 'Account Created', description: 'When new account is created' },
  { id: 'account.deleted', label: 'Account Deleted', description: 'When user account is deleted' },
  { id: 'profile.updated', label: 'Profile Updated', description: 'When user updates profile' },
  { id: 'role.assigned', label: 'Role Assigned', description: 'When user role is changed' }
]

export function WebhookConfig({ appId, onSave }: WebhookConfigProps) {
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null)
  const [testResults, setTestResults] = useState<Record<string, any>>({})
  const [copiedSecret, setCopiedSecret] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('basic')

  // Form state for creating/editing webhooks
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [] as string[],
    secret: '',
    active: true,
    retryCount: 3,
    timeout: 10000,
    headers: {} as Record<string, string>
  })

  useEffect(() => {
    // Load existing webhooks
    loadWebhooks()
  }, [appId])

  const loadWebhooks = async () => {
    // Mock data - replace with actual API call
    const mockWebhooks: Webhook[] = [
      {
        id: '1',
        name: 'User Analytics',
        url: 'https://api.analytics.com/webhooks',
        events: ['user.signup', 'user.login', 'user.logout'],
        secret: 'whsec_1234567890abcdef',
        active: true,
        retryCount: 3,
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' },
        createdAt: '2024-01-15T10:30:00Z',
        lastTriggered: '2024-01-20T14:22:00Z',
        status: 'active'
      }
    ]
    setWebhooks(mockWebhooks)
  }

  const handleCreateWebhook = () => {
    setFormData({
      name: '',
      url: '',
      events: [],
      secret: `whsec_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      active: true,
      retryCount: 3,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    })
    setIsCreating(true)
    setEditingWebhook(null)
    setActiveTab('basic')
  }

  const handleEditWebhook = (webhook: Webhook) => {
    setFormData({
      name: webhook.name,
      url: webhook.url,
      events: webhook.events,
      secret: webhook.secret,
      active: webhook.active,
      retryCount: webhook.retryCount,
      timeout: webhook.timeout,
      headers: webhook.headers
    })
    setIsCreating(false)
    setEditingWebhook(webhook)
    setActiveTab('basic')
  }

  const handleSaveWebhook = () => {
    if (!formData.name || !formData.url || formData.events.length === 0) {
      alert('Please fill in all required fields')
      return
    }

    const webhookData: Webhook = {
      id: editingWebhook?.id || Date.now().toString(),
      ...formData,
      createdAt: editingWebhook?.createdAt || new Date().toISOString(),
      status: formData.active ? 'active' : 'inactive'
    }

    if (editingWebhook) {
      setWebhooks(prev => prev.map(w => w.id === editingWebhook.id ? webhookData : w))
    } else {
      setWebhooks(prev => [...prev, webhookData])
    }

    setIsCreating(false)
    setEditingWebhook(null)
    onSave?.(webhooks)
  }

  const handleDeleteWebhook = (id: string) => {
    if (confirm('Are you sure you want to delete this webhook?')) {
      setWebhooks(prev => prev.filter(w => w.id !== id))
    }
  }

  const handleToggleWebhook = (id: string) => {
    setWebhooks(prev => prev.map(w => 
      w.id === id ? { ...w, active: !w.active, status: !w.active ? 'active' : 'inactive' } : w
    ))
  }

  const handleTestWebhook = async (webhook: Webhook) => {
    setTestResults(prev => ({ ...prev, [webhook.id]: { loading: true } }))
    
    try {
      // Mock test - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setTestResults(prev => ({
        ...prev,
        [webhook.id]: {
          loading: false,
          success: true,
          message: 'Webhook test successful',
          timestamp: new Date().toISOString()
        }
      }))
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [webhook.id]: {
          loading: false,
          success: false,
          message: 'Webhook test failed: Connection timeout',
          timestamp: new Date().toISOString()
        }
      }))
    }
  }

  const handleCopySecret = (secret: string, webhookId: string) => {
    navigator.clipboard.writeText(secret)
    setCopiedSecret(webhookId)
    setTimeout(() => setCopiedSecret(null), 2000)
  }

  const handleEventToggle = (eventId: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter(e => e !== eventId)
        : [...prev.events, eventId]
    }))
  }

  const handleHeaderChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      headers: { ...prev.headers, [key]: value }
    }))
  }

  const addHeader = () => {
    const key = prompt('Enter header name:')
    if (key && !formData.headers[key]) {
      handleHeaderChange(key, '')
    }
  }

  const removeHeader = (key: string) => {
    setFormData(prev => {
      const newHeaders = { ...prev.headers }
      delete newHeaders[key]
      return { ...prev, headers: newHeaders }
    })
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Webhook className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Webhook Configuration</h3>
          <Badge variant="outline">{webhooks.length} webhooks</Badge>
        </div>
        <Button onClick={handleCreateWebhook} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Webhook
        </Button>
      </div>

      {/* Webhook List */}
      <div className="space-y-4">
        {webhooks.map((webhook) => (
          <Card key={webhook.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-medium">{webhook.name}</h4>
                  <Badge variant={webhook.active ? 'default' : 'outline'}>
                    {webhook.status}
                  </Badge>
                  {webhook.lastTriggered && (
                    <span className="text-xs text-gray-500">
                      Last triggered: {new Date(webhook.lastTriggered).toLocaleDateString()}
                    </span>
                  )}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">URL:</span>
                    <code className="bg-gray-100 px-2 py-1 rounded">{webhook.url}</code>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Events:</span>
                    <div className="flex gap-1 flex-wrap">
                      {webhook.events.map(event => (
                        <Badge key={event} variant="outline" className="text-xs">
                          {AVAILABLE_EVENTS.find(e => e.id === event)?.label || event}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleWebhook(webhook.id)}
                >
                  {webhook.active ? 'Disable' : 'Enable'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestWebhook(webhook)}
                  disabled={testResults[webhook.id]?.loading}
                >
                  <TestTube className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditWebhook(webhook)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteWebhook(webhook.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Test Result */}
            {testResults[webhook.id] && (
              <div className={`mt-3 p-2 rounded text-sm ${
                testResults[webhook.id].success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {testResults[webhook.id].message}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Create/Edit Webhook Modal */}
      {(isCreating || editingWebhook) && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {isCreating ? 'Create Webhook' : 'Edit Webhook'}
          </h3>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6">
            <TabButton id="basic" label="Basic" isActive={activeTab === 'basic'} />
            <TabButton id="events" label="Events" isActive={activeTab === 'events'} />
            <TabButton id="advanced" label="Advanced" isActive={activeTab === 'advanced'} />
          </div>

          {/* Basic Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Webhook Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., User Analytics"
                />
              </div>

              <div>
                <Label htmlFor="url">Endpoint URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://your-api.com/webhooks"
                />
              </div>

              <div>
                <Label htmlFor="secret">Signing Secret</Label>
                <div className="flex gap-2">
                  <Input
                    id="secret"
                    value={formData.secret}
                    onChange={(e) => setFormData(prev => ({ ...prev, secret: e.target.value }))}
                    placeholder="Auto-generated secret"
                  />
                  <Button
                    variant="outline"
                    onClick={() => handleCopySecret(formData.secret, editingWebhook?.id || 'new')}
                  >
                    {copiedSecret === (editingWebhook?.id || 'new') ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

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
                <Label>Events to trigger this webhook</Label>
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
                        <p className="text-sm text-gray-500">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Advanced Tab */}
          {activeTab === 'advanced' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="retryCount">Retry Count</Label>
                  <Input
                    id="retryCount"
                    type="number"
                    min="0"
                    max="10"
                    value={formData.retryCount}
                    onChange={(e) => setFormData(prev => ({ ...prev, retryCount: parseInt(e.target.value) || 0 }))}
                  />
                </div>

                <div>
                  <Label htmlFor="timeout">Timeout (ms)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    min="1000"
                    max="60000"
                    step="1000"
                    value={formData.timeout}
                    onChange={(e) => setFormData(prev => ({ ...prev, timeout: parseInt(e.target.value) || 10000 }))}
                  />
                </div>
              </div>

              <div>
                <Label>Custom Headers</Label>
                <div className="mt-2 space-y-2">
                  {Object.entries(formData.headers).map(([key, value]) => (
                    <div key={key} className="flex gap-2">
                      <Input
                        value={key}
                        disabled
                        className="flex-1"
                      />
                      <Input
                        value={value}
                        onChange={(e) => handleHeaderChange(key, e.target.value)}
                        placeholder="Header value"
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeHeader(key)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" onClick={addHeader} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Header
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreating(false)
                setEditingWebhook(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveWebhook}>
              {isCreating ? 'Create' : 'Update'} Webhook
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
