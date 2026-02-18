'use client'

import React from 'react'
import { Input } from '../ui/Input'
import { Label } from '../ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select'
import { Switch } from '../ui/switch'
import { Separator } from '../ui/Separator'
import { LoginConfig } from './LoginConfigTypes'

interface LoginConfigAnimationsProps {
  config: Partial<LoginConfig>
  updateConfig: (section: keyof LoginConfig, field: string, value: any) => void
}

export function LoginConfigAnimations({ config, updateConfig }: LoginConfigAnimationsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Animation Settings</h3>
      
      {/* Animation Toggles */}
      <div className="space-y-4">
        <h4 className="text-md font-medium">Animation Toggles</h4>
        
        {/* Show Page Transitions */}
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="showPageTransitions">Show Page Transitions</Label>
          </div>
          <div className="col-span-8">
            <Switch
              id="showPageTransitions"
              checked={config.animations?.showPageTransitions || false}
              onCheckedChange={(checked) => updateConfig('animations', 'showPageTransitions', checked)}
            />
          </div>
        </div>

        {/* Show Form Animations */}
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="showFormAnimations">Show Form Animations</Label>
          </div>
          <div className="col-span-8">
            <Switch
              id="showFormAnimations"
              checked={config.animations?.showFormAnimations || false}
              onCheckedChange={(checked) => updateConfig('animations', 'showFormAnimations', checked)}
            />
          </div>
        </div>

        {/* Show Button Animations */}
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="showButtonAnimations">Show Button Animations</Label>
          </div>
          <div className="col-span-8">
            <Switch
              id="showButtonAnimations"
              checked={config.animations?.showButtonAnimations || false}
              onCheckedChange={(checked) => updateConfig('animations', 'showButtonAnimations', checked)}
            />
          </div>
        </div>

        {/* Show Input Animations */}
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="showInputAnimations">Show Input Animations</Label>
          </div>
          <div className="col-span-8">
            <Switch
              id="showInputAnimations"
              checked={config.animations?.showInputAnimations || false}
              onCheckedChange={(checked) => updateConfig('animations', 'showInputAnimations', checked)}
            />
          </div>
        </div>

        {/* Show Loading Animations */}
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="showLoadingAnimations">Show Loading Animations</Label>
          </div>
          <div className="col-span-8">
            <Switch
              id="showLoadingAnimations"
              checked={config.animations?.showLoadingAnimations || false}
              onCheckedChange={(checked) => updateConfig('animations', 'showLoadingAnimations', checked)}
            />
          </div>
        </div>

        {/* Show Error Animations */}
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="showErrorAnimations">Show Error Animations</Label>
          </div>
          <div className="col-span-8">
            <Switch
              id="showErrorAnimations"
              checked={config.animations?.showErrorAnimations || false}
              onCheckedChange={(checked) => updateConfig('animations', 'showErrorAnimations', checked)}
            />
          </div>
        </div>

        {/* Show Success Animations */}
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="showSuccessAnimations">Show Success Animations</Label>
          </div>
          <div className="col-span-8">
            <Switch
              id="showSuccessAnimations"
              checked={config.animations?.showSuccessAnimations || false}
              onCheckedChange={(checked) => updateConfig('animations', 'showSuccessAnimations', checked)}
            />
          </div>
        </div>

        {/* Show Hover Animations */}
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="showHoverAnimations">Show Hover Animations</Label>
          </div>
          <div className="col-span-8">
            <Switch
              id="showHoverAnimations"
              checked={config.animations?.showHoverAnimations || false}
              onCheckedChange={(checked) => updateConfig('animations', 'showHoverAnimations', checked)}
            />
          </div>
        </div>

        {/* Show Focus Animations */}
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="showFocusAnimations">Show Focus Animations</Label>
          </div>
          <div className="col-span-8">
            <Switch
              id="showFocusAnimations"
              checked={config.animations?.showFocusAnimations || false}
              onCheckedChange={(checked) => updateConfig('animations', 'showFocusAnimations', checked)}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Animation Types */}
      <div className="space-y-4">
        <h4 className="text-md font-medium">Animation Types</h4>
        
        {/* Page Transition Type */}
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="pageTransitionType">Page Transition Type</Label>
          </div>
          <div className="col-span-8">
            <Select value={config.animations?.pageTransitionType || 'fade'} onValueChange={(value: any) => updateConfig('animations', 'pageTransitionType', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fade">Fade</SelectItem>
                <SelectItem value="slide">Slide</SelectItem>
                <SelectItem value="zoom">Zoom</SelectItem>
                <SelectItem value="flip">Flip</SelectItem>
                <SelectItem value="bounce">Bounce</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Form Animation Type */}
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="formAnimationType">Form Animation Type</Label>
          </div>
          <div className="col-span-8">
            <Select value={config.animations?.formAnimationType || 'slideUp'} onValueChange={(value: any) => updateConfig('animations', 'formAnimationType', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slideUp">Slide Up</SelectItem>
                <SelectItem value="slideDown">Slide Down</SelectItem>
                <SelectItem value="fadeIn">Fade In</SelectItem>
                <SelectItem value="scaleIn">Scale In</SelectItem>
                <SelectItem value="rotateIn">Rotate In</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Button Animation Type */}
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="buttonAnimationType">Button Animation Type</Label>
          </div>
          <div className="col-span-8">
            <Select value={config.animations?.buttonAnimationType || 'pulse'} onValueChange={(value: any) => updateConfig('animations', 'buttonAnimationType', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pulse">Pulse</SelectItem>
                <SelectItem value="bounce">Bounce</SelectItem>
                <SelectItem value="shake">Shake</SelectItem>
                <SelectItem value="glow">Glow</SelectItem>
                <SelectItem value="scale">Scale</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Input Animation Type */}
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="inputAnimationType">Input Animation Type</Label>
          </div>
          <div className="col-span-8">
            <Select value={config.animations?.inputAnimationType || 'focus'} onValueChange={(value: any) => updateConfig('animations', 'inputAnimationType', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="focus">Focus</SelectItem>
                <SelectItem value="slide">Slide</SelectItem>
                <SelectItem value="fade">Fade</SelectItem>
                <SelectItem value="scale">Scale</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading Animation Type */}
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="loadingAnimationType">Loading Animation Type</Label>
          </div>
          <div className="col-span-8">
            <Select value={config.animations?.loadingAnimationType || 'spin'} onValueChange={(value: any) => updateConfig('animations', 'loadingAnimationType', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spin">Spin</SelectItem>
                <SelectItem value="pulse">Pulse</SelectItem>
                <SelectItem value="bounce">Bounce</SelectItem>
                <SelectItem value="dots">Dots</SelectItem>
                <SelectItem value="bars">Bars</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Error Animation Type */}
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="errorAnimationType">Error Animation Type</Label>
          </div>
          <div className="col-span-8">
            <Select value={config.animations?.errorAnimationType || 'shake'} onValueChange={(value: any) => updateConfig('animations', 'errorAnimationType', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shake">Shake</SelectItem>
                <SelectItem value="fade">Fade</SelectItem>
                <SelectItem value="slide">Slide</SelectItem>
                <SelectItem value="pulse">Pulse</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Success Animation Type */}
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="successAnimationType">Success Animation Type</Label>
          </div>
          <div className="col-span-8">
            <Select value={config.animations?.successAnimationType || 'checkmark'} onValueChange={(value: any) => updateConfig('animations', 'successAnimationType', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checkmark">Checkmark</SelectItem>
                <SelectItem value="fade">Fade</SelectItem>
                <SelectItem value="slide">Slide</SelectItem>
                <SelectItem value="bounce">Bounce</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Hover Animation Type */}
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="hoverAnimationType">Hover Animation Type</Label>
          </div>
          <div className="col-span-8">
            <Select value={config.animations?.hoverAnimationType || 'scale'} onValueChange={(value: any) => updateConfig('animations', 'hoverAnimationType', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scale">Scale</SelectItem>
                <SelectItem value="fade">Fade</SelectItem>
                <SelectItem value="slide">Slide</SelectItem>
                <SelectItem value="glow">Glow</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Focus Animation Type */}
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="focusAnimationType">Focus Animation Type</Label>
          </div>
          <div className="col-span-8">
            <Select value={config.animations?.focusAnimationType || 'glow'} onValueChange={(value: any) => updateConfig('animations', 'focusAnimationType', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="glow">Glow</SelectItem>
                <SelectItem value="scale">Scale</SelectItem>
                <SelectItem value="slide">Slide</SelectItem>
                <SelectItem value="fade">Fade</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Animation Timing */}
      <div className="space-y-4">
        <h4 className="text-md font-medium">Animation Timing</h4>
        
        {/* Animation Duration */}
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="animationDuration">Animation Duration (ms)</Label>
          </div>
          <div className="col-span-8">
            <Input
              id="animationDuration"
              type="number"
              min="100"
              max="3000"
              value={config.animations?.animationDuration || 300}
              onChange={(e) => updateConfig('animations', 'animationDuration', parseInt(e.target.value))}
              placeholder="300"
            />
          </div>
        </div>

        {/* Animation Easing */}
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="animationEasing">Animation Easing</Label>
          </div>
          <div className="col-span-8">
            <Select value={config.animations?.animationEasing || 'ease'} onValueChange={(value: any) => updateConfig('animations', 'animationEasing', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ease">Ease</SelectItem>
                <SelectItem value="ease-in">Ease In</SelectItem>
                <SelectItem value="ease-out">Ease Out</SelectItem>
                <SelectItem value="ease-in-out">Ease In Out</SelectItem>
                <SelectItem value="linear">Linear</SelectItem>
                <SelectItem value="cubic-bezier">Cubic Bezier</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Animation Delay */}
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="animationDelay">Animation Delay (ms)</Label>
          </div>
          <div className="col-span-8">
            <Input
              id="animationDelay"
              type="number"
              min="0"
              max="1000"
              value={config.animations?.animationDelay || 0}
              onChange={(e) => updateConfig('animations', 'animationDelay', parseInt(e.target.value))}
              placeholder="0"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Micro Interactions */}
      <div className="space-y-4">
        <h4 className="text-md font-medium">Micro Interactions</h4>
        
        {/* Micro Interaction Type */}
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="microInteractionType">Micro Interaction Type</Label>
          </div>
          <div className="col-span-8">
            <Select value={config.animations?.microInteractionType || 'none'} onValueChange={(value: any) => updateConfig('animations', 'microInteractionType', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="bounce">Bounce</SelectItem>
                <SelectItem value="shake">Shake</SelectItem>
                <SelectItem value="rotate">Rotate</SelectItem>
                <SelectItem value="pulse">Pulse</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
