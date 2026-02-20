'use client'


import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardBody } from '../ui/Card'
import { Button } from '../ui/Button'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { ToggleSwitch } from '../ui/ToggleSwitch'
import { Rating } from '../ui/Rating'
import { Slider } from '../ui/Slider'
import { ChipField } from '../ui/ChipField'
import { useApp } from '../../contexts/AppContext'
import { adminService } from '../../services/adminService'
import { generateMobileUsage } from '../../utils/collectionUtils'
import { SchemaField, ColumnDefinition, DynamicCollection, SchemaFieldType } from '../../types/collection'
import { Upload, X, Image as ImageIcon, FileText, Eye, EyeOff } from 'lucide-react'
import { clsx } from 'clsx'

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
                                                        title="Edit item"
                                                        aria-label="Edit item"
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
                                                        title="Delete item"
                                                        aria-label="Delete item"
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

// Image/File Upload Component for form fields
function ImageUploadField({
    value,
    onChange,
    label,
    required,
    accept = 'image/*',
    helpText
}: {
    value: string
    onChange: (url: string) => void
    label: string
    required?: boolean
    accept?: string
    helpText?: string
}) {
    const [uploading, setUploading] = useState(false)
    const [preview, setPreview] = useState<string>(value || '')
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        setPreview(value || '')
    }, [value])

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const res = await adminService.uploadFile(file)
            const imageUrl = res?.url
            
            if (imageUrl) {
                let finalUrl = imageUrl
                if (!imageUrl.startsWith('http')) {
                    const fileId = imageUrl
                    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
                    finalUrl = `${apiBase}/api/v1/storage/proxy/${fileId}`
                }
                setPreview(finalUrl)
                onChange(finalUrl)
            }
        } catch (err) {
            console.error('Upload failed', err)
        } finally {
            setUploading(false)
        }
    }

    const handleClear = () => {
        setPreview('')
        onChange('')
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleFileChange}
                className="hidden"
                aria-label={`Upload ${label}`}
            />
            
            <div className="flex items-start gap-4">
                {/* Preview */}
                <div 
                    className={`relative w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors overflow-hidden ${
                        uploading ? 'opacity-50' : ''
                    } ${preview ? 'border-solid border-gray-300' : 'border-gray-300 bg-gray-50'}`}
                    onClick={() => !uploading && fileInputRef.current?.click()}
                >
                    {uploading ? (
                        <LoadingSpinner size="sm" />
                    ) : preview ? (
                        <>
                            {accept.includes('image') ? (
                                <img 
                                    src={preview} 
                                    alt="Preview" 
                                    className="w-full h-full object-cover"
                                    onError={() => setPreview('')}
                                />
                            ) : (
                                <FileText className="w-8 h-8 text-gray-400" />
                            )}
                        </>
                    ) : (
                        <div className="text-center p-2">
                            <Upload className="w-6 h-6 mx-auto text-gray-400" />
                            <span className="text-xs text-gray-500 mt-1">Upload</span>
                        </div>
                    )}
                </div>
                
                {/* Actions */}
                <div className="flex flex-col gap-2">
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        type="button"
                    >
                        {preview ? 'Change' : 'Upload'}
                    </Button>
                    {preview && (
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={handleClear}
                            type="button"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>
            
            {/* URL Input */}
            <Input
                type="text"
                value={value || ''}
                onChange={(e) => {
                    setPreview(e.target.value)
                    onChange(e.target.value)
                }}
                placeholder="Or paste URL..."
                className="text-sm"
            />
            
            {helpText && <p className="text-xs text-gray-500">{helpText}</p>}
        </div>
    )
}

// Multi-select component using checkboxes
function MultiSelectField({
    value,
    onChange,
    options,
    label,
    required,
    helpText
}: {
    value: any[]
    onChange: (values: any[]) => void
    options: { label: string; value: any }[]
    label: string
    required?: boolean
    helpText?: string
}) {
    const currentValues = Array.isArray(value) ? value : []

    const toggleValue = (optionValue: any) => {
        if (currentValues.includes(optionValue)) {
            onChange(currentValues.filter(v => v !== optionValue))
        } else {
            onChange([...currentValues, optionValue])
        }
    }

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="flex flex-wrap gap-2 p-3 border border-gray-300 rounded-lg bg-gray-50 max-h-40 overflow-y-auto">
                {options.map((option) => (
                    <label 
                        key={option.value} 
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-colors ${
                            currentValues.includes(option.value)
                                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-200'
                        }`}
                    >
                        <input
                            type="checkbox"
                            checked={currentValues.includes(option.value)}
                            onChange={() => toggleValue(option.value)}
                            className="hidden"
                        />
                        <span className="text-sm">{option.label}</span>
                        {currentValues.includes(option.value) && (
                            <X className="w-3 h-3" />
                        )}
                    </label>
                ))}
            </div>
            {helpText && <p className="text-xs text-gray-500">{helpText}</p>}
        </div>
    )
}

// Helper Generic Form Component - Enhanced with all field types
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
    const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({})

    // Also include any extra fields from initialData that are not in schema
    const extraFields = initialData 
        ? Object.keys(initialData).filter(key => 
            !schema.find(f => f.key === key) && 
            key !== 'id' && 
            key !== 'created_at' && 
            key !== 'updated_at' &&
            key !== 'createdAt' &&
            key !== 'updatedAt'
        )
        : []

    const handleChange = (key: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [key]: value }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(formData)
    }

    // Helper to format date value for input
    const formatDateValue = (value: any): string => {
        if (!value) return ''
        try {
            return new Date(value).toISOString().split('T')[0]
        } catch {
            return ''
        }
    }

    // Helper to format datetime value for input
    const formatDateTimeValue = (value: any): string => {
        if (!value) return ''
        try {
            const date = new Date(value)
            return date.toISOString().slice(0, 16) // Format: YYYY-MM-DDTHH:mm
        } catch {
            return ''
        }
    }

    // Helper to format time value for input
    const formatTimeValue = (value: any): string => {
        if (!value) return ''
        try {
            if (typeof value === 'string' && value.match(/^\d{2}:\d{2}/)) {
                return value.slice(0, 5)
            }
            const date = new Date(value)
            return date.toTimeString().slice(0, 5) // Format: HH:mm
        } catch {
            return ''
        }
    }

    // Infer field type from value
    const inferFieldType = (key: string, value: any): SchemaFieldType => {
        if (value === null || value === undefined) return 'text'
        if (typeof value === 'boolean') return 'boolean'
        if (typeof value === 'number') return 'number'
        if (Array.isArray(value)) return 'tags'
        if (typeof value === 'object') return 'json'
        if (typeof value === 'string') {
            if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)) return 'datetime'
            if (value.match(/^\d{4}-\d{2}-\d{2}$/)) return 'date'
            if (value.match(/^\d{2}:\d{2}/)) return 'time'
            if (value.match(/^https?:\/\//)) {
                if (value.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return 'image'
                return 'url'
            }
            if (value.includes('@') && value.includes('.')) return 'email'
            if (value.length > 200) return 'textarea'
        }
        return 'text'
    }

    // Render a single field based on its type
    const renderField = (field: SchemaField) => {
        // Skip hidden fields
        if (field.hidden) return null

        const value = formData[field.key]
        const isReadonly = field.readonly

        switch (field.type) {
            case 'select':
                return (
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <select
                            value={value || field.defaultValue || ''}
                            onChange={(e) => handleChange(field.key, e.target.value)}
                            disabled={isReadonly}
                            className={clsx(
                                "w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all",
                                isReadonly && "bg-gray-50 text-gray-400 cursor-not-allowed"
                            )}
                            title={`Select ${field.label.toLowerCase()}`}
                        >
                            <option value="">Select {field.label}...</option>
                            {(field.options || []).map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                )

            case 'multiselect':
                return (
                    <MultiSelectField
                        value={value || []}
                        onChange={(values) => handleChange(field.key, values)}
                        options={field.options || []}
                        label={field.label}
                        required={field.required}
                        helpText={field.helpText}
                    />
                )

            case 'boolean':
                return (
                    <div className="py-2">
                        <ToggleSwitch
                            checked={!!(value ?? field.defaultValue)}
                            onChange={(checked) => handleChange(field.key, checked)}
                            label={field.label}
                            description={field.helpText}
                            disabled={isReadonly}
                        />
                        {field.required && <span className="text-red-500 ml-1 text-xs">*</span>}
                    </div>
                )

            case 'date':
                return (
                    <Input
                        label={field.label}
                        type="date"
                        value={formatDateValue(value)}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                        disabled={isReadonly}
                    />
                )

            case 'datetime':
                return (
                    <Input
                        label={field.label}
                        type="datetime-local"
                        value={formatDateTimeValue(value)}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                        disabled={isReadonly}
                    />
                )

            case 'time':
                return (
                    <Input
                        label={field.label}
                        type="time"
                        value={formatTimeValue(value)}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                        disabled={isReadonly}
                    />
                )

            case 'textarea':
            case 'rich-text':
            case 'markdown':
                return (
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <textarea
                            value={value || ''}
                            onChange={(e) => handleChange(field.key, e.target.value)}
                            rows={field.rows || 4}
                            placeholder={field.placeholder}
                            required={field.required}
                            disabled={isReadonly}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-y"
                        />
                        {field.helpText && <p className="text-xs text-gray-500">{field.helpText}</p>}
                    </div>
                )

            case 'json':
                return (
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <textarea
                            value={typeof value === 'object' ? JSON.stringify(value, null, 2) : (value || '')}
                            onChange={(e) => {
                                const val = e.target.value
                                try {
                                    if (val.trim().startsWith('{') || val.trim().startsWith('[')) {
                                        const parsed = JSON.parse(val)
                                        handleChange(field.key, parsed)
                                    } else {
                                        handleChange(field.key, val)
                                    }
                                } catch {
                                    handleChange(field.key, val)
                                }
                            }}
                            rows={field.rows || 5}
                            placeholder={field.placeholder || 'Enter JSON here...'}
                            disabled={isReadonly}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xs transition-all"
                        />
                        {field.helpText && <p className="text-xs text-gray-500">{field.helpText}</p>}
                    </div>
                )

            case 'image':
                return (
                    <ImageUploadField
                        value={value || ''}
                        onChange={(url) => handleChange(field.key, url)}
                        label={field.label}
                        required={field.required}
                        accept={field.accept || 'image/*'}
                        helpText={field.helpText}
                    />
                )

            case 'file':
                return (
                    <ImageUploadField
                        value={value || ''}
                        onChange={(url) => handleChange(field.key, url)}
                        label={field.label}
                        required={field.required}
                        accept={field.accept || '*/*'}
                        helpText={field.helpText}
                    />
                )

            case 'color':
                return (
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={value || '#000000'}
                                onChange={(e) => handleChange(field.key, e.target.value)}
                                disabled={isReadonly}
                                className="w-12 h-10 p-1 border border-gray-300 rounded-lg cursor-pointer"
                                title={`Select color for ${field.label}`}
                                aria-label={`Select color for ${field.label}`}
                            />
                            <Input
                                type="text"
                                value={value || ''}
                                onChange={(e) => handleChange(field.key, e.target.value)}
                                placeholder="#000000"
                                disabled={isReadonly}
                                className="flex-1"
                            />
                        </div>
                        {field.helpText && <p className="text-xs text-gray-500">{field.helpText}</p>}
                    </div>
                )

            case 'email':
                return (
                    <Input
                        label={field.label}
                        type="email"
                        value={value || ''}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        placeholder={field.placeholder || 'email@example.com'}
                        required={field.required}
                        disabled={isReadonly}
                    />
                )

            case 'url':
                return (
                    <Input
                        label={field.label}
                        type="url"
                        value={value || ''}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        placeholder={field.placeholder || 'https://'}
                        required={field.required}
                        disabled={isReadonly}
                    />
                )

            case 'phone':
                return (
                    <Input
                        label={field.label}
                        type="tel"
                        value={value || ''}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        placeholder={field.placeholder || '+1 (555) 000-0000'}
                        required={field.required}
                        disabled={isReadonly}
                    />
                )

            case 'password':
                return (
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword[field.key] ? 'text' : 'password'}
                                value={value || ''}
                                onChange={(e) => handleChange(field.key, e.target.value)}
                                placeholder={field.placeholder}
                                required={field.required}
                                disabled={isReadonly}
                                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(prev => ({ ...prev, [field.key]: !prev[field.key] }))}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {field.helpText && <p className="text-xs text-gray-500">{field.helpText}</p>}
                    </div>
                )

            case 'rating':
                return (
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <Rating
                            value={value || 0}
                            max={field.max || 5}
                            onChange={(v) => handleChange(field.key, v)}
                            readOnly={isReadonly}
                        />
                        {field.helpText && <p className="text-xs text-gray-500">{field.helpText}</p>}
                    </div>
                )

            case 'slider':
                return (
                    <Slider
                        value={value || field.min || 0}
                        min={field.min || 0}
                        max={field.max || 100}
                        step={field.step || 1}
                        onChange={(v) => handleChange(field.key, v)}
                        label={field.label}
                    />
                )

            case 'tags':
                return (
                    <ChipField
                        label={field.label}
                        chips={Array.isArray(value) ? value : []}
                        onChange={(chips) => handleChange(field.key, chips)}
                        placeholder={field.placeholder || 'Add tag...'}
                    />
                )

            case 'reference':
                // For now, render as text input - can be enhanced with entity lookup later
                return (
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                            {field.referenceType && (
                                <span className="text-xs text-gray-400 ml-2">
                                    (Reference to {field.referenceType})
                                </span>
                            )}
                        </label>
                        <Input
                            type="text"
                            value={value || ''}
                            onChange={(e) => handleChange(field.key, e.target.value)}
                            placeholder={field.placeholder || 'Enter ID...'}
                            required={field.required}
                            disabled={isReadonly}
                        />
                        {field.helpText && <p className="text-xs text-gray-500">{field.helpText}</p>}
                    </div>
                )

            case 'number':
                return (
                    <Input
                        label={field.label}
                        type="number"
                        value={value ?? ''}
                        onChange={(e) => handleChange(field.key, e.target.value ? parseFloat(e.target.value) : null)}
                        placeholder={field.placeholder}
                        required={field.required}
                        disabled={isReadonly}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                    />
                )

            case 'text':
            default:
                return (
                    <Input
                        label={field.label}
                        type="text"
                        value={value || ''}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                        disabled={isReadonly}
                    />
                )
        }
    }

    // Render extra fields that are not in schema (auto-detect type)
    const renderExtraField = (key: string) => {
        const value = formData[key]
        const inferredType = inferFieldType(key, value)
        const label = key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()
            .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

        const field: SchemaField = {
            key,
            label,
            type: inferredType
        }

        return renderField(field)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {/* Schema-defined fields */}
            {schema.map((field) => (
                <div key={field.key}>
                    {renderField(field)}
                </div>
            ))}

            {/* Extra fields from data (not in schema) */}
            {extraFields.length > 0 && (
                <>
                    <div className="border-t border-gray-200 pt-4 mt-4">
                        <h4 className="text-sm font-medium text-gray-500 mb-3">Additional Fields</h4>
                    </div>
                    {extraFields.map((key) => (
                        <div key={key}>
                            {renderExtraField(key)}
                        </div>
                    ))}
                </>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 sticky bottom-0 bg-white py-3">
                <Button variant="secondary" onClick={onCancel} type="button">
                    Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <div className="flex items-center gap-2">
                            <LoadingSpinner size="sm" /> Saving...
                        </div>
                    ) : (
                        initialData?.id ? 'Update' : 'Create'
                    )}
                </Button>
            </div>
        </form>
    );
}


