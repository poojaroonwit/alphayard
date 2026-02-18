'use client'

import React from 'react'
import { Input } from '../ui/Input'
import { Label } from '../ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select'
import { Switch } from '../ui/switch'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/Button'
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
  ChevronLeft,
  Upload
} from 'lucide-react'
import { LoginConfig } from './LoginConfigTypes'
import { AccordionSection, AccordionProvider } from './AccordionSection'

interface LoginConfigFormProps {
  config: Partial<LoginConfig>
  updateConfig: (section: keyof LoginConfig, field: string, value: any) => void
}

export function LoginConfigForm({ config, updateConfig }: LoginConfigFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Form Settings</h3>
      
      <AccordionProvider>
        {/* Basic Fields */}
        <AccordionSection 
          title="Basic Fields" 
          description="Configure which form fields to display"
          sectionId="basic-fields"
          defaultOpen={true}
        >
        <div className="space-y-4">
          {/* Show Email Field */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="showEmailField">Show Email Field</Label>
            </div>
            <div className="col-span-8">
              <Switch
                id="showEmailField"
                checked={config.form?.showEmailField || false}
                onCheckedChange={(checked) => updateConfig('form', 'showEmailField', checked)}
              />
            </div>
          </div>

          {/* Show Username Field */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="showUsernameField">Show Username Field</Label>
            </div>
            <div className="col-span-8">
              <Switch
                id="showUsernameField"
                checked={config.form?.showUsernameField || false}
                onCheckedChange={(checked) => updateConfig('form', 'showUsernameField', checked)}
              />
            </div>
          </div>

          {/* Show Phone Field */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="showPhoneField">Show Phone Field</Label>
            </div>
            <div className="col-span-8">
              <Switch
                id="showPhoneField"
                checked={config.form?.showPhoneField || false}
                onCheckedChange={(checked) => updateConfig('form', 'showPhoneField', checked)}
              />
            </div>
          </div>

          {/* Show Company Field */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="showCompanyField">Show Company Field</Label>
            </div>
            <div className="col-span-8">
              <Switch
                id="showCompanyField"
                checked={config.form?.showCompanyField || false}
                onCheckedChange={(checked) => updateConfig('form', 'showCompanyField', checked)}
              />
            </div>
          </div>

          {/* Show Password Field */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="showPasswordField">Show Password Field</Label>
            </div>
            <div className="col-span-8">
              <Switch
                id="showPasswordField"
                checked={config.form?.showPasswordField || false}
                onCheckedChange={(checked) => updateConfig('form', 'showPasswordField', checked)}
              />
            </div>
          </div>
        </div>
        </AccordionSection>

        {/* Authentication Options */}
        <AccordionSection 
          title="Authentication Options" 
          description="Remember me, forgot password, and other auth options"
          sectionId="authentication-options"
        >
        <div className="space-y-4">
          {/* Show Remember Me */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="showRememberMe">Show Remember Me</Label>
            </div>
            <div className="col-span-8">
              <Switch
                id="showRememberMe"
                checked={config.form?.showRememberMe || false}
                onCheckedChange={(checked) => updateConfig('form', 'showRememberMe', checked)}
              />
            </div>
          </div>

          {/* Show Remember Device */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="showRememberDevice">Show Remember Device</Label>
            </div>
            <div className="col-span-8">
              <Switch
                id="showRememberDevice"
                checked={config.form?.showRememberDevice || false}
                onCheckedChange={(checked) => updateConfig('form', 'showRememberDevice', checked)}
              />
            </div>
          </div>

          {/* Show Forgot Password */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="showForgotPassword">Show Forgot Password</Label>
            </div>
            <div className="col-span-8">
              <Switch
                id="showForgotPassword"
                checked={config.form?.showForgotPassword || false}
                onCheckedChange={(checked) => updateConfig('form', 'showForgotPassword', checked)}
              />
            </div>
          </div>

          {/* Show Social Login */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="showSocialLogin">Show Social Login</Label>
            </div>
            <div className="col-span-8">
              <Switch
                id="showSocialLogin"
                checked={config.form?.showSocialLogin || false}
                onCheckedChange={(checked) => updateConfig('form', 'showSocialLogin', checked)}
              />
            </div>
          </div>

          {/* Show SSO */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="showSSO">Show SSO</Label>
            </div>
            <div className="col-span-8">
              <Switch
                id="showSSO"
                checked={config.form?.showSSO || false}
                onCheckedChange={(checked) => updateConfig('form', 'showSSO', checked)}
              />
            </div>
          </div>

          {/* Show Language Selector */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="showLanguageSelector">Show Language Selector</Label>
            </div>
            <div className="col-span-8">
              <Switch
                id="showLanguageSelector"
                checked={config.form?.showLanguageSelector || false}
                onCheckedChange={(checked) => updateConfig('form', 'showLanguageSelector', checked)}
              />
            </div>
          </div>

          {/* Show Theme Toggle */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="showThemeToggle">Show Theme Toggle</Label>
            </div>
            <div className="col-span-8">
              <Switch
                id="showThemeToggle"
                checked={config.form?.showThemeToggle || false}
                onCheckedChange={(checked) => updateConfig('form', 'showThemeToggle', checked)}
              />
            </div>
          </div>
        </div>
        </AccordionSection>

        {/* Button Configuration */}
        <AccordionSection 
          title="Button Configuration" 
          description="Customize button text and behavior"
          sectionId="button-configuration"
        >
        <div className="space-y-4">
          {/* Sign In Button */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="signInButtonText">Sign In Button Text</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="signInButtonText"
                value={config.form?.signInButtonText || ''}
                onChange={(e) => updateConfig('form', 'signInButtonText', e.target.value)}
                placeholder="Sign In"
              />
            </div>
          </div>

          {/* Sign Up Button */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="signUpButtonText">Sign Up Button Text</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="signUpButtonText"
                value={config.form?.signUpButtonText || ''}
                onChange={(e) => updateConfig('form', 'signUpButtonText', e.target.value)}
                placeholder="Sign Up"
              />
            </div>
          </div>

          {/* Submit Button Text */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="submitButtonText">Submit Button Text</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="submitButtonText"
                value={config.form?.submitButtonText || ''}
                onChange={(e) => updateConfig('form', 'submitButtonText', e.target.value)}
                placeholder="Sign In"
              />
            </div>
          </div>

          {/* Remember Me Text */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="rememberMeText">Remember Me Text</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="rememberMeText"
                value={config.form?.rememberMeText || ''}
                onChange={(e) => updateConfig('form', 'rememberMeText', e.target.value)}
                placeholder="Remember me"
              />
            </div>
          </div>

          {/* Remember Device Text */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="rememberDeviceText">Remember Device Text</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="rememberDeviceText"
                value={config.form?.rememberDeviceText || ''}
                onChange={(e) => updateConfig('form', 'rememberDeviceText', e.target.value)}
                placeholder="Remember this device"
              />
            </div>
          </div>

          {/* Forgot Password Text */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="forgotPasswordText">Forgot Password Text</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="forgotPasswordText"
                value={config.form?.forgotPasswordText || ''}
                onChange={(e) => updateConfig('form', 'forgotPasswordText', e.target.value)}
                placeholder="Forgot your password?"
              />
            </div>
          </div>

          {/* Sign Up Link Text */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="signUpLinkText">Sign Up Link Text</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="signUpLinkText"
                value={config.form?.signUpLinkText || ''}
                onChange={(e) => updateConfig('form', 'signUpLinkText', e.target.value)}
                placeholder="Don't have an account? Sign up"
              />
            </div>
          </div>

          {/* Sign In Link Text */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="signInLinkText">Sign In Link Text</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="signInLinkText"
                value={config.form?.signInLinkText || ''}
                onChange={(e) => updateConfig('form', 'signInLinkText', e.target.value)}
                placeholder="Already have an account? Sign in"
              />
            </div>
          </div>
        </div>
        </AccordionSection>

        {/* Button Styling */}
        <AccordionSection 
          title="Button Styling" 
          description="Configure button appearance and animations"
          sectionId="button-styling"
        >
        <div className="space-y-4">
          {/* Button Style */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="buttonStyle">Button Style</Label>
            </div>
            <div className="col-span-8">
              <Select value={config.form?.buttonStyle || 'solid'} onValueChange={(value) => updateConfig('form', 'buttonStyle', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="outline">Outline</SelectItem>
                  <SelectItem value="ghost">Ghost</SelectItem>
                  <SelectItem value="gradient">Gradient</SelectItem>
                  <SelectItem value="rounded">Rounded</SelectItem>
                  <SelectItem value="sharp">Sharp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Button Size */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="buttonSize">Button Size</Label>
            </div>
            <div className="col-span-8">
              <Select value={config.form?.buttonSize || 'medium'} onValueChange={(value) => updateConfig('form', 'buttonSize', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="extra-large">Extra Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Button Border Radius */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="buttonBorderRadius">Button Border Radius</Label>
            </div>
            <div className="col-span-8">
              <Select value={config.form?.buttonBorderRadius || 'medium'} onValueChange={(value) => updateConfig('form', 'buttonBorderRadius', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="small">Small (2px)</SelectItem>
                  <SelectItem value="medium">Medium (4px)</SelectItem>
                  <SelectItem value="large">Large (8px)</SelectItem>
                  <SelectItem value="extra-large">Extra Large (12px)</SelectItem>
                  <SelectItem value="full">Full (50%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Button Padding */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="buttonPadding">Button Padding</Label>
            </div>
            <div className="col-span-8">
              <Select value={config.form?.buttonPadding || 'medium'} onValueChange={(value) => updateConfig('form', 'buttonPadding', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="extra-large">Extra Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Show Button Icons */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="showButtonIcons">Show Button Icons</Label>
            </div>
            <div className="col-span-8">
              <Switch
                id="showButtonIcons"
                checked={config.form?.showButtonIcons || false}
                onCheckedChange={(checked) => updateConfig('form', 'showButtonIcons', checked)}
              />
            </div>
          </div>

          {/* Button Animation */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="buttonAnimation">Button Animation</Label>
            </div>
            <div className="col-span-8">
              <Select value={config.form?.buttonAnimation || 'none'} onValueChange={(value) => updateConfig('form', 'buttonAnimation', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="scale">Scale</SelectItem>
                  <SelectItem value="bounce">Bounce</SelectItem>
                  <SelectItem value="slide">Slide</SelectItem>
                  <SelectItem value="fade">Fade</SelectItem>
                  <SelectItem value="pulse">Pulse</SelectItem>
                  <SelectItem value="shake">Shake</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Button Full Width */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="buttonFullWidth">Full Width Buttons</Label>
            </div>
            <div className="col-span-8">
              <Switch
                id="buttonFullWidth"
                checked={config.form?.buttonFullWidth || false}
                onCheckedChange={(checked) => updateConfig('form', 'buttonFullWidth', checked)}
              />
            </div>
          </div>
        </div>
        </AccordionSection>

        {/* Field Placeholders */}
        <AccordionSection 
          title="Field Placeholders" 
          description="Customize placeholder text for form fields"
          sectionId="field-placeholders"
        >
        <div className="space-y-4">
          {/* Email Placeholder */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="emailPlaceholder">Email Placeholder</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="emailPlaceholder"
                value={config.form?.emailPlaceholder || ''}
                onChange={(e) => updateConfig('form', 'emailPlaceholder', e.target.value)}
                placeholder="Enter your email"
              />
            </div>
          </div>

          {/* Username Placeholder */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="usernamePlaceholder">Username Placeholder</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="usernamePlaceholder"
                value={config.form?.usernamePlaceholder || ''}
                onChange={(e) => updateConfig('form', 'usernamePlaceholder', e.target.value)}
                placeholder="Enter your username"
              />
            </div>
          </div>

          {/* Phone Placeholder */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="phonePlaceholder">Phone Placeholder</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="phonePlaceholder"
                value={config.form?.phonePlaceholder || ''}
                onChange={(e) => updateConfig('form', 'phonePlaceholder', e.target.value)}
                placeholder="Enter your phone number"
              />
            </div>
          </div>

          {/* Company Placeholder */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="companyPlaceholder">Company Placeholder</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="companyPlaceholder"
                value={config.form?.companyPlaceholder || ''}
                onChange={(e) => updateConfig('form', 'companyPlaceholder', e.target.value)}
                placeholder="Enter your company name"
              />
            </div>
          </div>

          {/* Password Placeholder */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="passwordPlaceholder">Password Placeholder</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="passwordPlaceholder"
                value={config.form?.passwordPlaceholder || ''}
                onChange={(e) => updateConfig('form', 'passwordPlaceholder', e.target.value)}
                placeholder="Enter your password"
              />
            </div>
          </div>
        </div>
        </AccordionSection>

        {/* Social Authentication */}
        <AccordionSection 
          title="Social Authentication" 
          description="Configure social login providers and settings"
          sectionId="social-authentication"
        >
        <div className="space-y-4">
          {/* SSO Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50/30">
            <div className="space-y-1">
              <Label htmlFor="showSSO" className="text-base">Enable SSO Button</Label>
              <p className="text-sm text-gray-500 font-normal">Show the main Enterprise SSO login option</p>
            </div>
            <Switch
              id="showSSO"
              checked={config.form?.showSSO ?? true}
              onCheckedChange={(checked) => updateConfig('form', 'showSSO', checked)}
            />
          </div>

          {/* Social Login Text */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="socialLoginText">Social Login Text</Label>
              <p className="text-xs text-gray-500 mt-1">Text above social login buttons</p>
            </div>
            <div className="col-span-8">
              <Input
                id="socialLoginText"
                value={config.form?.socialLoginText || ''}
                onChange={(e) => updateConfig('form', 'socialLoginText', e.target.value)}
                placeholder="Continue with"
              />
            </div>
          </div>

          {/* SSO Button Text */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="ssoButtonText">SSO Button Text</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="ssoButtonText"
                value={config.form?.ssoButtonText || ''}
                onChange={(e) => updateConfig('form', 'ssoButtonText', e.target.value)}
                placeholder="Continue with SSO"
              />
            </div>
          </div>

          {/* SSO Button Layout */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="ssoLayout">SSO Button Layout</Label>
              <p className="text-xs text-gray-500 mt-1">Choose layout for social buttons</p>
            </div>
            <div className="col-span-8">
              <Select 
                value={config.form?.ssoLayout || 'vertical'} 
                onValueChange={(value) => updateConfig('form', 'ssoLayout', value as 'vertical' | 'horizontal')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select layout" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vertical">Vertical (Full Width)</SelectItem>
                  <SelectItem value="horizontal">Horizontal (Grid/Side-by-side)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Available Social Providers */}
          {config.form?.showSocialLogin && (
            <div className="space-y-6">
              <div className="space-y-2 pt-4 border-t border-gray-100">
                <Label>Available Social Providers</Label>
                <div className="grid grid-cols-1 gap-2">
                  {['Google', 'Microsoft', 'Apple', 'GitHub', 'LinkedIn', 'Okta', 'SAML', 'OIDC'].map((provider: string) => (
                    <div key={provider} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm font-medium">{provider}</span>
                      <Switch
                        id={`form-sso-${provider.toLowerCase()}`}
                        checked={config.form?.socialProviders?.includes(provider) || false}
                        onCheckedChange={(checked) => {
                          const currentProviders: string[] = config.form?.socialProviders || []
                          if (checked) {
                            updateConfig('form', 'socialProviders', [...currentProviders, provider])
                          } else {
                            updateConfig('form', 'socialProviders', currentProviders.filter((p: string) => p !== provider))
                          }
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Individual Social Provider Logos */}
              {(config.form?.socialProviders?.length || 0) > 0 && (
                <div className="space-y-3 pt-4 border-t">
                  <Label className="text-sm font-semibold">Individual Provider Logos</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {config.form?.socialProviders?.map((provider: string) => (
                      <div key={provider} className="p-3 border rounded-lg bg-gray-50/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">{provider}</span>
                          {config.branding?.providerLogos?.[provider] ? (
                            <div className="flex items-center gap-1">
                              <img 
                                src={config.branding.providerLogos[provider]} 
                                alt={`${provider} Logo`} 
                                className="h-6 w-6 object-contain border rounded bg-white"
                              />
                            </div>
                          ) : null}
                        </div>
                        <input
                          type="file"
                          id={`form-logo-${provider.toLowerCase()}`}
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
                          className="w-full text-[10px] h-7"
                          onClick={() => document.getElementById(`form-logo-${provider.toLowerCase()}`)?.click()}
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          {config.branding?.providerLogos?.[provider] ? 'Change Logo' : 'Upload Logo'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Show More Social Providers */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="showMoreSocialProviders">Show More Social Providers</Label>
            </div>
            <div className="col-span-8">
              <Switch
                id="showMoreSocialProviders"
                checked={config.form?.showMoreSocialProviders || false}
                onCheckedChange={(checked) => updateConfig('form', 'showMoreSocialProviders', checked)}
              />
            </div>
          </div>

          {/* Show Social Pre-Fill */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="showSocialPreFill">Show Social Pre-Fill</Label>
            </div>
            <div className="col-span-8">
              <Switch
                id="showSocialPreFill"
                checked={config.form?.showSocialPreFill || false}
                onCheckedChange={(checked) => updateConfig('form', 'showSocialPreFill', checked)}
              />
            </div>
          </div>

          {/* Show Account Linking */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="showAccountLinking">Show Account Linking</Label>
            </div>
            <div className="col-span-8">
              <Switch
                id="showAccountLinking"
                checked={config.form?.showAccountLinking || false}
                onCheckedChange={(checked) => updateConfig('form', 'showAccountLinking', checked)}
              />
            </div>
          </div>

          {/* More Social Providers Text */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="moreSocialProvidersText">More Providers Text</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="moreSocialProvidersText"
                value={config.form?.moreSocialProvidersText || ''}
                onChange={(e) => updateConfig('form', 'moreSocialProvidersText', e.target.value)}
                placeholder="More providers"
              />
            </div>
          </div>

          {/* Social Pre-Fill Text */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="socialPreFillText">Social Pre-Fill Text</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="socialPreFillText"
                value={config.form?.socialPreFillText || ''}
                onChange={(e) => updateConfig('form', 'socialPreFillText', e.target.value)}
                placeholder="Auto-fill from social profile"
              />
            </div>
          </div>

          {/* Account Linking Text */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="accountLinkingText">Account Linking Text</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="accountLinkingText"
                value={config.form?.accountLinkingText || ''}
                onChange={(e) => updateConfig('form', 'accountLinkingText', e.target.value)}
                placeholder="Link existing account"
              />
            </div>
          </div>
        </div>
        </AccordionSection>

        {/* Messages */}
        <AccordionSection 
          title="Messages & Notifications" 
          description="Configure system messages and notifications"
          sectionId="messages-notifications"
        >
        <div className="space-y-4">
          {/* Loading Text */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="loadingText">Loading Text</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="loadingText"
                value={config.form?.loadingText || ''}
                onChange={(e) => updateConfig('form', 'loadingText', e.target.value)}
                placeholder="Loading..."
              />
            </div>
          </div>

          {/* Error Message */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="errorMessage">Error Message</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="errorMessage"
                value={config.form?.errorMessage || ''}
                onChange={(e) => updateConfig('form', 'errorMessage', e.target.value)}
                placeholder="An error occurred"
              />
            </div>
          </div>

          {/* Success Message */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="successMessage">Success Message</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="successMessage"
                value={config.form?.successMessage || ''}
                onChange={(e) => updateConfig('form', 'successMessage', e.target.value)}
                placeholder="Success!"
              />
            </div>
          </div>

          {/* Validation Message */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="validationMessage">Validation Message</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="validationMessage"
                value={config.form?.validationMessage || ''}
                onChange={(e) => updateConfig('form', 'validationMessage', e.target.value)}
                placeholder="Please check your input"
              />
            </div>
          </div>

          {/* Progress Text */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="progressText">Progress Text</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="progressText"
                value={config.form?.progressText || ''}
                onChange={(e) => updateConfig('form', 'progressText', e.target.value)}
                placeholder="Processing..."
              />
            </div>
          </div>
        </div>
        </AccordionSection>

        {/* Compliance & Legal */}
        <AccordionSection
          title="Compliance & Legal"
          description="Configure legal notices, policies, and compliance markers"
          sectionId="compliance-legal"
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50/50">
              <div className="space-y-1">
                <Label>Cookie Consent Flag</Label>
                <p className="text-sm text-gray-500 font-normal">Show cookie notice on the login page</p>
              </div>
              <Switch
                checked={config.form?.showCookieConsent || false}
                onCheckedChange={(checked) => updateConfig('form', 'showCookieConsent', checked)}
              />
            </div>

            {config.form?.showCookieConsent && (
              <div className="grid grid-cols-12 gap-4 items-start pl-4 border-l-2">
                <div className="col-span-4">
                  <Label>Consent Text</Label>
                </div>
                <div className="col-span-8">
                  <Input
                    value={config.form?.cookieConsentText || ''}
                    onChange={(e) => updateConfig('form', 'cookieConsentText', e.target.value)}
                    placeholder="We use cookies to improve your experience..."
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50/50">
              <div className="space-y-1">
                <Label>Terms & Privacy Policies</Label>
                <p className="text-sm text-gray-500 font-normal">Display links to Terms and Privacy Policy</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Terms</span>
                  <Switch
                    checked={config.form?.showTermsOfService || false}
                    onCheckedChange={(checked) => updateConfig('form', 'showTermsOfService', checked)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Privacy</span>
                  <Switch
                    checked={config.form?.showPrivacyPolicy || false}
                    onCheckedChange={(checked) => updateConfig('form', 'showPrivacyPolicy', checked)}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50/50">
              <div className="space-y-1">
                <Label>GDPR Compliance Marker</Label>
                <p className="text-sm text-gray-500 font-normal">Show GDPR compliance marker</p>
              </div>
              <Switch
                checked={config.form?.showGDPR || false}
                onCheckedChange={(checked) => updateConfig('form', 'showGDPR', checked)}
              />
            </div>
          </div>
        </AccordionSection>

        {/* Accessibility Features */}
        <AccordionSection
          title="Accessibility Features"
          description="Optimize the login experience for all users"
          sectionId="accessibility-settings"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Screen Reader Support</Label>
                <p className="text-sm text-gray-500 font-normal">Optimize ARIA labels and focus management</p>
              </div>
              <Switch
                checked={config.form?.showScreenReaderSupport || false}
                onCheckedChange={(checked) => updateConfig('form', 'showScreenReaderSupport', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>High Contrast Mode</Label>
                <p className="text-sm text-gray-500 font-normal">Force high contrast colors for better visibility</p>
              </div>
              <Switch
                checked={config.form?.showHighContrast || false}
                onCheckedChange={(checked) => updateConfig('form', 'showHighContrast', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Font Size Controls</Label>
                <p className="text-sm text-gray-500 font-normal">Show font size adjustment buttons</p>
              </div>
              <Switch
                checked={config.form?.showFontSizeControls || false}
                onCheckedChange={(checked) => updateConfig('form', 'showFontSizeControls', checked)}
              />
            </div>
          </div>
        </AccordionSection>
      </AccordionProvider>
    </div>
  )
}
