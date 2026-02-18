import React, { useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { CategoryConfig, ComponentStyle, ComponentConfig } from './types'
import { ColorPickerPopover, colorValueToCss } from '../ui/ColorPickerPopover'
import { SegmentedControl } from '../ui/SegmentedControl'
import { MobileGuide } from '../ui/MobileGuide'
import { XMarkIcon, EyeIcon, CodeBracketIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { IconPickerPopover } from '../ui/IconPickerPopover'
import * as HeroIcons from '@heroicons/react/24/outline'
import { clsx } from 'clsx'
import { ShadowPickerPopover } from '../ui/ShadowPickerPopover'

import { renderPreview } from './ComponentPreviews'
import { ReactNativeComponentInfo } from './ReactNativeComponentInfo'

interface StyleConfigPopoverProps {
    isOpen: boolean
    onClose: () => void
    component: ComponentConfig
    activeCategory: CategoryConfig
    handleUpdateComponentStyle: (categoryId: string, componentId: string, field: keyof ComponentStyle, value: any) => void
    handleUpdateComponentConfig?: (categoryId: string, componentId: string, field: string, value: any) => void
    activePopover: string | null
    setActivePopover: (val: string | null) => void
}

export function StyleConfigPopover({ 
    isOpen, 
    onClose, 
    component, 
    activeCategory, 
    handleUpdateComponentStyle,
    handleUpdateComponentConfig,
    activePopover,
    setActivePopover
}: StyleConfigPopoverProps) {
    const [activeTab, setActiveTab] = useState<'preview' | 'react-native'>('preview')
    
    if (!component) return null
    const styles = component.styles
    const config = component.config

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog onClose={onClose} className="relative z-50">
                {/* Backdrop */}
                {/* Backdrop removed as requested */}

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-4 right-4 flex max-w-full pl-10">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-in-out duration-500 sm:duration-700"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-500 sm:duration-700"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                                    <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-2xl rounded-3xl border border-gray-100 py-6">
                                        <div className="px-4 sm:px-6 border-b border-gray-100 pb-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <Dialog.Title className="text-lg font-bold text-gray-900 leading-6">{component.name}</Dialog.Title>
                                                    <div className="text-xs text-gray-500 font-mono mt-1">{component.id}</div>
                                                </div>
                                                <div className="ml-3 flex items-center gap-2">
                                                    {component.mobileConfig && (
                                                        <MobileGuide 
                                                            title={component.name}
                                                            idLabel="Component Path"
                                                            idValue={component.mobileConfig.filePath || ''}
                                                            usageExample={component.mobileConfig.usageExample || ''}
                                                            devNote={`This maps to ${component.mobileConfig.componentName} in mobile.`}
                                                            buttonVariant="labeled"
                                                            buttonLabel="Integration Guide"
                                                        />
                                                    )}
                                                    <button
                                                        type="button"
                                                        className="relative rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                                        onClick={onClose}
                                                    >
                                                        <span className="absolute -inset-2.5" />
                                                        <span className="sr-only">Close panel</span>
                                                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="relative mt-6 flex-1 px-4 sm:px-6 space-y-6">
                                            {/* Tab Navigation */}
                                            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
                                                <button
                                                    onClick={() => setActiveTab('preview')}
                                                    className={clsx(
                                                        "flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all",
                                                        activeTab === 'preview' 
                                                            ? "bg-white text-gray-900 shadow-sm" 
                                                            : "text-gray-500 hover:text-gray-700"
                                                    )}
                                                >
                                                    <EyeIcon className="w-4 h-4" />
                                                    Preview
                                                </button>
                                                <button
                                                    onClick={() => setActiveTab('react-native')}
                                                    className={clsx(
                                                        "flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all",
                                                        activeTab === 'react-native' 
                                                            ? "bg-white text-gray-900 shadow-sm" 
                                                            : "text-gray-500 hover:text-gray-700",
                                                        !component.mobileConfig && "opacity-50 cursor-not-allowed"
                                                    )}
                                                    disabled={!component.mobileConfig}
                                                >
                                                    <CodeBracketIcon className="w-4 h-4" />
                                                    React Native
                                                </button>
                                            </div>

                                            {/* Preview Section - Type-Specific Renderers */}
                                            {activeTab === 'preview' && (
                                                <div className="w-full bg-gray-50 rounded-xl border border-gray-100 p-8 flex items-center justify-center min-h-[120px]">
                                                    {renderPreview(component, styles)}
                                                </div>
                                            )}

                                            {/* React Native Component Info */}
                                            {activeTab === 'react-native' && (
                                                <ReactNativeComponentInfo component={component} showFullPath />
                                            )}



                                            {/* Z. Specific Component Configuration (Dynamic) */}
                                            {config && handleUpdateComponentConfig && (
                                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <h5 className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.15em] border-b border-indigo-50 pb-2">Component Config</h5>
                                                    
                                                    {['selection-tabs', 'circle-selection-tabs'].includes(component.id) ? (
                                                        <div className="space-y-6">
                                                            <div className="space-y-3">
                                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Container & Layout</label>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="flex flex-col gap-1.5 col-span-2">
                                                                        <label className="text-[11px] font-medium text-gray-500">Menu Box Shadow</label>
                                                                        <SegmentedControl
                                                                            options={[
                                                                                { label: 'None', value: 'none' },
                                                                                { label: 'Small', value: 'sm' },
                                                                                { label: 'Medium', value: 'md' },
                                                                                { label: 'Large', value: 'lg' },
                                                                            ]}
                                                                            value={config.menuShowShadow as string || 'none'}
                                                                            onChange={(val) => handleUpdateComponentConfig(activeCategory.id, component.id, 'menuShowShadow', val)}
                                                                            variant="slate"
                                                                        />
                                                                    </div>
                                                                    <ColorPickerPopover
                                                                        label="Menu Background"
                                                                        value={typeof config.menuBackgroundColor === 'string' ? { mode: 'solid', solid: config.menuBackgroundColor } : config.menuBackgroundColor}
                                                                        onChange={(val: any) => handleUpdateComponentConfig(activeCategory.id, component.id, 'menuBackgroundColor', val.solid || val)}
                                                                        open={activePopover === `${component.id}-config-menuBackgroundColor`}
                                                                        onOpenChange={(open) => setActivePopover(open ? `${component.id}-config-menuBackgroundColor` : null)}
                                                                    />
                                                                    <div className="flex flex-col gap-1.5">
                                                                        <label className="text-[11px] font-medium text-gray-500">Fit Width</label>
                                                                        <SegmentedControl
                                                                            options={[{ label: 'Fit', value: true }, { label: 'Scroll', value: false }]}
                                                                            value={config.fit as boolean}
                                                                            onChange={(val) => handleUpdateComponentConfig(activeCategory.id, component.id, 'fit', val)}
                                                                            variant="slate"
                                                                        />
                                                                    </div>
                                                                    {!(config.fit as boolean) && (
                                                                         <div className="space-y-1.5 animate-in fade-in zoom-in duration-200">
                                                                            <div className="flex justify-between">
                                                                                <label className="text-[11px] font-medium text-gray-500">Item Spacing</label>
                                                                                <span className="text-[10px] font-mono text-gray-400">{config.itemSpacing ?? 8}px</span>
                                                                            </div>
                                                                            <input 
                                                                                type="range" min="0" max="32" 
                                                                                value={config.itemSpacing as number ?? 8}
                                                                                onChange={(e) => handleUpdateComponentConfig(activeCategory.id, component.id, 'itemSpacing', parseInt(e.target.value))}
                                                                                className="w-full accent-black h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Circle Tab Visibility */}
                                                                {component.id === 'circle-selection-tabs' && (
                                                                    <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-3 mt-1">
                                                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider col-span-2">Tab Visibility</label>
                                                                        {[
                                                                            { id: 'showLocationTab', label: 'Location' },
                                                                            { id: 'showGalleryTab', label: 'Gallery' },
                                                                            { id: 'showFinancialTab', label: 'Financial' },
                                                                            { id: 'showHealthTab', label: 'Health' },
                                                                        ].map(tab => (
                                                                            <div key={tab.id} className="flex flex-col gap-1.5">
                                                                                <label className="text-[11px] font-medium text-gray-500">{tab.label}</label>
                                                                                <SegmentedControl
                                                                                    options={[ { label: 'Show', value: true }, { label: 'Hide', value: false } ]}
                                                                                    value={config[tab.id] as boolean ?? true}
                                                                                    onChange={(val) => handleUpdateComponentConfig(activeCategory.id, component.id, tab.id, val)}
                                                                                    variant="slate"
                                                                                />
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                {/* Pinned Tab Controls */}
                                                                <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-3 mt-1">
                                                                    <div className="flex flex-col gap-1.5 col-span-2">
                                                                        <div className="flex justify-between items-center">
                                                                            <label className="text-[11px] font-medium text-gray-500">Fixed First Tab</label>
                                                                            <SegmentedControl
                                                                                options={[
                                                                                    { label: 'Off', value: false },
                                                                                    { label: 'On', value: true },
                                                                                ]}
                                                                                value={config.pinnedFirstTab as boolean || false}
                                                                                onChange={(val) => handleUpdateComponentConfig(activeCategory.id, component.id, 'pinnedFirstTab', val)}
                                                                                variant="slate"
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    {(config.pinnedFirstTab) && (
                                                                        <div className="col-span-2 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1">
                                                                             <div className="flex flex-col gap-1.5">
                                                                                <label className="text-[11px] font-medium text-gray-500">Show Separator</label>
                                                                                <SegmentedControl
                                                                                    options={[
                                                                                        { label: 'No', value: false },
                                                                                        { label: 'Yes', value: true },
                                                                                    ]}
                                                                                    value={config.showPinnedSeparator as boolean || false}
                                                                                    onChange={(val) => handleUpdateComponentConfig(activeCategory.id, component.id, 'showPinnedSeparator', val)}
                                                                                    variant="slate"
                                                                                />
                                                                            </div>
                                                                            <ColorPickerPopover
                                                                                label="Separator Color"
                                                                                value={{ mode: 'solid', solid: config.pinnedSeparatorColor as string || '#E5E7EB' }}
                                                                                onChange={(val: any) => handleUpdateComponentConfig(activeCategory.id, component.id, 'pinnedSeparatorColor', val.solid || val)}
                                                                                open={activePopover === `${component.id}-config-pinnedSeparatorColor`}
                                                                                onOpenChange={(open) => setActivePopover(open ? `${component.id}-config-pinnedSeparatorColor` : null)}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Item Shadows */}
                                                                <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-3 mt-1">
                                                                    <div className="flex flex-col gap-1.5">
                                                                        <label className="text-[11px] font-medium text-gray-500">Active Item Shadow</label>
                                                                        <SegmentedControl
                                                                            options={[
                                                                                { label: 'None', value: 'none' },
                                                                                { label: 'Sm', value: 'sm' },
                                                                                { label: 'Md', value: 'md' },
                                                                                { label: 'Lg', value: 'lg' },
                                                                            ]}
                                                                            value={config.activeShowShadow as string || 'none'}
                                                                            onChange={(val) => handleUpdateComponentConfig(activeCategory.id, component.id, 'activeShowShadow', val)}
                                                                            variant="slate"
                                                                        />
                                                                    </div>
                                                                    <div className="flex flex-col gap-1.5">
                                                                        <label className="text-[11px] font-medium text-gray-500">Inactive Item Shadow</label>
                                                                        <SegmentedControl
                                                                            options={[
                                                                                { label: 'None', value: 'none' },
                                                                                { label: 'Sm', value: 'sm' },
                                                                                { label: 'Md', value: 'md' },
                                                                                { label: 'Lg', value: 'lg' },
                                                                            ]}
                                                                            value={config.inactiveShowShadow as string || 'none'}
                                                                            onChange={(val) => handleUpdateComponentConfig(activeCategory.id, component.id, 'inactiveShowShadow', val)}
                                                                            variant="slate"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Item Radius */}
                                                            <div className="space-y-1.5">
                                                                <div className="flex justify-between">
                                                                    <label className="text-[11px] font-medium text-gray-500">Item Border Radius</label>
                                                                    <span className="text-[10px] font-mono text-gray-400">{config.itemBorderRadius ?? 12}px</span>
                                                                </div>
                                                                <input 
                                                                    type="range" min="0" max="32" 
                                                                    value={config.itemBorderRadius as number ?? 12}
                                                                    onChange={(e) => handleUpdateComponentConfig(activeCategory.id, component.id, 'itemBorderRadius', parseInt(e.target.value))}
                                                                    className="w-full accent-black h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                                                                />
                                                            </div>

                                                            {/* Group 2: Section Backgrounds & Borders */}
                                                            <div className="space-y-3 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Background & Border</label>
                                                                
                                                                {/* Active State */}
                                                                <div className="space-y-2">
                                                                    <label className="text-[10px] font-semibold text-gray-400">Active State</label>
                                                                    <div className="grid grid-cols-2 gap-3">
                                                                        <ColorPickerPopover
                                                                            label="Background"
                                                                            value={{ mode: 'solid', solid: config.activeColor as string }}
                                                                            onChange={(val: any) => handleUpdateComponentConfig(activeCategory.id, component.id, 'activeColor', val.solid || val)}
                                                                            open={activePopover === `${component.id}-config-activeColor`}
                                                                            onOpenChange={(open) => setActivePopover(open ? `${component.id}-config-activeColor` : null)}
                                                                        />
                                                                        <ColorPickerPopover
                                                                            label="Border"
                                                                            value={{ mode: 'solid', solid: config.activeBorderColor as string || 'transparent' }}
                                                                            onChange={(val: any) => handleUpdateComponentConfig(activeCategory.id, component.id, 'activeBorderColor', val.solid || val)}
                                                                            open={activePopover === `${component.id}-config-activeBorderColor`}
                                                                            onOpenChange={(open) => setActivePopover(open ? `${component.id}-config-activeBorderColor` : null)}
                                                                        />
                                                                        <div className="col-span-1">
                                                                            <label className="text-[9px] text-gray-400 block mb-1">Opacity (%)</label>
                                                                            <input 
                                                                                type="number" min="0" max="100"
                                                                                value={(config.activeOpacity as number ?? 1) * 100}
                                                                                onChange={(e) => handleUpdateComponentConfig(activeCategory.id, component.id, 'activeOpacity', parseInt(e.target.value) / 100)}
                                                                                className="w-full text-xs border-gray-200 rounded py-1"
                                                                            />
                                                                        </div>
                                                                         <div className="col-span-1">
                                                                            <label className="text-[9px] text-gray-400 block mb-1">Border Width</label>
                                                                            <input 
                                                                                type="number" min="0" max="10"
                                                                                value={config.activeBorderWidth as number ?? 0}
                                                                                onChange={(e) => handleUpdateComponentConfig(activeCategory.id, component.id, 'activeBorderWidth', parseInt(e.target.value))}
                                                                                className="w-full text-xs border-gray-200 rounded py-1"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Inactive State */}
                                                                <div className="space-y-2 pt-2 border-t border-gray-200/50">
                                                                    <label className="text-[10px] font-semibold text-gray-400">Inactive State</label>
                                                                    <div className="grid grid-cols-2 gap-3">
                                                                        <ColorPickerPopover
                                                                            label="Background"
                                                                            value={{ mode: 'solid', solid: config.inactiveColor as string }}
                                                                            onChange={(val: any) => handleUpdateComponentConfig(activeCategory.id, component.id, 'inactiveColor', val.solid || val)}
                                                                            open={activePopover === `${component.id}-config-inactiveColor`}
                                                                            onOpenChange={(open) => setActivePopover(open ? `${component.id}-config-inactiveColor` : null)}
                                                                        />
                                                                         <ColorPickerPopover
                                                                            label="Border"
                                                                            value={{ mode: 'solid', solid: config.inactiveBorderColor as string || 'transparent' }}
                                                                            onChange={(val: any) => handleUpdateComponentConfig(activeCategory.id, component.id, 'inactiveBorderColor', val.solid || val)}
                                                                            open={activePopover === `${component.id}-config-inactiveBorderColor`}
                                                                            onOpenChange={(open) => setActivePopover(open ? `${component.id}-config-inactiveBorderColor` : null)}
                                                                        />
                                                                        <div className="col-span-1">
                                                                            <label className="text-[9px] text-gray-400 block mb-1">Opacity (%)</label>
                                                                            <input 
                                                                                type="number" min="0" max="100"
                                                                                value={(config.inactiveOpacity as number ?? 1) * 100}
                                                                                onChange={(e) => handleUpdateComponentConfig(activeCategory.id, component.id, 'inactiveOpacity', parseInt(e.target.value) / 100)}
                                                                                className="w-full text-xs border-gray-200 rounded py-1"
                                                                            />
                                                                        </div>
                                                                        <div className="col-span-1">
                                                                            <label className="text-[9px] text-gray-400 block mb-1">Border Width</label>
                                                                            <input 
                                                                                type="number" min="0" max="10"
                                                                                value={config.inactiveBorderWidth as number ?? 0}
                                                                                onChange={(e) => handleUpdateComponentConfig(activeCategory.id, component.id, 'inactiveBorderWidth', parseInt(e.target.value))}
                                                                                className="w-full text-xs border-gray-200 rounded py-1"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Group 3: Text Colors */}
                                                            <div className="space-y-3 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Text Color</label>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <ColorPickerPopover
                                                                        label="Active"
                                                                        value={{ mode: 'solid', solid: config.activeTextColor as string }}
                                                                        onChange={(val: any) => handleUpdateComponentConfig(activeCategory.id, component.id, 'activeTextColor', val.solid || val)}
                                                                        open={activePopover === `${component.id}-config-activeTextColor`}
                                                                        onOpenChange={(open) => setActivePopover(open ? `${component.id}-config-activeTextColor` : null)}
                                                                    />
                                                                    <ColorPickerPopover
                                                                        label="Inactive"
                                                                        value={{ mode: 'solid', solid: config.inactiveTextColor as string }}
                                                                        onChange={(val: any) => handleUpdateComponentConfig(activeCategory.id, component.id, 'inactiveTextColor', val.solid || val)}
                                                                        open={activePopover === `${component.id}-config-inactiveTextColor`}
                                                                        onOpenChange={(open) => setActivePopover(open ? `${component.id}-config-inactiveTextColor` : null)}
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Group 4: Icon Colors */}
                                                            <div className="space-y-3 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Icon Color</label>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <ColorPickerPopover
                                                                        label="Active"
                                                                        value={{ mode: 'solid', solid: config.activeIconColor as string }}
                                                                        onChange={(val: any) => handleUpdateComponentConfig(activeCategory.id, component.id, 'activeIconColor', val.solid || val)}
                                                                        open={activePopover === `${component.id}-config-activeIconColor`}
                                                                        onOpenChange={(open) => setActivePopover(open ? `${component.id}-config-activeIconColor` : null)}
                                                                    />
                                                                    <ColorPickerPopover
                                                                        label="Inactive"
                                                                        value={{ mode: 'solid', solid: config.inactiveIconColor as string }}
                                                                        onChange={(val: any) => handleUpdateComponentConfig(activeCategory.id, component.id, 'inactiveIconColor', val.solid || val)}
                                                                        open={activePopover === `${component.id}-config-inactiveIconColor`}
                                                                        onOpenChange={(open) => setActivePopover(open ? `${component.id}-config-inactiveIconColor` : null)}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            {Object.entries(config).map(([key, value]) => {
                                                                const isColor = key.toLowerCase().includes('color');
                                                                const isBoolean = typeof value === 'boolean';

                                                                const isNumber = typeof value === 'number';
                                                                const isString = typeof value === 'string' && !isColor;

                                                                if (isColor) {
                                                                    return (
                                                                        <ColorPickerPopover
                                                                            key={key}
                                                                            label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                                                            value={typeof value === 'string' ? { mode: 'solid', solid: value } : value}
                                                                            onChange={(val: any) => handleUpdateComponentConfig(activeCategory.id, component.id, key, val.solid || val)}
                                                                            open={activePopover === `${component.id}-config-${key}`}
                                                                            onOpenChange={(open) => setActivePopover(open ? `${component.id}-config-${key}` : null)}
                                                                        />
                                                                    );
                                                                }

                                                                if (isBoolean) {
                                                                    return (
                                                                        <div key={key} className="flex flex-col gap-1.5 col-span-2">
                                                                            <label className="text-[11px] font-medium text-gray-500">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</label>
                                                                            <SegmentedControl
                                                                                options={[
                                                                                    { label: 'True', value: true },
                                                                                    { label: 'False', value: false },
                                                                                ]}
                                                                                value={value as boolean}
                                                                                onChange={(val) => handleUpdateComponentConfig(activeCategory.id, component.id, key, val)}
                                                                                variant="slate"
                                                                            />
                                                                        </div>
                                                                    );
                                                                }

                                                                if (isNumber) {
                                                                     return (
                                                                        <div key={key} className="space-y-1.5">
                                                                            <div className="flex justify-between">
                                                                                <label className="text-[11px] font-medium text-gray-500">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</label>
                                                                                <span className="text-[10px] font-mono text-gray-400">{value}</span>
                                                                            </div>
                                                                            <input 
                                                                                type="number"
                                                                                value={value as number}
                                                                                onChange={(e) => handleUpdateComponentConfig(activeCategory.id, component.id, key, parseFloat(e.target.value))}
                                                                                className="w-full text-sm border-gray-200 rounded-md py-1.5 px-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                                                            />
                                                                        </div>
                                                                    );
                                                                }

                                                                if (isString) {
                                                                    return (
                                                                        <div key={key} className="space-y-1.5 col-span-2">
                                                                            <label className="text-[11px] font-medium text-gray-500">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</label>
                                                                            <input 
                                                                                type="text"
                                                                                value={value as string}
                                                                                onChange={(e) => handleUpdateComponentConfig(activeCategory.id, component.id, key, e.target.value)}
                                                                                className="w-full text-sm border-gray-200 rounded-md py-1.5 px-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                                                            />
                                                                        </div>
                                                                    );
                                                                }

                                                                return null;
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* 1. Base Appearance */}
                                            <div className="space-y-4">
                                                <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] border-b border-gray-100 pb-2">Base Appearance</h5>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <ColorPickerPopover
                                                        label="Background"
                                                        value={styles?.backgroundColor || { mode: 'solid', solid: '#ffffff' }}
                                                        onChange={(val) => handleUpdateComponentStyle(activeCategory.id, component.id, 'backgroundColor', val)}
                                                        open={activePopover === `${component.id}-bg`}
                                                        onOpenChange={(open) => setActivePopover(open ? `${component.id}-bg` : null)}
                                                    />
                                                    <ColorPickerPopover
                                                        label="Text Color"
                                                        value={styles?.textColor || { mode: 'solid', solid: '#000000' }}
                                                        onChange={(val) => handleUpdateComponentStyle(activeCategory.id, component.id, 'textColor', val)}
                                                        open={activePopover === `${component.id}-text`}
                                                        onOpenChange={(open) => setActivePopover(open ? `${component.id}-text` : null)}
                                                    />
                                                    <ColorPickerPopover
                                                        label="Border Color"
                                                        value={styles?.borderColor || { mode: 'solid', solid: 'transparent' }}
                                                        onChange={(val) => handleUpdateComponentStyle(activeCategory.id, component.id, 'borderColor', val)}
                                                        open={activePopover === `${component.id}-border`}
                                                        onOpenChange={(open) => setActivePopover(open ? `${component.id}-border` : null)}
                                                    />
                                                    <div className="space-y-1.5 pt-1">
                                                        <div className="flex justify-between">
                                                            <label className="text-[11px] font-medium text-gray-500">Opacity</label>
                                                            <span className="text-[10px] font-mono text-gray-400">{styles?.opacity ?? 100}%</span>
                                                        </div>
                                                        <input 
                                                            type="range" min="0" max="100" 
                                                            value={styles?.opacity ?? 100}
                                                            onChange={(e) => handleUpdateComponentStyle(activeCategory.id, component.id, 'opacity', parseInt(e.target.value))}
                                                            className="w-full accent-black h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 2. Component-Specific: Input States */}
                                            {component.type === 'input' && (
                                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <h5 className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.15em] border-b border-blue-50 pb-2">Input States</h5>
                                                    
                                                    <div className="grid grid-cols-1 gap-3">
                                                        <div className="bg-gray-50/50 p-3 rounded-xl space-y-3 border border-gray-100">
                                                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Focus State</label>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                 <ColorPickerPopover
                                                                     label="Border"
                                                                     value={styles?.focusBorderColor || styles?.borderColor || { mode: 'solid', solid: '#3B82F6' }}
                                                                     onChange={(val) => handleUpdateComponentStyle(activeCategory.id, component.id, 'focusBorderColor', val)}
                                                                     open={activePopover === `${component.id}-focus-border`}
                                                                     onOpenChange={(open) => setActivePopover(open ? `${component.id}-focus-border` : null)}
                                                                 />
                                                                 <ColorPickerPopover
                                                                     label="Background"
                                                                     value={styles?.focusBackgroundColor || styles?.backgroundColor || { mode: 'solid', solid: '#ffffff' }}
                                                                     onChange={(val) => handleUpdateComponentStyle(activeCategory.id, component.id, 'focusBackgroundColor', val)}
                                                                     open={activePopover === `${component.id}-focus-bg`}
                                                                     onOpenChange={(open) => setActivePopover(open ? `${component.id}-focus-bg` : null)}
                                                                 />
                                                            </div>
                                                        </div>

                                                        <div className="bg-green-50/30 p-3 rounded-xl space-y-3 border border-green-100/50">
                                                            <label className="text-[9px] font-bold text-green-600/70 uppercase tracking-wider">Valid State</label>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                 <ColorPickerPopover
                                                                     label="Border"
                                                                     value={styles?.validBorderColor || { mode: 'solid', solid: '#10B981' }}
                                                                     onChange={(val) => handleUpdateComponentStyle(activeCategory.id, component.id, 'validBorderColor', val)}
                                                                     open={activePopover === `${component.id}-valid-border`}
                                                                     onOpenChange={(open) => setActivePopover(open ? `${component.id}-valid-border` : null)}
                                                                 />
                                                                 <ColorPickerPopover
                                                                     label="Background"
                                                                     value={styles?.validBackgroundColor || styles?.backgroundColor || { mode: 'solid', solid: '#ffffff' }}
                                                                     onChange={(val) => handleUpdateComponentStyle(activeCategory.id, component.id, 'validBackgroundColor', val)}
                                                                     open={activePopover === `${component.id}-valid-bg`}
                                                                     onOpenChange={(open) => setActivePopover(open ? `${component.id}-valid-bg` : null)}
                                                                 />
                                                            </div>
                                                        </div>

                                                        <div className="bg-red-50/30 p-3 rounded-xl space-y-3 border border-red-100/50">
                                                            <label className="text-[9px] font-bold text-red-600/70 uppercase tracking-wider">Invalid State</label>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                 <ColorPickerPopover
                                                                     label="Border"
                                                                     value={styles?.invalidBorderColor || { mode: 'solid', solid: '#EF4444' }}
                                                                     onChange={(val) => handleUpdateComponentStyle(activeCategory.id, component.id, 'invalidBorderColor', val)}
                                                                     open={activePopover === `${component.id}-invalid-border`}
                                                                     onOpenChange={(open) => setActivePopover(open ? `${component.id}-invalid-border` : null)}
                                                                 />
                                                                 <ColorPickerPopover
                                                                     label="Background"
                                                                     value={styles?.invalidBackgroundColor || styles?.backgroundColor || { mode: 'solid', solid: '#ffffff' }}
                                                                     onChange={(val) => handleUpdateComponentStyle(activeCategory.id, component.id, 'invalidBackgroundColor', val)}
                                                                     open={activePopover === `${component.id}-invalid-bg`}
                                                                     onOpenChange={(open) => setActivePopover(open ? `${component.id}-invalid-bg` : null)}
                                                                 />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* 3. Shape & Layout */}
                                            <div className="space-y-4">
                                                <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] border-b border-gray-100 pb-2">Shape & Layout</h5>
                                                <div className="space-y-4 px-1">
                                                    <div className="space-y-1.5">
                                                        <div className="flex justify-between">
                                                            <label className="text-[11px] font-medium text-gray-500">Border Radius</label>
                                                            <span className="text-[10px] font-mono text-gray-400">{styles?.borderRadius ?? 0}px</span>
                                                        </div>
                                                        <input 
                                                            type="range" min="0" max="48" 
                                                            value={styles?.borderRadius ?? 0}
                                                            onChange={(e) => handleUpdateComponentStyle(activeCategory.id, component.id, 'borderRadius', parseInt(e.target.value))}
                                                            className="w-full accent-black h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                                                        />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <div className="flex justify-between items-center">
                                                            <label className="text-[11px] font-medium text-gray-500">Border Width</label>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        const isExpanded = activePopover === `${component.id}-border-sides`;
                                                                        setActivePopover(isExpanded ? null : `${component.id}-border-sides`);
                                                                    }}
                                                                    className={`p-1 rounded hover:bg-gray-100 ${activePopover === `${component.id}-border-sides` ? 'bg-gray-100 text-gray-900' : 'text-gray-400'}`}
                                                                    title="Toggle Individual Sides"
                                                                >
                                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                                                        <path d="M9 3v18"/>
                                                                        <path d="M15 3v18"/>
                                                                        <path d="M3 9h18"/>
                                                                        <path d="M3 15h18"/>
                                                                    </svg>
                                                                </button>
                                                                <span className="text-[10px] font-mono text-gray-400 w-8 text-right">
                                                                    {activePopover === `${component.id}-border-sides` 
                                                                        ? 'Mixed' 
                                                                        : `${styles?.borderWidth ?? 0}px`
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {activePopover === `${component.id}-border-sides` ? (
                                                            <div className="grid grid-cols-4 gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                                                                {['Top', 'Right', 'Bottom', 'Left'].map((side) => {
                                                                    const key = `border${side}Width` as keyof typeof styles;
                                                                    const val = styles?.[key] ?? styles?.borderWidth ?? 0;
                                                                    
                                                                    return (
                                                                        <div key={side} className="space-y-1">
                                                                            <label className="text-[9px] text-gray-400 block text-center uppercase">{side[0]}</label>
                                                                            <input
                                                                                type="text"
                                                                                value={val as any}
                                                                                onChange={(e) => {
                                                                                    const num = parseInt(e.target.value) || 0;
                                                                                    handleUpdateComponentStyle(activeCategory.id, component.id, key, num);
                                                                                }}
                                                                                className="w-full text-center text-[10px] border border-gray-200 rounded py-1 px-1 focus:border-indigo-500 focus:outline-none"
                                                                            />
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <input 
                                                                    type="range" min="0" max="10" 
                                                                    value={styles?.borderWidth ?? 0}
                                                                    onChange={(e) => handleUpdateComponentStyle(activeCategory.id, component.id, 'borderWidth', parseInt(e.target.value))}
                                                                    className="flex-1 accent-black h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                                                                />
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="99"
                                                                    value={styles?.borderWidth ?? 0}
                                                                    onChange={(e) => handleUpdateComponentStyle(activeCategory.id, component.id, 'borderWidth', parseInt(e.target.value))}
                                                                    className="w-8 text-center text-[10px] border border-gray-200 rounded py-0.5 focus:border-indigo-500 focus:outline-none"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <div className="flex justify-between">
                                                            <label className="text-[11px] font-medium text-gray-500">Inner Padding</label>
                                                            <span className="text-[10px] font-mono text-gray-400">{styles?.padding ?? 16}px</span>
                                                        </div>
                                                        <input 
                                                            type="range" min="0" max="80" 
                                                            value={styles?.padding ?? 16}
                                                            onChange={(e) => handleUpdateComponentStyle(activeCategory.id, component.id, 'padding', parseInt(e.target.value))}
                                                            className="w-full accent-black h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 4. Effects & Shadow */}
                                            {component.id !== 'selection-tabs' && (
                                            <div className="space-y-4">
                                                <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] border-b border-gray-100 pb-2">Effects</h5>
                                                <div className="space-y-4 px-1">
                                                    <ShadowPickerPopover
                                                        label="Box Shadow"
                                                        value={{
                                                            level: styles?.shadowLevel || 'none',
                                                            color: styles?.shadowColor,
                                                            blur: styles?.shadowBlur,
                                                            spread: styles?.shadowSpread,
                                                            offsetX: styles?.shadowOffsetX,
                                                            offsetY: styles?.shadowOffsetY,
                                                        }}
                                                        onChange={(updates: any) => {
                                                            Object.entries(updates).forEach(([key, val]) => {
                                                                handleUpdateComponentStyle(activeCategory.id, component.id, key as any, val)
                                                            })
                                                        }}
                                                    />

                                                    {(component.type === 'button' || !component.type) && (
                                                        <div className="space-y-1.5">
                                                            <label className="text-[11px] font-medium text-gray-500">Tap Action Feedack</label>
                                                            <SegmentedControl
                                                                options={[
                                                                    { label: 'Off', value: 'none' },
                                                                    { label: 'Scale', value: 'scale' },
                                                                    { label: 'Pulse', value: 'pulse' },
                                                                    { label: 'Dim', value: 'opacity' },
                                                                ]}
                                                                value={styles?.clickAnimation || 'none'}
                                                                onChange={(val) => handleUpdateComponentStyle(activeCategory.id, component.id, 'clickAnimation', val)}
                                                                variant="slate"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            )}

                                            {/* 5. Icons & Content */}
                                            <div className="space-y-4">
                                                <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] border-b border-gray-100 pb-2">Icons & Content</h5>
                                                
                                                <div className="space-y-4">
                                                    <IconPickerPopover
                                                        label="Select Icon"
                                                        value={styles?.icon}
                                                        onChange={(val) => handleUpdateComponentStyle(activeCategory.id, component.id, 'icon', val)}
                                                    />

                                                    {styles?.icon && (
                                                        <div className="p-3 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <ColorPickerPopover
                                                                    label="Icon Color"
                                                                    value={styles?.iconColor || { mode: 'solid', solid: 'currentColor' }}
                                                                    onChange={(val) => handleUpdateComponentStyle(activeCategory.id, component.id, 'iconColor', val)}
                                                                    open={activePopover === `${component.id}-icon-color`}
                                                                    onOpenChange={(open) => setActivePopover(open ? `${component.id}-icon-color` : null)}
                                                                />
                                                                
                                                                <div className="flex flex-col gap-1.5">
                                                                    <label className="text-[11px] font-medium text-gray-500">Icon Shape</label>
                                                                    <SegmentedControl
                                                                        options={[
                                                                            { label: 'None', value: false },
                                                                            { label: 'Bg', value: true },
                                                                        ]}
                                                                        value={styles?.showIconBackground || false}
                                                                        onChange={(val) => handleUpdateComponentStyle(activeCategory.id, component.id, 'showIconBackground', val)}
                                                                        variant="slate"
                                                                    />
                                                                </div>

                                                                <div className="flex flex-col gap-1.5 col-span-2">
                                                                    <label className="text-[11px] font-medium text-gray-500">Placement</label>
                                                                    <SegmentedControl
                                                                        options={[
                                                                            { label: 'Left / Start', value: 'left' },
                                                                            { label: 'Right / End', value: 'right' },
                                                                        ]}
                                                                        value={styles?.iconPosition || 'left'}
                                                                        onChange={(val) => handleUpdateComponentStyle(activeCategory.id, component.id, 'iconPosition', val)}
                                                                        variant="slate"
                                                                    />
                                                                </div>
                                                            </div>

                                                            {styles.showIconBackground && (
                                                                <div className="grid grid-cols-2 gap-4 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                                                                     <ColorPickerPopover
                                                                        label="Shape Fill"
                                                                        value={styles?.iconBackgroundColor || { mode: 'solid', solid: '#ffffff' }}
                                                                        onChange={(val) => handleUpdateComponentStyle(activeCategory.id, component.id, 'iconBackgroundColor', val)}
                                                                        open={activePopover === `${component.id}-icon-bg`}
                                                                        onOpenChange={(open) => setActivePopover(open ? `${component.id}-icon-bg` : null)}
                                                                    />
                                                                    
                                                                    <div className="space-y-1.5">
                                                                        <div className="flex justify-between">
                                                                            <label className="text-[11px] font-medium text-gray-500">Opacity</label>
                                                                            <span className="text-[10px] font-mono text-gray-400">{styles?.iconBackgroundOpacity ?? 20}%</span>
                                                                        </div>
                                                                        <input 
                                                                            type="range" min="0" max="100" 
                                                                            value={styles?.iconBackgroundOpacity ?? 20}
                                                                            onChange={(e) => handleUpdateComponentStyle(activeCategory.id, component.id, 'iconBackgroundOpacity', parseInt(e.target.value))}
                                                                            className="w-full accent-black h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition>
    )
}
