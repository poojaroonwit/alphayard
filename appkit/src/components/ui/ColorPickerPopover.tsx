'use client'

import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { adminService } from '../../services/adminService'
import { API_BASE_URL } from '../../services/apiConfig'
import { clsx } from 'clsx'
import { toast } from '@/hooks/use-toast'

export type ColorMode = 'solid' | 'gradient' | 'image' | 'video'

export interface GradientStop {
  id: string
  color: string
  position: number
}

export interface ColorValue {
  mode: ColorMode
  solid?: string
  gradient?: {
    type: 'linear' | 'radial'
    angle?: number
    stops: GradientStop[]
  }
  image?: string
  video?: string
}

interface ColorPickerPopoverProps {
  value: ColorValue
  onChange: (value: ColorValue) => void
  label?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const DEFAULT_GRADIENTS = [
  { stops: [{ id: '1', color: '#FA7272', position: 0 }, { id: '2', color: '#FF9A9E', position: 100 }], angle: 135 },
  { stops: [{ id: '1', color: '#667EEA', position: 0 }, { id: '2', color: '#764BA2', position: 100 }], angle: 135 },
  { stops: [{ id: '1', color: '#11998E', position: 0 }, { id: '2', color: '#38EF7D', position: 100 }], angle: 135 },
  { stops: [{ id: '1', color: '#FC466B', position: 0 }, { id: '2', color: '#3F5EFB', position: 100 }], angle: 135 },
  { stops: [{ id: '1', color: '#F093FB', position: 0 }, { id: '2', color: '#F5576C', position: 100 }], angle: 135 },
  { stops: [{ id: '1', color: '#FF6B6B', position: 0 }, { id: '2', color: '#FEC89A', position: 50 }, { id: '3', color: '#FFD93D', position: 100 }], angle: 90 },
]

const COLOR_PRESETS = [
  '#FA7272', '#FF6B6B', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899',
  '#1F2937', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB', '#F3F4F6', '#FFFFFF',
]

let stopIdCounter = 0
const generateStopId = () => `stop_${++stopIdCounter}_${Date.now()}`

// Helper to parse color string to Hex and Alpha
const parseColorToHexAndAlpha = (color: string) => {
  let hex = '#FFFFFF'
  let alpha = 1

  if (!color) return { hex, alpha }

  if (color.startsWith('#')) {
    hex = color.substring(0, 7)
    if (color.length === 9) {
      alpha = parseInt(color.substring(7, 9), 16) / 255
    }
  } else if (color.startsWith('rgb')) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
    if (match) {
      const r = parseInt(match[1])
      const g = parseInt(match[2])
      const b = parseInt(match[3])
      alpha = match[4] ? parseFloat(match[4]) : 1
      hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()
    }
  }
  return { hex, alpha }
}

const formatColor = (hex: string, alpha: number) => {
  // Ensure hex is valid 6 char
  if (!/^#[0-9A-F]{6}$/i.test(hex)) return hex;
  
  if (alpha >= 1) return hex
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  // Round alpha to 2 decimal places to avoid long floats
  return `rgba(${r}, ${g}, ${b}, ${Math.round(alpha * 100) / 100})`
}

export function ColorPickerPopover({ value, onChange, label, open, onOpenChange }: ColorPickerPopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  
  const [coords, setCoords] = useState({ top: 0, left: 0 })

  const handleOpenChange = (newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }

  const [activeTab, setActiveTab] = useState<ColorMode>(value.mode || 'solid')
  const popoverRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  // Parse current solid color
  const { hex: currentHex, alpha: currentAlpha } = parseColorToHexAndAlpha(value.solid || '#FFFFFF')

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside both popover (in portal) and button (in main DOM)
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        handleOpenChange(false)
      }
    }
    
    // Update position logic
    const updatePosition = () => {
        if (buttonRef.current && isOpen) {
            const rect = buttonRef.current.getBoundingClientRect()
            const scrollTop = window.scrollY || document.documentElement.scrollTop
             
            // Check if it would overflow right edge
            let left = rect.left
            const popoverWidth = 320 // approx width of w-80
            if (window.innerWidth && (left + popoverWidth > window.innerWidth - 20)) {
                left = Math.max(10, window.innerWidth - popoverWidth - 20)
            }

            setCoords({
                top: rect.bottom + 5,
                left: left
            })
        }
    }

    if (isOpen) {
        updatePosition()
        document.addEventListener('mousedown', handleClickOutside)
        window.addEventListener('resize', updatePosition)
        window.addEventListener('scroll', updatePosition, true) // Capture phase for nested scrolls
    }
    return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        window.removeEventListener('resize', updatePosition)
        window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen])

  // ... rest of helper functions ... (getPreviewStyle etc - no changes needed)

  const getPreviewStyle = (): React.CSSProperties => {
    switch (value.mode) {
      case 'solid':
        return { backgroundColor: value.solid || '#FFFFFF' }
      case 'gradient':
        if (value.gradient && value.gradient.stops.length >= 2) {
          const sortedStops = [...value.gradient.stops].sort((a, b) => a.position - b.position)
          const stops = sortedStops.map(s => `${s.color} ${s.position}%`).join(', ')
          return { background: `linear-gradient(${value.gradient.angle || 135}deg, ${stops})` }
        }
        return { backgroundColor: '#FFFFFF' }
      case 'image':
        return { 
          backgroundImage: value.image ? `url(${value.image})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }
      case 'video':
        return { backgroundColor: '#1F2937' }
      default:
        return { backgroundColor: '#FFFFFF' }
    }
  }

  const handleSolidHexChange = (newHex: string) => {
    const finalColor = formatColor(newHex, currentAlpha)
    onChange({ ...value, mode: 'solid', solid: finalColor })
  }

  const handleSolidAlphaChange = (newAlpha: number) => {
    const finalColor = formatColor(currentHex, newAlpha)
    onChange({ ...value, mode: 'solid', solid: finalColor })
  }

  // Legacy handler compatibility
  const handleSolidChange = (color: string) => {
      // If user types/pastes a full rgba string or hex, use it directly
      if (color.startsWith('rgba') || color.length > 7) {
          onChange({ ...value, mode: 'solid', solid: color })
      } else {
          // If it's just a hex change, preserve alpha
          handleSolidHexChange(color)
      }
  }

  const handleGradientChange = (gradient: ColorValue['gradient']) => {
    onChange({ ...value, mode: 'gradient', gradient })
  }

  const handleAddStop = () => {
    const currentStops = value.gradient?.stops || [
      { id: generateStopId(), color: '#FA7272', position: 0 },
      { id: generateStopId(), color: '#FF9A9E', position: 100 }
    ]
    // Find a position between existing stops
    const sortedStops = [...currentStops].sort((a, b) => a.position - b.position)
    let newPosition = 50
    if (sortedStops.length >= 2) {
      // Find the largest gap
      let maxGap = 0
      let gapStart = 0
      for (let i = 0; i < sortedStops.length - 1; i++) {
        const gap = sortedStops[i + 1].position - sortedStops[i].position
        if (gap > maxGap) {
          maxGap = gap
          gapStart = sortedStops[i].position
        }
      }
      newPosition = Math.round(gapStart + maxGap / 2)
    }
    const newStop: GradientStop = {
      id: generateStopId(),
      color: '#FFFFFF',
      position: newPosition
    }
    handleGradientChange({
      type: value.gradient?.type || 'linear',
      angle: value.gradient?.angle || 135,
      stops: [...currentStops, newStop]
    })
  }

  const handleRemoveStop = (stopId: string) => {
    const currentStops = value.gradient?.stops || []
    if (currentStops.length <= 2) return // Need at least 2 stops
    handleGradientChange({
      type: value.gradient?.type || 'linear',
      angle: value.gradient?.angle || 135,
      stops: currentStops.filter(s => s.id !== stopId)
    })
  }

  const handleUpdateStop = (stopId: string, updates: Partial<GradientStop>) => {
    const currentStops = value.gradient?.stops || []
    handleGradientChange({
      type: value.gradient?.type || 'linear',
      angle: value.gradient?.angle || 135,
      stops: currentStops.map(s => s.id === stopId ? { ...s, ...updates } : s)
    })
  }

  const handleImageChange = (imageUrl: string) => {
    onChange({ ...value, mode: 'image', image: imageUrl })
  }

  const handleVideoChange = (videoUrl: string) => {
    onChange({ ...value, mode: 'video', video: videoUrl })
  }

  const tabs = [
    { id: 'solid' as ColorMode, label: 'Solid', icon: '◼' },
    { id: 'gradient' as ColorMode, label: 'Gradient', icon: '◧' },
    { id: 'image' as ColorMode, label: 'Image', icon: '🖼' },
    { id: 'video' as ColorMode, label: 'Video', icon: '▶' },
  ]

  const gradientStops = value.gradient?.stops || [
    { id: generateStopId(), color: '#FA7272', position: 0 },
    { id: generateStopId(), color: '#FF9A9E', position: 100 }
  ]
  const sortedStops = [...gradientStops].sort((a, b) => a.position - b.position)

  return (
    <div className="relative">
      {label && <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>}
      
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        onClick={() => handleOpenChange(!isOpen)}
        className="flex items-center gap-2 w-full h-9 px-2 border border-gray-300 rounded-lg bg-white hover:border-pink-400 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500"
      >
        <div 
          className="w-6 h-6 rounded-md border border-gray-200 shrink-0"
          style={getPreviewStyle()}
        />
        <span className="text-xs text-gray-600 truncate flex-1 text-left">
          {value.mode === 'solid' && value.solid}
          {value.mode === 'gradient' && `Gradient (${gradientStops.length} stops)`}
          {value.mode === 'image' && (value.image ? 'Image' : 'No image')}
          {value.mode === 'video' && (value.video ? 'Video' : 'No video')}
        </span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Popover */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div 
          ref={popoverRef}
          className="fixed z-[9999] mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
          style={{ top: coords.top, left: coords.left }}
        >
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  onChange({ ...value, mode: tab.id })
                }}
                className={`flex-1 py-2 px-2 text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-pink-600 border-b-2 border-pink-600 bg-pink-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-3 max-h-[400px] overflow-y-auto">
            {/* Solid Color */}
            {activeTab === 'solid' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={currentHex}
                    onChange={(e) => handleSolidHexChange(e.target.value)}
                    className="w-10 h-10 p-0.5 border border-gray-300 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={value.solid || '#FFFFFF'}
                    onChange={(e) => handleSolidChange(e.target.value)}
                    className="flex-1 h-10 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                
                {/* Opacity Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-gray-600">Opacity</label>
                    <span className="text-xs text-gray-400">{Math.round(currentAlpha * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={currentAlpha}
                    onChange={(e) => handleSolidAlphaChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                  />
                </div>

                <div className="grid grid-cols-7 gap-1.5 pt-2">
                  {COLOR_PRESETS.map((color, i) => (
                    <button
                      key={i}
                      onClick={() => handleSolidChange(color)}
                      className={`w-7 h-7 rounded-md border-2 transition-transform hover:scale-110 ${
                        currentHex === color ? 'border-pink-500 ring-2 ring-pink-200' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Gradient */}
            {activeTab === 'gradient' && (
              <div className="space-y-4">
                {/* Preview Bar */}
                <div 
                  className="h-12 rounded-lg border border-gray-200"
                  style={{
                    background: sortedStops.length >= 2 
                      ? `linear-gradient(${value.gradient?.angle || 135}deg, ${sortedStops.map(s => `${s.color} ${s.position}%`).join(', ')})`
                      : '#f3f4f6'
                  }}
                />

                {/* Preset Gradients */}
                <div>
                  <p className="text-xs text-gray-500 mb-2">Presets</p>
                  <div className="grid grid-cols-6 gap-2">
                    {DEFAULT_GRADIENTS.map((grad, i) => (
                      <button
                        key={i}
                        onClick={() => handleGradientChange({ 
                          type: 'linear', 
                          angle: grad.angle, 
                          stops: grad.stops.map(s => ({ ...s, id: generateStopId() }))
                        })}
                        className="w-10 h-10 rounded-lg border-2 border-gray-200 hover:border-pink-400 transition-colors"
                        style={{
                          background: `linear-gradient(${grad.angle}deg, ${grad.stops.map(s => `${s.color} ${s.position}%`).join(', ')})`
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Angle Control */}
                <div className="flex items-center gap-3">
                  <label className="text-xs text-gray-600 w-12">Angle</label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={value.gradient?.angle || 135}
                    onChange={(e) => handleGradientChange({
                      ...value.gradient!,
                      angle: parseInt(e.target.value)
                    })}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                  />
                  <input
                    type="number"
                    min="0"
                    max="360"
                    value={value.gradient?.angle || 135}
                    onChange={(e) => handleGradientChange({
                      ...value.gradient!,
                      angle: parseInt(e.target.value) || 0
                    })}
                    className="w-14 h-8 px-2 text-xs text-center border border-gray-300 rounded-lg"
                  />
                  <span className="text-xs text-gray-500">°</span>
                </div>

                {/* Color Stops */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-gray-700">Color Stops</p>
                    <button
                      onClick={handleAddStop}
                      className="flex items-center gap-1 text-xs text-pink-600 hover:text-pink-700 font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Stop
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {sortedStops.map((stop, index) => {
                      const { hex, alpha } = parseColorToHexAndAlpha(stop.color)
                      return (
                        <div key={stop.id} className="flex flex-col gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 w-4">{index + 1}</span>
                            <div className="flex-1 flex gap-2">
                                <input
                                  type="color"
                                  value={hex}
                                  onChange={(e) => handleUpdateStop(stop.id, { color: formatColor(e.target.value, alpha) })}
                                  className="w-8 h-8 p-0.5 border border-gray-300 rounded cursor-pointer shrink-0"
                                />
                                <input
                                  type="text"
                                  value={stop.color}
                                  onChange={(e) => handleUpdateStop(stop.id, { color: e.target.value })}
                                  className="flex-1 h-8 px-2 text-xs border border-gray-300 rounded-lg font-mono"
                                />
                            </div>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={stop.position}
                                onChange={(e) => handleUpdateStop(stop.id, { position: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) })}
                                className="w-12 h-8 px-2 text-xs text-center border border-gray-300 rounded-lg"
                              />
                              <span className="text-xs text-gray-500">%</span>
                            </div>
                            {sortedStops.length > 2 && (
                              <button
                                onClick={() => handleRemoveStop(stop.id)}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>

                          {/* Opacity Slider */}
                          <div className="flex items-center gap-2 pl-6">
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider w-8">Opacity</span>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.01"
                              value={alpha}
                              onChange={(e) => handleUpdateStop(stop.id, { color: formatColor(hex, parseFloat(e.target.value)) })}
                              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                            />
                            <span className="text-xs text-gray-400 w-8 text-right">{Math.round(alpha * 100)}%</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Image */}
            {activeTab === 'image' && (
              <div className="space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setUploading(true)
                      try {
                        const res = await adminService.uploadFile(file)
                        console.log('Upload response:', res)
                        // Handle response structure: { file: { id, url, mime_type, file_name } }
                        const fileData = res?.file || res
                        const imageUrl = fileData?.url
                        
                        if (imageUrl) {
                          // The URL from the server should already be the full proxy URL
                          // If it's not a full URL, construct it using the file ID
                          let finalUrl = imageUrl
                          if (!imageUrl.startsWith('http')) {
                            // Fallback: construct proxy URL using file ID
                            const fileId = fileData?.id || imageUrl
                            finalUrl = `${API_BASE_URL}/storage/proxy/${fileId}`
                          }
                          console.log('Setting image URL:', finalUrl)
                          console.log('File data:', { fileId: fileData?.id, url: fileData?.url, mimeType: fileData?.mime_type })
                          
                          handleImageChange(finalUrl)
                        } else if (fileData?.id) {
                          // Fallback: if no URL but we have an ID, construct the proxy URL
                          const finalUrl = `${API_BASE_URL}/storage/proxy/${fileData.id}`
                          console.log('Constructed image URL from ID:', finalUrl)
                          handleImageChange(finalUrl)
                        } else {
                          console.error('No URL or ID in upload response:', res)
                          toast({ title: "Upload failed", description: "No URL returned from server", variant: "destructive" })
                        }
                      } catch (err: any) {
                        console.error('Upload failed', err)
                        toast({ 
                          title: "Upload failed", 
                          description: err.message || "Could not upload image. Please try again.", 
                          variant: "destructive" 
                        })
                      } finally {
                        setUploading(false)
                      }
                    }
                  }}
                />
                <div 
                  className={clsx("w-full h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-pink-400 transition-colors relative overflow-hidden", uploading && "opacity-50 pointer-events-none", !value.image && !uploading && "bg-gray-50")}
                  onClick={() => !uploading && fileInputRef.current?.click()}
                >
                  {uploading ? (
                      <div className="text-center text-xs text-pink-600 font-medium animate-pulse z-10 relative">Uploading...</div>
                  ) : value.image ? (
                    <img 
                      src={value.image} 
                      alt="Preview" 
                      className="absolute inset-0 w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        console.error('Image failed to load:', value.image)
                        console.error('Error details:', e)
                        // Show placeholder on error
                        e.currentTarget.style.display = 'none'
                        const placeholder = e.currentTarget.parentElement?.querySelector('.upload-placeholder')
                        if (placeholder) {
                          (placeholder as HTMLElement).style.display = 'block'
                        }
                        // Show error message
                        toast({ 
                          title: "Image failed to load", 
                          description: `Could not load image from: ${value.image}`, 
                          variant: "destructive" 
                        })
                      }}
                      onLoad={() => {
                        console.log('Image loaded successfully:', value.image)
                        // Hide placeholder when image loads successfully
                        const placeholder = document.querySelector('.upload-placeholder')
                        if (placeholder) {
                          (placeholder as HTMLElement).style.display = 'none'
                        }
                      }}
                    />
                  ) : (
                    <div className="text-center upload-placeholder z-10 relative">
                      <svg className="w-8 h-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs text-gray-500 mt-1">Click to upload</p>
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Or paste image URL..."
                  value={value.image || ''}
                  onChange={(e) => handleImageChange(e.target.value)}
                  className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              </div>
            )}

            {/* Video */}
            {activeTab === 'video' && (
              <div className="space-y-3">
                <input
                  type="file"
                  ref={videoInputRef}
                  className="hidden"
                  accept="video/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                       setUploading(true)
                       try {
                         const res = await adminService.uploadFile(file)
                         handleVideoChange(res.file.url)
                       } catch (err) {
                         console.error('Upload failed', err)
                       } finally {
                         setUploading(false)
                       }
                    }
                  }}
                />
                <div 
                  className={clsx("w-full h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-900 cursor-pointer hover:border-pink-400 transition-colors", uploading && "opacity-50 pointer-events-none")}
                  onClick={() => !uploading && videoInputRef.current?.click()}
                >
                  {uploading ? (
                     <div className="text-center text-xs text-pink-500 font-medium animate-pulse">Uploading...</div>
                  ) : (
                  <div className="text-center">
                    <svg className="w-8 h-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-gray-400 mt-1">Click to upload video</p>
                  </div>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Or paste video URL..."
                  value={value.video || ''}
                  onChange={(e) => handleVideoChange(e.target.value)}
                  className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              </div>
            )}
          </div>
        </div>
      , document.body)}
    </div>
  )
}

// Helper to convert legacy string color to ColorValue
export function toColorValue(color: string | ColorValue): ColorValue {
  if (typeof color === 'string') {
    return { mode: 'solid', solid: color }
  }
  return color
}

// Helper to get CSS value from ColorValue
export function colorValueToCss(value: ColorValue): string {
  switch (value.mode) {
    case 'solid':
      return value.solid || '#FFFFFF'
    case 'gradient':
      if (value.gradient && value.gradient.stops.length >= 2) {
        const sortedStops = [...value.gradient.stops].sort((a, b) => a.position - b.position)
        const stops = sortedStops.map(s => `${s.color} ${s.position}%`).join(', ')
        return `linear-gradient(${value.gradient.angle || 135}deg, ${stops})`
      }
      return '#FFFFFF'
    case 'image':
      return value.image ? `url(${value.image})` : '#FFFFFF'
    case 'video':
      return '#1F2937'
    default:
      return '#FFFFFF'
  }
}
