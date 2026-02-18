'use client'

import React from 'react'
import { Input } from '../ui/Input'
import { Label } from '../ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select'
import { Switch } from '../ui/switch'
import { Separator } from '../ui/Separator'
import ColorInput from '../inputs/ColorInput'
import { Plus, Trash2 } from 'lucide-react'
import { LoginConfig } from './LoginConfigTypes'

interface LoginConfigBackgroundProps {
  config: Partial<LoginConfig>
  updateConfig: (section: keyof LoginConfig, field: string, value: any) => void
}

export function LoginConfigBackground({ config, updateConfig }: LoginConfigBackgroundProps) {
  const addGradientStop = () => {
    const stops = [...(config.background?.gradientStops || [])]
    stops.push({ color: '#000000', position: stops.length * 25 })
    updateConfig('background', 'gradientStops', stops)
  }

  const removeGradientStop = (index: number) => {
    const stops = [...(config.background?.gradientStops || [])]
    stops.splice(index, 1)
    updateConfig('background', 'gradientStops', stops)
  }

  const updateGradientStop = (index: number, field: 'color' | 'position', value: any) => {
    const stops = [...(config.background?.gradientStops || [])]
    stops[index] = { ...stops[index], [field]: value }
    updateConfig('background', 'gradientStops', stops)
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Background Settings</h3>
      
      {/* Background Type */}
      <div className="grid grid-cols-12 gap-4 items-start">
        <div className="col-span-4">
          <Label htmlFor="backgroundType">Background Type</Label>
        </div>
        <div className="col-span-8">
          <Select value={config.background?.type || 'solid'} onValueChange={(value: any) => updateConfig('background', 'type', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="solid">Solid Color</SelectItem>
              <SelectItem value="gradient">Gradient</SelectItem>
              <SelectItem value="image">Image</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="pattern">Pattern</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Solid Color */}
      {config.background?.type === 'solid' && (
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="solidColor">Color</Label>
          </div>
          <div className="col-span-8">
            <ColorInput
              value={config.background?.value || '#ffffff'}
              onChange={(value) => updateConfig('background', 'value', value)}
              label="Color"
            />
          </div>
        </div>
      )}

      {/* Gradient Settings */}
      {config.background?.type === 'gradient' && (
        <div className="space-y-4">
          {/* Gradient Direction */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="gradientDirection">Direction</Label>
            </div>
            <div className="col-span-8">
              <Select value={config.background?.gradientDirection || 'to-right'} onValueChange={(value: any) => updateConfig('background', 'gradientDirection', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="to-right">To Right</SelectItem>
                  <SelectItem value="to-left">To Left</SelectItem>
                  <SelectItem value="to-bottom">To Bottom</SelectItem>
                  <SelectItem value="to-top">To Top</SelectItem>
                  <SelectItem value="to-br">To Bottom Right</SelectItem>
                  <SelectItem value="to-bl">To Bottom Left</SelectItem>
                  <SelectItem value="to-tr">To Top Right</SelectItem>
                  <SelectItem value="to-tl">To Top Left</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Gradient Stops */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-medium">Gradient Stops</h4>
              <button
                type="button"
                onClick={addGradientStop}
                className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
              >
                <Plus className="h-4 w-4" />
                Add Stop
              </button>
            </div>
            
            {config.background?.gradientStops?.map((stop, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 items-start">
                <div className="col-span-4">
                  <Label>Stop {index + 1}</Label>
                </div>
                <div className="col-span-8">
                  <div className="flex items-center gap-2">
                    <ColorInput
                      value={stop.color}
                      onChange={(value) => updateGradientStop(index, 'color', value)}
                      label={`Color ${index + 1}`}
                    />
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={stop.position}
                      onChange={(e) => updateGradientStop(index, 'position', parseInt(e.target.value))}
                      placeholder="0"
                      className="w-20"
                    />
                    <span className="text-sm text-gray-500">%</span>
                    {(config.background?.gradientStops?.length || 0) > 1 && (
                      <button
                        type="button"
                        onClick={() => removeGradientStop(index)}
                        className="p-1 text-red-500 hover:text-red-700"
                        title="Remove gradient stop"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image/Video URL */}
      {(config.background?.type === 'image' || config.background?.type === 'video') && (
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="mediaUrl">{config.background?.type === 'image' ? 'Image URL' : 'Video URL'}</Label>
          </div>
          <div className="col-span-8">
            <Input
              id="mediaUrl"
              value={config.background?.type === 'image' ? config.background?.imageUrl : config.background?.videoUrl}
              onChange={(e) => updateConfig('background', config.background?.type === 'image' ? 'imageUrl' : 'videoUrl', e.target.value)}
              placeholder={config.background?.type === 'image' ? 'https://example.com/image.jpg' : 'https://example.com/video.mp4'}
            />
          </div>
        </div>
      )}

      {/* Pattern Settings */}
      {config.background?.type === 'pattern' && (
        <div className="space-y-4">
          {/* Pattern Type */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="patternType">Pattern Type</Label>
            </div>
            <div className="col-span-8">
              <Select value={config.background?.patternType || 'dots'} onValueChange={(value: any) => updateConfig('background', 'patternType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dots">Dots</SelectItem>
                  <SelectItem value="lines">Lines</SelectItem>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="zigzag">Zigzag</SelectItem>
                  <SelectItem value="waves">Waves</SelectItem>
                  <SelectItem value="circles">Circles</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pattern Color */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="patternColor">Pattern Color</Label>
            </div>
            <div className="col-span-8">
              <ColorInput
                value={config.background?.patternColor || '#000000'}
                onChange={(value) => updateConfig('background', 'patternColor', value)}
                label="Pattern Color"
              />
            </div>
          </div>

          {/* Pattern Size */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <Label htmlFor="patternSize">Pattern Size</Label>
            </div>
            <div className="col-span-8">
              <Select value={config.background?.patternSize || '20px'} onValueChange={(value: any) => updateConfig('background', 'patternSize', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10px">10px</SelectItem>
                  <SelectItem value="20px">20px</SelectItem>
                  <SelectItem value="30px">30px</SelectItem>
                  <SelectItem value="40px">40px</SelectItem>
                  <SelectItem value="50px">50px</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      <Separator />

      {/* Effects */}
      <div className="space-y-4">
        <h4 className="text-md font-medium">Effects</h4>
        
        {/* Opacity */}
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="opacity">Opacity</Label>
          </div>
          <div className="col-span-8">
            <Input
              id="opacity"
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={config.background?.opacity || 1}
              onChange={(e) => updateConfig('background', 'opacity', parseFloat(e.target.value))}
              placeholder="1"
            />
          </div>
        </div>

        {/* Blur */}
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <Label htmlFor="blur">Blur</Label>
          </div>
          <div className="col-span-8">
            <Input
              id="blur"
              type="number"
              min="0"
              max="20"
              value={config.background?.blur || 0}
              onChange={(e) => updateConfig('background', 'blur', parseInt(e.target.value))}
              placeholder="0"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
