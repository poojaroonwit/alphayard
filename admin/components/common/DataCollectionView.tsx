'use client'


import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardBody } from '../ui/Card'
import { Button } from '../ui/Button'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { useApp } from '../../contexts/AppContext'
import { adminService } from '../../services/adminService'
import { generateMobileUsage } from '../../utils/collectionUtils'
import { SchemaField, ColumnDefinition, DynamicCollection } from '../../types/collection'
import { MobileGuide } from '../ui/MobileGuide'

// View mode types
export type ViewMode = 'table' | 'list' | 'grid'

// Column definition for table view
export interface DataCollectionViewProps {
    collectionName: string
    title: string
    description?: string
    columns: ColumnDefinition[]
    data: any[]
    loading?: boolean
    error?: string | null
    onAdd?: () => void
    onEdit?: (item: any) => void
    onDelete?: (item: any) => void
    onRowClick?: (item: any) => void
    emptyMessage?: string
    addButtonLabel?: string
    gridRender?: (item: any) => React.ReactNode
    listRender?: (item: any) => React.ReactNode
    searchable?: boolean
    searchPlaceholder?: string
    
    // CRUD Capabilities
    canCreate?: boolean
    canUpdate?: boolean
    canDelete?: boolean
    schema?: SchemaField[]
    
    // Modal Control
    isModalOpen?: boolean
    onCloseModal?: () => void
    onSave?: (data: any) => void
    editingItem?: any
    isSubmitting?: boolean
}

// Icons for view modes
const ViewIcons = {
    table: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
    ),
    list: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
    ),
    grid: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
    )
}

export function DataCollectionView({
    collectionName,
    title,
    description,
    columns,
    data,
    loading = false,
    error = null,
    onAdd,
    onEdit,
    onDelete,
    onRowClick,
    emptyMessage = 'No items found',
    addButtonLabel = 'Add New',
    gridRender,
    listRender,
    searchable = true,
    searchPlaceholder = 'Search...',
    // New Props Destructuring
    canCreate,
    canUpdate,
    canDelete,
    schema,
    isModalOpen,
    onCloseModal,
    onSave,
    editingItem,
    isSubmitting
}: DataCollectionViewProps) {
    const { currentApp } = useApp()
    const [viewMode, setViewMode] = useState<ViewMode>('table')
    const [searchQuery, setSearchQuery] = useState('')
    const [loadingPreference, setLoadingPreference] = useState(true)

    // Generate storage key based on collection and app
    const preferenceKey = `collection_view_${collectionName}_${currentApp?.id || 'default'}`

    // Load user preference from backend
    useEffect(() => {
        loadViewPreference()
    }, [currentApp?.id, collectionName])

    const loadViewPreference = async () => {
        setLoadingPreference(true)
        try {
            // Try to get from backend first
            const res = await adminService.getViewPreference(preferenceKey)
            if (res?.value) {
                setViewMode(res.value as ViewMode)
            }
        } catch {
            // Fallback to localStorage
            const stored = localStorage.getItem(preferenceKey)
            if (stored && ['table', 'list', 'grid'].includes(stored)) {
                setViewMode(stored as ViewMode)
            }
        } finally {
            setLoadingPreference(false)
        }
    }

    const saveViewPreference = async (mode: ViewMode) => {
        setViewMode(mode)
        // Save to localStorage immediately for responsiveness
        localStorage.setItem(preferenceKey, mode)
        
        // Save to backend for persistence across devices
        try {
            await adminService.saveViewPreference(preferenceKey, mode)
        } catch (err) {
            console.log('Failed to save preference to backend, using localStorage')
        }
    }

    // Get cell value from accessor
    const getCellValue = useCallback((item: any, accessor: string | ((item: any) => any)) => {
        if (typeof accessor === 'function') {
            return accessor(item)
        }
        return accessor.split('.').reduce((obj, key) => obj?.[key], item)
    }, [])



    // Filter data based on search
    const filteredData = searchQuery
        ? data.filter(item => {
            const searchLower = searchQuery.toLowerCase()
            return columns.some(col => {
                const value = getCellValue(item, col.accessor)
                return String(value || '').toLowerCase().includes(searchLower)
            })
        })
        : data

    // Render loading state
    if (loading || loadingPreference) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    // Render error state
    if (error) {
        return (
            <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <p className="text-red-600 font-medium">Error: {error}</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                    {description && <p className="text-gray-500 mt-1">{description}</p>}
                </div>
                <div className="flex items-center gap-3">
                    {/* Mobile Guide */}
                    {schema && (
                        <MobileGuide 
                            title={`${title} Integration`}
                            idLabel="Collection ID"
                            idValue={collectionName}
                            usageExample={generateMobileUsage(collectionName, title, schema)}
                            devNote="Use the useCollection hook to fetch data from this collection."
                            buttonLabel="Dev Guide"
                            buttonVariant="labeled"
                        />
                    )}

                    {/* View Mode Toggle */}
                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                        {(['table', 'list', 'grid'] as ViewMode[]).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => saveViewPreference(mode)}
                                className={`p-2 rounded-md transition-all ${
                                    viewMode === mode
                                        ? 'bg-white shadow-sm text-blue-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                                title={`${mode.charAt(0).toUpperCase() + mode.slice(1)} View`}
                            >
                                {ViewIcons[mode]}
                            </button>
                        ))}
                    </div>
                    
                    {/* Add Button */}
                    {onAdd && (
                        <Button variant="primary" onClick={onAdd} className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            {addButtonLabel}
                        </Button>
                    )}
                </div>
            </div>

            {/* Search Bar */}
            {searchable && (
                <div className="relative">
                    <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                </div>
            )}

            {/* Content Area */}
            {filteredData.length === 0 ? (
                <Card>
                    <CardBody className="py-16 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-50 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                        </div>
                        <p className="text-gray-500">{emptyMessage}</p>
                        {onAdd && (
                            <Button variant="secondary" onClick={onAdd} className="mt-4">
                                {addButtonLabel}
                            </Button>
                        )}
                    </CardBody>
                </Card>
            ) : viewMode === 'table' ? (
                /* Table View */
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {columns.map((col) => (
                                        <th
                                            key={col.id}
                                            className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                                            style={{ width: col.width }}
                                        >
                                            {col.label}
                                        </th>
                                    ))}
                                    {(onEdit || onDelete) && (
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredData.map((item, idx) => (
                                    <tr
                                        key={item.id || idx}
                                        className={`hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                                        onClick={() => onRowClick?.(item)}
                                    >
                                        {columns.map((col) => {
                                            const value = getCellValue(item, col.accessor)
                                            return (
                                                <td key={col.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {col.render ? col.render(value, item) : value}
                                                </td>
                                            )
                                        })}
                                        {(onEdit || onDelete) && (
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                {onEdit && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onEdit(item) }}
                                                        className="text-blue-600 hover:text-blue-800 mr-3 font-medium"
                                                    >
                                                        Edit
                                                    </button>
                                                )}
                                                {onDelete && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onDelete(item) }}
                                                        className="text-red-600 hover:text-red-800 font-medium"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            ) : viewMode === 'list' ? (
                /* List View */
                <div className="space-y-3">
                    {filteredData.map((item, idx) => (
                        <Card
                            key={item.id || idx}
                            className={`hover:shadow-md transition-all ${onRowClick ? 'cursor-pointer' : ''}`}
                            onClick={() => onRowClick?.(item)}
                        >
                            <CardBody className="p-4">
                                {listRender ? (
                                    listRender(item)
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold">
                                                {String(getCellValue(item, columns[0]?.accessor) || '?')[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {getCellValue(item, columns[0]?.accessor)}
                                                </p>
                                                {columns[1] && (
                                                    <p className="text-sm text-gray-500">
                                                        {getCellValue(item, columns[1]?.accessor)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {(onEdit || onDelete) && (
                                            <div className="flex items-center gap-2">
                                                {onEdit && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onEdit(item) }}
                                                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                )}
                                                {onDelete && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onDelete(item) }}
                                                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    ))}
                </div>
            ) : (
                /* Grid View */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredData.map((item, idx) => (
                        <Card
                            key={item.id || idx}
                            className={`hover:shadow-lg transition-all ${onRowClick ? 'cursor-pointer' : ''}`}
                            onClick={() => onRowClick?.(item)}
                        >
                            <CardBody className="p-4">
                                {gridRender ? (
                                    gridRender(item)
                                ) : (
                                    <div className="text-center">
                                        <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                            {String(getCellValue(item, columns[0]?.accessor) || '?')[0].toUpperCase()}
                                        </div>
                                        <p className="font-semibold text-gray-900 truncate">
                                            {getCellValue(item, columns[0]?.accessor)}
                                        </p>
                                        {columns[1] && (
                                            <p className="text-sm text-gray-500 truncate mt-1">
                                                {getCellValue(item, columns[1]?.accessor)}
                                            </p>
                                        )}
                                        {(onEdit || onDelete) && (
                                            <div className="flex justify-center gap-2 mt-4 pt-3 border-t border-gray-100">
                                                {onEdit && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onEdit(item) }}
                                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                                    >
                                                        Edit
                                                    </button>
                                                )}
                                                {onDelete && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onDelete(item) }}
                                                        className="text-xs text-red-600 hover:text-red-800 font-medium"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}

            {/* Results count */}
            <div className="text-sm text-gray-500 text-center">
                Showing {filteredData.length} of {data.length} items
            </div>
            {/* Generic Add/Edit Modal */}
            {isModalOpen && onCloseModal && onSave && schema && (
                <Modal
                    isOpen={isModalOpen}
                    onClose={onCloseModal}
                    title={editingItem ? `Edit ${title?.slice(0, -1)}` : `Add ${title?.slice(0, -1)}`}
                >
                    <GenericForm
                        schema={schema}
                        initialData={editingItem}
                        onSubmit={onSave}
                        onCancel={onCloseModal}
                        isSubmitting={isSubmitting}
                    />
                </Modal>
            )}
        </div>
    )
}

// Helper Generic Form Component
function GenericForm({ 
    schema, 
    initialData, 
    onSubmit, 
    onCancel, 
    isSubmitting 
}: { 
    schema: SchemaField[] 
    initialData?: any 
    onSubmit: (data: any) => void 
    onCancel: () => void 
    isSubmitting?: boolean 
}) {
    const [formData, setFormData] = useState<any>(initialData || {})

    const handleChange = (key: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [key]: value }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(formData)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {schema.map((field) => (
                <div key={field.key}>
                    {field.type === 'select' ? (
                        <Select
                            label={field.label}
                            value={formData[field.key] || field.defaultValue || ''}
                            onChange={(e) => handleChange(field.key, e.target.value)}
                            options={field.options || []}
                            required={field.required}
                        />
                    ) : field.type === 'boolean' ? (
                        <div className="flex items-center gap-3 py-2">
                            <input
                                id={`field-${field.key}`}
                                type="checkbox"
                                checked={!!(formData[field.key] ?? field.defaultValue)}
                                onChange={(e) => handleChange(field.key, e.target.checked)}
                                className="w-5 h-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 transition-all cursor-pointer"
                            />
                            <label 
                                htmlFor={`field-${field.key}`}
                                className="text-sm font-medium text-gray-700 cursor-pointer select-none"
                            >
                                {field.label}
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                        </div>
                    ) : field.type === 'date' ? (
                        <Input
                            label={field.label}
                            type="date"
                            value={formData[field.key] ? new Date(formData[field.key]).toISOString().split('T')[0] : ''}
                            onChange={(e) => handleChange(field.key, e.target.value)}
                            placeholder={field.placeholder}
                            required={field.required}
                        />
                    ) : field.type === 'json' ? (
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {field.label}
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            <textarea
                                value={typeof formData[field.key] === 'object' ? JSON.stringify(formData[field.key], null, 2) : (formData[field.key] || '')}
                                onChange={(e) => {
                                    const val = e.target.value
                                    try {
                                        // Try to parse as JSON if it looks like JSON
                                        if (val.trim().startsWith('{') || val.trim().startsWith('[')) {
                                            const parsed = JSON.parse(val)
                                            handleChange(field.key, parsed)
                                        } else {
                                            handleChange(field.key, val)
                                        }
                                    } catch (err) {
                                        // Keep as string if invalid JSON
                                        handleChange(field.key, val)
                                    }
                                }}
                                rows={5}
                                placeholder={field.placeholder || 'Enter JSON here...'}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xs transition-all"
                            />
                        </div>
                    ) : (
                        <Input
                            label={field.label}
                            type={field.type === 'number' ? 'number' : 'text'}
                            value={formData[field.key] || ''}
                            onChange={(e) => handleChange(field.key, field.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                            placeholder={field.placeholder}
                            required={field.required}
                        />
                    )}
                </div>
            ))}
            <div className="flex justify-end gap-3 pt-4">
                <Button variant="secondary" onClick={onCancel} type="button">
                    Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <div className="flex items-center gap-2">
                            <LoadingSpinner size="sm" /> Saving...
                        </div>
                    ) : (
                        initialData ? 'Update' : 'Create'
                    )}
                </Button>
            </div>
        </form>
    );
}
