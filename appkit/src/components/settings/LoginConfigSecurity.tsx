'use client'

import React from 'react'
import { Input } from '../ui/Input'
import { Label } from '../ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select'
import { Switch } from '../ui/switch'
import { Separator } from '../ui/Separator'
import { LoginConfig } from './LoginConfigTypes'

interface LoginConfigSecurityProps {
  config: Partial<LoginConfig>
  updateConfig: (section: keyof LoginConfig, field: string, value: any) => void
}

export function LoginConfigSecurity({ config, updateConfig }: LoginConfigSecurityProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Security Settings</h3>
      
      {/* Authentication Security */}
      <div className="space-y-4">
        <h4 className="text-md font-medium">Authentication Security</h4>
        
        {/* Enable Two Factor */}
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="enableTwoFactor">Enable Two-Factor Authentication</Label>
          </div>
          <div className="col-span-8">
            <Switch
              id="enableTwoFactor"
              checked={config.security?.enableTwoFactor || false}
              onCheckedChange={(checked) => updateConfig('security', 'enableTwoFactor', checked)}
            />
          </div>
        </div>

        {/* Enable Captcha */}
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="enableCaptcha">Enable Captcha</Label>
          </div>
          <div className="col-span-8">
            <Switch
              id="enableCaptcha"
              checked={config.security?.enableCaptcha || false}
              onCheckedChange={(checked) => updateConfig('security', 'enableCaptcha', checked)}
            />
          </div>
        </div>

        {/* Enable Rate Limit */}
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="enableRateLimit">Enable Rate Limiting</Label>
          </div>
          <div className="col-span-8">
            <Switch
              id="enableRateLimit"
              checked={config.security?.enableRateLimit || false}
              onCheckedChange={(checked) => updateConfig('security', 'enableRateLimit', checked)}
            />
          </div>
        </div>

        {/* Enable Session Management */}
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="enableSessionManagement">Enable Session Management</Label>
          </div>
          <div className="col-span-8">
            <Switch
              id="enableSessionManagement"
              checked={config.security?.enableSessionManagement || false}
              onCheckedChange={(checked) => updateConfig('security', 'enableSessionManagement', checked)}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Password Security */}
      <div className="space-y-4">
        <h4 className="text-md font-medium">Password Security</h4>
        
        {/* Enable Password Strength */}
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="enablePasswordStrength">Enable Password Strength</Label>
          </div>
          <div className="col-span-8">
            <Switch
              id="enablePasswordStrength"
              checked={config.security?.enablePasswordStrength || false}
              onCheckedChange={(checked) => updateConfig('security', 'enablePasswordStrength', checked)}
            />
          </div>
        </div>

        {/* Enable Account Lockout */}
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="enableAccountLockout">Enable Account Lockout</Label>
          </div>
          <div className="col-span-8">
            <Switch
              id="enableAccountLockout"
              checked={config.security?.enableAccountLockout || false}
              onCheckedChange={(checked) => updateConfig('security', 'enableAccountLockout', checked)}
            />
          </div>
        </div>

        {/* Password Min Length */}
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="passwordMinLength">Password Min Length</Label>
          </div>
          <div className="col-span-8">
            <Input
              id="passwordMinLength"
              type="number"
              min="6"
              max="50"
              value={config.security?.passwordMinLength || 8}
              onChange={(e) => updateConfig('security', 'passwordMinLength', parseInt(e.target.value))}
              placeholder="8"
            />
          </div>
        </div>

        {/* Password Requirements */}
        <div className="space-y-4">
          <h5 className="text-sm font-medium text-gray-600">Password Requirements</h5>
          
          {/* Require Uppercase */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="passwordRequireUppercase">Require Uppercase</Label>
            </div>
            <div className="col-span-8">
              <Switch
                id="passwordRequireUppercase"
                checked={config.security?.passwordRequireUppercase || false}
                onCheckedChange={(checked) => updateConfig('security', 'passwordRequireUppercase', checked)}
              />
            </div>
          </div>

          {/* Require Lowercase */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="passwordRequireLowercase">Require Lowercase</Label>
            </div>
            <div className="col-span-8">
              <Switch
                id="passwordRequireLowercase"
                checked={config.security?.passwordRequireLowercase || false}
                onCheckedChange={(checked) => updateConfig('security', 'passwordRequireLowercase', checked)}
              />
            </div>
          </div>

          {/* Require Numbers */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="passwordRequireNumbers">Require Numbers</Label>
            </div>
            <div className="col-span-8">
              <Switch
                id="passwordRequireNumbers"
                checked={config.security?.passwordRequireNumbers || false}
                onCheckedChange={(checked) => updateConfig('security', 'passwordRequireNumbers', checked)}
              />
            </div>
          </div>

          {/* Require Special Chars */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="passwordRequireSpecialChars">Require Special Characters</Label>
            </div>
            <div className="col-span-8">
              <Switch
                id="passwordRequireSpecialChars"
                checked={config.security?.passwordRequireSpecialChars || false}
                onCheckedChange={(checked) => updateConfig('security', 'passwordRequireSpecialChars', checked)}
              />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Session Settings */}
      <div className="space-y-4">
        <h4 className="text-md font-medium">Session Settings</h4>
        
        {/* Session Timeout */}
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
          </div>
          <div className="col-span-8">
            <Input
              id="sessionTimeout"
              type="number"
              min="5"
              max="1440"
              value={config.security?.sessionTimeout || 30}
              onChange={(e) => updateConfig('security', 'sessionTimeout', parseInt(e.target.value))}
              placeholder="30"
            />
          </div>
        </div>

        {/* Max Login Attempts */}
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
          </div>
          <div className="col-span-8">
            <Input
              id="maxLoginAttempts"
              type="number"
              min="3"
              max="10"
              value={config.security?.maxLoginAttempts || 5}
              onChange={(e) => updateConfig('security', 'maxLoginAttempts', parseInt(e.target.value))}
              placeholder="5"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Advanced Security */}
      <div className="space-y-4">
        <h4 className="text-md font-medium">Advanced Security</h4>
        
        {/* Enable Audit Log */}
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="enableAuditLog">Enable Audit Log</Label>
          </div>
          <div className="col-span-8">
            <Switch
              id="enableAuditLog"
              checked={config.security?.enableAuditLog || false}
              onCheckedChange={(checked) => updateConfig('security', 'enableAuditLog', checked)}
            />
          </div>
        </div>

        {/* Enable Encryption */}
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="enableEncryption">Enable Encryption</Label>
          </div>
          <div className="col-span-8">
            <Switch
              id="enableEncryption"
              checked={config.security?.enableEncryption || false}
              onCheckedChange={(checked) => updateConfig('security', 'enableEncryption', checked)}
            />
          </div>
        </div>

        {/* Enable Secure Cookies */}
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="enableSecureCookies">Enable Secure Cookies</Label>
          </div>
          <div className="col-span-8">
            <Switch
              id="enableSecureCookies"
              checked={config.security?.enableSecureCookies || false}
              onCheckedChange={(checked) => updateConfig('security', 'enableSecureCookies', checked)}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Protection Settings */}
      <div className="space-y-4">
        <h4 className="text-md font-medium">Protection Settings</h4>
        
        {/* Enable CSRF Protection */}
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="enableCSRFProtection">Enable CSRF Protection</Label>
          </div>
          <div className="col-span-8">
            <Switch
              id="enableCSRFProtection"
              checked={config.security?.enableCSRFProtection || false}
              onCheckedChange={(checked) => updateConfig('security', 'enableCSRFProtection', checked)}
            />
          </div>
        </div>

        {/* Enable XSS Protection */}
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="enableXSSProtection">Enable XSS Protection</Label>
          </div>
          <div className="col-span-8">
            <Switch
              id="enableXSSProtection"
              checked={config.security?.enableXSSProtection || false}
              onCheckedChange={(checked) => updateConfig('security', 'enableXSSProtection', checked)}
            />
          </div>
        </div>

        {/* Enable SQL Injection Protection */}
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="enableSQLInjectionProtection">Enable SQL Injection Protection</Label>
          </div>
          <div className="col-span-8">
            <Switch
              id="enableSQLInjectionProtection"
              checked={config.security?.enableSQLInjectionProtection || false}
              onCheckedChange={(checked) => updateConfig('security', 'enableSQLInjectionProtection', checked)}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Authentication Methods */}
      <div className="space-y-4">
        <h4 className="text-md font-medium">Authentication Methods</h4>
        
        {/* Two Factor Methods */}
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="twoFactorMethods">Two-Factor Methods</Label>
          </div>
          <div className="col-span-8">
            <Select value={config.security?.twoFactorMethods?.[0] || 'totp'} onValueChange={(value) => updateConfig('security', 'twoFactorMethods', [value])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="totp">TOTP (Time-based)</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="push">Push Notification</SelectItem>
                <SelectItem value="backup">Backup Codes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Captcha Provider */}
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="captchaProvider">Captcha Provider</Label>
          </div>
          <div className="col-span-8">
            <Select value={config.security?.captchaProvider || 'recaptcha'} onValueChange={(value) => updateConfig('security', 'captchaProvider', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recaptcha">reCAPTCHA</SelectItem>
                <SelectItem value="hcaptcha">hCaptcha</SelectItem>
                <SelectItem value="turnstile">Cloudflare Turnstile</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Encryption Algorithm */}
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="encryptionAlgorithm">Encryption Algorithm</Label>
          </div>
          <div className="col-span-8">
            <Select value={config.security?.encryptionAlgorithm || 'aes256'} onValueChange={(value) => updateConfig('security', 'encryptionAlgorithm', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aes256">AES-256</SelectItem>
                <SelectItem value="aes128">AES-128</SelectItem>
                <SelectItem value="chacha20">ChaCha20</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
