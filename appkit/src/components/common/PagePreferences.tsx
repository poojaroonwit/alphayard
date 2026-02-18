'use client'

import { useEffect, useState } from 'react'
import { Card, CardBody, CardHeader } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { LoadingSpinner } from '../ui/LoadingSpinner'

export function PagePreferences() {
  const [activeTab, setActiveTab] = useState<'homescreen'>('homescreen')
  const [bgType, setBgType] = useState<'color' | 'gradient' | 'image'>('color')
  const [bgColors, setBgColors] = useState<string[]>(['#ffffff'])
  const [bgImage, setBgImage] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string>('')
  const [selectedFileName, setSelectedFileName] = useState<string>('')

  const uploadEndpoint = () => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
    return base.replace(/\/api$/i, '') + '/api/v1/storage/upload'
  }

  const handleFilePicked = async (file: File) => {
    setSelectedFileName(file.name)
    const objUrl = URL.createObjectURL(file)
    setLocalPreviewUrl(objUrl)
    setBgType('image')
    setBgImage(objUrl)
    try {
      setUploading(true)
      const form = new FormData()
      form.append('file', file)
      // Optional: mark as shared/public
      form.append('isShared', 'true')

      const token = localStorage.getItem('admin_token') || ''
      const res = await fetch(uploadEndpoint(), {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: form
      })
      if (!res.ok) throw new Error('Upload failed')
      const json = await res.json()
      const uploaded = json.file || json.data || json
      const url = uploaded?.public_url || uploaded?.url || uploaded?.path || ''
      if (url) {
        setBgImage(url)
      }
    } catch (e) {
      alert('Image upload failed. Using local preview only.')
    } finally {
      setUploading(false)
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const svc = (await import('../../services/adminService')).adminService
        const res = await svc.getApplicationSettings()
        const draft = res.settings?.find((s: any) => s.setting_key === 'homescreen.background.draft')
        const published = res.settings?.find((s: any) => s.setting_key === 'homescreen.background.public')
        const found = draft?.setting_value || published?.setting_value || res.settings?.find((s: any) => s.setting_key === 'homescreen.background')?.setting_value
        if (found) {
          const v = found
          setBgType(v.type || 'color')
          setBgColors(Array.isArray(v.colors) && v.colors.length ? v.colors.slice(0, 3) : ['#ffffff'])
          setBgImage(v.imageUrl || '')
        }
      } catch (e) {
        // ignore
      }
    })()
  }, [])

  return (
    <div className="grid grid-cols-12 gap-6 animate-fade-in">
      {/* Secondary Sidebar */}
      <aside className="col-span-12 lg:col-span-3">
        <Card variant="frosted">
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-700">Pages</h3>
          </CardHeader>
          <CardBody className="p-2">
            <nav>
              <button
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'homescreen'
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'hover:bg-gray-50 text-gray-600 hover:text-gray-900'
                  }`}
                onClick={() => setActiveTab('homescreen')}
              >
                Homescreen
              </button>
            </nav>
          </CardBody>
        </Card>
      </aside>

      {/* Content */}
      <section className="col-span-12 lg:col-span-9 space-y-6">
        {activeTab === 'homescreen' && (
          <Card variant="frosted">
            <CardHeader>
              <h3 className="text-base font-semibold text-gray-900">Homescreen Background</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Type</label>
                  <div className="flex gap-4">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="bgType"
                        value="color"
                        checked={bgType === 'color'}
                        onChange={() => setBgType('color')}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Color</span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="bgType"
                        value="gradient"
                        checked={bgType === 'gradient'}
                        onChange={() => setBgType('gradient')}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">2–3 Color Gradient</span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="bgType"
                        value="image"
                        checked={bgType === 'image'}
                        onChange={() => setBgType('image')}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Image</span>
                    </label>
                  </div>
                </div>

                {bgType === 'color' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="color"
                        value={bgColors[0] || '#ffffff'}
                        onChange={e => setBgColors([e.target.value])}
                        className="h-10 w-12 p-0 border border-gray-300 rounded-lg cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={bgColors[0] || ''}
                        onChange={e => setBgColors([e.target.value])}
                        className="flex-1"
                      />
                    </div>
                  </div>
                )}

                {bgType === 'gradient' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Gradient Colors (2–3)</label>
                    <div className="space-y-3">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="flex gap-3 items-center">
                          <input
                            type="color"
                            value={bgColors[i] || '#ffffff'}
                            onChange={e => {
                              const next = [...bgColors]
                              next[i] = e.target.value
                              setBgColors(next.filter(Boolean).slice(0, 3))
                            }}
                            className="h-10 w-12 p-0 border border-gray-300 rounded-lg cursor-pointer"
                          />
                          <Input
                            type="text"
                            value={bgColors[i] || ''}
                            onChange={e => {
                              const next = [...bgColors]
                              next[i] = e.target.value
                              setBgColors(next.filter(Boolean).slice(0, 3))
                            }}
                            placeholder={i < 2 ? `Color ${i + 1} (required)` : 'Color 3 (optional)'}
                            className="flex-1"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {bgType === 'image' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                    <div className="space-y-3">
                      <Input
                        type="text"
                        value={bgImage}
                        onChange={e => setBgImage(e.target.value)}
                        placeholder="https://.../background.jpg"
                      />
                      <div className="flex items-center gap-3">
                        <input
                          id="bg-file-input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFilePicked(file)
                          }}
                        />
                        <Button
                          variant="secondary"
                          type="button"
                          onClick={() => document.getElementById('bg-file-input')?.click()}
                          disabled={uploading}
                        >
                          {uploading ? (
                            <>
                              <LoadingSpinner size="sm" className="mr-2" />
                              Uploading…
                            </>
                          ) : (
                            'Upload Image'
                          )}
                        </Button>
                        {selectedFileName && (
                          <span className="text-sm text-gray-600 truncate max-w-xs">{selectedFileName}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
                  <div className="relative rounded-lg overflow-hidden border border-gray-200/50 shadow-sm">
                    <div
                      className="h-40"
                      style={{
                        background: (
                          bgType === 'color'
                            ? (bgColors[0] || '#ffffff')
                            : bgType === 'gradient'
                              ? `linear-gradient(135deg, ${bgColors.filter(Boolean).slice(0, 3).join(', ')})`
                              : `url(${(localPreviewUrl || bgImage) || ''}) center/cover no-repeat`
                        )
                      }}
                    />
                    {showPreview && (
                      <div className="absolute inset-0 rounded-lg border-2 border-blue-400 pointer-events-none shadow-lg" />
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200/50">
                  <Button
                    variant="primary"
                    onClick={async () => {
                      try {
                        setSaving(true)
                        const svc = (await import('../../services/adminService')).adminService
                        await svc.upsertApplicationSetting({
                          setting_key: 'homescreen.background.draft',
                          setting_value: {
                            type: bgType,
                            colors: bgType === 'color' ? [bgColors[0]] : bgColors.filter(Boolean).slice(0, 3),
                            imageUrl: bgType === 'image' ? (bgImage || '') : undefined,
                          },
                          setting_type: 'json',
                          category: 'appearance',
                          description: 'Homescreen background configuration (draft)',
                          is_public: true,
                          is_editable: true,
                        })
                        alert('Draft saved.')
                      } catch (e) {
                        alert('Failed to save draft.')
                      } finally {
                        setSaving(false)
                      }
                    }}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Draft'}
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={async () => {
                      try {
                        setPublishing(true)
                        const value = {
                          type: bgType,
                          colors: bgType === 'color' ? [bgColors[0]] : bgColors.filter(Boolean).slice(0, 3),
                          imageUrl: bgType === 'image' ? (bgImage || '') : undefined,
                        }
                        const svc = (await import('../../services/adminService')).adminService
                        await svc.upsertApplicationSetting({
                          setting_key: 'homescreen.background.public',
                          setting_value: value,
                          setting_type: 'json',
                          category: 'appearance',
                          description: 'Homescreen background configuration (public)',
                          is_public: true,
                          is_editable: true,
                        })
                        alert('Published to public background.')
                      } catch (e) {
                        alert('Failed to publish background.')
                      } finally {
                        setPublishing(false)
                      }
                    }}
                    disabled={publishing}
                  >
                    {publishing ? 'Publishing...' : 'Publish'}
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? 'Hide Preview' : 'Preview Draft'}
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </section>
    </div>
  )
}


