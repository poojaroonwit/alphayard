'use client'

import React from 'react'
import { Switch } from '../ui/switch'
import { Label } from '../ui/Label'
import { Input } from '../ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { Monitor, Smartphone, Tablet } from 'lucide-react'
import { AccordionProvider, AccordionSection } from './AccordionSection'

import { LoginConfig } from './LoginConfigTypes'

interface LoginConfigResponsiveProps {
  config: any
  updateConfig: (section: keyof LoginConfig, field: string, value: any) => void
}

export function LoginConfigResponsive({ config, updateConfig }: LoginConfigResponsiveProps) {
  return (
    <AccordionProvider>
      <div className="space-y-6">
        {/* Responsive Settings */}
        <AccordionSection 
          title="Responsive Configuration"
          description="Enable device-specific settings for different screen sizes"
          sectionId="responsive-settings"
        >
          <div className="space-y-4">
            {/* Enable Responsive Config */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="enableResponsiveConfig">Enable Device-Specific Config</Label>
                <p className="text-sm text-gray-500">
                  Allow different settings for desktop, mobile, and tablet
                </p>
              </div>
              <Switch
                id="enableResponsiveConfig"
                checked={config.responsive?.enableResponsiveConfig || false}
                onCheckedChange={(checked) => updateConfig('responsive', 'enableResponsiveConfig', checked)}
              />
            </div>

            {config.responsive?.enableResponsiveConfig && (
              <>
                {/* Breakpoint Settings */}
                <div className="grid grid-cols-12 gap-4 items-start">
                  <div className="col-span-4">
                    <Label htmlFor="breakpointMobile">Mobile Breakpoint</Label>
                    <p className="text-xs text-gray-500 mt-1">Max width for mobile devices</p>
                  </div>
                  <div className="col-span-8">
                    <Input
                      id="breakpointMobile"
                      value={config.responsive?.breakpointMobile || '768px'}
                      onChange={(e) => updateConfig('responsive', 'breakpointMobile', e.target.value)}
                      placeholder="768px"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-4 items-start">
                  <div className="col-span-4">
                    <Label htmlFor="breakpointTablet">Tablet Breakpoint</Label>
                    <p className="text-xs text-gray-500 mt-1">Max width for tablet devices</p>
                  </div>
                  <div className="col-span-8">
                    <Input
                      id="breakpointTablet"
                      value={config.responsive?.breakpointTablet || '1024px'}
                      onChange={(e) => updateConfig('responsive', 'breakpointTablet', e.target.value)}
                      placeholder="1024px"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-4 items-start">
                  <div className="col-span-4">
                    <Label htmlFor="breakpointDesktop">Desktop Breakpoint</Label>
                    <p className="text-xs text-gray-500 mt-1">Min width for desktop devices</p>
                  </div>
                  <div className="col-span-8">
                    <Input
                      id="breakpointDesktop"
                      value={config.responsive?.breakpointDesktop || '1025px'}
                      onChange={(e) => updateConfig('responsive', 'breakpointDesktop', e.target.value)}
                      placeholder="1025px"
                    />
                  </div>
                </div>

                {/* Device Overview */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-900 mb-3">Device Configuration Overview</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Mobile</p>
                        <p className="text-xs text-blue-700">≤ {config.responsive?.breakpointMobile || '768px'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Tablet className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Tablet</p>
                        <p className="text-xs text-blue-700">
                          {parseInt(config.responsive?.breakpointMobile || '768') + 1}px - {config.responsive?.breakpointTablet || '1024px'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Monitor className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Desktop</p>
                        <p className="text-xs text-blue-700">≥ {config.responsive?.breakpointDesktop || '1025px'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </AccordionSection>

        {/* Device Configuration Status */}
        {config.responsive?.enableResponsiveConfig && (
          <AccordionSection 
            title="Device Configuration Status"
            description="Current configuration status for each device"
            sectionId="device-status"
          >
            <div className="space-y-4">
              {['desktop', 'mobile', 'tablet'].map((device) => {
                const deviceConfig = config[device as keyof typeof config]
                const hasConfig = deviceConfig && Object.keys(deviceConfig).length > 0
                
                return (
                  <div key={device} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {device === 'desktop' && <Monitor className="h-5 w-5 text-gray-600" />}
                      {device === 'mobile' && <Smartphone className="h-5 w-5 text-gray-600" />}
                      {device === 'tablet' && <Tablet className="h-5 w-5 text-gray-600" />}
                      <div>
                        <p className="font-medium capitalize">{device}</p>
                        <p className="text-sm text-gray-500">
                          {hasConfig ? 'Custom configuration applied' : 'Using default configuration'}
                        </p>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      hasConfig 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {hasConfig ? 'Configured' : 'Default'}
                    </div>
                  </div>
                )
              })}
            </div>
          </AccordionSection>
        )}
      </div>
    </AccordionProvider>
  )
}
