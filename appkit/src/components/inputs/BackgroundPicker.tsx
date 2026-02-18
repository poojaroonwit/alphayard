'use client'

import React, { useState, useEffect } from 'react'
import { Popover, Tab, Transition } from '@headlessui/react'
import { ChevronDownIcon, PlusIcon, TrashIcon } from '@heroicons/react/20/solid'
import { BackgroundConfig, BackgroundType, GradientStop } from '@/types/settings'
import clsx from 'clsx'
import { v4 as uuidv4 } from 'uuid'

interface BackgroundPickerProps {
    value: BackgroundConfig
    onChange: (config: BackgroundConfig) => void
    onUpload?: (file: File) => Promise<void>
    isUploading?: boolean
    label?: string
}

const PRESET_COLORS = [
    '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', // Grays
    '#3b82f6', '#2563eb', '#1d4ed8', // Blues
    '#ef4444', '#dc2626', '#b91c1c', // Reds
    '#10b981', '#059669', '#047857', // Greens
    '#f59e0b', '#d97706', '#b45309', // Ambers
    '#8b5cf6', '#7c3aed', '#6d28d9', // Violets
    '#000000', '#1e293b',
]

const TEXTURES = [
    { id: 'dots', name: 'Dots', class: 'bg-dots' },
    { id: 'grid', name: 'Grid', class: 'bg-grid' },
    { id: 'none', name: 'None', class: '' },
]

export default function BackgroundPicker({ 
    value, 
    onChange, 
    onUpload,
    isUploading = false,
    label = 'Background' 
}: BackgroundPickerProps) {
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const videoInputRef = React.useRef<HTMLInputElement>(null)

    // Helper to update specific fields
    const update = (changes: Partial<BackgroundConfig>) => {
        onChange({ ...value, ...changes })
    }

    // Gradient Helpers
    const addStop = () => {
        const newStop: GradientStop = { id: uuidv4(), color: '#3b82f6', position: 50 }
        update({ 
            gradientStops: [...(value.gradientStops || []), newStop].sort((a, b) => a.position - b.position) 
        })
    }

    const removeStop = (id: string) => {
        update({ gradientStops: value.gradientStops?.filter(s => s.id !== id) })
    }

    const updateStop = (id: string, stopChanges: Partial<GradientStop>) => {
        const newStops = value.gradientStops?.map(s => 
            s.id === id ? { ...s, ...stopChanges } : s
        ).sort((a, b) => a.position - b.position)
        update({ gradientStops: newStops })
    }

    // Determine current tab index
    const tabs: BackgroundType[] = ['solid', 'gradient', 'texture', 'image', 'video']
    const selectedIndex = tabs.indexOf(value.type)

    return (
        <div className="w-full max-w-sm">
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <Popover className="relative">
                {({ open }) => (
                    <>
                        <Popover.Button className="w-full flex items-center justify-between rounded-lg bg-white border border-gray-300 px-3 py-2 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <div className="flex items-center gap-3">
                                {/* Preview Swatch */}
                                <div 
                                    className="h-6 w-12 rounded border border-gray-200 shadow-sm"
                                    style={{
                                        background: value.type === 'solid' ? value.value : 
                                                    value.type === 'gradient' ? `linear-gradient(${value.gradientDirection || 'to right'}, ${value.gradientStops?.map(s => `${s.color} ${s.position}%`).join(', ')})` :
                                                    '#eee'
                                    }}
                                />
                                <span className="text-sm text-gray-700 capitalize">{value.type} Background</span>
                            </div>
                            <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </Popover.Button>
                        <Transition
                            as={React.Fragment}
                            enter="transition ease-out duration-200"
                            enterFrom="opacity-0 translate-y-1"
                            enterTo="opacity-100 translate-y-0"
                            leave="transition ease-in duration-150"
                            leaveFrom="opacity-100 translate-y-0"
                            leaveTo="opacity-0 translate-y-1"
                        >
                            <Popover.Panel className="absolute z-50 mt-1 w-[400px] overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                                <Tab.Group 
                                    selectedIndex={selectedIndex} 
                                    onChange={(idx) => update({ type: tabs[idx] })}
                                >
                                    <Tab.List className="flex bg-gray-50 border-b border-gray-200">
                                        {tabs.map((tab) => (
                                            <Tab
                                                key={tab}
                                                className={({ selected }) =>
                                                    clsx(
                                                        'flex-1 py-3 text-xs font-medium focus:outline-none capitalize transition-colors',
                                                        selected ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
                                                    )
                                                }
                                            >
                                                {tab}
                                            </Tab>
                                        ))}
                                    </Tab.List>
                                    <Tab.Panels className="p-4">
                                        {/* SOLID (index 0) */}
                                        <Tab.Panel>
                                            <div className="mb-4">
                                                <label className="text-xs font-medium text-gray-500 uppercase">Hex Color</label>
                                                <div className="mt-1 flex gap-2">
                                                    <input 
                                                        type="color" 
                                                        value={value.value} 
                                                        onChange={(e) => update({ value: e.target.value })}
                                                        className="h-10 w-12 p-0 border-0 rounded overflow-hidden cursor-pointer"
                                                    />
                                                    <input 
                                                        type="text" 
                                                        value={value.value} 
                                                        onChange={(e) => update({ value: e.target.value })}
                                                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-7 gap-2">
                                                {PRESET_COLORS.map(c => (
                                                    <button 
                                                        key={c}
                                                        className="h-6 w-full rounded border border-gray-200"
                                                        style={{ backgroundColor: c }}
                                                        onClick={() => update({ value: c })}
                                                        title={c}
                                                    />
                                                ))}
                                            </div>
                                        </Tab.Panel>

                                        {/* GRADIENT (index 1) */}
                                        <Tab.Panel>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-xs font-medium text-gray-500 uppercase">Direction</label>
                                                    <select 
                                                        value={value.gradientDirection}
                                                        onChange={(e) => update({ gradientDirection: e.target.value })}
                                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                                    >
                                                        <option value="to right">To Right →</option>
                                                        <option value="to bottom">To Bottom ↓</option>
                                                        <option value="to bottom right">To Bottom Right ↘</option>
                                                        <option value="to bottom left">To Bottom Left ↙</option>
                                                    </select>
                                                </div>
                                                
                                                <div>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <label className="text-xs font-medium text-gray-500 uppercase">Stops</label>
                                                        <button 
                                                            type="button" 
                                                            onClick={addStop} 
                                                            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center"
                                                        >
                                                            <PlusIcon className="h-3 w-3 mr-1" /> Add
                                                        </button>
                                                    </div>
                                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                                        {value.gradientStops?.map((stop) => (
                                                            <div key={stop.id} className="flex items-center gap-2">
                                                                <input 
                                                                    type="color" 
                                                                    value={stop.color} 
                                                                    onChange={(e) => updateStop(stop.id, { color: e.target.value })}
                                                                    className="h-8 w-8 p-0 border-0 rounded overflow-hidden cursor-pointer flex-shrink-0"
                                                                />
                                                                <input 
                                                                    type="range" 
                                                                    min="0" 
                                                                    max="100" 
                                                                    value={stop.position}
                                                                    onChange={(e) => updateStop(stop.id, { position: parseInt(e.target.value) })}
                                                                    className="flex-1"
                                                                />
                                                                <span className="text-xs text-gray-500 w-8 text-right">{stop.position}%</span>
                                                                {(value.gradientStops?.length || 0) > 2 && (
                                                                    <button 
                                                                        onClick={() => removeStop(stop.id)}
                                                                        className="text-gray-400 hover:text-red-500"
                                                                    >
                                                                        <TrashIcon className="h-4 w-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </Tab.Panel>

                                        {/* TEXTURE (index 2) */}
                                        <Tab.Panel>
                                            <div className="grid grid-cols-2 gap-3">
                                                {TEXTURES.map((texture) => (
                                                    <button
                                                        key={texture.id}
                                                        onClick={() => update({ value: texture.id })}
                                                        className={clsx(
                                                            "h-16 rounded-lg border-2 flex items-center justify-center text-sm font-medium transition-all",
                                                            value.value === texture.id ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 hover:border-gray-300 text-gray-700"
                                                        )}
                                                    >
                                                        {texture.name}
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="mt-4 text-xs text-gray-500">
                                                Textures are subtle patterns overlayed on a solid background color. Switch to the Solid tab to change the base color.
                                            </p>
                                        </Tab.Panel>

                                        {/* IMAGE (index 3) */}
                                        <Tab.Panel>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-xs font-medium text-gray-500 uppercase">Image URL</label>
                                                    <div className="flex gap-2">
                                                        <input 
                                                            type="text" 
                                                            value={value.value} 
                                                            onChange={(e) => update({ value: e.target.value })}
                                                            placeholder="https://example.com/background.jpg"
                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                                        />
                                                        {onUpload && (
                                                            <>
                                                                <input
                                                                    ref={fileInputRef}
                                                                    type="file"
                                                                    accept="image/*"
                                                                    className="hidden"
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0]
                                                                        if (file) onUpload(file)
                                                                    }}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => fileInputRef.current?.click()}
                                                                    disabled={isUploading}
                                                                    className="mt-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 transition-colors whitespace-nowrap"
                                                                >
                                                                    {isUploading ? '...' : 'Upload'}
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                {value.value && (
                                                    <div className="mt-2 aspect-video rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center relative">
                                                        <img src={value.value} alt="Preview" className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: value.overlayColor, opacity: value.overlayOpacity }} />
                                                    </div>
                                                )}
                                                <div>
                                                    <label className="text-xs font-medium text-gray-500 uppercase">Overlay</label>
                                                    <div className="flex gap-2 mt-1">
                                                        <input 
                                                            type="color" 
                                                            value={value.overlayColor || '#000000'} 
                                                            onChange={(e) => update({ overlayColor: e.target.value })}
                                                            className="h-8 w-8 border-0 p-0 rounded cursor-pointer"
                                                        />
                                                        <input 
                                                            type="range" min="0" max="1" step="0.1"
                                                            value={value.overlayOpacity || 0}
                                                            onChange={(e) => update({ overlayOpacity: parseFloat(e.target.value) })}
                                                            className="flex-1"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </Tab.Panel>

                                        {/* VIDEO (index 4) */}
                                        <Tab.Panel>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-xs font-medium text-gray-500 uppercase">Video URL</label>
                                                    <div className="flex gap-2">
                                                        <input 
                                                            type="text" 
                                                            value={value.value} 
                                                            onChange={(e) => update({ value: e.target.value })}
                                                            placeholder="https://example.com/background.mp4"
                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                                        />
                                                        {onUpload && (
                                                            <>
                                                                <input
                                                                    ref={videoInputRef}
                                                                    type="file"
                                                                    accept="video/*"
                                                                    className="hidden"
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0]
                                                                        if (file) onUpload(file)
                                                                    }}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => videoInputRef.current?.click()}
                                                                    disabled={isUploading}
                                                                    className="mt-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 transition-colors whitespace-nowrap"
                                                                >
                                                                    {isUploading ? '...' : 'Upload'}
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                {value.value && (
                                                    <div className="mt-2 aspect-video rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center relative">
                                                        <video src={value.value} className="w-full h-full object-cover" autoPlay muted loop />
                                                        <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: value.overlayColor, opacity: value.overlayOpacity }} />
                                                    </div>
                                                )}
                                                <div>
                                                    <label className="text-xs font-medium text-gray-500 uppercase">Overlay</label>
                                                    <div className="flex gap-2 mt-1">
                                                        <input 
                                                            type="color" 
                                                            value={value.overlayColor || '#000000'} 
                                                            onChange={(e) => update({ overlayColor: e.target.value })}
                                                            className="h-8 w-8 border-0 p-0 rounded cursor-pointer"
                                                        />
                                                        <input 
                                                            type="range" min="0" max="1" step="0.1"
                                                            value={value.overlayOpacity || 0}
                                                            onChange={(e) => update({ overlayOpacity: parseFloat(e.target.value) })}
                                                            className="flex-1"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </Tab.Panel>
                                    </Tab.Panels>
                                </Tab.Group>
                            </Popover.Panel>
                        </Transition>
                    </>
                )}
            </Popover>
        </div>
    )
}
