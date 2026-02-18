'use client'

import React, { useState } from 'react'
import { CategoryConfig, ComponentStyle, ComponentConfig } from './types'
import { clsx } from 'clsx'
import { StyleConfigPopover } from './StyleConfigPopover'
import { MiniDevicePreview } from './MiniDevicePreview'

import { DocumentDuplicateIcon } from '@heroicons/react/24/outline'

interface ComponentStyleSettingsProps {
    activeCategory: CategoryConfig
    handleUpdateComponentStyle: (categoryId: string, componentId: string, field: keyof ComponentStyle, value: any) => void
    handleUpdateComponentConfig?: (categoryId: string, componentId: string, field: string, value: any) => void
    handleDuplicateComponent?: (categoryId: string, componentId: string) => void
    autoOpenComponentId?: string | null
}

export function ComponentStyleSettings({ activeCategory, handleUpdateComponentStyle, handleUpdateComponentConfig, handleDuplicateComponent, autoOpenComponentId }: ComponentStyleSettingsProps) {
    const [selectedComponentId, setSelectedComponentId] = useState<string | null>(activeCategory.components[0]?.id || null)
    
    // Popover Management
    const [configOpen, setConfigOpen] = useState(false)
    const [activePopover, setActivePopover] = useState<string | null>(null) // For nested color pickers

    React.useEffect(() => {
        if (autoOpenComponentId) {
            setSelectedComponentId(autoOpenComponentId)
            setConfigOpen(true)
        }
    }, [autoOpenComponentId])

    const selectedComponent = activeCategory.components.find(c => c.id === selectedComponentId) || activeCategory.components[0]

    const handleGridItemClick = (comp: ComponentConfig) => {
        setSelectedComponentId(comp.id)
        setConfigOpen(true)
    }

    return (
        <div className="flex flex-col xl:flex-row gap-8 relative">
            {/* Popover */}
            {selectedComponent && (
                <StyleConfigPopover
                    isOpen={configOpen}
                    onClose={() => setConfigOpen(false)}
                    component={selectedComponent}
                    activeCategory={activeCategory}
                    handleUpdateComponentStyle={handleUpdateComponentStyle}
                    handleUpdateComponentConfig={handleUpdateComponentConfig}
                    activePopover={activePopover}
                    setActivePopover={setActivePopover}
                />
            )}

            {/* Left Column: Visual Grid */}
            <div className="flex-1 space-y-6">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-gray-900">{activeCategory.name}</h3>
                        <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                            {activeCategory.components.length} components
                        </div>
                    </div>
                    {activeCategory.description && (
                        <p className="text-sm text-gray-500 max-w-2xl">{activeCategory.description}</p>
                    )}
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {activeCategory.components.map((component) => {
                        return (
                            <div key={component.id} className="flex flex-col gap-2 group">
                                <div className="flex items-center justify-between w-full px-1">
                                    <span className="font-semibold text-gray-900 text-sm tracking-tight truncate">{component.name}</span>
                                    {handleDuplicateComponent && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDuplicateComponent(activeCategory.id, component.id);
                                            }}
                                            className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Duplicate component"
                                        >
                                            <DocumentDuplicateIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <MiniDevicePreview 
                                    component={component} 
                                    onClick={() => handleGridItemClick(component)}
                                />
                            </div>
                        )
                    })}
                </div>
            </div>

        </div>
    )
}
