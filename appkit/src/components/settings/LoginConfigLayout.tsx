'use client'

import React from 'react'
import { Input } from '../ui/Input'
import { Label } from '../ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select'
import { Switch } from '../ui/switch'
import { LoginConfig } from './LoginConfigTypes'
import { AccordionSection, AccordionProvider } from './AccordionSection'

interface LoginConfigLayoutProps {
  config: Partial<LoginConfig>
  updateConfig: (section: keyof LoginConfig, field: string, value: any) => void
}

export function LoginConfigLayout({ config, updateConfig }: LoginConfigLayoutProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Layout Settings</h3>
      
      <AccordionProvider>
        {/* Basic Layout */}
        <AccordionSection 
          title="Basic Layout" 
          description="Fundamental layout and sizing options"
          sectionId="basic-layout"
          defaultOpen={true}
        >
        <div className="space-y-4">
          {/* Layout Type */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="layoutType">Layout Type</Label>
            </div>
            <div className="col-span-8">
              <Select value={config.layout?.layout || 'centered'} onValueChange={(value: any) => updateConfig('layout', 'layout', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="centered">Centered</SelectItem>
                  <SelectItem value="split">Split Screen</SelectItem>
                  <SelectItem value="full-width">Full Width</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Max Width */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="maxWidth">Max Width</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="maxWidth"
                value={config.layout?.maxWidth || '400px'}
                onChange={(e) => updateConfig('layout', 'maxWidth', e.target.value)}
                placeholder="400px"
              />
            </div>
          </div>

          {/* Padding */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="padding">Padding</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="padding"
                value={config.layout?.padding || '2rem'}
                onChange={(e) => updateConfig('layout', 'padding', e.target.value)}
                placeholder="2rem"
              />
            </div>
          </div>

          {/* Border Radius */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="borderRadius">Border Radius</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="borderRadius"
                value={config.layout?.borderRadius || '0.5rem'}
                onChange={(e) => updateConfig('layout', 'borderRadius', e.target.value)}
                placeholder="0.5rem"
              />
            </div>
          </div>

          {/* Shadow */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="shadow">Shadow</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="shadow"
                value={config.layout?.shadow || '0 10px 25px rgba(0, 0, 0, 0.1)'}
                onChange={(e) => updateConfig('layout', 'shadow', e.target.value)}
                placeholder="0 10px 25px rgba(0, 0, 0, 0.1)"
              />
            </div>
          </div>

          {/* Backdrop Blur */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="backdropBlur">Backdrop Blur</Label>
            </div>
            <div className="col-span-8">
              <Switch
                id="backdropBlur"
                checked={config.layout?.backdropBlur || false}
                onCheckedChange={(checked) => updateConfig('layout', 'backdropBlur', checked)}
              />
            </div>
          </div>

          {/* Show Branding */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="showBranding">Show Branding</Label>
            </div>
            <div className="col-span-8">
              <Switch
                id="showBranding"
                checked={config.layout?.showBranding !== false}
                onCheckedChange={(checked) => updateConfig('layout', 'showBranding', checked)}
              />
            </div>
          </div>

          {/* Show Footer */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="showFooter">Show Footer</Label>
            </div>
            <div className="col-span-8">
              <Switch
                id="showFooter"
                checked={config.layout?.showFooter !== false}
                onCheckedChange={(checked) => updateConfig('layout', 'showFooter', checked)}
              />
            </div>
          </div>

          {/* Footer Text */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="footerText">Footer Text</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="footerText"
                value={config.layout?.footerText || ''}
                onChange={(e) => updateConfig('layout', 'footerText', e.target.value)}
                placeholder="© 2024 Your Company. All rights reserved."
              />
            </div>
          </div>
        </div>
        </AccordionSection>

        {/* Card Positioning */}
        <AccordionSection 
          title="Card Positioning" 
          description="Position the login card on screen"
          sectionId="card-positioning"
        >
        <div className="space-y-4">
          {/* Horizontal Position */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="horizontalPosition">Horizontal Position</Label>
            </div>
            <div className="col-span-8">
              <Select value={config.layout?.horizontalPosition || 'center'} onValueChange={(value) => updateConfig('layout', 'horizontalPosition', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Vertical Position */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="verticalPosition">Vertical Position</Label>
            </div>
            <div className="col-span-8">
              <Select value={config.layout?.verticalPosition || 'center'} onValueChange={(value) => updateConfig('layout', 'verticalPosition', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Top</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="bottom">Bottom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custom Position X */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="positionX">Custom Position X</Label>
              <p className="text-xs text-gray-500 mt-1">Override horizontal position (px, %, or CSS value)</p>
            </div>
            <div className="col-span-8">
              <Input
                id="positionX"
                value={config.layout?.positionX || ''}
                onChange={(e) => updateConfig('layout', 'positionX', e.target.value)}
                placeholder="50% or 400px"
              />
            </div>
          </div>

          {/* Custom Position Y */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="positionY">Custom Position Y</Label>
              <p className="text-xs text-gray-500 mt-1">Override vertical position (px, %, or CSS value)</p>
            </div>
            <div className="col-span-8">
              <Input
                id="positionY"
                value={config.layout?.positionY || ''}
                onChange={(e) => updateConfig('layout', 'positionY', e.target.value)}
                placeholder="50% or 300px"
              />
            </div>
          </div>

          {/* Use Custom Position */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="useCustomPosition">Use Custom Position</Label>
            </div>
            <div className="col-span-8">
              <Switch
                id="useCustomPosition"
                checked={config.layout?.useCustomPosition || false}
                onCheckedChange={(checked) => updateConfig('layout', 'useCustomPosition', checked)}
              />
            </div>
          </div>
        </div>
        </AccordionSection>

        {/* Button Positioning */}
        <AccordionSection 
          title="Button Positioning" 
          description="Configure button layout and positioning"
          sectionId="button-positioning"
        >
        <div className="space-y-4">
          {/* Button Alignment */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="buttonAlignment">Button Alignment</Label>
            </div>
            <div className="col-span-8">
              <Select value={config.layout?.buttonAlignment || 'center'} onValueChange={(value) => updateConfig('layout', 'buttonAlignment', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                  <SelectItem value="stretch">Stretch (Full Width)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Button Group Layout */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="buttonGroupLayout">Button Group Layout</Label>
            </div>
            <div className="col-span-8">
              <Select value={config.layout?.buttonGroupLayout || 'vertical'} onValueChange={(value) => updateConfig('layout', 'buttonGroupLayout', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vertical">Vertical Stack</SelectItem>
                  <SelectItem value="horizontal">Horizontal Row</SelectItem>
                  <SelectItem value="grid">Grid Layout</SelectItem>
                  <SelectItem value="flex">Flex Layout</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* SSO Icon Only */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="ssoIconOnly">Show Only Icons</Label>
              <p className="text-xs text-gray-500">Hide text labels on social/SSO buttons</p>
            </div>
            <Switch
              id="ssoIconOnly"
              checked={config.layout?.ssoIconOnly || false}
              onCheckedChange={(checked) => updateConfig('layout', 'ssoIconOnly', checked)}
            />
          </div>

          {/* SSO Button Shape */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="ssoButtonShape">SSO Button Shape</Label>
              <p className="text-xs text-gray-500 mt-1">Shape of social login buttons</p>
            </div>
            <div className="col-span-8">
              <Select value={config.layout?.ssoButtonShape || 'default'} onValueChange={(value) => updateConfig('layout', 'ssoButtonShape', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default (Rounded Rectangle)</SelectItem>
                  <SelectItem value="square">Square</SelectItem>
                  <SelectItem value="rounded">Soft Rounded</SelectItem>
                  <SelectItem value="circle">Circle</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Button Spacing */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="buttonSpacing">Button Spacing</Label>
            </div>
            <div className="col-span-8">
              <Select value={config.layout?.buttonSpacing || 'medium'} onValueChange={(value) => updateConfig('layout', 'buttonSpacing', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="small">Small (4px)</SelectItem>
                  <SelectItem value="medium">Medium (8px)</SelectItem>
                  <SelectItem value="large">Large (16px)</SelectItem>
                  <SelectItem value="extra-large">Extra Large (24px)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Primary Button Position */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="primaryButtonPosition">Primary Button Position</Label>
            </div>
            <div className="col-span-8">
              <Select value={config.layout?.primaryButtonPosition || 'top'} onValueChange={(value) => updateConfig('layout', 'primaryButtonPosition', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Top</SelectItem>
                  <SelectItem value="bottom">Bottom</SelectItem>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Secondary Button Position */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="secondaryButtonPosition">Secondary Button Position</Label>
            </div>
            <div className="col-span-8">
              <Select value={config.layout?.secondaryButtonPosition || 'bottom'} onValueChange={(value) => updateConfig('layout', 'secondaryButtonPosition', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Top</SelectItem>
                  <SelectItem value="bottom">Bottom</SelectItem>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Show Button Divider */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="showButtonDivider">Show Button Divider</Label>
            </div>
            <div className="col-span-8">
              <Switch
                id="showButtonDivider"
                checked={config.layout?.showButtonDivider || false}
                onCheckedChange={(checked) => updateConfig('layout', 'showButtonDivider', checked)}
              />
            </div>
          </div>
        </div>
      </AccordionSection>

      {/* Advanced Positioning */}
      <AccordionSection 
        title="Advanced Positioning" 
        description="Advanced positioning and visual effects"
        sectionId="advanced-positioning"
      >
        <div className="space-y-4">
          {/* Card Float */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="cardFloat">Card Float</Label>
            </div>
            <div className="col-span-8">
              <Select value={config.layout?.cardFloat || 'none'} onValueChange={(value) => updateConfig('layout', 'cardFloat', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                  <SelectItem value="top-left">Top Left</SelectItem>
                  <SelectItem value="top-right">Top Right</SelectItem>
                  <SelectItem value="bottom-left">Bottom Left</SelectItem>
                  <SelectItem value="bottom-right">Bottom Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Card Z-Index */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="cardZIndex">Card Z-Index</Label>
              <p className="text-xs text-gray-500 mt-1">Stacking order (higher = on top)</p>
            </div>
            <div className="col-span-8">
              <Select value={config.layout?.cardZIndex || '10'} onValueChange={(value) => updateConfig('layout', 'cardZIndex', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 (Background)</SelectItem>
                  <SelectItem value="10">10 (Default)</SelectItem>
                  <SelectItem value="20">20 (Elevated)</SelectItem>
                  <SelectItem value="50">50 (Modal)</SelectItem>
                  <SelectItem value="100">100 (Tooltip)</SelectItem>
                  <SelectItem value="1000">1000 (Always on Top)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Card Transform */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="cardTransform">Card Transform</Label>
              <p className="text-xs text-gray-500 mt-1">CSS transform effects</p>
            </div>
            <div className="col-span-8">
              <Input
                id="cardTransform"
                value={config.layout?.cardTransform || ''}
                onChange={(e) => updateConfig('layout', 'cardTransform', e.target.value)}
                placeholder="rotate(2deg) scale(1.02)"
              />
            </div>
          </div>

          {/* Sticky Position */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="stickyPosition">Sticky Position</Label>
            </div>
            <div className="col-span-8">
              <Switch
                id="stickyPosition"
                checked={config.layout?.stickyPosition || false}
                onCheckedChange={(checked) => updateConfig('layout', 'stickyPosition', checked)}
              />
            </div>
          </div>

          {/* Responsive Positioning */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="responsivePositioning">Responsive Positioning</Label>
            </div>
            <div className="col-span-8">
              <Switch
                id="responsivePositioning"
                checked={config.layout?.responsivePositioning || false}
                onCheckedChange={(checked) => updateConfig('layout', 'responsivePositioning', checked)}
              />
            </div>
          </div>
        </div>
      </AccordionSection>

      {/* Individual Padding */}
      <AccordionSection 
        title="Individual Padding" 
        description="Fine-tune padding for each side"
        sectionId="individual-padding"
      >
        <div className="space-y-4">
          {/* Top Padding */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="paddingTop">Top Padding</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="paddingTop"
                value={config.layout?.paddingTop || ''}
                onChange={(e) => updateConfig('layout', 'paddingTop', e.target.value)}
                placeholder="2rem"
              />
            </div>
          </div>

          {/* Right Padding */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="paddingRight">Right Padding</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="paddingRight"
                value={config.layout?.paddingRight || ''}
                onChange={(e) => updateConfig('layout', 'paddingRight', e.target.value)}
                placeholder="2rem"
              />
            </div>
          </div>

          {/* Bottom Padding */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="paddingBottom">Bottom Padding</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="paddingBottom"
                value={config.layout?.paddingBottom || ''}
                onChange={(e) => updateConfig('layout', 'paddingBottom', e.target.value)}
                placeholder="2rem"
              />
            </div>
          </div>

          {/* Left Padding */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="paddingLeft">Left Padding</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="paddingLeft"
                value={config.layout?.paddingLeft || ''}
                onChange={(e) => updateConfig('layout', 'paddingLeft', e.target.value)}
                placeholder="2rem"
              />
            </div>
          </div>
        </div>
      </AccordionSection>

      {/* Individual Margin */}
      <AccordionSection 
        title="Individual Margin" 
        description="Fine-tune margin for each side"
        sectionId="individual-margin"
      >
        <div className="space-y-4">
          {/* Top Margin */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="marginTop">Top Margin</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="marginTop"
                value={config.layout?.marginTop || ''}
                onChange={(e) => updateConfig('layout', 'marginTop', e.target.value)}
                placeholder="1rem"
              />
            </div>
          </div>

          {/* Right Margin */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="marginRight">Right Margin</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="marginRight"
                value={config.layout?.marginRight || ''}
                onChange={(e) => updateConfig('layout', 'marginRight', e.target.value)}
                placeholder="1rem"
              />
            </div>
          </div>

          {/* Bottom Margin */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="marginBottom">Bottom Margin</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="marginBottom"
                value={config.layout?.marginBottom || ''}
                onChange={(e) => updateConfig('layout', 'marginBottom', e.target.value)}
                placeholder="1rem"
              />
            </div>
          </div>

          {/* Left Margin */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="marginLeft">Left Margin</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="marginLeft"
                value={config.layout?.marginLeft || ''}
                onChange={(e) => updateConfig('layout', 'marginLeft', e.target.value)}
                placeholder="1rem"
              />
            </div>
          </div>
        </div>
      </AccordionSection>

      {/* Individual Border Radius */}
      <AccordionSection 
        title="Individual Border Radius" 
        description="Fine-tune border radius for each corner"
        sectionId="individual-border-radius"
      >
        <div className="space-y-4">
          {/* Top-Left Radius */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="borderTopLeftRadius">Top-Left Radius</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="borderTopLeftRadius"
                value={config.layout?.borderTopLeftRadius || ''}
                onChange={(e) => updateConfig('layout', 'borderTopLeftRadius', e.target.value)}
                placeholder="1rem"
              />
            </div>
          </div>

          {/* Top-Right Radius */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="borderTopRightRadius">Top-Right Radius</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="borderTopRightRadius"
                value={config.layout?.borderTopRightRadius || ''}
                onChange={(e) => updateConfig('layout', 'borderTopRightRadius', e.target.value)}
                placeholder="1rem"
              />
            </div>
          </div>

          {/* Bottom-Right Radius */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="borderBottomRightRadius">Bottom-Right Radius</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="borderBottomRightRadius"
                value={config.layout?.borderBottomRightRadius || ''}
                onChange={(e) => updateConfig('layout', 'borderBottomRightRadius', e.target.value)}
                placeholder="1rem"
              />
            </div>
          </div>

          {/* Bottom-Left Radius */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="borderBottomLeftRadius">Bottom-Left Radius</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="borderBottomLeftRadius"
                value={config.layout?.borderBottomLeftRadius || ''}
                onChange={(e) => updateConfig('layout', 'borderBottomLeftRadius', e.target.value)}
                placeholder="1rem"
              />
            </div>
          </div>
        </div>
        </AccordionSection>
      </AccordionProvider>
    </div>
  )
}
