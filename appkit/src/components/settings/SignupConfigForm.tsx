'use client'

import React from 'react'
import { AccordionProvider, AccordionSection } from './AccordionSection'
import { Button } from '../ui/Button'
import { Upload } from 'lucide-react'
import { Switch } from '../ui/switch'
import { Label } from '../ui/Label'
import { Input } from '../ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select'
import { Textarea } from '../ui/textarea'

import { LoginConfig } from './LoginConfigTypes'

interface SignupConfigFormProps {
  config: any
  updateConfig: (section: keyof LoginConfig, field: string, value: any) => void
}

export function SignupConfigForm({ config, updateConfig }: SignupConfigFormProps) {
  return (
    <AccordionProvider>
      <div className="space-y-6">
        {/* Form Fields */}
        <AccordionSection 
          title="Form Fields"
          description="Configure which fields appear in the signup form"
          sectionId="signup-form-fields"
        >
          <div className="space-y-4">
            {/* Show Name Field */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="showNameField">Show Name Field</Label>
                <p className="text-sm text-gray-500">Display full name input field</p>
              </div>
              <Switch
                id="showNameField"
                checked={config.signup?.showNameField !== false}
                onCheckedChange={(checked) => updateConfig('signup', 'showNameField', checked)}
              />
            </div>

            {/* Show Email Field */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="showEmailField">Show Email Field</Label>
                <p className="text-sm text-gray-500">Display email input field</p>
              </div>
              <Switch
                id="showEmailField"
                checked={config.signup?.showEmailField !== false}
                onCheckedChange={(checked) => updateConfig('signup', 'showEmailField', checked)}
              />
            </div>

            {/* Show Phone Field */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="showPhoneField">Show Phone Field</Label>
                <p className="text-sm text-gray-500">Display phone number input field</p>
              </div>
              <Switch
                id="showPhoneField"
                checked={config.signup?.showPhoneField || false}
                onCheckedChange={(checked) => updateConfig('signup', 'showPhoneField', checked)}
              />
            </div>

            {/* Show Company Field */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="showCompanyField">Show Company Field</Label>
                <p className="text-sm text-gray-500">Display company input field</p>
              </div>
              <Switch
                id="showCompanyField"
                checked={config.signup?.showCompanyField || false}
                onCheckedChange={(checked) => updateConfig('signup', 'showCompanyField', checked)}
              />
            </div>

            {/* Show Password Field */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="showPasswordField">Show Password Field</Label>
                <p className="text-sm text-gray-500">Display password input field</p>
              </div>
              <Switch
                id="showPasswordField"
                checked={config.signup?.showPasswordField !== false}
                onCheckedChange={(checked) => updateConfig('signup', 'showPasswordField', checked)}
              />
            </div>

            {/* Show Confirm Password Field */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="showConfirmPasswordField">Show Confirm Password Field</Label>
                <p className="text-sm text-gray-500">Display password confirmation field</p>
              </div>
              <Switch
                id="showConfirmPasswordField"
                checked={config.signup?.showConfirmPasswordField !== false}
                onCheckedChange={(checked) => updateConfig('signup', 'showConfirmPasswordField', checked)}
              />
            </div>

            {/* Show Terms Checkbox */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="showTermsCheckbox">Show Terms Checkbox</Label>
                <p className="text-sm text-gray-500">Display terms and conditions checkbox</p>
              </div>
              <Switch
                id="showTermsCheckbox"
                checked={config.signup?.showTermsCheckbox !== false}
                onCheckedChange={(checked) => updateConfig('signup', 'showTermsCheckbox', checked)}
              />
            </div>

            {/* Show Privacy Checkbox */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="showPrivacyCheckbox">Show Privacy Checkbox</Label>
                <p className="text-sm text-gray-500">Display privacy policy checkbox</p>
              </div>
              <Switch
                id="showPrivacyCheckbox"
                checked={config.signup?.showPrivacyCheckbox || false}
                onCheckedChange={(checked) => updateConfig('signup', 'showPrivacyCheckbox', checked)}
              />
            </div>
          </div>
        </AccordionSection>

        {/* Field Labels and Placeholders */}
        <AccordionSection 
          title="Field Labels & Placeholders"
          description="Customize text labels and placeholder text"
          sectionId="signup-field-labels"
        >
          <div className="space-y-4">
            {/* Name Placeholder */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-4">
                <Label htmlFor="namePlaceholder">Name Placeholder</Label>
                <p className="text-xs text-gray-500 mt-1">Full name field placeholder</p>
              </div>
              <div className="col-span-8">
                <Input
                  id="namePlaceholder"
                  value={config.signup?.namePlaceholder || 'Full name'}
                  onChange={(e) => updateConfig('signup', 'namePlaceholder', e.target.value)}
                  placeholder="Full name"
                />
              </div>
            </div>

            {/* Email Placeholder */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-4">
                <Label htmlFor="emailPlaceholder">Email Placeholder</Label>
                <p className="text-xs text-gray-500 mt-1">Email field placeholder</p>
              </div>
              <div className="col-span-8">
                <Input
                  id="emailPlaceholder"
                  value={config.signup?.emailPlaceholder || 'Email address'}
                  onChange={(e) => updateConfig('signup', 'emailPlaceholder', e.target.value)}
                  placeholder="Email address"
                />
              </div>
            </div>

            {/* Phone Placeholder */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-4">
                <Label htmlFor="phonePlaceholder">Phone Placeholder</Label>
                <p className="text-xs text-gray-500 mt-1">Phone field placeholder</p>
              </div>
              <div className="col-span-8">
                <Input
                  id="phonePlaceholder"
                  value={config.signup?.phonePlaceholder || 'Phone number'}
                  onChange={(e) => updateConfig('signup', 'phonePlaceholder', e.target.value)}
                  placeholder="Phone number"
                />
              </div>
            </div>

            {/* Company Placeholder */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-4">
                <Label htmlFor="companyPlaceholder">Company Placeholder</Label>
                <p className="text-xs text-gray-500 mt-1">Company field placeholder</p>
              </div>
              <div className="col-span-8">
                <Input
                  id="companyPlaceholder"
                  value={config.signup?.companyPlaceholder || 'Company name'}
                  onChange={(e) => updateConfig('signup', 'companyPlaceholder', e.target.value)}
                  placeholder="Company name"
                />
              </div>
            </div>

            {/* Password Placeholder */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-4">
                <Label htmlFor="passwordPlaceholder">Password Placeholder</Label>
                <p className="text-xs text-gray-500 mt-1">Password field placeholder</p>
              </div>
              <div className="col-span-8">
                <Input
                  id="passwordPlaceholder"
                  value={config.signup?.passwordPlaceholder || 'Create a password'}
                  onChange={(e) => updateConfig('signup', 'passwordPlaceholder', e.target.value)}
                  placeholder="Create a password"
                />
              </div>
            </div>

            {/* Confirm Password Placeholder */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-4">
                <Label htmlFor="confirmPasswordPlaceholder">Confirm Password Placeholder</Label>
                <p className="text-xs text-gray-500 mt-1">Confirm password field placeholder</p>
              </div>
              <div className="col-span-8">
                <Input
                  id="confirmPasswordPlaceholder"
                  value={config.signup?.confirmPasswordPlaceholder || 'Confirm your password'}
                  onChange={(e) => updateConfig('signup', 'confirmPasswordPlaceholder', e.target.value)}
                  placeholder="Confirm your password"
                />
              </div>
            </div>
          </div>
        </AccordionSection>

        {/* Button Configuration */}
        <AccordionSection 
          title="Button Configuration"
          description="Customize signup button text and style"
          sectionId="signup-button-config"
        >
          <div className="space-y-4">
            {/* Submit Button Text */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-4">
                <Label htmlFor="submitButtonText">Submit Button Text</Label>
                <p className="text-xs text-gray-500 mt-1">Text on the signup button</p>
              </div>
              <div className="col-span-8">
                <Input
                  id="submitButtonText"
                  value={config.signup?.submitButtonText || 'Create Account'}
                  onChange={(e) => updateConfig('signup', 'submitButtonText', e.target.value)}
                  placeholder="Create Account"
                />
              </div>
            </div>

            {/* Sign In Link Text */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-4">
                <Label htmlFor="signInLinkText">Sign In Link Text</Label>
                <p className="text-xs text-gray-500 mt-1">Text for sign in link</p>
              </div>
              <div className="col-span-8">
                <Input
                  id="signInLinkText"
                  value={config.signup?.signInLinkText || 'Already have an account? Sign in'}
                  onChange={(e) => updateConfig('signup', 'signInLinkText', e.target.value)}
                  placeholder="Already have an account? Sign in"
                />
              </div>
            </div>

            {/* Terms Link Text */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-4">
                <Label htmlFor="termsLinkText">Terms Link Text</Label>
                <p className="text-xs text-gray-500 mt-1">Terms and conditions link text</p>
              </div>
              <div className="col-span-8">
                <Input
                  id="termsLinkText"
                  value={config.signup?.termsLinkText || 'Terms of Service'}
                  onChange={(e) => updateConfig('signup', 'termsLinkText', e.target.value)}
                  placeholder="Terms of Service"
                />
              </div>
            </div>

            {/* Privacy Link Text */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-4">
                <Label htmlFor="privacyLinkText">Privacy Link Text</Label>
                <p className="text-xs text-gray-500 mt-1">Privacy policy link text</p>
              </div>
              <div className="col-span-8">
                <Input
                  id="privacyLinkText"
                  value={config.signup?.privacyLinkText || 'Privacy Policy'}
                  onChange={(e) => updateConfig('signup', 'privacyLinkText', e.target.value)}
                  placeholder="Privacy Policy"
                />
              </div>
            </div>

            {/* Button Style */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-4">
                <Label htmlFor="buttonStyle">Button Style</Label>
                <p className="text-xs text-gray-500 mt-1">Visual style of submit button</p>
              </div>
              <div className="col-span-8">
                <Select value={config.signup?.buttonStyle || 'primary'} onValueChange={(value) => updateConfig('signup', 'buttonStyle', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primary</SelectItem>
                    <SelectItem value="secondary">Secondary</SelectItem>
                    <SelectItem value="outline">Outline</SelectItem>
                    <SelectItem value="ghost">Ghost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Button Size */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-4">
                <Label htmlFor="buttonSize">Button Size</Label>
                <p className="text-xs text-gray-500 mt-1">Size of submit button</p>
              </div>
              <div className="col-span-8">
                <Select value={config.signup?.buttonSize || 'medium'} onValueChange={(value) => updateConfig('signup', 'buttonSize', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Full Width Button */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="buttonFullWidth">Full Width Button</Label>
                <p className="text-sm text-gray-500">Make submit button full width</p>
              </div>
              <Switch
                id="buttonFullWidth"
                checked={config.signup?.buttonFullWidth || false}
                onCheckedChange={(checked) => updateConfig('signup', 'buttonFullWidth', checked)}
              />
            </div>
          </div>
        </AccordionSection>

        {/* Social Login Configuration */}
        <AccordionSection 
          title="Social Login"
          description="Configure social media signup options"
          sectionId="signup-social-login"
        >
          <div className="space-y-4">
            {/* Show SSO Toggle */}
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-1">
                <Label htmlFor="signup-showSSO">Show SSO Button</Label>
                <p className="text-sm text-gray-500">Enable or disable the "Continue with SSO" option</p>
              </div>
              <Switch
                id="signup-showSSO"
                checked={config.signup?.showSSO !== false}
                onCheckedChange={(checked) => updateConfig('signup', 'showSSO', checked)}
              />
            </div>

            {/* Show Social Login */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="showSocialLogin">Show Social Login</Label>
                <p className="text-sm text-gray-500">Display social media signup options</p>
              </div>
              <Switch
                id="showSocialLogin"
                checked={config.signup?.showSocialLogin || false}
                onCheckedChange={(checked) => updateConfig('signup', 'showSocialLogin', checked)}
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
                  value={config.signup?.socialLoginText || 'Or sign up with'}
                  onChange={(e) => updateConfig('signup', 'socialLoginText', e.target.value)}
                  placeholder="Or sign up with"
                />
              </div>
            </div>

            {/* SSO Button Layout */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-4">
                <Label htmlFor="signup-ssoLayout">SSO Button Layout</Label>
                <p className="text-xs text-gray-500 mt-1">Choose layout for social buttons</p>
              </div>
              <div className="col-span-8">
                <select
                  id="signup-ssoLayout"
                  value={config.signup?.ssoLayout || 'vertical'}
                  onChange={(e) => updateConfig('signup', 'ssoLayout', e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="vertical">Vertical (Full Width)</option>
                  <option value="horizontal">Horizontal (Grid/Side-by-side)</option>
                </select>
              </div>
            </div>

            {/* Available Social Providers */}
            {config.signup?.showSocialLogin && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Available Social Providers</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {['Google', 'Microsoft', 'Apple', 'GitHub', 'LinkedIn', 'Okta', 'SAML', 'OIDC'].map((provider: string) => (
                      <div key={provider} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm font-medium">{provider}</span>
                        <Switch
                          id={`sso-${provider.toLowerCase()}`}
                          checked={config.signup?.socialProviders?.includes(provider) || false}
                          onCheckedChange={(checked) => {
                            const currentProviders: string[] = config.signup?.socialProviders || []
                            if (checked) {
                              updateConfig('signup', 'socialProviders', [...currentProviders, provider])
                            } else {
                              updateConfig('signup', 'socialProviders', currentProviders.filter((p: string) => p !== provider))
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Individual Social Provider Logos */}
                {(config.signup?.socialProviders?.length || 0) > 0 && (
                  <div className="space-y-3 pt-4 border-t">
                    <Label className="text-sm font-semibold">Individual Provider Logos</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {config.signup?.socialProviders?.map((provider: string) => (
                        <div key={provider} className="p-3 border rounded-lg bg-gray-50/50 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">{provider}</span>
                            {config.signup?.socialProviderLogos?.[provider] ? (
                              <div className="flex items-center gap-1">
                                <img 
                                  src={config.signup.socialProviderLogos[provider]} 
                                  alt={`${provider} Logo`} 
                                  className="h-6 w-6 object-contain border rounded bg-white"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const newLogos = { ...(config.signup?.socialProviderLogos || {}) }
                                    delete newLogos[provider]
                                    updateConfig('signup', 'socialProviderLogos', newLogos)
                                  }}
                                  className="h-6 w-6 p-0 text-red-500"
                                >
                                  <Upload className="h-3 w-3 rotate-180" />
                                </Button>
                              </div>
                            ) : null}
                          </div>
                          <input
                            type="file"
                            id={`signup-logo-${provider.toLowerCase()}`}
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                const reader = new FileReader()
                                reader.onload = (e) => {
                                  const newLogos = { ...(config.signup?.socialProviderLogos || {}) }
                                  newLogos[provider] = e.target?.result as string
                                  updateConfig('signup', 'socialProviderLogos', newLogos)
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
                            onClick={() => document.getElementById(`signup-logo-${provider.toLowerCase()}`)?.click()}
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            {config.branding?.providerLogos?.[provider] ? 'Change' : 'Upload'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </AccordionSection>

        {/* Validation Configuration */}
        <AccordionSection 
          title="Validation"
          description="Configure form validation rules"
          sectionId="signup-validation"
        >
          <div className="space-y-4">
            {/* Enable Validation */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="enableValidation">Enable Validation</Label>
                <p className="text-sm text-gray-500">Enable client-side form validation</p>
              </div>
              <Switch
                id="enableValidation"
                checked={config.signup?.enableValidation !== false}
                onCheckedChange={(checked) => updateConfig('signup', 'enableValidation', checked)}
              />
            </div>

            {/* Password Requirements */}
            <div className="space-y-3">
              <Label>Password Requirements</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Minimum Length</span>
                  <Input
                    type="number"
                    value={config.signup?.passwordMinLength || 8}
                    onChange={(e) => updateConfig('signup', 'passwordMinLength', parseInt(e.target.value))}
                    className="w-20"
                    min="4"
                    max="32"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Require Uppercase</span>
                  <Switch
                    checked={config.signup?.passwordRequireUppercase || false}
                    onCheckedChange={(checked) => updateConfig('signup', 'passwordRequireUppercase', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Require Lowercase</span>
                  <Switch
                    checked={config.signup?.passwordRequireLowercase || false}
                    onCheckedChange={(checked) => updateConfig('signup', 'passwordRequireLowercase', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Require Numbers</span>
                  <Switch
                    checked={config.signup?.passwordRequireNumbers || false}
                    onCheckedChange={(checked) => updateConfig('signup', 'passwordRequireNumbers', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Require Special Characters</span>
                  <Switch
                    checked={config.signup?.passwordRequireSpecialChars || false}
                    onCheckedChange={(checked) => updateConfig('signup', 'passwordRequireSpecialChars', checked)}
                  />
                </div>
              </div>
            </div>

            {/* Email Validation */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="validateEmailDomain">Validate Email Domain</Label>
                <p className="text-sm text-gray-500">Check if email domain is valid</p>
              </div>
              <Switch
                id="validateEmailDomain"
                checked={config.signup?.validateEmailDomain || false}
                onCheckedChange={(checked) => updateConfig('signup', 'validateEmailDomain', checked)}
              />
            </div>

            {/* Phone Validation */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="validatePhoneFormat">Validate Phone Format</Label>
                <p className="text-sm text-gray-500">Check if phone number format is valid</p>
              </div>
              <Switch
                id="validatePhoneFormat"
                checked={config.signup?.validatePhoneFormat || false}
                onCheckedChange={(checked) => updateConfig('signup', 'validatePhoneFormat', checked)}
              />
            </div>
          </div>
        </AccordionSection>

        {/* Compliance & Legal */}
        <AccordionSection
          title="Compliance & Legal"
          description="Configure legal notices, policies, and compliance markers"
          sectionId="signup-compliance-legal"
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50/50">
              <div className="space-y-1">
                <Label>Cookie Consent Flag</Label>
                <p className="text-sm text-gray-500 font-normal">Show cookie notice on the signup page</p>
              </div>
              <Switch
                checked={config.signup?.showCookieConsent || false}
                onCheckedChange={(checked) => updateConfig('signup', 'showCookieConsent', checked)}
              />
            </div>

            {config.signup?.showCookieConsent && (
              <div className="grid grid-cols-12 gap-4 items-start pl-4 border-l-2">
                <div className="col-span-4">
                  <Label>Consent Text</Label>
                </div>
                <div className="col-span-8">
                  <Input
                    value={config.signup?.cookieConsentText || ''}
                    onChange={(e) => updateConfig('signup', 'cookieConsentText', e.target.value)}
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
                    checked={config.signup?.showTermsCheckbox || false}
                    onCheckedChange={(checked) => updateConfig('signup', 'showTermsCheckbox', checked)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Privacy</span>
                  <Switch
                    checked={config.signup?.showPrivacyCheckbox || false}
                    onCheckedChange={(checked) => updateConfig('signup', 'showPrivacyCheckbox', checked)}
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
                checked={config.signup?.showGDPR || false}
                onCheckedChange={(checked) => updateConfig('signup', 'showGDPR', checked)}
              />
            </div>
          </div>
        </AccordionSection>

        {/* Accessibility Features */}
        <AccordionSection
          title="Accessibility Features"
          description="Optimize the signup experience for all users"
          sectionId="signup-accessibility-settings"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Screen Reader Support</Label>
                <p className="text-sm text-gray-500 font-normal">Optimize ARIA labels and focus management</p>
              </div>
              <Switch
                checked={config.signup?.showScreenReaderSupport || false}
                onCheckedChange={(checked) => updateConfig('signup', 'showScreenReaderSupport', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>High Contrast Mode</Label>
                <p className="text-sm text-gray-500 font-normal">Force high contrast colors for better visibility</p>
              </div>
              <Switch
                checked={config.signup?.showHighContrast || false}
                onCheckedChange={(checked) => updateConfig('signup', 'showHighContrast', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Font Size Controls</Label>
                <p className="text-sm text-gray-500 font-normal">Show font size adjustment buttons</p>
              </div>
              <Switch
                checked={config.signup?.showFontSizeControls || false}
                onCheckedChange={(checked) => updateConfig('signup', 'showFontSizeControls', checked)}
              />
            </div>
          </div>
        </AccordionSection>
      </div>
    </AccordionProvider>
  )
}
