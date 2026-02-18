'use client'

import React from 'react'
import { IconUploadEditor } from './IconUploadEditor'
import { ComponentConfig } from './types'
import { ShareIcon, GlobeAltIcon } from '@heroicons/react/24/outline'

interface IconCategoryPanelProps {
    categoryId: string
    categoryName: string
    description: string
    components: ComponentConfig[]
    onIconUpload: (componentId: string, file: File) => Promise<string>
    onIconRemove: (componentId: string) => void
    onIconUrlChange: (componentId: string, url: string) => void
}

export const IconCategoryPanel: React.FC<IconCategoryPanelProps> = ({
    categoryId,
    categoryName,
    description,
    components,
    onIconUpload,
    onIconRemove,
    onIconUrlChange
}) => {
    const isSocial = categoryId === 'social-icons'
    
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center
                    ${isSocial 
                        ? 'bg-gradient-to-br from-pink-500 to-purple-600' 
                        : 'bg-gradient-to-br from-blue-500 to-cyan-600'
                    }
                `}>
                    {isSocial 
                        ? <ShareIcon className="w-6 h-6 text-white" />
                        : <GlobeAltIcon className="w-6 h-6 text-white" />
                    }
                </div>
                <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {categoryName}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {description}
                    </p>
                </div>
            </div>

            {/* Instructions */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                    💡 Upload Instructions
                </h4>
                <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                    <li>• Supported formats: PNG, SVG, JPG, WebP</li>
                    <li>• Recommended size: 64x64 pixels or larger</li>
                    <li>• Maximum file size: 500KB</li>
                    <li>• Use transparent backgrounds for best results</li>
                </ul>
            </div>

            {/* Icons Grid */}
            <div className="space-y-3">
                {components.map((component) => (
                    <IconUploadEditor
                        key={component.id}
                        iconUrl={(component.styles as any)?.iconUrl || ''}
                        iconName={component.name}
                        onUpload={(file) => onIconUpload(component.id, file)}
                        onRemove={() => onIconRemove(component.id)}
                        onChange={(url) => onIconUrlChange(component.id, url)}
                    />
                ))}
            </div>

            {/* Add Custom Icon */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button className="w-full py-3 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 dark:hover:border-blue-400 dark:hover:text-blue-400 transition-colors">
                    + Add Custom {isSocial ? 'Social Platform' : 'Country Flag'}
                </button>
            </div>
        </div>
    )
}

export default IconCategoryPanel
