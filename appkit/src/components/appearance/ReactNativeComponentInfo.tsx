'use client'

import React, { useState } from 'react'
import { ComponentConfig, MobileComponentConfig } from './types'
import { clsx } from 'clsx'
import { 
    CodeBracketIcon, 
    DocumentDuplicateIcon, 
    FolderOpenIcon,
    CheckIcon,
    DevicePhoneMobileIcon,
    CubeIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline'

interface ReactNativeComponentInfoProps {
    component: ComponentConfig
    className?: string
    showFullPath?: boolean
}

// Component type badges with colors and icons
const COMPONENT_TYPE_COLORS: Record<string, { bg: string; text: string; icon: string; description: string }> = {
    button: { bg: 'bg-blue-100', text: 'text-blue-700', icon: '🔘', description: 'Interactive buttons' },
    input: { bg: 'bg-purple-100', text: 'text-purple-700', icon: '📝', description: 'Text inputs & form fields' },
    card: { bg: 'bg-green-100', text: 'text-green-700', icon: '🃏', description: 'Content containers' },
    badge: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '🏷️', description: 'Status indicators' },
    tabbar: { bg: 'bg-pink-100', text: 'text-pink-700', icon: '📑', description: 'Tab navigation' },
    accordion: { bg: 'bg-orange-100', text: 'text-orange-700', icon: '📂', description: 'Collapsible sections' },
    avatar: { bg: 'bg-violet-100', text: 'text-violet-700', icon: '👤', description: 'User avatars & profiles' },
    navigation: { bg: 'bg-cyan-100', text: 'text-cyan-700', icon: '🧭', description: 'Navigation menus' },
    map: { bg: 'bg-teal-100', text: 'text-teal-700', icon: '📍', description: 'Map & location markers' },
    calendar: { bg: 'bg-sky-100', text: 'text-sky-700', icon: '📅', description: 'Calendar & events' },
    chat: { bg: 'bg-rose-100', text: 'text-rose-700', icon: '💬', description: 'Chat bubbles & messages' },
    widget: { bg: 'bg-amber-100', text: 'text-amber-700', icon: '📊', description: 'Dashboard widgets' },
    emergency: { bg: 'bg-red-100', text: 'text-red-700', icon: '🆘', description: 'Emergency & SOS buttons' },
    toggle: { bg: 'bg-lime-100', text: 'text-lime-700', icon: '🔀', description: 'Toggle switches' },
    loading: { bg: 'bg-slate-100', text: 'text-slate-700', icon: '⏳', description: 'Loading indicators' },
    progress: { bg: 'bg-indigo-100', text: 'text-indigo-700', icon: '📈', description: 'Progress bars' },
    modal: { bg: 'bg-fuchsia-100', text: 'text-fuchsia-700', icon: '🪟', description: 'Modal dialogs' },
    toast: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: '🔔', description: 'Toast notifications' },
    list: { bg: 'bg-stone-100', text: 'text-stone-700', icon: '📋', description: 'List views' },
    header: { bg: 'bg-zinc-100', text: 'text-zinc-700', icon: '📰', description: 'Headers & titles' },
    'icon-upload': { bg: 'bg-indigo-100', text: 'text-indigo-700', icon: '🖼️', description: 'Image uploads' },
    generic: { bg: 'bg-gray-100', text: 'text-gray-700', icon: '📦', description: 'Generic components' },
}

// Get category from file path
const getCategoryFromPath = (filePath: string): string => {
    const parts = filePath.split('/')
    const componentsIndex = parts.findIndex(p => p === 'components')
    if (componentsIndex >= 0 && parts[componentsIndex + 1]) {
        return parts[componentsIndex + 1]
    }
    return 'other'
}

// Category colors with descriptions
const CATEGORY_COLORS: Record<string, { color: string; icon: string; description: string }> = {
    home: { color: 'bg-emerald-500', icon: '🏠', description: 'Home screen components' },
    profile: { color: 'bg-violet-500', icon: '👤', description: 'Profile & user components' },
    calendar: { color: 'bg-blue-500', icon: '📅', description: 'Calendar & scheduling' },
    chat: { color: 'bg-pink-500', icon: '💬', description: 'Chat & messaging' },
    common: { color: 'bg-gray-500', icon: '🔧', description: 'Common/shared components' },
    widgets: { color: 'bg-amber-500', icon: '📊', description: 'Dashboard widgets' },
    settings: { color: 'bg-slate-500', icon: '⚙️', description: 'Settings & preferences' },
    auth: { color: 'bg-red-500', icon: '🔐', description: 'Authentication screens' },
    maps: { color: 'bg-teal-500', icon: '🗺️', description: 'Map & location' },
    emergency: { color: 'bg-rose-500', icon: '🆘', description: 'Emergency & safety' },
    safety: { color: 'bg-orange-500', icon: '🛡️', description: 'Safety features' },
    apps: { color: 'bg-indigo-500', icon: '📱', description: 'Mini apps' },
    card: { color: 'bg-cyan-500', icon: '🎴', description: 'Card components' },
    ui: { color: 'bg-purple-500', icon: '🎨', description: 'UI primitives' },
    branding: { color: 'bg-fuchsia-500', icon: '🏢', description: 'Branding & logos' },
    video: { color: 'bg-lime-500', icon: '🎥', description: 'Video & media' },
    ai: { color: 'bg-sky-500', icon: '🤖', description: 'AI features' },
    circle: { color: 'bg-green-500', icon: '⭕', description: 'Circle features' },
    popup: { color: 'bg-yellow-500', icon: '💭', description: 'Popups & modals' },
    social: { color: 'bg-pink-500', icon: '👥', description: 'Social features' },
    forms: { color: 'bg-purple-500', icon: '📋', description: 'Forms & inputs' },
    media: { color: 'bg-rose-500', icon: '🖼️', description: 'Media & images' },
    navigation: { color: 'bg-cyan-500', icon: '🧭', description: 'Navigation' },
    other: { color: 'bg-gray-400', icon: '📦', description: 'Other components' },
}

// Helper function to get category color string
const getCategoryColorClass = (category: string): string => {
    return CATEGORY_COLORS[category]?.color || CATEGORY_COLORS.other.color
}

export function ReactNativeComponentInfo({ component, className, showFullPath = false }: ReactNativeComponentInfoProps) {
    const [copiedField, setCopiedField] = useState<string | null>(null)
    const mobileConfig = component.mobileConfig

    if (!mobileConfig) {
        return (
            <div className={clsx("p-4 bg-gray-50 rounded-xl border border-gray-200", className)}>
                <div className="flex items-center gap-2 text-gray-400">
                    <InformationCircleIcon className="w-5 h-5" />
                    <span className="text-sm">No React Native component linked</span>
                </div>
            </div>
        )
    }

    const handleCopy = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopiedField(field)
            setTimeout(() => setCopiedField(null), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    const category = getCategoryFromPath(mobileConfig.filePath)
    const typeConfig = COMPONENT_TYPE_COLORS[component.type] || COMPONENT_TYPE_COLORS.generic
    const categoryConfig = CATEGORY_COLORS[category] || CATEGORY_COLORS.other

    // Format the import statement
    const getImportStatement = () => {
        const componentName = mobileConfig.componentName
        const relativePath = mobileConfig.filePath.replace('mobile/src/', '@/').replace('.tsx', '')
        return `import { ${componentName} } from '${relativePath}'`
    }

    return (
        <div className={clsx("bg-white rounded-xl border border-gray-200 overflow-hidden", className)}>
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-slate-800 to-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <DevicePhoneMobileIcon className="w-5 h-5 text-white/80" />
                    <span className="text-sm font-semibold text-white">React Native Component</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={clsx(
                        "px-2 py-0.5 text-[10px] font-bold rounded-full uppercase",
                        typeConfig.bg, typeConfig.text
                    )}>
                        {typeConfig.icon} {component.type}
                    </span>
                    <span className={clsx(
                        "px-2 py-0.5 text-[10px] font-bold rounded-full text-white capitalize",
                        categoryConfig.color
                    )}>
                        {categoryConfig.icon} {category}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {/* Component Name */}
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <CubeIcon className="w-4 h-4 text-gray-400" />
                        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Component Name</label>
                    </div>
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                        <code className="text-sm font-mono font-semibold text-blue-600">
                            {mobileConfig.componentName}
                        </code>
                        <button
                            onClick={() => handleCopy(mobileConfig.componentName, 'name')}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="Copy component name"
                        >
                            {copiedField === 'name' ? (
                                <CheckIcon className="w-4 h-4 text-green-500" />
                            ) : (
                                <DocumentDuplicateIcon className="w-4 h-4 text-gray-400" />
                            )}
                        </button>
                    </div>
                </div>

                {/* File Path */}
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <FolderOpenIcon className="w-4 h-4 text-gray-400" />
                        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">File Path</label>
                    </div>
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                        <code className="text-xs font-mono text-gray-600 truncate max-w-[240px]" title={mobileConfig.filePath}>
                            {showFullPath ? mobileConfig.filePath : mobileConfig.filePath.replace('mobile/src/', '')}
                        </code>
                        <button
                            onClick={() => handleCopy(mobileConfig.filePath, 'path')}
                            className="p-1 hover:bg-gray-200 rounded transition-colors shrink-0"
                            title="Copy file path"
                        >
                            {copiedField === 'path' ? (
                                <CheckIcon className="w-4 h-4 text-green-500" />
                            ) : (
                                <DocumentDuplicateIcon className="w-4 h-4 text-gray-400" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Import Statement */}
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <CodeBracketIcon className="w-4 h-4 text-gray-400" />
                        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Import Statement</label>
                    </div>
                    <div className="flex items-center justify-between bg-slate-900 rounded-lg px-3 py-2">
                        <code className="text-xs font-mono text-emerald-400 truncate max-w-[240px]">
                            {getImportStatement()}
                        </code>
                        <button
                            onClick={() => handleCopy(getImportStatement(), 'import')}
                            className="p-1 hover:bg-slate-700 rounded transition-colors shrink-0"
                            title="Copy import statement"
                        >
                            {copiedField === 'import' ? (
                                <CheckIcon className="w-4 h-4 text-green-400" />
                            ) : (
                                <DocumentDuplicateIcon className="w-4 h-4 text-slate-400" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Usage Example */}
                {mobileConfig.usageExample && (
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CodeBracketIcon className="w-4 h-4 text-gray-400" />
                                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Usage Example</label>
                            </div>
                            <button
                                onClick={() => handleCopy(mobileConfig.usageExample || '', 'usage')}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                                title="Copy usage example"
                            >
                                {copiedField === 'usage' ? (
                                    <CheckIcon className="w-4 h-4 text-green-500" />
                                ) : (
                                    <DocumentDuplicateIcon className="w-4 h-4 text-gray-400" />
                                )}
                            </button>
                        </div>
                        <pre className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                            <code className="text-xs font-mono text-slate-300 whitespace-pre-wrap">
                                {mobileConfig.usageExample}
                            </code>
                        </pre>
                    </div>
                )}
            </div>
        </div>
    )
}

// Compact version for grid views
export function ReactNativeComponentBadge({ component }: { component: ComponentConfig }) {
    const mobileConfig = component.mobileConfig
    
    if (!mobileConfig) return null

    const category = getCategoryFromPath(mobileConfig.filePath)
    const categoryConfig = CATEGORY_COLORS[category] || CATEGORY_COLORS.other
    const typeConfig = COMPONENT_TYPE_COLORS[component.type] || COMPONENT_TYPE_COLORS.generic

    return (
        <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md border border-gray-100 shadow-sm">
            <span className="text-xs">{typeConfig.icon}</span>
            <span className={clsx(
                "w-2 h-2 rounded-full",
                categoryConfig.color
            )} />
            <span className="text-[10px] font-mono text-gray-600 truncate max-w-[100px]">
                {mobileConfig.componentName}
            </span>
        </div>
    )
}

// List view for showing all React Native components
export function ReactNativeComponentList({ 
    components, 
    onSelect 
}: { 
    components: ComponentConfig[]
    onSelect?: (component: ComponentConfig) => void 
}) {
    const [filter, setFilter] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string>('all')

    // Get unique categories
    const categories = ['all', ...Array.from(new Set(
        components
            .filter(c => c.mobileConfig)
            .map(c => getCategoryFromPath(c.mobileConfig!.filePath))
    ))]

    // Filter components
    const filteredComponents = components.filter(c => {
        if (!c.mobileConfig) return false
        
        const matchesFilter = filter === '' || 
            c.mobileConfig.componentName.toLowerCase().includes(filter.toLowerCase()) ||
            c.name.toLowerCase().includes(filter.toLowerCase())
        
        const matchesCategory = selectedCategory === 'all' || 
            getCategoryFromPath(c.mobileConfig.filePath) === selectedCategory

        return matchesFilter && matchesCategory
    })

    // Group by category
    const groupedComponents = filteredComponents.reduce((acc, component) => {
        const category = getCategoryFromPath(component.mobileConfig!.filePath)
        if (!acc[category]) acc[category] = []
        acc[category].push(component)
        return acc
    }, {} as Record<string, ComponentConfig[]>)

    return (
        <div className="space-y-4">
            {/* Search and Filter */}
            <div className="flex gap-3">
                <input
                    type="text"
                    placeholder="Search components..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent capitalize"
                    title="Filter by category"
                    aria-label="Filter components by category"
                >
                    {categories.map(cat => (
                        <option key={cat} value={cat} className="capitalize">{cat}</option>
                    ))}
                </select>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{filteredComponents.length} components</span>
                <span>•</span>
                <span>{Object.keys(groupedComponents).length} categories</span>
            </div>

            {/* Component List */}
            <div className="space-y-6">
                {Object.entries(groupedComponents).map(([category, comps]) => {
                    const catConfig = CATEGORY_COLORS[category] || CATEGORY_COLORS.other
                    return (
                        <div key={category} className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className={clsx(
                                    "w-3 h-3 rounded-full",
                                    catConfig.color
                                )} />
                                <span className="text-base">{catConfig.icon}</span>
                                <h3 className="text-sm font-semibold text-gray-700 capitalize">{category}</h3>
                                <span className="text-xs text-gray-400">({comps.length})</span>
                                <span className="text-xs text-gray-400 hidden md:inline">- {catConfig.description}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {comps.map(component => {
                                    const typeConfig = COMPONENT_TYPE_COLORS[component.type] || COMPONENT_TYPE_COLORS.generic
                                    return (
                                        <button
                                            key={component.id}
                                            onClick={() => onSelect?.(component)}
                                            className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50 transition-all text-left group"
                                            title={`${component.mobileConfig?.componentName} - ${typeConfig.description}`}
                                        >
                                            <div className={clsx(
                                                "w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0",
                                                typeConfig.bg
                                            )}>
                                                {typeConfig.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm text-gray-900 truncate">
                                                    {component.mobileConfig?.componentName}
                                                </div>
                                                <div className="text-xs text-gray-400 truncate">
                                                    {component.mobileConfig?.filePath.replace('mobile/src/components/', '')}
                                                </div>
                                            </div>
                                            <CodeBracketIcon className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors shrink-0" />
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
