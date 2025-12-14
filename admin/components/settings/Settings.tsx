'use client'

import { useEffect, useState } from 'react'
import { AdminConsoleUsers } from '../users/AdminConsoleUsers'
import {
  CogIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
  PhotoIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { IntegrationsSettings } from './IntegrationsSettings'
import { settingsService, type BrandingSettings } from '../../services/settingsService'
import { Card, CardBody, CardHeader } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { LoadingSpinner } from '../ui/LoadingSpinner'

export function Settings() {
  const [activeSection, setActiveSection] = useState<'general' | 'branding' | 'admin-users' | 'integrations'>('branding')
  const [activeSubTab, setActiveSubTab] = useState<
    | 'integrations'
    | 'auth'
    | 'endpoints'
    | 'monitoring'
    | 'push'
    | 'storage'
    | 'analytics'
    | 'payments'
    | 'smtp'
    | 'localization'
    | 'security'
  >('integrations')
  const [branding, setBranding] = useState<BrandingSettings>({
    adminAppName: 'Bondarys Admin',
    mobileAppName: 'Bondarys Mobile',
    logoUrl: '',
    iconUrl: ''
  })
  const [savingBranding, setSavingBranding] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingIcon, setUploadingIcon] = useState(false)
  const [generatingAssets, setGeneratingAssets] = useState(false)
  const [generateStatus, setGenerateStatus] = useState<null | { ok: boolean; message: string }>(null)

  useEffect(() => {
    const load = async () => {
      const b = await settingsService.getBranding()
      if (b) setBranding(prev => ({ ...prev, ...b }))
    }
    load()
  }, [])

  const handleSaveBranding = async () => {
    try {
      setSavingBranding(true)
      const saved = await settingsService.saveBranding(branding)
      if (saved) setBranding(saved)
    } finally {
      setSavingBranding(false)
    }
  }

  const uploadFile = async (file: File, type: 'logo' | 'icon') => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${base}/api/settings/branding/${type}`, {
      method: 'POST',
      credentials: 'include',
      body: form
    })
    if (!res.ok) throw new Error('Upload failed')
    const data = await res.json()
    return data?.url as string
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <Card variant="frosted">
        <CardBody>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Settings</h2>
            <p className="text-sm text-gray-500">Configure your Bondarys CMS settings</p>
          </div>
        </CardBody>
      </Card>

      {/* Settings Navigation */}
      <Card variant="frosted">
        <CardBody className="p-0">
          <nav className="flex space-x-1 p-2" role="tablist" aria-label="Settings sections">
            {[
              { id: 'branding', label: 'Branding', icon: PhotoIcon },
              { id: 'general', label: 'General', icon: CogIcon },
              { id: 'integrations', label: 'Integrations', icon: Squares2X2Icon },
              { id: 'admin-users', label: 'Admin Users', icon: ShieldCheckIcon },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeSection === id
                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                role="tab"
                aria-selected={activeSection === id}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                {label}
              </button>
            ))}
          </nav>
        </CardBody>
      </Card>

      {/* Settings Content */}
      {activeSection === 'branding' && (
        <Card variant="frosted">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Branding</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-6">
              <Input
                label="Admin App Name"
                value={branding.adminAppName || ''}
                onChange={(e) => setBranding({ ...branding, adminAppName: e.target.value })}
              />
              <Input
                label="Mobile App Name"
                value={branding.mobileAppName || ''}
                onChange={(e) => setBranding({ ...branding, mobileAppName: e.target.value })}
              />

              <div>
                <Input
                  label="Logo URL"
                  type="url"
                  placeholder="https://..."
                  value={branding.logoUrl || ''}
                  onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
                />
                <div className="mt-3 flex items-center gap-3">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        try {
                          setUploadingLogo(true)
                          const url = await uploadFile(file, 'logo')
                          setBranding(b => ({ ...b, logoUrl: url }))
                        } finally {
                          setUploadingLogo(false)
                          e.currentTarget.value = ''
                        }
                      }}
                    />
                    <Button variant="secondary" size="sm" as="span">
                      {uploadingLogo ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Uploading...
                        </>
                      ) : (
                        'Upload Logo'
                      )}
                    </Button>
                  </label>
                  {branding.logoUrl && (
                    <img src={branding.logoUrl} alt="Logo preview" className="h-10 rounded-lg shadow-sm" />
                  )}
                </div>
              </div>

              <div>
                <Input
                  label="Icon URL"
                  type="url"
                  placeholder="https://..."
                  value={branding.iconUrl || ''}
                  onChange={(e) => setBranding({ ...branding, iconUrl: e.target.value })}
                />
                <div className="mt-3 flex items-center gap-3">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        try {
                          setUploadingIcon(true)
                          const url = await uploadFile(file, 'icon')
                          setBranding(b => ({ ...b, iconUrl: url }))
                        } finally {
                          setUploadingIcon(false)
                          e.currentTarget.value = ''
                        }
                      }}
                    />
                    <Button variant="secondary" size="sm" as="span">
                      {uploadingIcon ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Uploading...
                        </>
                      ) : (
                        'Upload Icon'
                      )}
                    </Button>
                  </label>
                  {branding.iconUrl && (
                    <img src={branding.iconUrl} alt="Icon preview" className="h-10 w-10 rounded-lg shadow-sm" />
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-gray-200/50">
                <Button
                  variant="primary"
                  onClick={handleSaveBranding}
                  disabled={savingBranding}
                >
                  {savingBranding ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save Branding'
                  )}
                </Button>
              </div>

              <div className="pt-4 border-t border-gray-200/50">
                <Button
                  variant="secondary"
                  onClick={async () => {
                    try {
                      setGeneratingAssets(true)
                      setGenerateStatus(null)
                      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
                      const res = await fetch(`${base}/api/settings/branding/generate-mobile-assets`, { method: 'POST', credentials: 'include' })
                      if (res.ok) {
                        setGenerateStatus({ ok: true, message: 'Mobile assets generated successfully' })
                      } else {
                        setGenerateStatus({ ok: false, message: 'Asset generation failed' })
                        console.error('Asset generation failed')
                      }
                    } finally {
                      setGeneratingAssets(false)
                    }
                  }}
                  disabled={generatingAssets}
                >
                  {generatingAssets ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="w-4 h-4 mr-2" aria-hidden="true" />
                      Generate Mobile Assets
                    </>
                  )}
                </Button>
                {generateStatus && (
                  <div className={`mt-3 text-sm ${generateStatus.ok ? 'text-green-600' : 'text-red-600'}`}>
                    {generateStatus.message}
                  </div>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {activeSection === 'general' && (
        <div className="space-y-6">
          <Card variant="frosted">
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">General Settings</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <Input label="Site Name" defaultValue="Bondarys CMS" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Site Description</label>
                  <textarea
                    className="macos-input w-full"
                    rows={3}
                    defaultValue="Family content management system"
                  />
                </div>
                <Input label="Admin Email" type="email" defaultValue="admin@bondarys.com" />
                <Button variant="primary">Save Settings</Button>
              </div>
            </CardBody>
          </Card>

          <Card variant="frosted">
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">System Configuration</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <Select
                  label="Default Language"
                  value="en"
                  onChange={() => { }}
                  options={[
                    { value: 'en', label: 'English' },
                    { value: 'es', label: 'Spanish' },
                    { value: 'fr', label: 'French' },
                    { value: 'de', label: 'German' }
                  ]}
                />
                <Select
                  label="Timezone"
                  value="UTC"
                  onChange={() => { }}
                  options={[
                    { value: 'UTC', label: 'UTC' },
                    { value: 'America/New_York', label: 'Eastern Time' },
                    { value: 'America/Los_Angeles', label: 'Pacific Time' },
                    { value: 'Europe/London', label: 'London' }
                  ]}
                />
                <Select
                  label="Date Format"
                  value="MM/DD/YYYY"
                  onChange={() => { }}
                  options={[
                    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }
                  ]}
                />
              </div>
            </CardBody>
          </Card>

          <Card variant="frosted">
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <Input label="Session Timeout (minutes)" type="number" defaultValue="30" min={5} max={480} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Password Requirements</label>
                  <div className="space-y-2">
                    {[
                      'Minimum 8 characters',
                      'Require uppercase letter',
                      'Require number',
                      'Require special character'
                    ].map((req, idx) => (
                      <label key={idx} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          defaultChecked={idx < 3}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{req}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <Button variant="primary">Save Security Settings</Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {activeSection === 'admin-users' && <AdminConsoleUsers />}

      {activeSection === 'integrations' && (
        <div className="space-y-6">
          <Card variant="frosted">
            <CardBody className="p-0">
              <nav className="flex flex-wrap gap-2 p-4" role="tablist">
                {[
                  { id: 'integrations', label: 'Branding & Legal' },
                  { id: 'analytics', label: 'Analytics' },
                  { id: 'push', label: 'Push' },
                  { id: 'smtp', label: 'SMTP' },
                  { id: 'auth', label: 'Auth' },
                  { id: 'endpoints', label: 'Links' },
                  { id: 'monitoring', label: 'Monitoring' },
                  { id: 'security', label: 'Security' },
                  { id: 'storage', label: 'Storage/CDN' },
                  { id: 'localization', label: 'Localization' },
                  { id: 'payments', label: 'Payments' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveSubTab(t.id as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeSubTab === (t.id as any)
                        ? 'bg-blue-50 text-blue-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    role="tab"
                    aria-selected={activeSubTab === (t.id as any)}
                  >
                    {t.label}
                  </button>
                ))}
              </nav>
            </CardBody>
          </Card>

          <IntegrationsSettings activeSub={activeSubTab} />
        </div>
      )}
    </div>
  )
}
