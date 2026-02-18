import React from 'react'
import { ComponentConfig } from './types'
import { colorValueToCss } from '../ui/ColorPickerPopover'
import { clsx } from 'clsx'
import * as HeroIcons from '@heroicons/react/24/outline'

import { renderPreview } from './ComponentPreviews'
import { ReactNativeComponentBadge } from './ReactNativeComponentInfo'

interface MiniDevicePreviewProps {
    component: ComponentConfig
    onClick?: () => void
}

// Component type colors for visual categorization
const TYPE_COLORS: Record<string, string> = {
    button: 'bg-blue-500',
    input: 'bg-purple-500',
    card: 'bg-green-500',
    badge: 'bg-yellow-500',
    tabbar: 'bg-pink-500',
    accordion: 'bg-orange-500',
    generic: 'bg-gray-500',
}

export function MiniDevicePreview({ component, onClick }: MiniDevicePreviewProps) {
    const styles = component.styles
    const typeColor = TYPE_COLORS[component.type] || TYPE_COLORS.generic

    return (
        <div 
            onClick={onClick}
            className="group relative w-full aspect-[4/3] bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-md hover:border-blue-200 hover:bg-white flex items-center justify-center p-4"
        >
            {/* The Component Preview */}
            <div className="relative z-10 w-full flex justify-center items-center transform scale-[0.65] origin-center -translate-y-2 group-hover:scale-[0.68] transition-transform duration-300">
                <div className="w-full flex justify-center pointer-events-none">
                    {renderPreview(component, styles)}
                </div>
            </div>

            {/* Component Status/Name Overlay */}
            <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-start pointer-events-none border-b border-transparent group-hover:border-gray-50 bg-transparent group-hover:bg-white/80 backdrop-blur-sm transition-all duration-300 z-10">
                <div className="flex items-center gap-1.5">
                    <div className={clsx("w-2 h-2 rounded-full", typeColor)} />
                    <div className="text-[10px] font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 uppercase tracking-tighter">
                       {component.type || 'generic'}
                    </div>
                </div>
                {component.mobileConfig ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" title="Linked to React Native" />
                ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300" title="No React Native component" />
                )}
            </div>

            {/* React Native Component Badge - Bottom Left */}
            {component.mobileConfig && (
                <div className="absolute bottom-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <ReactNativeComponentBadge component={component} />
                </div>
            )}

            {/* Hover Footer */}
            <div className="absolute inset-0 bg-transparent transition-colors z-20 flex items-end justify-center pb-3 pointer-events-none">
                <span className="text-[10px] bg-white border border-gray-200 shadow-sm text-gray-900 px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 duration-200 font-medium">
                    Configure Styling
                </span>
            </div>
        </div>
    )
}
