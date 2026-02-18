'use client'

import React, { useState } from 'react'
import { Input } from '../ui/Input'
import { Label } from '../ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select'
import { Textarea } from '../ui/textarea'
import { Switch } from '../ui/switch'
import { Button } from '../ui/Button'
import ColorInput from '../inputs/ColorInput'
import { Upload, Eye, EyeOff, Trash2 } from 'lucide-react'
import { LoginConfig } from './LoginConfigTypes'
import { AccordionSection, AccordionProvider } from './AccordionSection'

interface LoginConfigBrandingProps {
  config: Partial<LoginConfig>
  updateConfig: (section: keyof LoginConfig, field: string, value: any) => void
}

export function LoginConfigBranding({ config, updateConfig }: LoginConfigBrandingProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [showLogoUrl, setShowLogoUrl] = useState(false)

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB')
        return
      }

      // Create preview and update config immediately
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setLogoPreview(result)
        updateConfig('branding', 'logoUrl', result)
      }
      reader.readAsDataURL(file)

      // Optional: Background upload if endpoint existed
      /*
      const formData = new FormData()
      formData.append('logo', file)
      try {
        const response = await fetch('/api/admin/upload/logo', {
          method: 'POST',
          body: formData
        })
        if (response.ok) {
          const result = await response.json()
          updateConfig('branding', 'logoUrl', result.url)
        }
      } catch (error) {
        console.error('Logo upload failed:', error)
      }
      */
    }
  }

  const removeLogo = () => {
    setLogoPreview(null)
    updateConfig('branding', 'logoUrl', '')
    const fileInput = document.getElementById('logo-upload') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Branding Settings</h3>
      
      <AccordionProvider>
        {/* Basic Information */}
        <AccordionSection 
          title="Basic Information" 
          description="App name, logo, and basic branding elements"
          sectionId="basic-information"
        >
        <div className="space-y-4">
          {/* App Name */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="appName">App Name</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="appName"
                value={config.branding?.appName || ''}
                onChange={(e) => updateConfig('branding', 'appName', e.target.value)}
                placeholder="My App"
              />
            </div>
          </div>

          {/* Logo Upload */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="logo-upload">Logo</Label>
            </div>
            <div className="col-span-8">
              <div className="space-y-4">
                {/* Logo Preview */}
                {(logoPreview || config.branding?.logoUrl) && (
                  <div className="relative inline-block">
                    <img
                      src={logoPreview || config.branding?.logoUrl}
                      alt="Logo preview"
                      className="h-16 w-auto max-w-xs object-contain border rounded"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      title="Remove logo"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {/* Upload Button */}
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Logo
                  </Button>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="use-logo-url"
                      checked={showLogoUrl}
                      onCheckedChange={setShowLogoUrl}
                    />
                    <Label htmlFor="use-logo-url" className="text-sm">Use URL</Label>
                  </div>
                </div>

                {/* Logo URL Input */}
                {showLogoUrl && (
                  <Input
                    placeholder="https://example.com/logo.png"
                    value={config.branding?.logoUrl || ''}
                    onChange={(e) => updateConfig('branding', 'logoUrl', e.target.value)}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Tagline */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="tagline">Tagline</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="tagline"
                value={config.branding?.tagline || ''}
                onChange={(e) => updateConfig('branding', 'tagline', e.target.value)}
                placeholder="Your app's tagline"
              />
            </div>
          </div>

          {/* Description */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="description">Description</Label>
            </div>
            <div className="col-span-8">
              <Textarea
                id="description"
                value={config.branding?.description || ''}
                onChange={(e) => updateConfig('branding', 'description', e.target.value)}
                placeholder="Brief description of your application"
                rows={3}
              />
            </div>
          </div>
        </div>
        </AccordionSection>

        {/* Colors */}
        <AccordionSection 
          title="Colors & Visual Style" 
          description="Color scheme and visual appearance"
          sectionId="colors-style"
        >
        <div className="space-y-4">
          {/* Primary Color */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="primaryColor">Primary Color</Label>
            </div>
            <div className="col-span-8">
              <ColorInput
                value={config.branding?.primaryColor || '#3b82f6'}
                onChange={(value) => updateConfig('branding', 'primaryColor', value)}
                label="Primary Color"
              />
            </div>
          </div>

          {/* Secondary Color */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="secondaryColor">Secondary Color</Label>
            </div>
            <div className="col-span-8">
              <ColorInput
                value={config.branding?.secondaryColor || '#64748b'}
                onChange={(value) => updateConfig('branding', 'secondaryColor', value)}
                label="Secondary Color"
              />
            </div>
          </div>

          {/* Accent Color */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="accentColor">Accent Color</Label>
            </div>
            <div className="col-span-8">
              <ColorInput
                value={config.branding?.accentColor || '#10b981'}
                onChange={(value) => updateConfig('branding', 'accentColor', value)}
                label="Accent Color"
              />
            </div>
          </div>

          {/* Text Color */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="textColor">Text Color</Label>
            </div>
            <div className="col-span-8">
              <ColorInput
                value={config.branding?.textColor || '#1f2937'}
                onChange={(value) => updateConfig('branding', 'textColor', value)}
                label="Text Color"
              />
            </div>
          </div>

          {/* Background Color */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="backgroundColor">Background Color</Label>
            </div>
            <div className="col-span-8">
              <ColorInput
                value={config.branding?.backgroundColor || '#ffffff'}
                onChange={(value) => updateConfig('branding', 'backgroundColor', value)}
                label="Background Color"
              />
            </div>
          </div>
        </div>
        </AccordionSection>

        {/* Typography */}
        <AccordionSection 
          title="Typography" 
          description="Font settings and text styling"
          sectionId="typography"
        >
        <div className="space-y-4">
          {/* Font Family */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="fontFamily">Font Family</Label>
            </div>
            <div className="col-span-8">
              <Select value={config.branding?.fontFamily || 'Inter'} onValueChange={(value) => updateConfig('branding', 'fontFamily', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inter">Inter</SelectItem>
                  <SelectItem value="Roboto">Roboto</SelectItem>
                  <SelectItem value="Open Sans">Open Sans</SelectItem>
                  <SelectItem value="Lato">Lato</SelectItem>
                  <SelectItem value="Montserrat">Montserrat</SelectItem>
                  <SelectItem value="Poppins">Poppins</SelectItem>
                  <SelectItem value="Raleway">Raleway</SelectItem>
                  <SelectItem value="Ubuntu">Ubuntu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Font Size */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="fontSize">Font Size</Label>
            </div>
            <div className="col-span-8">
              <Select value={config.branding?.fontSize || '16px'} onValueChange={(value) => updateConfig('branding', 'fontSize', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12px">12px</SelectItem>
                  <SelectItem value="14px">14px</SelectItem>
                  <SelectItem value="16px">16px</SelectItem>
                  <SelectItem value="18px">18px</SelectItem>
                  <SelectItem value="20px">20px</SelectItem>
                  <SelectItem value="24px">24px</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Font Weight */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="fontWeight">Font Weight</Label>
            </div>
            <div className="col-span-8">
              <Select value={config.branding?.fontWeight || '400'} onValueChange={(value) => updateConfig('branding', 'fontWeight', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="300">Light (300)</SelectItem>
                  <SelectItem value="400">Normal (400)</SelectItem>
                  <SelectItem value="500">Medium (500)</SelectItem>
                  <SelectItem value="600">Semi-Bold (600)</SelectItem>
                  <SelectItem value="700">Bold (700)</SelectItem>
                  <SelectItem value="800">Extra-Bold (800)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        </AccordionSection>

        {/* SSO Configuration */}
        <AccordionSection 
          title="SSO Provider Configuration" 
          description="Single Sign-On provider settings and logos"
          sectionId="sso-configuration"
        >
        <div className="space-y-4">
          {/* SSO Logo Upload */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="sso-logo-upload">SSO Logo</Label>
              <p className="text-xs text-gray-500 mt-1">For SSO login buttons</p>
            </div>
            <div className="col-span-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    id="sso-logo-upload"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = (e) => {
                          updateConfig('branding', 'ssoLogoUrl', e.target?.result as string)
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('sso-logo-upload')?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload SSO Logo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => updateConfig('branding', 'ssoLogoUrl', '')}
                    className="flex items-center gap-2"
                    title="Remove SSO logo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* SSO Logo Preview */}
                {config.branding?.ssoLogoUrl && (
                  <div className="flex items-center space-x-4 p-4 border rounded-lg bg-gray-50">
                    <img 
                      src={config.branding.ssoLogoUrl} 
                      alt="SSO Logo" 
                      className="h-12 w-12 object-contain border rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">SSO Logo Preview</p>
                      <p className="text-xs text-gray-500">This logo will appear on SSO login buttons</p>
                    </div>
                  </div>
                )}
                
                {/* SSO Logo URL Fallback */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="use-sso-url"
                    checked={!!config.branding?.ssoLogoUrl?.startsWith('http')}
                    onCheckedChange={(checked) => {
                      if (!checked) {
                        updateConfig('branding', 'ssoLogoUrl', '')
                      }
                    }}
                  />
                  <Label htmlFor="use-sso-url" className="text-sm">Use URL instead of upload</Label>
                </div>
                
                {config.branding?.ssoLogoUrl?.startsWith('http') && (
                  <Input
                    placeholder="https://example.com/sso-logo.png"
                    value={config.branding.ssoLogoUrl}
                    onChange={(e) => updateConfig('branding', 'ssoLogoUrl', e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>
            </div>
          </div>

          {/* SSO Logo Size */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="ssoLogoSize">SSO Logo Size</Label>
            </div>
            <div className="col-span-8">
              <Select value={config.branding?.ssoLogoSize || '32px'} onValueChange={(value) => updateConfig('branding', 'ssoLogoSize', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16px">16px</SelectItem>
                  <SelectItem value="24px">24px</SelectItem>
                  <SelectItem value="32px">32px</SelectItem>
                  <SelectItem value="40px">40px</SelectItem>
                  <SelectItem value="48px">48px</SelectItem>
                  <SelectItem value="56px">56px</SelectItem>
                  <SelectItem value="64px">64px</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* SSO Providers Configuration */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="ssoProviders">SSO Providers</Label>
              <p className="text-xs text-gray-500 mt-1">Configure available SSO providers</p>
            </div>
            <div className="col-span-8">
              <div className="space-y-2">
                {['Google', 'Microsoft', 'Apple', 'GitHub', 'LinkedIn', 'Okta', 'SAML', 'OIDC'].map((provider) => (
                  <div key={provider} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm font-medium">{provider}</span>
                    <Switch
                      id={`sso-${provider.toLowerCase()}`}
                      checked={config.branding?.ssoProviders?.includes(provider) || false}
                      onCheckedChange={(checked) => {
                        const currentProviders = config.branding?.ssoProviders || []
                        if (checked) {
                          updateConfig('branding', 'ssoProviders', [...currentProviders, provider])
                        } else {
                          updateConfig('branding', 'ssoProviders', currentProviders.filter((p: string) => p !== provider))
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Individual SSO Provider Logos */}
          {(config.branding?.ssoProviders?.length || 0) > 0 && (
            <div className="mt-8 space-y-4 pt-6 border-t border-gray-100">
              <div>
                <Label className="text-sm font-semibold">Individual Provider Logos</Label>
                <p className="text-xs text-gray-500 mt-1">Upload custom logos for specific providers (overrides default icons)</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {config.branding?.ssoProviders?.map((provider) => (
                  <div key={provider} className="p-4 border rounded-lg bg-white shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{provider}</span>
                      {config.branding?.providerLogos?.[provider] ? (
                        <div className="flex items-center gap-2">
                          <img 
                            src={config.branding.providerLogos[provider]} 
                            alt={`${provider} Logo`} 
                            className="h-8 w-8 object-contain border rounded bg-gray-50 p-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newLogos = { ...(config.branding?.providerLogos || {}) }
                              delete newLogos[provider]
                              updateConfig('branding', 'providerLogos', newLogos)
                            }}
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                            title="Remove logo"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="h-8 w-8 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-[10px] font-bold">
                          DEF
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id={`logo-${provider.toLowerCase()}`}
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onload = (e) => {
                              const newLogos = { ...(config.branding?.providerLogos || {}) }
                              newLogos[provider] = e.target?.result as string
                              updateConfig('branding', 'providerLogos', newLogos)
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => document.getElementById(`logo-${provider.toLowerCase()}`)?.click()}
                      >
                        <Upload className="h-3 w-3 mr-2" />
                        {config.branding?.providerLogos?.[provider] ? 'Change Logo' : 'Upload Logo'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        </AccordionSection>

        {/* Advanced Options */}
        <AccordionSection 
          title="Advanced Options" 
          description="Custom code, meta tags, and advanced settings"
          sectionId="advanced-options"
        >
        <div className="space-y-4">
          {/* Favicon URL */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="faviconUrl">Favicon URL</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="faviconUrl"
                value={config.branding?.faviconUrl || ''}
                onChange={(e) => updateConfig('branding', 'faviconUrl', e.target.value)}
                placeholder="https://example.com/favicon.ico"
              />
            </div>
          </div>

          {/* Meta Description */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="metaDescription">Meta Description</Label>
            </div>
            <div className="col-span-8">
              <Textarea
                id="metaDescription"
                value={config.branding?.metaDescription || ''}
                onChange={(e) => updateConfig('branding', 'metaDescription', e.target.value)}
                placeholder="SEO meta description"
                rows={2}
              />
            </div>
          </div>

          {/* Meta Keywords */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="metaKeywords">Meta Keywords</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="metaKeywords"
                value={config.branding?.metaKeywords || ''}
                onChange={(e) => updateConfig('branding', 'metaKeywords', e.target.value)}
                placeholder="keyword1, keyword2, keyword3"
              />
            </div>
          </div>

          {/* Custom CSS */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="customCSS">Custom CSS</Label>
            </div>
            <div className="col-span-8">
              <Textarea
                id="customCSS"
                value={config.branding?.customCSS || ''}
                onChange={(e) => updateConfig('branding', 'customCSS', e.target.value)}
                placeholder="/* Add your custom CSS here */"
                rows={6}
                className="font-mono text-sm"
              />
            </div>
          </div>

          {/* Custom JavaScript */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="customJS">Custom JavaScript</Label>
            </div>
            <div className="col-span-8">
              <Textarea
                id="customJS"
                value={config.branding?.customJS || ''}
                onChange={(e) => updateConfig('branding', 'customJS', e.target.value)}
                placeholder="// Add your custom JavaScript here"
                rows={6}
                className="font-mono text-sm"
              />
            </div>
          </div>
        </div>
        </AccordionSection>
      </AccordionProvider>
    </div>
  )
}
