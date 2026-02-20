'use client'

import React, { useState, useRef } from 'react'
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import { ColorPickerPopover, colorValueToCss } from '../ui/ColorPickerPopover'
import { Input } from '../ui/Input'
import { BrandingConfig, ScreenConfig, ColorValue } from './types'
import { Button } from '../ui/Button'
import { 
    PlusIcon, 
    TrashIcon, 
    DevicePhoneMobileIcon, 
    RectangleStackIcon, 
    PhotoIcon, 
    AdjustmentsHorizontalIcon,
    ArrowUpTrayIcon,
    SparklesIcon,
    PencilIcon,
    CheckIcon,
    XMarkIcon,
    MagnifyingGlassPlusIcon,
    MagnifyingGlassMinusIcon,
    MagnifyingGlassIcon,
    Square2StackIcon,
    CheckCircleIcon,
    XCircleIcon
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'
import { toast } from '@/hooks/use-toast'
// @ts-ignore
import { DndProvider, useDrag, useDrop } from 'react-dnd'
// @ts-ignore
import { HTML5Backend } from 'react-dnd-html5-backend'

const ItemTypes = {
    SCREEN: 'screen',
    GROUP: 'group'
}

interface ScreenManagerProps {
    branding: BrandingConfig
    setBranding: React.Dispatch<React.SetStateAction<BrandingConfig>>
    handleBrandingUpload: (field: keyof BrandingConfig, file: File, screenId?: string) => Promise<void>
    activeScreenTab?: string
    setActiveScreenTab?: (id: string) => void
}

export function ScreenManager({ 
    branding, 
    setBranding, 
    handleBrandingUpload,
    activeScreenTab,
    setActiveScreenTab
}: ScreenManagerProps) {
    const [zoom, setZoom] = useState(1)
    const [isAdding, setIsAdding] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [uploadingId, setUploadingId] = useState<string | null>(null)
    
    // Group State
    const [activeGroup, setActiveGroup] = useState<string>('all')
    const [isCreatingGroup, setIsCreatingGroup] = useState(false)
    const [newGroupName, setNewGroupName] = useState('')
    const [searchQuery, setSearchQuery] = useState('')

    // Bulk Update State
    const [isSelectionMode, setIsSelectionMode] = useState(false)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [bulkBackground, setBulkBackground] = useState<ColorValue>({ mode: 'solid', solid: '#ffffff' })
    const [bulkResizeMode, setBulkResizeMode] = useState<'cover' | 'contain' | 'stretch' | 'center'>('cover')

    const toggleSelection = (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        const newSelected = new Set(selectedIds)
        if (newSelected.has(id)) {
            newSelected.delete(id)
        } else {
            newSelected.add(id)
        }
        setSelectedIds(newSelected)
    }

    const selectAll = () => {
        if (selectedIds.size === filteredScreens.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(filteredScreens.map(s => s.id)))
        }
    }

    const handleBulkUpdate = () => {
        if (selectedIds.size === 0) return

        if (confirm(`Update background for ${selectedIds.size} screens?`)) {
            setBranding(prev => ({
                ...prev,
                screens: prev.screens.map(s => {
                    if (selectedIds.has(s.id)) {
                        return {
                            ...s,
                            background: bulkBackground,
                            resizeMode: bulkResizeMode
                        }
                    }
                    return s
                })
            }))
            toast({ title: "Bulk Update", description: `Updated ${selectedIds.size} screens.` })
            setIsSelectionMode(false)
            setSelectedIds(new Set())
        }
    }

    // New Screen State
    const [newScreen, setNewScreen] = useState<Partial<ScreenConfig>>({
        id: '',
        name: '',
        type: 'screen',
        resizeMode: 'cover'
    })

    const addScreen = () => {
        if (!newScreen.id || !newScreen.name) {
            toast({ title: "Validation Error", description: "ID and Name are required.", variant: "destructive" })
            return
        }

        const safeId = newScreen.id.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

        if (branding.screens?.some(s => s.id === safeId)) {
            toast({ title: "Duplicate ID", description: "A screen with this ID already exists.", variant: "destructive" })
            return
        }

        const screen: ScreenConfig = {
            id: safeId,
            name: newScreen.name,
            background: '',
            resizeMode: newScreen.resizeMode as any || 'cover',
            type: newScreen.type as any || 'screen',
            icon: 'document',
            groupId: activeGroup === 'all' ? 'other' : activeGroup
        }

        setBranding(prev => ({
            ...prev,
            screens: [...(prev.screens || []), screen]
        }))

        setNewScreen({ id: '', name: '', type: 'screen', resizeMode: 'cover' })
        setIsAdding(false)
        if (setActiveScreenTab) setActiveScreenTab(screen.id)
        toast({ title: "Screen Added", description: `${screen.name} has been added to the inventory.` })
    }

    const removeScreen = (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        if (confirm('Are you sure you want to remove this screen?')) {
            setBranding(prev => ({
                ...prev,
                screens: prev.screens.filter(s => s.id !== id)
            }))
            toast({ title: "Screen Removed", description: "The screen has been removed." })
            if (activeScreenTab === id && setActiveScreenTab) {
                setActiveScreenTab('')
            }
        }
    }

    const updateScreenName = (id: string, newName: string) => {
        setBranding(prev => ({
            ...prev,
            screens: prev.screens.map(s => s.id === id ? { ...s, name: newName } : s)
        }))
        setEditingId(null)
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, screenId: string) => {
        const file = e.target.files?.[0]
        if (!file) return

        e.stopPropagation() // Prevent card click
        setUploadingId(screenId)
        try {
            await handleBrandingUpload('screens', file, screenId)
            toast({ title: "Wallpaper Updated", description: "New background uploaded successfully." })
        } catch (error) {
            toast({ title: "Upload Failed", variant: "destructive" })
        } finally {
            setUploadingId(null)
        }
    }

    const screenGroups = branding.screenGroups || [
        { id: 'auth', name: 'Authentication', icon: 'lock' },
        { id: 'main', name: 'Main App', icon: 'home' }, 
        { id: 'settings', name: 'Profile & Settings', icon: 'cog' },
        { id: 'other', name: 'Uncategorized', icon: 'folder' }
    ]

    const filteredScreens = (branding.screens || []).filter(s => {
        const matchesGroup = activeGroup === 'all' ? true : 
                             activeGroup === 'other' ? (!s.groupId || s.groupId === 'other') : 
                             s.groupId === activeGroup

        if (!matchesGroup) return false

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            return s.name.toLowerCase().includes(query) || s.id.toLowerCase().includes(query)
        }

        return true
    })

    const createGroup = () => {
        if (!newGroupName.trim()) return
        const id = newGroupName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        
        if (screenGroups.some(g => g.id === id)) {
            toast({ title: "Group exists", variant: "destructive" })
            return
        }

        const newGroup = { id, name: newGroupName, icon: 'folder' }
        setBranding(prev => ({
            ...prev,
            screenGroups: [...(prev.screenGroups || []), newGroup]
        }))
        
        setNewGroupName('')
        setIsCreatingGroup(false)
        setActiveGroup(id)
        toast({ title: "Group Created", description: `Created group ${newGroupName}` })
    }

    const moveScreenToGroup = (screenId: string, targetGroupId: string) => {
        setBranding(prev => ({
            ...prev,
            screens: prev.screens.map(s => {
                if (s.id === screenId) {
                    if (s.groupId !== targetGroupId) {
                        toast({ title: "Moved", description: `Moved to ${screenGroups.find(g => g.id === targetGroupId)?.name || 'folder'}` })
                    }
                    return { ...s, groupId: targetGroupId === 'other' ? undefined : targetGroupId }
                }
                return s
            })
        }))
    }

    const removeGroup = (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        if (confirm('Are you sure you want to delete this group? Screens will be moved to Uncategorized.')) {
            setBranding(prev => ({
                ...prev,
                screens: prev.screens.map(s => s.groupId === id ? { ...s, groupId: undefined } : s),
                screenGroups: (prev.screenGroups || []).filter(g => g.id !== id)
            }))
            if (activeGroup === id) setActiveGroup('all')
            toast({ title: "Group Deleted", description: "Screens have been moved to Uncategorized." })
        }
    }
    
    // Move functions for reordering
    const moveScreen = (dragId: string, hoverId: string) => {
        setBranding(prev => {
            const screens = [...(prev.screens || [])];
            const dragIndex = screens.findIndex(s => s.id === dragId);
            const hoverIndex = screens.findIndex(s => s.id === hoverId);
            
            if (dragIndex === -1 || hoverIndex === -1) return prev;
            
            const [removed] = screens.splice(dragIndex, 1);
            screens.splice(hoverIndex, 0, removed);
            
            return { ...prev, screens };
        });
    };

    const moveGroup = (dragId: string, hoverId: string) => {
        setBranding(prev => {
            const groups = [...(prev.screenGroups || [])];
            const dragIndex = groups.findIndex(g => g.id === dragId);
            const hoverIndex = groups.findIndex(g => g.id === hoverId);
            
            if (dragIndex === -1 || hoverIndex === -1) return prev;
            
            const [removed] = groups.splice(dragIndex, 1);
            groups.splice(hoverIndex, 0, removed);
            
            return { ...prev, screenGroups: groups };
        });
    };

    const DraggableScreenCard = ({ screen, isActive, isModal }: { screen: ScreenConfig, isActive: boolean, isModal: boolean }) => {
        const ref = useRef<HTMLDivElement>(null)
        const isSelected = selectedIds.has(screen.id)
        
        const [{ isDragging }, drag] = useDrag(() => ({
            type: ItemTypes.SCREEN,
            item: { id: screen.id },
            canDrag: !isSelectionMode,
            collect: (monitor: any) => ({
                isDragging: !!monitor.isDragging(),
            }),
        }), [isSelectionMode])

        const [, drop] = useDrop({
            accept: ItemTypes.SCREEN,
            hover(item: { id: string }) {
                if (!ref.current || item.id === screen.id || isSelectionMode) return;
                moveScreen(item.id, screen.id);
            }
        }, [isSelectionMode])

        drag(drop(ref))

        return (
             <div 
                ref={ref}
                className={clsx("flex flex-col gap-3 group relative select-none", isDragging ? "opacity-50" : "opacity-100")}
                onClick={(e) => {
                    if (isSelectionMode) {
                        e.stopPropagation()
                        toggleSelection(e, screen.id)
                    }
                }}
            >
                {/* Device Preview Card */}
                <div 
                    onClick={() => !isSelectionMode && setActiveScreenTab?.(screen.id)}
                    className={clsx(
                        "relative aspect-[9/16] bg-gray-900 shadow-xl transition-all duration-300 overflow-hidden cursor-pointer",
                        isActive && !isSelectionMode ? "ring-4 ring-purple-400/50 scale-[1.02] border-gray-800" : "border-gray-800",
                        !isActive && !isSelectionMode ? "hover:scale-[1.01] hover:shadow-2xl" : "",
                        isSelectionMode && isSelected ? "ring-4 ring-blue-500 scale-[0.98] border-blue-500" : "",
                        isSelectionMode && !isSelected ? "opacity-60 hover:opacity-80" : ""
                    )}
                    style={{
                        borderRadius: `${Math.floor(32 * zoom)}px`,
                        borderWidth: `${Math.floor(4 * zoom)}px`
                    }}
                >
                    {/* Selection Checkbox */}
                    {isSelectionMode && (
                        <div className="absolute top-4 right-4 z-50">
                            {isSelected ? (
                                <CheckCircleIcon className="w-8 h-8 text-blue-500 bg-white rounded-full" />
                            ) : (
                                <div className="w-8 h-8 rounded-full border-2 border-white/50 bg-black/20" />
                            )}
                        </div>
                    )}

                    {/* Device Frame Notch */}
                    <div 
                        className="absolute top-0 left-1/2 -translate-x-1/2 bg-gray-800 z-20 pointer-events-none"
                        style={{
                            width: `${Math.floor(96 * zoom)}px`,
                            height: `${Math.floor(20 * zoom)}px`,
                            borderBottomLeftRadius: `${Math.floor(12 * zoom)}px`,
                            borderBottomRightRadius: `${Math.floor(12 * zoom)}px`
                        }}
                    ></div>

                    {/* Background Image / Placeholder */}
                    <div className="absolute inset-0 bg-white">
                        {screen.background ? (
                            <div 
                                className={clsx("w-full h-full", 
                                    screen.resizeMode === 'contain' ? 'bg-center bg-no-repeat bg-contain' :
                                    screen.resizeMode === 'stretch' ? 'bg-center bg-no-repeat bg-[length:100%_100%]' :
                                    screen.resizeMode === 'center' ? 'bg-center bg-no-repeat' :
                                    'bg-center bg-no-repeat bg-cover'
                                )}
                                style={(() => {
                                    const bg = screen.background;
                                    const resolved = typeof bg === 'string' ? bg : (bg?.mode === 'image' ? (bg.image || '') : colorValueToCss(bg));
                                    const isImage = resolved && (resolved.startsWith('http') || resolved.startsWith('/') || resolved.startsWith('data:'));
                                    return isImage ? { backgroundImage: `url(${resolved})` } : { background: resolved };
                                })()}
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-300 gap-2">
                                {isModal ? <AdjustmentsHorizontalIcon className="w-12 h-12 opacity-20" /> : <PhotoIcon className="w-12 h-12 opacity-20" />}
                            </div>
                        )}
                    </div>

                    {/* Modal Overlay Style */}
                    {isModal && (
                        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-white/90 backdrop-blur-sm rounded-t-3xl border-t border-gray-200/50 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] mx-2 mb-2 z-10 pointer-events-none">
                            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3"></div>
                        </div>
                    )}

                    {/* Hover/Active Overlay Controls - Hide in selection mode */}
                    {!isSelectionMode && (
                        <div className={clsx(
                            "absolute inset-0 bg-black/40 flex flex-col justify-between p-4 transition-opacity duration-200 z-30",
                            isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        )}>
                            <div className="flex justify-between items-start">
                                <div onClick={e => e.stopPropagation()}>
                                </div>
                                <button 
                                    onClick={(e) => removeScreen(e, screen.id)}
                                    className="p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-full backdrop-blur-md transition-all shadow-sm"
                                    title="Delete Screen"
                                >
                                    <TrashIcon className="w-3 h-3" />
                                </button>
                            </div>

                            {/* Upload Trigger */}
                            <label className="flex items-center justify-center gap-2 w-full py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 rounded-xl cursor-pointer transition-all text-white text-xs font-medium group/upload" onClick={e => e.stopPropagation()}>
                                {uploadingId === screen.id ? (
                                    <span className="animate-pulse">Uploading...</span>
                                ) : (
                                    <>
                                        <ArrowUpTrayIcon className="w-3 h-3 group-hover/upload:-translate-y-0.5 transition-transform" />
                                        <span>Upload</span>
                                    </>
                                )}
                                <input type="file" className="hidden" accept="image/*" title="Upload screen image" onChange={(e) => handleFileUpload(e, screen.id)} />
                            </label>
                        </div>
                    )}
                </div>

                {/* Info Footer (Below Device) */}
                <div className="px-1 space-y-1">
                    <div className="flex items-center justify-between">
                        {editingId === screen.id ? (
                            <div className="flex-1 flex gap-1 bg-white border border-gray-200 rounded-lg p-0.5" onClick={e => e.stopPropagation()}>
                                <Input 
                                    autoFocus
                                    defaultValue={screen.name}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') updateScreenName(screen.id, e.currentTarget.value)
                                        if (e.key === 'Escape') setEditingId(null)
                                    }}
                                    onBlur={(e) => updateScreenName(screen.id, e.target.value)}
                                    className="h-6 text-xs border-0 bg-transparent p-1 focus:ring-0 text-gray-900 font-bold"
                                />
                                <button onClick={() => setEditingId(null)} className="px-1 text-green-600 hover:bg-green-50 rounded" title="Save screen name"><CheckIcon className="w-3 h-3"/></button>
                            </div>
                        ) : (
                            <div 
                                className="font-bold text-gray-900 text-sm truncate cursor-pointer hover:text-purple-600 flex items-center gap-1"
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    if (!isSelectionMode) setEditingId(screen.id) 
                                }}
                            >
                                {screen.name}
                                {!isSelectionMode && <PencilIcon className="w-3 h-3 opacity-0 group-hover:opacity-30" />}
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                        <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{screen.id}</span>
                        <span className={clsx(
                            "px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wider",
                            isModal ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                        )}>
                            {isModal ? 'Modal' : 'Page'}
                        </span>
                    </div>
                </div>
            </div>
        )
    }

    const DroppableGroupButton = ({ group, count, isActive, onClick }: { group: { id: string, name: string, icon?: string }, count: number, isActive: boolean, onClick: () => void }) => {
        const ref = useRef<HTMLButtonElement>(null)
        
        const [{ isDragging }, drag] = useDrag(() => ({
            type: ItemTypes.GROUP,
            item: { id: group.id },
            collect: (monitor: any) => ({
                isDragging: !!monitor.isDragging(),
            }),
        }))

        const [{ isOver }, drop] = useDrop(() => ({
            accept: [ItemTypes.SCREEN, ItemTypes.GROUP],
            drop: (item: any, monitor: any) => {
                const type = monitor.getItemType()
                if (type === ItemTypes.SCREEN) {
                    moveScreenToGroup(item.id, group.id)
                }
            },
            hover: (item: any, monitor: any) => {
                const type = monitor.getItemType()
                if (type === ItemTypes.GROUP && item.id !== group.id) {
                    moveGroup(item.id, group.id)
                }
            },
            collect: (monitor: any) => ({
                isOver: monitor.isOver() && monitor.getItemType() === ItemTypes.SCREEN,
            }),
        }))

        drag(drop(ref))

        return (
            <button
                ref={ref}
                key={group.id}
                onClick={onClick}
                className={clsx(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all relative overflow-hidden group/groupitem",
                    isActive ? "bg-white shadow-sm text-purple-700 font-medium border border-purple-100" : "text-gray-600 hover:bg-white/50 hover:text-gray-900",
                    isOver && "ring-2 ring-purple-500 ring-offset-1 bg-purple-50",
                    isDragging && "opacity-50"
                )}
            >
                {isOver && <div className="absolute inset-0 bg-purple-100/50 pointer-events-none" />}
                <div className="flex items-center gap-2 relative z-10 flex-1 min-w-0">
                    <div className={clsx("w-4 h-4 rounded flex items-center justify-center text-xs shrink-0", isActive ? "bg-purple-100" : "bg-gray-100")}>
                        {group.name[0]}
                    </div>
                    <span className="truncate">{group.name}</span>
                </div>
                <div className="flex items-center gap-2 relative z-10">
                    <span className="text-xs text-gray-400">{count}</span>
                    {group.id !== 'other' && (
                        <div 
                            onClick={(e) => removeGroup(e, group.id)}
                            className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-all opacity-0 group-hover/groupitem:opacity-100"
                            title="Delete Group"
                        >
                            <TrashIcon className="w-3.5 h-3.5" />
                        </div>
                    )}
                </div>
            </button>
        )
    }

    return (
      <DndProvider backend={HTML5Backend}>
        <div className="flex flex-col h-full space-y-6">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <DevicePhoneMobileIcon className="w-6 h-6 text-purple-600" />
                        Screen Studio
                    </h2>
                    <p className="text-gray-500">Manage your app's screens and their visual appearance.</p>
                </div>
                <div className="flex gap-2">
                    {/* Selection Toggle */}
                    <Button 
                        size="sm" 
                        variant={isSelectionMode ? "primary" : "outline"}
                        onClick={() => {
                            setIsSelectionMode(!isSelectionMode)
                            if (isSelectionMode) setSelectedIds(new Set())
                        }}
                        className={clsx("transition-all", isSelectionMode ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-white text-gray-700 border-gray-200")}
                    >
                        {isSelectionMode ? (
                            <>
                                <XCircleIcon className="w-4 h-4 mr-2" />
                                Cancel ({selectedIds.size})
                            </>
                        ) : (
                            <>
                                <Square2StackIcon className="w-4 h-4 mr-2" />
                                Select
                            </>
                        )}
                    </Button>

                    {isSelectionMode && (
                         <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={selectAll}
                            className="text-xs text-gray-500"
                        >
                            Select All
                        </Button>
                    )}

                    {/* Seed Inventory Button */}
                    <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={async () => {
                            if (confirm('This will add standard default screens to your inventory. Proceed?')) {
                                try {
                                    const { adminService } = await import('../../services/adminService');
                                    const res = await adminService.seedScreens();
                                    toast({ title: "Inventory Seeded", description: res.message });
                                    window.location.reload(); // Refresh to see changes
                                } catch (error) {
                                    toast({ title: "Seed Failed", variant: "destructive" });
                                }
                            }
                        }}
                        className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200"
                    >
                        <SparklesIcon className="w-4 h-4 mr-2" />
                        Seed Inventory
                    </Button>
                    {/* Add Screen Button */}
                     <Button 
                        size="sm" 
                        onClick={() => setIsAdding(true)}
                        className={clsx("transition-all", isAdding ? "bg-gray-100 text-gray-400" : "")}
                        disabled={isAdding}
                    >
                        <PlusIcon className="w-4 h-4 mr-2" />
                        New Screen
                    </Button>

                    {/* Search Bar */}
                    <div className="relative group/search">
                        <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within/search:text-purple-600 transition-colors" />
                        <input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search screens..."
                            className="h-9 pl-9 pr-4 rounded-xl border border-gray-200 bg-white/50 focus:bg-white text-xs w-40 focus:w-60 transition-all outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300"
                        />
                    </div>

                    {/* Zoom Controls */}
                    <div className="flex items-center gap-2 bg-white/50 px-3 py-1.5 rounded-xl border border-gray-200 backdrop-blur-sm self-center">
                        <button 
                            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                            className="p-1 hover:bg-white rounded transition-colors text-gray-500 hover:text-purple-600"
                            title="Zoom Out"
                        >
                            <MagnifyingGlassMinusIcon className="w-4 h-4" />
                        </button>
                        <input 
                            type="range" 
                            min="0.5" 
                            max="1.5" 
                            step="0.1" 
                            value={zoom} 
                            onChange={e => setZoom(parseFloat(e.target.value))}
                            className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                            title="Adjust zoom level"
                        />
                        <button 
                            onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}
                            className="p-1 hover:bg-white rounded transition-colors text-gray-500 hover:text-purple-600"
                            title="Zoom In"
                        >
                            <MagnifyingGlassPlusIcon className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] font-bold text-gray-400 min-w-[2.5rem] text-center">
                            {Math.round(zoom * 100)}%
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex flex-1 gap-6 min-h-0">
                {/* Groups Sidebar */}
                <aside className="w-64 shrink-0 bg-white/50 rounded-2xl border border-gray-200/50 p-3 flex flex-col gap-2 h-full">
                    <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider flex justify-between items-center">
                        <span>Groups</span>
                        <button 
                            onClick={() => setIsCreatingGroup(true)}
                            className="p-1 hover:bg-white rounded"
                            title="Create new group"
                        >
                            <PlusIcon className="w-3 h-3" />
                        </button>
                    </div>

                    {isCreatingGroup && (
                        <div className="px-2 mb-2">
                             <div className="flex items-center gap-1 bg-white border border-blue-200 rounded-lg p-1">
                                <input 
                                    autoFocus
                                    className="w-full text-xs border-0 p-1 focus:ring-0"
                                    placeholder="Group Name"
                                    value={newGroupName}
                                    onChange={e => setNewGroupName(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') createGroup()
                                        if (e.key === 'Escape') setIsCreatingGroup(false)
                                    }}
                                    title="Enter group name"
                                />
                                <button onClick={() => setIsCreatingGroup(false)} className="text-gray-400 hover:text-red-500 px-1" title="Cancel group creation">
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                             </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto space-y-1">
                        <button
                            onClick={() => setActiveGroup('all')}
                            className={clsx(
                                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all",
                                activeGroup === 'all' ? "bg-purple-100 text-purple-700 font-medium" : "text-gray-600 hover:bg-white hover:text-gray-900"
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <RectangleStackIcon className="w-4 h-4 opacity-70" />
                                <span>All Screens</span>
                            </div>
                            <span className="text-xs bg-gray-100 px-1.5 rounded-full text-gray-500">{(branding.screens || []).length}</span>
                        </button>
                        
                        {/* Uncategorized (Other) - Fixed position under All Screens */}
                        {(() => {
                            const otherGroup = screenGroups.find(g => g.id === 'other') || { id: 'other', name: 'Uncategorized', icon: 'folder' };
                            const count = (branding.screens || []).filter(s => !s.groupId || s.groupId === 'other').length;
                            return (
                                <DroppableGroupButton 
                                    key="other" 
                                    group={otherGroup} 
                                    count={count} 
                                    isActive={activeGroup === 'other'} 
                                    onClick={() => setActiveGroup('other')} 
                                />
                            );
                        })()}

                        {screenGroups.filter(g => g.id !== 'other').map(group => {
                            const count = (branding.screens || []).filter(s => s.groupId === group.id).length
                            
                            return (
                                <DroppableGroupButton 
                                    key={group.id} 
                                    group={group} 
                                    count={count} 
                                    isActive={activeGroup === group.id} 
                                    onClick={() => setActiveGroup(group.id)} 
                                />
                            )
                        })}
                    </div>
                </aside>

                {/* Grid Layout */}
                <div className="flex-1 overflow-y-auto">
                    <div 
                        className="grid gap-6 pb-20"
                        style={{
                            gridTemplateColumns: `repeat(auto-fill, minmax(${Math.floor(220 * zoom)}px, 1fr))`
                        }}
                    >
                        
                        {/* Add New Screen Card (Inline) */}
                        {isAdding && (
                            <Card className="border-2 border-dashed border-purple-300 bg-purple-50/30 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                <CardBody className="p-4 flex flex-col h-full gap-4">
                                    <div className="flex-1 flex flex-col justify-center gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-purple-900 uppercase">Screen Name</label>
                                            <Input 
                                                autoFocus
                                                value={newScreen.name}
                                                onChange={(e) => {
                                                    const name = e.target.value
                                                    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
                                                    setNewScreen(prev => ({ ...prev, name, id }))
                                                }}
                                                placeholder="e.g. My Profile"
                                                className="bg-white border-purple-200 focus:border-purple-500"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-purple-900 uppercase">Type</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button 
                                                    onClick={() => setNewScreen(prev => ({ ...prev, type: 'screen' }))}
                                                    className={clsx("p-2 rounded-lg text-xs font-medium border transition-all", newScreen.type === 'screen' ? "bg-purple-100 border-purple-300 text-purple-700" : "bg-white border-gray-200 hover:border-purple-200")}
                                                >
                                                    Screen
                                                </button>
                                                <button 
                                                    onClick={() => setNewScreen(prev => ({ ...prev, type: 'modal' }))}
                                                    className={clsx("p-2 rounded-lg text-xs font-medium border transition-all", newScreen.type === 'modal' ? "bg-purple-100 border-purple-300 text-purple-700" : "bg-white border-gray-200 hover:border-purple-200")}
                                                >
                                                    Modal
                                                </button>
                                            </div>
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-mono text-center">
                                            ID: {newScreen.id || '...'}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="ghost" className="flex-1" onClick={() => setIsAdding(false)}>Cancel</Button>
                                        <Button size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white" onClick={addScreen}>Create</Button>
                                    </div>
                                </CardBody>
                            </Card>
                        )}

                        {filteredScreens.map((screen) => {
                            const isActive = activeScreenTab === screen.id
                            const isModal = screen.type === 'modal'
                            
                            return (
                                <DraggableScreenCard 
                                    key={screen.id} 
                                    screen={screen} 
                                    isActive={isActive} 
                                    isModal={isModal} 
                                />
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
            {/* Bulk Action Bar */}
            {isSelectionMode && selectedIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-2 z-50 flex items-center gap-4 animate-in slide-in-from-bottom-10 fade-in duration-300">
                     <div className="flex items-center gap-3 px-2 border-r border-gray-100 pr-4">
                        <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{selectedIds.size}</span>
                        <span className="text-xs font-bold text-gray-700">Selected</span>
                     </div>

                     <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Background</span>
                            <div className="w-40">
                                <ColorPickerPopover 
                                    value={bulkBackground}
                                    onChange={setBulkBackground}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Resize Mode</span>
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                {['cover', 'contain', 'stretch', 'center'].map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setBulkResizeMode(mode as any)}
                                        className={clsx(
                                            "px-2 py-1 rounded text-[10px] font-medium transition-all capitalize",
                                            bulkResizeMode === mode ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
                                        )}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                        </div>
                     </div>

                     <div className="flex items-center gap-2 pl-2 border-l border-gray-100">
                        <Button size="sm" onClick={handleBulkUpdate} className="bg-blue-600 hover:bg-blue-700 text-white">
                            Apply
                        </Button>
                     </div>
                </div>
            )}
      </DndProvider>
    )
}


