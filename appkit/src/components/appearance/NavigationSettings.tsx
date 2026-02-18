'use client'

import React, { useState } from 'react'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import { Input } from '../ui/Input'
import { NavigationConfig, NavItemConfig, BrandingConfig } from './types'
import { MobileGuide } from '../ui/MobileGuide'
import { clsx } from 'clsx'
import { ListBulletIcon, EyeIcon, EyeSlashIcon, Bars3Icon, PlusIcon, TrashIcon, LinkIcon, DevicePhoneMobileIcon, GlobeAltIcon, RectangleStackIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'

interface NavigationSettingsProps {
    navigation: NavigationConfig
    branding: BrandingConfig
    setBranding: React.Dispatch<React.SetStateAction<any>>
}

export function NavigationSettings({ navigation, branding, setBranding }: NavigationSettingsProps) {
    const screens = branding.screens || []
    
    // Safety fallback
    const safeNavigation = {
        tabBar: navigation.tabBar || [] as NavItemConfig[],
        drawer: navigation.drawer || [] as NavItemConfig[],
    }

    const [newTab, setNewTab] = useState<Partial<NavItemConfig>>({ label: '', actionType: 'link', actionValue: '' })
    const [isAddingTab, setIsAddingTab] = useState(false)
    const [isAddingDrawer, setIsAddingDrawer] = useState(false)

    const toggleVisibility = (id: string, group: 'tabBar' | 'drawer') => {
        setBranding((prev: any) => ({
            ...prev,
            navigation: {
                ...prev.navigation,
                [group]: (prev.navigation?.[group] || []).map((item: any) => 
                    item.id === id ? { ...item, visible: !item.visible } : item
                )
            }
        }))
    }

    const updateItem = (id: string, group: 'tabBar' | 'drawer', updates: Partial<NavItemConfig>) => {
        setBranding((prev: any) => ({
            ...prev,
            navigation: {
                ...prev.navigation,
                [group]: (prev.navigation?.[group] || []).map((item: any) => 
                    item.id === id ? { ...item, ...updates } : item
                )
            }
        }))
    }

    const addItem = (group: 'tabBar' | 'drawer', data: Partial<NavItemConfig>) => {
        if (!data.label) return

        const id = `${group}-${Date.now()}`
        const newItem: NavItemConfig = {
            id,
            label: data.label,
            icon: data.icon || 'star',
            visible: true,
            isCustom: true,
            actionType: data.actionType as any || 'link',
            actionValue: data.actionValue || ''
        }

        setBranding((prev: any) => ({
            ...prev,
            navigation: {
                ...prev.navigation,
                [group]: [...(prev.navigation?.[group] || []), newItem]
            }
        }))

        if (group === 'tabBar') setIsAddingTab(false)
        else setIsAddingDrawer(false)
    }

    const removeItem = (id: string, group: 'tabBar' | 'drawer') => {
        setBranding((prev: any) => ({
            ...prev,
            navigation: {
                ...prev.navigation,
                [group]: (prev.navigation?.[group] || []).filter((item: any) => item.id !== id)
            }
        }))
    }

    const NavigationItemRow = ({ item, group }: { item: NavItemConfig, group: 'tabBar' | 'drawer' }) => (
        <div key={item.id} className={`flex items-center gap-4 p-3 rounded-2xl border transition-all ${item.visible ? 'bg-white border-gray-100' : 'bg-gray-50/50 border-dashed border-gray-200 opacity-60'}`}>
            <div className="p-2 bg-gray-50 rounded-xl border border-gray-100">
                <Bars3Icon className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
                <Input 
                    value={item.label} 
                    onChange={(e) => updateItem(item.id, group, { label: e.target.value })}
                    className="h-8 text-sm font-semibold border-transparent hover:border-gray-100 focus:border-blue-500 bg-transparent px-2"
                />
                <div className="flex items-center gap-2 mt-1 px-2">
                    <select 
                        className="text-[10px] bg-transparent border-0 font-bold text-gray-400 uppercase tracking-tight p-0"
                        value={item.actionType}
                        onChange={(e) => updateItem(item.id, group, { actionType: e.target.value as any })}
                    >
                        <option value="link">URL</option>
                        <option value="screen">SCREEN</option>
                    </select>
                            {item.actionType === 'screen' ? (
                        <select 
                            className="flex-1 text-[10px] bg-transparent border-0 font-mono text-blue-500 p-0"
                            value={item.actionValue}
                            onChange={(e) => updateItem(item.id, group, { actionValue: e.target.value })}
                        >
                            <option value="">Select Screen...</option>
                            {screens.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
                        </select>
                    ) : (
                        <input 
                            value={item.actionValue}
                            onChange={(e) => updateItem(item.id, group, { actionValue: e.target.value })}
                            placeholder="https://..."
                            className="flex-1 text-[10px] bg-transparent border-0 font-mono text-blue-500 p-0"
                        />
                    )}
                </div>
            </div>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => toggleVisibility(item.id, group)}
                    className={clsx(
                        "p-2 rounded-xl border transition-all",
                        item.visible ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-gray-50 text-gray-400 border-gray-200"
                    )}
                >
                    {item.visible ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
                </button>
                {item.isCustom && (
                    <button
                        onClick={() => removeItem(item.id, group)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    )
    
    // UI for adding a new item
    const NewItemRow = ({ group, onClose }: { group: 'tabBar' | 'drawer', onClose: () => void }) => (
         <div className="flex items-center gap-4 p-3 rounded-2xl border border-blue-100 bg-blue-50/30 animate-in fade-in slide-in-from-top-2">
            <div className="p-2 bg-blue-100 rounded-xl">
                 <PlusIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
                <Input 
                    autoFocus
                    placeholder="Label (e.g. Home)"
                    value={newTab.label} 
                    onChange={(e) => setNewTab({...newTab, label: e.target.value})}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') addItem(group, newTab)
                        if (e.key === 'Escape') onClose()
                    }}
                    className="h-8 text-sm font-semibold border-transparent focus:border-blue-500 bg-white px-2 mb-1 shadow-sm"
                />
                <div className="flex items-center gap-2 px-2">
                     <select 
                        className="text-[10px] bg-transparent border-0 font-bold text-gray-500 uppercase tracking-tight p-0"
                        value={newTab.actionType || 'link'}
                        onChange={(e) => setNewTab({...newTab, actionType: e.target.value as any})}
                    >
                        <option value="link">URL</option>
                        <option value="screen">SCREEN</option>
                    </select>
                    
                    {newTab.actionType === 'screen' ? (
                        <select 
                             className="flex-1 text-[10px] bg-transparent border-0 font-mono text-blue-600 p-0"
                             value={newTab.actionValue || ''}
                             onChange={(e) => setNewTab({...newTab, actionValue: e.target.value})}
                        >
                            <option value="">Select Screen...</option>
                             {screens.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
                        </select>
                    ) : (
                        <input 
                             value={newTab.actionValue || ''}
                             onChange={(e) => setNewTab({...newTab, actionValue: e.target.value})}
                             placeholder="https://..."
                             className="flex-1 text-[10px] bg-transparent border-0 font-mono text-blue-600 p-0"
                        />
                    )}
                </div>
            </div>
            <div className="flex items-center gap-1">
                 <Button size="sm" onClick={() => addItem(group, newTab)} disabled={!newTab.label} className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-3">
                    Add
                 </Button>
                 <Button size="sm" variant="ghost" onClick={onClose} className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600">
                    <XMarkIcon className="w-4 h-4" />
                 </Button>
            </div>
        </div>
    )

    const guideUsage = `const { navigation } = useBranding();\n\nconst visibleTabs = (navigation?.tabBar || []).filter(t => t.visible);\n\nvisibleTabs.forEach(tab => {\n  if (tab.actionType === 'screen') {\n    navigation.navigate(tab.actionValue);\n  }\n});`

    return (
        <Card className="border-0 shadow-sm ring-1 ring-gray-200/50 bg-white/80 backdrop-blur-xl">
            <CardHeader className="border-b border-gray-100/50 pb-3">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <ListBulletIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">App Navigation</CardTitle>
                            <CardDescription>Configure tabs and main menu items.</CardDescription>
                        </div>
                    </div>
                    
                    <MobileGuide 
                        title="Navigation Manager"
                        idLabel="Config Type"
                        idValue="Dynamic Navigation"
                        usageExample={guideUsage}
                        devNote="Screens are dynamically linked using Screen IDs from the inventory."
                        buttonVariant="labeled"
                        buttonLabel="Developer Info"
                    />
                </div>
            </CardHeader>
            <CardBody className="p-5 space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    <div className="space-y-12">
                        {/* Tab Bar Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Main Tab Bar</h4>
                                <Button size="sm" variant="ghost" onClick={() => setIsAddingTab(!isAddingTab)}>
                                    <PlusIcon className="w-3.5 h-3.5 mr-1" /> Add Tab
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {safeNavigation.tabBar.map((item) => (
                                    <NavigationItemRow key={item.id} item={item} group="tabBar" />
                                ))}
                                {isAddingTab && <NewItemRow group="tabBar" onClose={() => setIsAddingTab(false)} />}
                                {!isAddingTab && safeNavigation.tabBar.length === 0 && (
                                    <div className="text-center py-6 border border-dashed border-gray-200 rounded-2xl bg-gray-50/20">
                                        <p className="text-xs text-gray-500">No tab bar items.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Drawer Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Side Drawer Menu</h4>
                                <Button size="sm" variant="ghost" onClick={() => setIsAddingDrawer(!isAddingDrawer)}>
                                    <PlusIcon className="w-3.5 h-3.5 mr-1" /> Add Menu Item
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {safeNavigation.drawer.map((item) => (
                                    <NavigationItemRow key={item.id} item={item} group="drawer" />
                                ))}
                                {isAddingDrawer && <NewItemRow group="drawer" onClose={() => setIsAddingDrawer(false)} />}
                                {!isAddingDrawer && safeNavigation.drawer.length === 0 && (
                                    <div className="text-center py-6 border border-dashed border-gray-200 rounded-2xl bg-gray-50/20">
                                        <p className="text-xs text-gray-500">No side drawer items.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Mobile Preview Section */}
                    <div className="hidden lg:block space-y-4">
                        <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest leading-loose">Visual Feedback</label>
                        <div className="flex justify-center p-8 bg-gray-50/50 rounded-3xl border border-gray-100 sticky top-4">
                            {/* Device Frame */}
                            <div className="relative w-[280px] h-[580px] bg-white rounded-[3rem] shadow-2xl overflow-hidden ring-1 ring-gray-200">
                                {/* Tab Bar Preview */}
                                <div className="absolute top-12 left-6 right-6 flex items-center justify-between">
                                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                                        <Bars3Icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 mx-4 h-10 rounded-xl bg-gray-50 border border-gray-100"></div>
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                        <DevicePhoneMobileIcon className="w-5 h-5" />
                                    </div>
                                </div>
                                
                                <div className="absolute inset-x-6 top-28 bottom-24 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center overflow-hidden">
                                     <div className="text-center p-6 space-y-2">
                                         <RectangleStackIcon className="w-8 h-8 text-gray-200 mx-auto" />
                                         <p className="text-[10px] text-gray-300 font-bold uppercase tracking-wider">Dynamic Viewport</p>
                                     </div>
                                </div>

                                <div className="absolute bottom-0 inset-x-0 bg-white border-t border-gray-100 pb-8 pt-2 px-4 flex items-center justify-around">
                                    {safeNavigation.tabBar.filter(t => t.visible).slice(0, 5).map((tab, idx) => (
                                        <div key={tab.id} className="flex flex-col items-center gap-1 group w-12">
                                            <div className={clsx("w-5 h-5", idx === 0 ? "text-blue-600" : "text-gray-300")}>
                                                <DevicePhoneMobileIcon className="w-full h-full" />
                                            </div>
                                            <span className={clsx("text-[8px] font-bold uppercase tracking-tighter truncate max-w-full", idx === 0 ? "text-blue-600" : "text-gray-300")}>
                                                {tab.label || '...'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardBody>
        </Card>
    )
}
