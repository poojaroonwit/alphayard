'use client'

import React from 'react'
import { AccordionProvider, AccordionSection } from './AccordionSection'
import { Switch } from '../ui/switch'
import { Label } from '../ui/Label'
import { Input } from '../ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select'

import { LoginConfig } from './LoginConfigTypes'

interface SignupConfigLayoutProps {
  config: any
  updateConfig: (section: keyof LoginConfig, field: string, value: any) => void
}

export function SignupConfigLayout({ config, updateConfig }: SignupConfigLayoutProps) {
  return (
    <AccordionProvider>
      <div className="space-y-6">
        {/* Card Layout */}
        <AccordionSection 
          title="Card Layout"
          description="Configure the signup card appearance and positioning"
          sectionId="signup-card-layout"
        >
          <div className="space-y-4">
            {/* Card Width */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-4">
                <Label htmlFor="cardWidth">Card Width</Label>
                <p className="text-xs text-gray-500 mt-1">Maximum width of signup card</p>
              </div>
              <div className="col-span-8">
                <Input
                  id="cardWidth"
                  value={config.signup?.cardWidth || '480px'}
                  onChange={(e) => updateConfig('signup', 'cardWidth', e.target.value)}
                  placeholder="480px"
                />
              </div>
            </div>

            {/* Card Padding */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-4">
                <Label htmlFor="cardPadding">Card Padding</Label>
                <p className="text-xs text-gray-500 mt-1">Internal padding of card</p>
              </div>
              <div className="col-span-8">
                <Input
                  id="cardPadding"
                  value={config.signup?.cardPadding || '2rem'}
                  onChange={(e) => updateConfig('signup', 'cardPadding', e.target.value)}
                  placeholder="2rem"
                />
              </div>
            </div>

            {/* Border Radius */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-4">
                <Label htmlFor="borderRadius">Border Radius</Label>
                <p className="text-xs text-gray-500 mt-1">Corner roundness of card</p>
              </div>
              <div className="col-span-8">
                <Input
                  id="borderRadius"
                  value={config.signup?.borderRadius || '0.75rem'}
                  onChange={(e) => updateConfig('signup', 'borderRadius', e.target.value)}
                  placeholder="0.75rem"
                />
              </div>
            </div>

            {/* Card Shadow */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-4">
                <Label htmlFor="cardShadow">Card Shadow</Label>
                <p className="text-xs text-gray-500 mt-1">Shadow effect for card</p>
              </div>
              <div className="col-span-8">
                <Input
                  id="cardShadow"
                  value={config.signup?.cardShadow || '0 20px 25px -5px rgba(0, 0, 0, 0.1)'}
                  onChange={(e) => updateConfig('signup', 'cardShadow', e.target.value)}
                  placeholder="0 20px 25px -5px rgba(0, 0, 0, 0.1)"
                />
              </div>
            </div>

            {/* Card Background */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-4">
                <Label htmlFor="cardBackground">Card Background</Label>
                <p className="text-xs text-gray-500 mt-1">Background color of card</p>
              </div>
              <div className="col-span-8">
                <Input
                  id="cardBackground"
                  value={config.signup?.cardBackground || '#ffffff'}
                  onChange={(e) => updateConfig('signup', 'cardBackground', e.target.value)}
                  placeholder="#ffffff"
                />
              </div>
            </div>

            {/* Card Border */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-4">
                <Label htmlFor="cardBorder">Card Border</Label>
                <p className="text-xs text-gray-500 mt-1">Border color and width</p>
              </div>
              <div className="col-span-8">
                <Input
                  id="cardBorder"
                  value={config.signup?.cardBorder || '1px solid #e5e7eb'}
                  onChange={(e) => updateConfig('signup', 'cardBorder', e.target.value)}
                  placeholder="1px solid #e5e7eb"
                />
              </div>
            </div>
          </div>
        </AccordionSection>

        {/* Form Layout */}
        <AccordionSection 
          title="Form Layout"
          description="Configure the form field layout and spacing"
          sectionId="signup-form-layout"
        >
          <div className="space-y-4">
            {/* Form Layout Style */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-4">
                <Label htmlFor="formLayoutStyle">Form Layout Style</Label>
                <p className="text-xs text-gray-500 mt-1">Overall layout of form fields</p>
              </div>
              <div className="col-span-8">
                <Select value={config.signup?.formLayoutStyle || 'stacked'} onValueChange={(value) => updateConfig('signup', 'formLayoutStyle', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stacked">Stacked (Vertical)</SelectItem>
                    <SelectItem value="inline">Inline (Horizontal)</SelectItem>
                    <SelectItem value="grid">Grid Layout</SelectItem>
                    <SelectItem value="split">Split Layout</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Field Spacing */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-4">
                <Label htmlFor="fieldSpacing">Field Spacing</Label>
                <p className="text-xs text-gray-500 mt-1">Space between form fields</p>
              </div>
              <div className="col-span-8">
                <Select value={config.signup?.fieldSpacing || 'medium'} onValueChange={(value) => updateConfig('signup', 'fieldSpacing', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tight">Tight</SelectItem>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                    <SelectItem value="extra-large">Extra Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Field Width */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-4">
                <Label htmlFor="fieldWidth">Field Width</Label>
                <p className="text-xs text-gray-500 mt-1">Width of form fields</p>
              </div>
              <div className="col-span-8">
                <Select value={config.signup?.fieldWidth || 'full'} onValueChange={(value) => updateConfig('signup', 'fieldWidth', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Width</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="small">Small</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Label Position */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-4">
                <Label htmlFor="labelPosition">Label Position</Label>
                <p className="text-xs text-gray-500 mt-1">Position of field labels</p>
              </div>
              <div className="col-span-8">
                <Select value={config.signup?.labelPosition || 'top'} onValueChange={(value) => updateConfig('signup', 'labelPosition', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Above Field</SelectItem>
                    <SelectItem value="left">Left of Field</SelectItem>
                    <SelectItem value="placeholder">Placeholder Only</SelectItem>
                    <SelectItem value="floating">Floating Label</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Show Field Icons */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="showFieldIcons">Show Field Icons</Label>
                <p className="text-sm text-gray-500">Display icons in form fields</p>
              </div>
              <Switch
                id="showFieldIcons"
                checked={config.signup?.showFieldIcons !== false}
                onCheckedChange={(checked) => updateConfig('signup', 'showFieldIcons', checked)}
              />
            </div>

            {/* Show Field Descriptions */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="showFieldDescriptions">Show Field Descriptions</Label>
                <p className="text-sm text-gray-500">Display helpful text below fields</p>
              </div>
              <Switch
                id="showFieldDescriptions"
                checked={config.signup?.showFieldDescriptions || false}
                onCheckedChange={(checked) => updateConfig('signup', 'showFieldDescriptions', checked)}
              />
            </div>
          </div>
        </AccordionSection>

        {/* Button Layout */}
        <AccordionSection 
          title="Button Layout"
          description="Configure button positioning and styling"
          sectionId="signup-button-layout"
        >
          <div className="space-y-4">
            {/* Button Position */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-4">
                <Label htmlFor="buttonPosition">Button Position</Label>
                <p className="text-xs text-gray-500 mt-1">Position of submit button</p>
              </div>
              <div className="col-span-8">
                <Select value={config.signup?.buttonPosition || 'bottom'} onValueChange={(value) => updateConfig('signup', 'buttonPosition', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Top of Form</SelectItem>
                    <SelectItem value="bottom">Bottom of Form</SelectItem>
                    <SelectItem value="left">Left Side</SelectItem>
                    <SelectItem value="right">Right Side</SelectItem>
                    <SelectItem value="center">Centered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Button Alignment */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-4">
                <Label htmlFor="buttonAlignment">Button Alignment</Label>
                <p className="text-xs text-gray-500 mt-1">Horizontal alignment of button</p>
              </div>
              <div className="col-span-8">
                <Select value={config.signup?.buttonAlignment || 'center'} onValueChange={(value) => updateConfig('signup', 'buttonAlignment', value)}>
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

            {/* Button Group Layout */}
            {config.signup?.showSocialLogin && (
              <div className="grid grid-cols-12 gap-4 items-start">
                <div className="col-span-4">
                  <Label htmlFor="buttonGroupLayout">Button Group Layout</Label>
                  <p className="text-xs text-gray-500 mt-1">Layout of multiple buttons</p>
                </div>
                <div className="col-span-8">
                  <Select value={config.signup?.buttonGroupLayout || 'vertical'} onValueChange={(value) => updateConfig('signup', 'buttonGroupLayout', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vertical">Vertical Stack</SelectItem>
                      <SelectItem value="horizontal">Horizontal Row</SelectItem>
                      <SelectItem value="grid">Grid Layout</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
            {/* SSO Icon Only */}
            {config.signup?.showSocialLogin && (
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="signup-ssoIconOnly">Show Only Icons</Label>
                  <p className="text-xs text-gray-500">Hide text labels on social/SSO buttons</p>
                </div>
                <Switch
                  id="signup-ssoIconOnly"
                  checked={config.signup?.ssoIconOnly || false}
                  onCheckedChange={(checked) => updateConfig('signup', 'ssoIconOnly', checked)}
                />
              </div>
            )}

            {/* SSO Button Shape */}
            {config.signup?.showSocialLogin && (
              <div className="grid grid-cols-12 gap-4 items-start">
                <div className="col-span-4">
                  <Label htmlFor="signup-ssoButtonShape">SSO Button Shape</Label>
                  <p className="text-xs text-gray-500 mt-1">Shape of social login buttons</p>
                </div>
                <div className="col-span-8">
                  <Select value={config.signup?.ssoButtonShape || 'default'} onValueChange={(value) => updateConfig('signup', 'ssoButtonShape', value)}>
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
            )}

            {/* Button Spacing */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-4">
                <Label htmlFor="buttonSpacing">Button Spacing</Label>
                <p className="text-xs text-gray-500 mt-1">Space between buttons</p>
              </div>
              <div className="col-span-8">
                <Select value={config.signup?.buttonSpacing || 'medium'} onValueChange={(value) => updateConfig('signup', 'buttonSpacing', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tight">Tight</SelectItem>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Show Button Divider */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="showButtonDivider">Show Button Divider</Label>
                <p className="text-sm text-gray-500">Display divider between buttons</p>
              </div>
              <Switch
                id="showButtonDivider"
                checked={config.signup?.showButtonDivider || false}
                onCheckedChange={(checked) => updateConfig('signup', 'showButtonDivider', checked)}
              />
            </div>
          </div>
        </AccordionSection>

        {/* Advanced Layout */}
        <AccordionSection 
          title="Advanced Layout"
          description="Advanced layout and positioning options"
          sectionId="signup-advanced-layout"
        >
          <div className="space-y-4">
            {/* Card Float Effect */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="cardFloat">Card Float Effect</Label>
                <p className="text-sm text-gray-500">Add floating animation to card</p>
              </div>
              <Switch
                id="cardFloat"
                checked={config.signup?.cardFloat || false}
                onCheckedChange={(checked) => updateConfig('signup', 'cardFloat', checked)}
              />
            </div>

            {/* Card Z-Index */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-4">
                <Label htmlFor="cardZIndex">Card Z-Index</Label>
                <p className="text-xs text-gray-500 mt-1">Stacking order of card</p>
              </div>
              <div className="col-span-8">
                <Input
                  id="cardZIndex"
                  type="number"
                  value={config.signup?.cardZIndex || '10'}
                  onChange={(e) => updateConfig('signup', 'cardZIndex', e.target.value)}
                  placeholder="10"
                />
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
                  value={config.signup?.cardTransform || ''}
                  onChange={(e) => updateConfig('signup', 'cardTransform', e.target.value)}
                  placeholder="rotate(2deg) scale(1.02)"
                />
              </div>
            </div>

            {/* Backdrop Blur */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="backdropBlur">Backdrop Blur</Label>
                <p className="text-sm text-gray-500">Blur background behind card</p>
              </div>
              <Switch
                id="backdropBlur"
                checked={config.signup?.backdropBlur || false}
                onCheckedChange={(checked) => updateConfig('signup', 'backdropBlur', checked)}
              />
            </div>

            {/* Sticky Position */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="stickyPosition">Sticky Position</Label>
                <p className="text-sm text-gray-500">Keep card in view while scrolling</p>
              </div>
              <Switch
                id="stickyPosition"
                checked={config.signup?.stickyPosition || false}
                onCheckedChange={(checked) => updateConfig('signup', 'stickyPosition', checked)}
              />
            </div>
          </div>
        </AccordionSection>
      </div>
    </AccordionProvider>
  )
}
