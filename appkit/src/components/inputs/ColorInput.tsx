'use client'

import React from 'react'
import { Popover, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx'

interface ColorInputProps {
    value?: string
    onChange: (color: string) => void
    label?: string
    className?: string
}

// Common presets matching mobile theme
const PRESETS = [
    '#FFB6C1', '#FFC0CB', '#FF69B4', '#F8BBD9', // Pinks
    '#6B7280', '#9CA3AF', '#F3F4F6', '#374151', // Greys
    '#FFFFFF', '#000000', '#10B981', '#3B82F6', '#F59E0B', '#EF4444' // Basics
]

export default function ColorInput({ value = '#000000', onChange, label, className }: ColorInputProps) {
    return (
        <div className={clsx("w-full", className)}>
            {label && <label className="block text-xs font-medium text-gray-500 uppercase mb-1">{label}</label>}
            <Popover className="relative">
                {({ open }) => (
                    <>
                        <Popover.Button className="w-full flex items-center justify-between rounded-lg bg-white border border-gray-300 px-3 py-2 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div 
                                    className="h-6 w-8 rounded border border-gray-200 shadow-sm"
                                    style={{ backgroundColor: value }}
                                />
                                <span className="text-sm text-gray-700 font-mono">{value}</span>
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
                            <Popover.Panel className="absolute z-50 mt-1 w-[240px] overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-black ring-opacity-5 p-3">
                                {/* Hex Input (Manual) */}
                                <div className="mb-3">
                                    <label className="text-xs font-medium text-gray-500 mb-1 block">Hex Value</label>
                                    <div className="flex gap-2">
                                        <div className="h-9 w-10 relative overflow-hidden rounded border border-gray-300">
                                            <input 
                                                type="color" 
                                                value={value} 
                                                onChange={(e) => onChange(e.target.value)}
                                                className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer p-0 border-0"
                                            />
                                        </div>
                                        <input 
                                            type="text" 
                                            value={value} 
                                            onChange={(e) => onChange(e.target.value)}
                                            className="flex-1 rounded border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Presets */}
                                <div>
                                    <label className="text-xs font-medium text-gray-500 mb-2 block">Presets</label>
                                    <div className="grid grid-cols-7 gap-2">
                                        {PRESETS.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                className="h-6 w-6 rounded-full border border-gray-200 shadow-sm hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                style={{ backgroundColor: color }}
                                                onClick={() => onChange(color)}
                                                title={color}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </Popover.Panel>
                        </Transition>
                    </>
                )}
            </Popover>
        </div>
    )
}
