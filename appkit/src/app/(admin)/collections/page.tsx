
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../../../components/ui/Button'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { DynamicCollection } from '../../../types/collection'
import { useApp } from '../../../contexts/AppContext'
import { adminService } from '../../../services/adminService'
import { MobileGuide } from '../../../components/ui/MobileGuide'
import { generateMobileUsage } from '../../../utils/collectionUtils'
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '../../../components/ui/Table'
import { Modal } from '../../../components/ui/Modal'
import { Input } from '../../../components/ui/Input'
import { 
  PlusIcon,
  TrashIcon, 
  PencilSquareIcon,
  TableCellsIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  StarIcon,
  BellIcon
} from '@heroicons/react/24/outline'



export default function CollectionsIndexPage() {
    const router = useRouter()
    const { currentApp } = useApp()
    const [allCollections, setAllCollections] = useState<DynamicCollection[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        loadDynamicCollections()
    }, [currentApp?.id])

    const loadDynamicCollections = async () => {
        setLoading(true)
        setError(null)
        try {
            const types = await adminService.getEntityTypes(currentApp?.id)
            if (Array.isArray(types)) {
                // Filter out collections that have dedicated management pages and are NOT app-level:
                // - 'users': Managed at /admin/identity/users (mobile app users - app-level but has dedicated UI)
                // - 'admin-users': Managed at /settings/admin-users (uniapps admin users - NOT app-level, separate system)
                // Admin users are uniapps-level (admin panel management), NOT app-level collections
                // These are managed through dedicated routes and don't use the entity/collection system
                const excludedNames = ['users', 'admin-users', 'admin_users']
                const filteredTypes = types.filter(type => !excludedNames.includes(type.name))
                setAllCollections(filteredTypes)
            } else {
                console.warn('getEntityTypes returned non-array:', types)
                setAllCollections([])
            }
        } catch (error: any) {
            console.error('Failed to load dynamic collections:', error)
            setError(error.message || 'Failed to load collections')
            setAllCollections([])
        } finally {
            setLoading(false)
        }
    }

    // Helper to get icon component
    const getIcon = (name: string, className = "w-5 h-5") => {
        switch(name) {
            case 'users': return <UsersIcon className={className} />
            case 'chat': 
            case 'message-square': return <ChatBubbleLeftRightIcon className={className} />
            case 'calendar': return <CalendarIcon className={className} />
            case 'file-text': return <DocumentTextIcon className={className} />
            case 'check-square': return <CheckCircleIcon className={className} />
            case 'star': return <StarIcon className={className} />
            case 'bell': return <BellIcon className={className} />
            default: return <TableCellsIcon className={className} />
        }
    }

    const handleDeleteCollection = async (collection: DynamicCollection, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!confirm(`Are you sure you want to delete "${collection.displayName}"? This will also delete all items in this collection.`)) {
            return
        }

        try {
            await adminService.deleteEntityType(collection.id)
            loadDynamicCollections()
        } catch (error: any) {
            alert(error.message || 'Failed to delete collection')
        }
    }

    const handleEditMetadata = (collection: DynamicCollection, e: React.MouseEvent) => {
        e.stopPropagation()
        setEditingMetadata(collection)
        setMetadataForm({
            displayName: collection.displayName,
            description: collection.description || '',
            icon: collection.icon || 'collection'
        })
        setIsEditModalOpen(true)
    }

    const handleSaveMetadata = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingMetadata) return
        
        setSavingMetadata(true)
        try {
            await adminService.updateEntityType(editingMetadata.id, {
                displayName: metadataForm.displayName,
                description: metadataForm.description,
                icon: metadataForm.icon,
                // Keep existing schema
                schema: editingMetadata.schema || []
            })
            setIsEditModalOpen(false)
            loadDynamicCollections()
        } catch (error: any) {
            alert(error.message || 'Failed to update collection metadata')
        } finally {
            setSavingMetadata(false)
        }
    }

    // Metdata Edit State (Move down after loadDynamicCollections)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editingMetadata, setEditingMetadata] = useState<DynamicCollection | null>(null)
    const [savingMetadata, setSavingMetadata] = useState(false)
    const [metadataForm, setMetadataForm] = useState({
        displayName: '',
        description: '',
        icon: 'collection'
    })

    // Grouping Logic
    const groupedCollections = allCollections.reduce((acc, col) => {
        const category = col.category || 'Common';
        if (!acc[category]) acc[category] = [];
        acc[category].push(col);
        return acc;
    }, {} as Record<string, typeof allCollections>);

    // Category Order
    const categoryOrder = ['System', 'Social', 'Content', 'Settings', 'Custom', 'Common'];
    const sortedCategories = Object.keys(groupedCollections).sort((a, b) => {
        const indexA = categoryOrder.indexOf(a);
        const indexB = categoryOrder.indexOf(b);
        return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
    });

    // Flatten for Pagination (if keeping pagination across all, or paginate within groups? usually across all)
    // Actually, grouping usually breaks simple pagination unless we flatten.
    // Let's keep pagination but paginate the *flattened* list including headers? 
    // Or just paginate the items and insert headers where appropriate. 
    // Simpler: Paginate the *items*, and then group the *current page*? 
    // No, grouping usually implies seeing all in that group.
    
    // Changing approach: If utilizing categories, usually we show all or have collapsed sections. 
    // Given the 10 item page limit, let's keep pagination on the *items* and show headers if they appear in the current page.
    
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10
    const totalPages = Math.ceil((allCollections.length || 1) / itemsPerPage)
    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    
    // Sort all collections by category first, then name
    const sortedAllCollections = [...allCollections].sort((a, b) => {
        const catA = a.category || 'Common';
        const catB = b.category || 'Common';
        const indexA = categoryOrder.indexOf(catA);
        const indexB = categoryOrder.indexOf(catB);
        const catDiff = (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
        if (catDiff !== 0) return catDiff;
        const nameA = a.displayName || a.title || a.name || '';
        const nameB = b.displayName || b.title || b.name || '';
        return nameA.localeCompare(nameB);
    });

    const currentItems = sortedAllCollections.slice(indexOfFirstItem, indexOfLastItem);

    // Group the *current page* items to insert headers
    const currentGroupedItems: { type: 'header' | 'item', data: any }[] = [];
    let lastCategory = '';
    
    // Check if the previous page ended with the same category as this page starts (to verify if we need a header)
    if (currentItems.length > 0) {
        const firstItem = currentItems[0];
        const firstCat = firstItem.category || 'Common';
        // If it's the start of the list OR the category changed from the absolute previous item
        const absolutePrevIndex = indexOfFirstItem - 1;
        if (absolutePrevIndex < 0 || (sortedAllCollections[absolutePrevIndex]?.category || 'Common') !== firstCat) {
             currentGroupedItems.push({ type: 'header', data: firstCat });
             lastCategory = firstCat;
        } else {
             // We are continuing a category from previous page, maybe show header with "(cont.)"? 
             // Or just show header for clarity always implementation?
             // Let's just show header if it's the first item of the view for clarity.
             currentGroupedItems.push({ type: 'header', data: firstCat });
             lastCategory = firstCat;
        }
    }

    currentItems.forEach(item => {
        const cat = item.category || 'Common';
        if (cat !== lastCategory) {
            currentGroupedItems.push({ type: 'header', data: cat });
            lastCategory = cat;
        }
        currentGroupedItems.push({ type: 'item', data: item });
    });

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page)
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Collections</h1>
                    <p className="text-gray-500 mt-1">Manage data entities for {currentApp?.name || 'your application'}</p>
                </div>
                <Button 
                    variant="primary" 
                    onClick={() => router.push('/collections/schema/new')}
                    className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
                >
                    <PlusIcon className="w-5 h-5" />
                    Create Collection
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-32">
                    <LoadingSpinner size="lg" />
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">{error}</p>
                    <Button 
                        variant="secondary" 
                        onClick={loadDynamicCollections}
                        className="mt-2"
                    >
                        Retry
                    </Button>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[300px]">Collection Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="w-[400px]">Description</TableHead>
                                    <TableHead>Fields</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentGroupedItems.map((row, idx) => {
                                    if (row.type === 'header') {
                                        return (
                                            <TableRow key={`header-${idx}`} className="bg-gray-50 hover:bg-gray-50 cursor-default">
                                                <TableCell colSpan={5} className="py-2 px-4">
                                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                        {row.data}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    }
                                    const col = row.data as (DynamicCollection & { isSystem: boolean });
                                    return (
                                    <TableRow 
                                        key={col.id} 
                                        className="cursor-pointer hover:bg-gray-50/80 transition-colors"
                                        onClick={() => router.push(`/collections/${col.name}`)}
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${col.isSystem ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                                    {getIcon(col.icon)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{col.displayName}</div>
                                                    <div className="text-xs text-gray-500 font-mono">{col.name}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                ${col.isSystem 
                                                    ? 'bg-blue-100 text-blue-700' 
                                                    : 'bg-indigo-100 text-indigo-700'
                                                }`}>
                                                {col.isSystem ? 'System' : 'Custom'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-sm text-gray-500 line-clamp-1">{col.description || '-'}</p>
                                        </TableCell>
                                        <TableCell>
                                            {col.schema && Array.isArray(col.schema) ? (
                                                <span className="text-sm text-gray-500">{col.schema.length} Fields</span>
                                            ) : (
                                                <span className="text-sm text-gray-400">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {!col.isSystem && (
                                                    <>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            onClick={(e) => handleEditMetadata(col, e)}
                                                            className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                                                            title="Edit Collection Info"
                                                        >
                                                            <PencilSquareIcon className="w-4 h-4" />
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            onClick={(e) => { e.stopPropagation(); router.push(`/collections/schema/${col.id}`) }}
                                                            className="h-8 w-8 p-0 text-gray-500 hover:text-indigo-600"
                                                            title="Edit Schema"
                                                        >
                                                            <TableCellsIcon className="w-4 h-4" />
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            onClick={(e) => handleDeleteCollection(col, e)}
                                                            className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50"
                                                            title="Delete Collection"
                                                        >
                                                            <TrashIcon className="w-4 h-4" />
                                                        </Button>
                                                        <MobileGuide 
                                                            title={`${col.displayName} Integration`}
                                                            idLabel="Collection ID"
                                                            idValue={col.name}
                                                            usageExample={generateMobileUsage(col.name, col.displayName, col.schema || [])}
                                                            devNote="Use the useCollection hook to fetch data from this collection."
                                                            buttonLabel=""
                                                            buttonVariant="icon"
                                                            className="h-8 w-8 text-gray-500 hover:text-green-600"
                                                        />
                                                    </>
                                                )}
                                                {col.name === 'users' && (
                                                     <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        onClick={(e) => { e.stopPropagation(); router.push('/collections/users') }}
                                                        className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                                                    >
                                                        <UsersIcon className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )})}
                                {allCollections.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                                            No collections found. Create one to get started.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                
                    {/* Pagination Controls */}
                    {allCollections.length > 0 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                            <div className="flex-1 flex justify-between sm:hidden">
                                <Button 
                                    variant="secondary" 
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </Button>
                                <Button 
                                    variant="secondary" 
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700">
                                        Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to <span className="font-medium">{Math.min(indexOfLastItem, allCollections.length)}</span> of <span className="font-medium">{allCollections.length}</span> results
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="sr-only">Previous</span>
                                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                        
                                        {/* Page Numbers */}
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                                             <button
                                                key={number}
                                                onClick={() => handlePageChange(number)}
                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium
                                                    ${currentPage === number 
                                                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' 
                                                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {number}
                                            </button>
                                        ))}

                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="sr-only">Next</span>
                                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Edit Metadata Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit Collection Details"
            >
                <form onSubmit={handleSaveMetadata} className="space-y-4">
                    <Input
                        label="Display Name"
                        value={metadataForm.displayName}
                        onChange={(e) => setMetadataForm(prev => ({ ...prev, displayName: e.target.value }))}
                        required
                    />
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            value={metadataForm.description}
                            onChange={(e) => setMetadataForm(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-h-[100px]"
                            aria-label="Collection description"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Icon</label>
                        <select
                            value={metadataForm.icon}
                            onChange={(e) => setMetadataForm(prev => ({ ...prev, icon: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            aria-label="Collection icon"
                        >
                            <option value="collection">Collection</option>
                            <option value="users">Users</option>
                            <option value="chat">Chat</option>
                            <option value="calendar">Calendar</option>
                            <option value="file-text">Document</option>
                            <option value="check-square">Checkbox</option>
                            <option value="star">Star</option>
                            <option value="bell">Bell</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <Button variant="secondary" onClick={() => setIsEditModalOpen(false)} type="button">
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" disabled={savingMetadata}>
                            {savingMetadata ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
