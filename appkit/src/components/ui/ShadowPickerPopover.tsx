'use client'

import React, { useState, useRef, useEffect } from 'react'
import { clsx } from 'clsx'
import { ColorPickerPopover, ColorValue, colorValueToCss } from './ColorPickerPopover'
import { SegmentedControl } from './SegmentedControl'

export interface ShadowConfig {
    color: ColorValue
    blur: number
    spread: number
    offsetX: number
    offsetY: number
    opacity: number
}

interface ShadowPickerPopoverProps {
    value?: {
        level: 'none' | 'sm' | 'md' | 'lg' | 'custom'
        color?: ColorValue
        blur?: number
        spread?: number
        offsetX?: number
        offsetY?: number
        opacity?: number
    }
    onChange: (updates: any) => void
    label?: string
}

const SHADOW_PRESETS = [
    { label: 'None', value: 'none' },
    { label: 'Small', value: 'sm' },
    { label: 'Medium', value: 'md' },
    { label: 'Large', value: 'lg' },
    { label: 'Custom', value: 'custom' },
]

export function ShadowPickerPopover({ value, onChange, label }: ShadowPickerPopoverProps) {
    const [isOpen, setIsOpen] = useState(false)
    const popoverRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)

    const level = value?.level || 'none'
    const color = value?.color || { mode: 'solid', solid: '#000000' }
    const blur = value?.blur ?? 10
    const spread = value?.spread ?? 0
    const offsetX = value?.offsetX ?? 0
    const offsetY = value?.offsetY ?? 4
    const opacity = value?.opacity ?? 10

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen])

    const getPreviewShadow = () => {
        if (level !== 'custom') {
            switch (level) {
                case 'sm': return '0 1px 2px rgba(0,0,0,0.05)'
                case 'md': return '0 4px 6px rgba(0,0,0,0.1)'
                case 'lg': return '0 10px 15px rgba(0,0,0,0.1)'
                default: return 'none'
            }
        }
        const rgba = colorValueToCss({ ...color, solid: color.solid }) // Basic color conversion
        // We need to inject opacity into the color if it's hex or rgb
        // For simplicity, we'll let the user handle color opacity via ColorPicker or just assume standard CSS structure
        // But better is to just use the color as is, and user sets opacity in color picker OR we multiply alpha
        
        // Actually, let's use the provided opacity value for the shadow color's alpha if possible, 
        // or just let ColorPicker handle exact color including alpha.
        // For this UI, let's just stick to the color value.
        return `${offsetX}px ${offsetY}px ${blur}px ${spread}px ${colorValueToCss(color)}`
    }

    return (
        <div className="relative w-full">
            {label && <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>}
            
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 w-full h-9 px-2 border border-gray-300 rounded-lg bg-white hover:border-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <div 
                    className="w-6 h-6 rounded bg-white border border-gray-200 shrink-0"
                    style={{ boxShadow: getPreviewShadow() }}
                />
                <span className="text-xs text-gray-600 truncate flex-1 text-left capitalize">
                    {level === 'custom' ? 'Custom Shadow' : (level === 'none' ? 'No Shadow' : `${level} Shadow`)}
                </span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div 
                    ref={popoverRef}
                    className="absolute z-50 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 p-4 right-0"
                >
                    <div className="space-y-4">
                        {/* Preset Selection */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Preset</label>
                            <div className="flex flex-wrap gap-1">
                                {SHADOW_PRESETS.map(preset => (
                                    <button
                                        key={preset.value}
                                        onClick={() => onChange({ shadowLevel: preset.value })}
                                        className={clsx(
                                            "px-2 py-1 text-xs rounded-md transition-colors border",
                                            level === preset.value
                                                ? "bg-blue-50 border-blue-200 text-blue-700 font-medium"
                                                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                        )}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {level === 'custom' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 pt-2 border-t border-gray-100">
                                {/* Color */}
                                <ColorPickerPopover
                                    label="Shadow Color"
                                    value={color}
                                    onChange={(val) => onChange({ shadowColor: val })}
                                />

                                {/* Offset X & Y */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <div className="flex justify-between">
                                            <label className="text-xs font-medium text-gray-600">Offset X</label>
                                            <span className="text-xs font-mono text-gray-400">{offsetX}px</span>
                                        </div>
                                        <input 
                                            type="range" min="-50" max="50" 
                                            value={offsetX}
                                            onChange={(e) => onChange({ shadowOffsetX: parseInt(e.target.value) })}
                                            className="w-full accent-black h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between">
                                            <label className="text-xs font-medium text-gray-600">Offset Y</label>
                                            <span className="text-xs font-mono text-gray-400">{offsetY}px</span>
                                        </div>
                                        <input 
                                            type="range" min="-50" max="50" 
                                            value={offsetY}
                                            onChange={(e) => onChange({ shadowOffsetY: parseInt(e.target.value) })}
                                            className="w-full accent-black h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                </div>

                                {/* Blur & Spread */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <div className="flex justify-between">
                                            <label className="text-xs font-medium text-gray-600">Blur</label>
                                            <span className="text-xs font-mono text-gray-400">{blur}px</span>
                                        </div>
                                        <input 
                                            type="range" min="0" max="100" 
                                            value={blur}
                                            onChange={(e) => onChange({ shadowBlur: parseInt(e.target.value) })}
                                            className="w-full accent-black h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between">
                                            <label className="text-xs font-medium text-gray-600">Spread</label>
                                            <span className="text-xs font-mono text-gray-400">{spread}px</span>
                                        </div>
                                        <input 
                                            type="range" min="-20" max="50" 
                                            value={spread}
                                            onChange={(e) => onChange({ shadowSpread: parseInt(e.target.value) })}
                                            className="w-full accent-black h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
