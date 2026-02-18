'use client'

import React from 'react'
import { AccordionProvider, AccordionSection } from './AccordionSection'
import { Switch } from '../ui/switch'
import { Label } from '../ui/Label'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/Button'
import { Upload } from 'lucide-react'

import { LoginConfig } from './LoginConfigTypes'

interface SignupConfigBrandingProps {
  config: any
  updateConfig: (section: keyof LoginConfig, field: string, value: any) => void
}

export function SignupConfigBranding({ config, updateConfig }: SignupConfigBrandingProps) {
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Create preview and update config immediately
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        // setLogoPreview(result) // If there's a local state for preview
        updateConfig('signup', 'logoUrl', result)
      }
      reader.readAsDataURL(file)
      
      // Optional: Background upload
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
          updateConfig('signup', 'logoUrl', result.url)
        }
      } catch (error) {
        console.error('Logo upload failed:', error)
      }
      */
    }
  }

  return (
    <AccordionProvider>
      <div className="space-y-6">
        {/* Page Branding */}
        <AccordionSection 
          title="Page Branding"
          description="Customize the signup page appearance and branding"
          sectionId="signup-page-branding"
        >
          <div className="space-y-4">
            {/* Show Branding */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="showBranding">Show Branding</Label>
                <p className="text-sm text-gray-500">Display logo and title on signup page</p>
              </div>
              <Switch
                id="showBranding"
                checked={config.signup?.showBranding !== false}
                onCheckedChange={(checked) => updateConfig('signup', 'showBranding', checked)}
              />
            </div>

            {/* Page Title */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-4">
                <Label htmlFor="pageTitle">Page Title</Label>
                <p className="text-xs text-gray-500 mt-1">Main title of signup page</p>
              </div>
              <div className="col-span-8">
                <Input
                  id="pageTitle"
                  value={config.signup?.pageTitle || 'Create Account'}
                  onChange={(e) => updateConfig('signup', 'pageTitle', e.target.value)}
                  placeholder="Create Account"
                />
              </div>
            </div>

            {/* Page Subtitle */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-4">
                <Label htmlFor="pageSubtitle">Page Subtitle</Label>
                <p className="text-xs text-gray-500 mt-1">Subtitle below the main title</p>
              </div>
              <div className="col-span-8">
                <Input
                  id="pageSubtitle"
                  value={config.signup?.pageSubtitle || 'Join us today and get started'}
                  onChange={(e) => updateConfig('signup', 'pageSubtitle', e.target.value)}
                  placeholder="Join us today and get started"
                />
              </div>
            </div>

            {/* Page Description */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-4">
                <Label htmlFor="pageDescription">Page Description</Label>
                <p className="text-xs text-gray-500 mt-1">Detailed description of signup process</p>
              </div>
              <div className="col-span-8">
                <Textarea
                  id="pageDescription"
                  value={config.signup?.pageDescription || ''}
                  onChange={(e) => updateConfig('signup', 'pageDescription', e.target.value)}
                  placeholder="Enter a detailed description of what users can expect when signing up..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        </AccordionSection>

        {/* Logo Configuration */}
        <AccordionSection 
          title="Logo Configuration"
          description="Upload and configure the signup page logo"
          sectionId="signup-logo-config"
        >
          <div className="space-y-4">
            {/* Logo Upload */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-4">
                <Label htmlFor="logoUpload">Logo Upload</Label>
                <p className="text-xs text-gray-500 mt-1">Upload your company logo</p>
              </div>
              <div className="col-span-8">
                <div className="space-y-2">
                  <Input
                    id="logoUpload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                  />
                  {config.signup?.logoUrl && (
                    <div className="flex items-center space-x-4 p-4 border rounded-lg bg-gray-50">
                      <img 
                        src={config.signup.logoUrl} 
                        alt="Signup Logo" 
                        className="h-12 w-12 object-contain border rounded"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Current Logo</p>
                        <p className="text-xs text-gray-500">{config.signup.logoUrl}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateConfig('signup', 'logoUrl', '')}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Logo Size */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-4">
                <Label htmlFor="logoSize">Logo Size</Label>
                <p className="text-xs text-gray-500 mt-1">Size of the logo display</p>
              </div>
              <div className="col-span-8">
                <Input
                  id="logoSize"
                  value={config.signup?.logoSize || '64px'}
                  onChange={(e) => updateConfig('signup', 'logoSize', e.target.value)}
                  placeholder="64px"
                />
              </div>
            </div>

            {/* Logo Position */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-4">
                <Label htmlFor="logoPosition">Logo Position</Label>
                <p className="text-xs text-gray-500 mt-1">Position of logo relative to title</p>
              </div>
              <div className="col-span-8">
                <select
                  id="logoPosition"
                  value={config.signup?.logoPosition || 'top'}
                  onChange={(e) => updateConfig('signup', 'logoPosition', e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="top">Above Title</option>
                  <option value="left">Left of Title</option>
                  <option value="right">Right of Title</option>
                  <option value="bottom">Below Title</option>
                </select>
              </div>
            </div>
          </div>
        </AccordionSection>

        {/* Welcome Message */}
        <AccordionSection 
          title="Welcome Message"
          description="Configure the welcome message for new users"
          sectionId="signup-welcome-message"
        >
          <div className="space-y-4">
            {/* Show Welcome Message */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="showWelcomeMessage">Show Welcome Message</Label>
                <p className="text-sm text-gray-500">Display a welcome message after signup</p>
              </div>
              <Switch
                id="showWelcomeMessage"
                checked={config.signup?.showWelcomeMessage || false}
                onCheckedChange={(checked) => updateConfig('signup', 'showWelcomeMessage', checked)}
              />
            </div>

            {/* Welcome Title */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-4">
                <Label htmlFor="welcomeTitle">Welcome Title</Label>
                <p className="text-xs text-gray-500 mt-1">Title of welcome message</p>
              </div>
              <div className="col-span-8">
                <Input
                  id="welcomeTitle"
                  value={config.signup?.welcomeTitle || 'Welcome!'}
                  onChange={(e) => updateConfig('signup', 'welcomeTitle', e.target.value)}
                  placeholder="Welcome!"
                />
              </div>
            </div>

            {/* Welcome Message */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-4">
                <Label htmlFor="welcomeMessage">Welcome Message</Label>
                <p className="text-xs text-gray-500 mt-1">Detailed welcome message text</p>
              </div>
              <div className="col-span-8">
                <Textarea
                  id="welcomeMessage"
                  value={config.signup?.welcomeMessage || 'Thank you for signing up! Your account has been created successfully.'}
                  onChange={(e) => updateConfig('signup', 'welcomeMessage', e.target.value)}
                  placeholder="Thank you for signing up! Your account has been created successfully."
                  rows={3}
                />
              </div>
            </div>

            {/* Next Steps */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-4">
                <Label htmlFor="nextSteps">Next Steps</Label>
                <p className="text-xs text-gray-500 mt-1">What users should do next</p>
              </div>
              <div className="col-span-8">
                <Textarea
                  id="nextSteps"
                  value={config.signup?.nextSteps || 'You can now log in with your credentials and start using our platform.'}
                  onChange={(e) => updateConfig('signup', 'nextSteps', e.target.value)}
                  placeholder="You can now log in with your credentials and start using our platform."
                  rows={2}
                />
              </div>
            </div>
          </div>
        </AccordionSection>

        {/* Success Page Configuration */}
        <AccordionSection 
          title="Success Page"
          description="Configure the page shown after successful signup"
          sectionId="signup-success-page"
        >
          <div className="space-y-4">
            {/* Redirect After Signup */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="redirectAfterSignup">Redirect After Signup</Label>
                <p className="text-sm text-gray-500">Redirect to a specific page after signup</p>
              </div>
              <Switch
                id="redirectAfterSignup"
                checked={config.signup?.redirectAfterSignup || false}
                onCheckedChange={(checked) => updateConfig('signup', 'redirectAfterSignup', checked)}
              />
            </div>

            {/* Redirect URL */}
            {config.signup?.redirectAfterSignup && (
              <div className="grid grid-cols-12 gap-4 items-start">
                <div className="col-span-4">
                  <Label htmlFor="redirectUrl">Redirect URL</Label>
                  <p className="text-xs text-gray-500 mt-1">URL to redirect to after signup</p>
                </div>
                <div className="col-span-8">
                  <Input
                    id="redirectUrl"
                    value={config.signup?.redirectUrl || '/dashboard'}
                    onChange={(e) => updateConfig('signup', 'redirectUrl', e.target.value)}
                    placeholder="/dashboard"
                  />
                </div>
              </div>
            )}

            {/* Auto Login */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="autoLogin">Auto Login After Signup</Label>
                <p className="text-sm text-gray-500">Automatically log in user after signup</p>
              </div>
              <Switch
                id="autoLogin"
                checked={config.signup?.autoLogin || false}
                onCheckedChange={(checked) => updateConfig('signup', 'autoLogin', checked)}
              />
            </div>

            {/* Show Success Animation */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="showSuccessAnimation">Show Success Animation</Label>
                <p className="text-sm text-gray-500">Display animation on successful signup</p>
              </div>
              <Switch
                id="showSuccessAnimation"
                checked={config.signup?.showSuccessAnimation !== false}
                onCheckedChange={(checked) => updateConfig('signup', 'showSuccessAnimation', checked)}
              />
            </div>
          </div>
        </AccordionSection>
      </div>
    </AccordionProvider>
  )
}
