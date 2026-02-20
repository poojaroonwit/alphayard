import React, { useState } from 'react'
import { Modal } from '../ui/Modal'
import { CategoryConfig, ComponentConfig } from './types'

interface StyleConfigPopoverProps {
    isOpen: boolean
    onClose: () => void
    component: ComponentConfig
    activeCategory: CategoryConfig
    handleUpdateComponentStyle: (categoryId: string, componentId: string, field: any, value: any) => void
    handleUpdateComponentConfig?: (categoryId: string, componentId: string, field: string, value: any) => void
    activePopover: string | null
    setActivePopover: (val: string | null) => void
}

export function StyleConfigPopover({
    component,
    isOpen,
    onClose,
    activePopover,
    setActivePopover
}: StyleConfigPopoverProps) {
    if (!isOpen) return null;
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg" title={component?.name || "Style Config"}>
            <div className="text-sm text-gray-500">
                Style configuration temporarily disabled
            </div>
        </Modal>
    )
}
