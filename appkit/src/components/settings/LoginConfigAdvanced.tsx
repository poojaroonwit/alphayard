'use client'

import React from 'react'
import { AccordionProvider, AccordionSection } from './AccordionSection'
import { Switch } from '../ui/switch'
import { Label } from '../ui/Label'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/Button'
import { Code, Bug, BarChart, Bell, Database, Globe, Layers, Shield, Zap } from 'lucide-react'
import { WebhookConfig } from './WebhookConfigV2'
import { ExternalIntegrations } from './ExternalIntegrations'

import { LoginConfig } from './LoginConfigTypes'

interface SignupConfigBrandingProps {
  config: any
  updateConfig: (section: keyof LoginConfig, field: string, value: any) => void
}

interface LoginConfigAdvancedProps {
  config: any
  updateConfig: (section: keyof LoginConfig, field: string, value: any) => void
}

export function LoginConfigAdvanced({ config, updateConfig }: LoginConfigAdvancedProps) {
  return (
    <AccordionProvider>
      <div className="space-y-6">
        {/* Development & Debugging */}
        <AccordionSection 
          title="Development & Debugging"
          description="Enable tools for troubleshooting and monitoring"
          sectionId="advanced-debug"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="enableDebugMode">Enable Debug Mode</Label>
                <p className="text-sm text-gray-500">Show detailed error messages and logs</p>
              </div>
              <Switch
                id="enableDebugMode"
                checked={config.advanced?.enableDebugMode || false}
                onCheckedChange={(checked) => updateConfig('advanced', 'enableDebugMode', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="enableAnalytics">Enable Analytics</Label>
                <p className="text-sm text-gray-500">Track user behavior and conversion</p>
              </div>
              <Switch
                id="enableAnalytics"
                checked={config.advanced?.enableAnalytics !== false}
                onCheckedChange={(checked) => updateConfig('advanced', 'enableAnalytics', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="enableLogging">Enable Remote Logging</Label>
                <p className="text-sm text-gray-500">Send logs to your monitoring server</p>
              </div>
              <Switch
                id="enableLogging"
                checked={config.advanced?.enableLogging || false}
                onCheckedChange={(checked) => updateConfig('advanced', 'enableLogging', checked)}
              />
            </div>
          </div>
        </AccordionSection>

        {/* Custom Code */}
        <AccordionSection 
          title="Custom Code"
          description="Inject custom CSS and JavaScript into the login page"
          sectionId="advanced-code"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Code className="h-4 w-4 text-gray-500" />
                <Label htmlFor="customCSS">Custom CSS</Label>
              </div>
              <Textarea
                id="customCSS"
                value={config.advanced?.customCSS || ''}
                onChange={(e) => updateConfig('advanced', 'customCSS', e.target.value)}
                placeholder="/* Add your custom styles here */"
                rows={6}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-4 w-4 text-gray-500" />
                <Label htmlFor="customJS">Custom JavaScript</Label>
              </div>
              <Textarea
                id="customJS"
                value={config.advanced?.customJS || ''}
                onChange={(e) => updateConfig('advanced', 'customJS', e.target.value)}
                placeholder="// Add your custom scripts here"
                rows={6}
                className="font-mono text-sm"
              />
            </div>
          </div>
        </AccordionSection>

        {/* Optimizations */}
        <AccordionSection 
          title="Performance & Optimizations"
          description="Configure caching and delivery settings"
          sectionId="advanced-performance"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="enableCDN">Enable Content Delivery Network (CDN)</Label>
                <p className="text-sm text-gray-500">Serve static assets through a global CDN</p>
              </div>
              <Switch
                id="enableCDN"
                checked={config.advanced?.enableCDN !== false}
                onCheckedChange={(checked) => updateConfig('advanced', 'enableCDN', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="enableLazyLoading">Enable Lazy Loading</Label>
                <p className="text-sm text-gray-500">Load non-critical images and scripts only when needed</p>
              </div>
              <Switch
                id="enableLazyLoading"
                checked={config.advanced?.enableLazyLoading !== false}
                onCheckedChange={(checked) => updateConfig('advanced', 'enableLazyLoading', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="enableAPICaching">API Response Caching</Label>
                <p className="text-sm text-gray-500">Cache configuration and metadata locally</p>
              </div>
              <Switch
                id="enableAPICaching"
                checked={config.advanced?.enableAPICaching || false}
                onCheckedChange={(checked) => updateConfig('advanced', 'enableAPICaching', checked)}
              />
            </div>
          </div>
        </AccordionSection>

        {/* System & API */}
        <AccordionSection 
          title="Webhooks"
          description="Configure webhook endpoints for real-time event notifications"
          sectionId="advanced-webhooks"
        >
          <WebhookConfig appId={config.appId} onSave={(webhooks) => {
            console.log('Webhooks saved:', webhooks)
            // Handle webhook save
          }} />
        </AccordionSection>

        <AccordionSection 
          title="External Integrations"
          description="Connect with analytics, marketing, and support services"
          sectionId="advanced-external"
        >
          <ExternalIntegrations appId={config.appId} onSave={(integrations) => {
            console.log('Integrations saved:', integrations)
            // Handle integrations save
          }} />
        </AccordionSection>
      </div>
    </AccordionProvider>
  )
}
