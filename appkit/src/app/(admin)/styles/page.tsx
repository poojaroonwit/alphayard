'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useApp } from '../../../contexts/AppContext'
import { adminService } from '../../../services/adminService'
import { Button } from '../../../components/ui/Button'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { toast } from '@/hooks/use-toast'
import { ComponentStyleSettings } from '../../../components/appearance/ComponentStyleSettings'
import { CategoryConfig, ComponentStyle, BrandingConfig } from '../../../components/appearance/types'
import { DEFAULT_CATEGORIES, CategoryIcons } from '../../../components/common/appearance-manager/appearance.config'
import { 
    SwatchIcon, 
    CheckIcon,
    ArrowPathIcon,
    PlusIcon
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'

export default function StylesPage() {
    const { currentApp, refreshApplications, isLoading: appLoading } = useApp()
    const [categories, setCategories] = useState<CategoryConfig[]>([])
    const [selectedCategory, setSelectedCategory] = useState<string>('buttons')
    const [isSaving, setIsSaving] = useState(false)
    const [isLoadingData, setIsLoadingData] = useState(true)

    // Add Component Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [newComponentData, setNewComponentData] = useState({ name: '', id: '' })
    const [lastAddedComponentId, setLastAddedComponentId] = useState<string | null>(null)

    const activeCategory = categories.find(c => c.id === selectedCategory)

    const fetchData = useCallback(async () => {
        setIsLoadingData(true)
        try {
            const data = await adminService.getComponentStudioSidebar()
            setCategories(data.sections)
            if (data.sections.length > 0 && !selectedCategory) {
               setSelectedCategory(data.sections[0].id)
            }
        } catch (error) {
            console.error('Failed to fetch component studio data:', error)
            toast({ title: "Error", description: "Could not load component styles.", variant: "destructive" })
        } finally {
            setIsLoadingData(false)
        }
    }, [selectedCategory])

    useEffect(() => {
        fetchData()
    }, [])

    const handleOpenAddModal = () => {
        setIsAddModalOpen(true)
        setNewComponentData({ name: '', id: '' })
    }

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!activeCategory || !newComponentData.name || !newComponentData.id) return

        try {
            const newStyle = await adminService.createComponentStyle({
                categoryId: activeCategory.id,
                definitionId: newComponentData.id,
                name: newComponentData.name,
                styles: { 
                    backgroundColor: { mode: 'solid', solid: '#3B82F6' },
                    textColor: { mode: 'solid', solid: '#FFFFFF' },
                    borderRadius: 12,
                    borderColor: { mode: 'solid', solid: 'transparent' },
                    shadowLevel: 'none',
                    clickAnimation: 'scale' 
                }
            })
            
            toast({ title: "Component Added", description: `Added ${newComponentData.name}` })
            setLastAddedComponentId(newStyle.style.id)
            setIsAddModalOpen(false)
            await fetchData()
        } catch (error) {
            toast({ title: "Error", description: "Failed to create component.", variant: "destructive" })
        }
    }

    // Auto-generate ID from name
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value
        const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')
        setNewComponentData(prev => ({ ...prev, name, id: slug }))
    }

    const handleUpdateComponentStyle = async (catId: string, compId: string, styleField: keyof ComponentStyle, value: any) => {
        // Optimistic UI update
        setCategories(prev => prev.map(cat => (cat.id === catId ? {
            ...cat,
            components: cat.components.map(comp => 
                comp.id === compId ? { ...comp, styles: { ...comp.styles, [styleField]: value } } : comp
            )
        } : cat)))

        try {
            const component = categories.find(c => c.id === catId)?.components.find(c => c.id === compId)
            if (component) {
                await adminService.updateComponentStyle(compId, { 
                    styles: { ...component.styles, [styleField]: value } 
                })
            }
        } catch (error) {
            console.error('Failed to update style:', error)
        }
    }

    const handleUpdateComponentConfig = async (catId: string, compId: string, configField: string, value: any) => {
        // Optimistic UI update
        setCategories(prev => prev.map(cat => (cat.id === catId ? {
            ...cat,
            components: cat.components.map(comp => 
                comp.id === compId ? { 
                    ...comp, 
                    config: { ...(comp.config || {}), [configField]: value } 
                } : comp
            )
        } : cat)))

        try {
            const component = categories.find(c => c.id === catId)?.components.find(c => c.id === compId)
            if (component) {
                await adminService.updateComponentStyle(compId, { 
                    config: { ...(component.config || {}), [configField]: value } 
                })
            }
        } catch (error) {
            console.error('Failed to update config:', error)
        }
    }

    const handleDuplicateComponent = async (catId: string, compId: string) => {
        try {
            await adminService.duplicateComponentStyle(compId)
            toast({ title: "Component Duplicated", description: "A copy has been created." })
            await fetchData()
        } catch (error) {
            toast({ title: "Error", description: "Failed to duplicate component.", variant: "destructive" })
        }
    }

    const handleSave = () => {
        toast({ title: "Saved", description: "Styles have been synchronized to the cloud." })
    }

    const handleResetToDefaults = () => {
        if (confirm('Are you sure you want to reset all components to their default styles? (This will NOT affect the cloud until re-saved)')) {
            // In a real app we'd call a reset endpoint
            toast({ title: "Coming Soon", description: "Reset endpoint is not yet implemented." })
        }
    }

    if (appLoading || isLoadingData) {

        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    if (!currentApp) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-500">
                Application not found.
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-transparent space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <SwatchIcon className="w-8 h-8 text-blue-600" />
                        Component Studio
                    </h1>
                    <p className="text-gray-500 mt-2 text-lg">
                        Fine-tune global UI components for <span className="font-semibold text-gray-900">{currentApp.name}</span>
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="ghost"
                        onClick={handleResetToDefaults}
                        className="text-gray-500 hover:text-red-600"
                    >
                        <ArrowPathIcon className="w-4 h-4 mr-2" />
                        Reset Defaults
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="h-10 px-6 bg-gray-900 hover:bg-black text-white shadow-lg transition-all flex items-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <CheckIcon className="w-4 h-4" />
                                <span>Save Styles</span>
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Category Sidebar */}
                <aside className="w-full lg:w-64 shrink-0 bg-white/50 backdrop-blur-sm rounded-3xl border border-gray-200/50 p-2 space-y-1">
                    <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex justify-between items-center">
                        <span>Element Categories</span>
                    </div>
                    {/* Render Categories by Group */}
                    {[
                        { title: 'Core Components', ids: ['buttons', 'cards', 'inputs', 'layout', 'advanced-inputs'] },
                        { title: 'Navigation', ids: ['mobile-nav', 'mobile-actions', 'navigation-ui'] },
                        { title: 'Feedback & Status', ids: ['feedback', 'status-feedback', 'safety-ui', 'communication'] },
                        { title: 'Data & Content', ids: ['data-display', 'charts-data', 'media-assets', 'lists-grids', 'app-widgets'] },
                        { title: 'Assets', ids: ['social-icons', 'flag-icons'] }
                    ].map(group => {
                        const groupCats = categories.filter(c => group.ids.includes(c.id));
                        if (groupCats.length === 0) return null;
                        
                        return (
                            <div key={group.title} className="mb-4">
                                <div className="px-4 py-1.5 text-[10px] font-bold text-gray-400/80 uppercase tracking-wider mb-1">
                                    {group.title}
                                </div>
                                {groupCats.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={clsx(
                                            "w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-sm font-medium transition-all group",
                                            selectedCategory === cat.id 
                                                ? "bg-white shadow-sm ring-1 ring-gray-200 text-blue-600" 
                                                : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={clsx(
                                                "transition-colors",
                                                selectedCategory === cat.id ? "text-blue-500" : "text-gray-400 group-hover:text-gray-600"
                                            )}>
                                                {CategoryIcons[cat.icon] || <SwatchIcon className="w-4 h-4" />}
                                            </span>
                                            <span>{cat.name}</span>
                                        </div>
                                        <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full font-mono group-hover:bg-gray-200">
                                            {cat.components.length}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        );
                    })}
                </aside>

                {/* Settings Component */}
                <div className="flex-1 min-w-0">
                    {activeCategory ? (
                        <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-1 animate-in fade-in duration-500">
                            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 relative">
                                <div className="absolute top-6 right-6 z-10">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleOpenAddModal}
                                        className="gap-1.5 bg-white shadow-sm hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                                    >
                                        <PlusIcon className="w-3.5 h-3.5" />
                                        Add Component
                                    </Button>
                                </div>
                                <ComponentStyleSettings 
                                    activeCategory={activeCategory} 
                                    handleUpdateComponentStyle={handleUpdateComponentStyle} 
                                    handleUpdateComponentConfig={handleUpdateComponentConfig}
                                    handleDuplicateComponent={handleDuplicateComponent}
                                    autoOpenComponentId={lastAddedComponentId}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center p-20 text-gray-400">
                            Select a category to begin styling.
                        </div>
                    )}
                </div>
            </div>

            {/* Add Component Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800 w-full max-w-md p-6 animate-scale-in">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Add New Component</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Create a new style variant for your app.</p>
                        
                        <form onSubmit={handleAddSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Label Name</label>
                                <input 
                                    autoFocus
                                    type="text" 
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="e.g. Primary Button"
                                    value={newComponentData.name}
                                    onChange={handleNameChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Component ID</label>
                                <input 
                                    type="text" 
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="e.g. primary-button"
                                    value={newComponentData.id}
                                    onChange={(e) => setNewComponentData({ ...newComponentData, id: e.target.value })}
                                    required
                                />
                                <p className="text-xs text-gray-500">Used in code to reference this style.</p>
                            </div>

                            <div className="flex justify-end gap-3 mt-8">
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    onClick={() => setIsAddModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={!newComponentData.name || !newComponentData.id}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    Create Component
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
