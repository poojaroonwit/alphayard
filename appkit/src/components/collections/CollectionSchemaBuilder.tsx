'use client'

import React, { useState, useCallback } from 'react'
import { Card, CardBody, CardHeader } from '../ui/Card'
import { Button } from '../ui/Button'
import { MobileGuide } from '../ui/MobileGuide'
import { useApp } from '../../contexts/AppContext'
import { generateMobileUsage } from '../../utils/collectionUtils'

// Field types available for collection schema - aligned with SchemaFieldType
const FIELD_TYPES = [
    // Basic text types
    { value: 'text', label: 'Text', icon: '📝', description: 'Short text input' },
    { value: 'textarea', label: 'Text Area', icon: '📄', description: 'Multi-line text' },
    { value: 'rich-text', label: 'Rich Text', icon: '📰', description: 'HTML rich text editor' },
    { value: 'markdown', label: 'Markdown', icon: '📑', description: 'Markdown editor' },
    
    // Number types
    { value: 'number', label: 'Number', icon: '🔢', description: 'Numeric input' },
    { value: 'slider', label: 'Slider', icon: '📊', description: 'Range slider' },
    { value: 'rating', label: 'Rating', icon: '⭐', description: 'Star rating' },
    
    // Boolean
    { value: 'boolean', label: 'Boolean', icon: '✓', description: 'Toggle switch' },
    
    // Date/Time types
    { value: 'date', label: 'Date', icon: '📅', description: 'Date picker' },
    { value: 'datetime', label: 'Date & Time', icon: '🕐', description: 'Date and time picker' },
    { value: 'time', label: 'Time', icon: '⏰', description: 'Time only picker' },
    
    // Selection types
    { value: 'select', label: 'Select', icon: '📋', description: 'Single select dropdown' },
    { value: 'multiselect', label: 'Multi-Select', icon: '☑️', description: 'Multiple selection' },
    { value: 'tags', label: 'Tags', icon: '🏷️', description: 'Tag input' },
    
    // Contact types
    { value: 'email', label: 'Email', icon: '📧', description: 'Email address' },
    { value: 'phone', label: 'Phone', icon: '📱', description: 'Phone number' },
    { value: 'url', label: 'URL', icon: '🔗', description: 'Web URL' },
    
    // Media types
    { value: 'image', label: 'Image', icon: '🖼️', description: 'Image upload' },
    { value: 'file', label: 'File', icon: '📎', description: 'File upload' },
    
    // Other types
    { value: 'color', label: 'Color', icon: '🎨', description: 'Color picker' },
    { value: 'password', label: 'Password', icon: '🔒', description: 'Password field' },
    { value: 'reference', label: 'Reference', icon: '🔗', description: 'Link to another entity' },
    { value: 'json', label: 'JSON', icon: '{ }', description: 'JSON data' },
] as const

// Icon options for collections
const ICON_OPTIONS = [
    { value: 'collection', label: 'Collection' },
    { value: 'users', label: 'Users' },
    { value: 'home', label: 'Home' },
    { value: 'message-square', label: 'Message' },
    { value: 'file-text', label: 'Document' },
    { value: 'check-square', label: 'Checkbox' },
    { value: 'calendar', label: 'Calendar' },
    { value: 'star', label: 'Star' },
    { value: 'heart', label: 'Heart' },
    { value: 'folder', label: 'Folder' },
    { value: 'tag', label: 'Tag' },
    { value: 'bell', label: 'Bell' },
]

export interface FieldDefinition {
    id: string
    name: string
    label: string
    type: typeof FIELD_TYPES[number]['value']
    required: boolean
    placeholder?: string
    defaultValue?: any
    options?: { value: string; label: string }[]
    referenceType?: string
    referenceDisplayField?: string
    hidden?: boolean
    readonly?: boolean
    helpText?: string
    rows?: number          // For textarea
    accept?: string        // For file/image upload
    min?: number           // For number, slider, rating
    max?: number           // For number, slider, rating
    step?: number          // For number, slider
    validation?: {
        min?: number
        max?: number
        pattern?: string
        message?: string
    }
}

export interface CollectionSchemaData {
    name: string
    displayName: string
    description: string
    icon: string
    category?: string
    fields: FieldDefinition[]
}

interface CollectionSchemaBuilderProps {
    initialData?: CollectionSchemaData
    onSave: (data: CollectionSchemaData) => Promise<void>
    onCancel: () => void
    isEditing?: boolean
}

const CATEGORY_OPTIONS = ['System', 'Social', 'Settings', 'Custom', 'Common'];

export function CollectionSchemaBuilder({
    initialData,
    onSave,
    onCancel,
    isEditing = false
}: CollectionSchemaBuilderProps) {
    const { currentApp } = useApp()
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    
    // Form state
    const [name, setName] = useState(initialData?.name || '')
    const [displayName, setDisplayName] = useState(initialData?.displayName || '')
    const [description, setDescription] = useState(initialData?.description || '')
    const [icon, setIcon] = useState(initialData?.icon || 'collection')
    const [category, setCategory] = useState(initialData?.category || 'Custom')
    const [fields, setFields] = useState<FieldDefinition[]>(initialData?.fields || [])
    
    // Field editor state
    const [editingFieldId, setEditingFieldId] = useState<string | null>(null)

    // Generate a unique ID for new fields
    const generateFieldId = () => `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Auto-generate name from display name
    const handleDisplayNameChange = (value: string) => {
        setDisplayName(value)
        if (!isEditing && !name) {
            // Auto-generate snake_case name
            const autoName = value
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '_')
                .replace(/^_+|_+$/g, '')
            setName(autoName)
        }
    }

    // Add a new field
    const addField = () => {
        const newField: FieldDefinition = {
            id: generateFieldId(),
            name: '',
            label: '',
            type: 'text',
            required: false
        }
        setFields([...fields, newField])
        setEditingFieldId(newField.id)
    }

    // Update a field
    const updateField = (id: string, updates: Partial<FieldDefinition>) => {
        setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f))
    }

    // Auto-generate field name from label
    const handleFieldLabelChange = (id: string, label: string) => {
        const field = fields.find(f => f.id === id)
        const autoName = label
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
        updateField(id, { label, name: field?.name || autoName })
    }

    // Remove a field
    const removeField = (id: string) => {
        setFields(fields.filter(f => f.id !== id))
        if (editingFieldId === id) {
            setEditingFieldId(null)
        }
    }

    // Move field up/down
    const moveField = (id: string, direction: 'up' | 'down') => {
        const index = fields.findIndex(f => f.id === id)
        if (direction === 'up' && index > 0) {
            const newFields = [...fields]
            ;[newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]]
            setFields(newFields)
        } else if (direction === 'down' && index < fields.length - 1) {
            const newFields = [...fields]
            ;[newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]]
            setFields(newFields)
        }
    }

    // Add option for select/multiselect fields
    const addOption = (fieldId: string) => {
        const field = fields.find(f => f.id === fieldId)
        if (field) {
            const options = field.options || []
            updateField(fieldId, {
                options: [...options, { value: '', label: '' }]
            })
        }
    }

    // Update option
    const updateOption = (fieldId: string, optionIndex: number, updates: { value?: string; label?: string }) => {
        const field = fields.find(f => f.id === fieldId)
        if (field && field.options) {
            const newOptions = [...field.options]
            newOptions[optionIndex] = { ...newOptions[optionIndex], ...updates }
            updateField(fieldId, { options: newOptions })
        }
    }

    // Remove option
    const removeOption = (fieldId: string, optionIndex: number) => {
        const field = fields.find(f => f.id === fieldId)
        if (field && field.options) {
            updateField(fieldId, {
                options: field.options.filter((_, i) => i !== optionIndex)
            })
        }
    }

    // Validate and save
    const handleSave = async () => {
        setError(null)

        // Validate
        if (!name.trim()) {
            setError('Collection name is required')
            return
        }
        if (!/^[a-z][a-z0-9_]*$/.test(name)) {
            setError('Name must be lowercase, start with a letter, and contain only letters, numbers, and underscores')
            return
        }
        if (!displayName.trim()) {
            setError('Display name is required')
            return
        }
        
        // Validate fields
        for (const field of fields) {
            if (!field.name.trim()) {
                setError(`Field name is required for all fields`)
                return
            }
            if (!field.label.trim()) {
                setError(`Field label is required for all fields`)
                return
            }
            if (!/^[a-z][a-z0-9_]*$/.test(field.name)) {
                setError(`Field "${field.label}" has invalid name format`)
                return
            }
        }

        // Check for duplicate field names
        const fieldNames = fields.map(f => f.name)
        const duplicates = fieldNames.filter((n, i) => fieldNames.indexOf(n) !== i)
        if (duplicates.length > 0) {
            setError(`Duplicate field names: ${duplicates.join(', ')}`)
            return
        }

        setSaving(true)
        try {
            await onSave({
                name,
                displayName,
                description,
                icon,
                category,
                fields
            })
        } catch (err: any) {
            setError(err.message || 'Failed to save collection')
        } finally {
            setSaving(false)
        }
    }
    


    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isEditing ? 'Edit Collection' : 'Create New Collection'}
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Define the schema for your collection to use in the mobile app
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <MobileGuide 
                        title={`${displayName || 'Collection'} Integration`}
                        idLabel="Collection ID"
                        idValue={name || 'collection_name'}
                            usageExample={generateMobileUsage(name || 'collection', displayName, fields as any)}
                        devNote="Use the useCollection hook to fetch data from this collection. Ensure you have defined the interface matching your fields."
                        buttonLabel="Dev Guide"
                        buttonVariant="labeled"
                        className="mr-2"
                    />
                    <Button variant="secondary" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : (isEditing ? 'Update Collection' : 'Create Collection')}
                    </Button>
                </div>
            </div>

            {/* Error message */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Basic Info */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
                        </CardHeader>
                        <CardBody className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Display Name *
                                </label>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => handleDisplayNameChange(e.target.value)}
                                    placeholder="e.g., Announcements"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    System Name *
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                    placeholder="e.g., announcements"
                                    disabled={isEditing}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 font-mono text-sm"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Lowercase, letters, numbers, and underscores only
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Category
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        list="category-suggestions"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        placeholder="Select or type category..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <datalist id="category-suggestions">
                                        {CATEGORY_OPTIONS.map(opt => (
                                            <option key={opt} value={opt} />
                                        ))}
                                    </datalist>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Group this collection for easier management
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe what this collection is for..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Icon
                                </label>
                                <select
                                    value={icon}
                                    onChange={(e) => setIcon(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    {ICON_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Preview */}
                    <Card>
                        <CardHeader>
                            <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
                        </CardHeader>
                        <CardBody>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-gray-900">{displayName || 'Collection Name'}</p>
                                            {category && (
                                                <span className="text-[10px] uppercase font-bold text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
                                                    {category}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500">{fields.length} field{fields.length !== 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                                {description && (
                                    <p className="text-sm text-gray-600">{description}</p>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Fields */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">Fields</h2>
                                <Button variant="secondary" onClick={addField} className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add Field
                                </Button>
                            </div>
                        </CardHeader>
                        <CardBody>
                            {fields.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-500 mb-4">No fields defined yet</p>
                                    <Button variant="primary" onClick={addField}>
                                        Add Your First Field
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {fields.map((field, index) => (
                                        <div
                                            key={field.id}
                                            className={`border rounded-lg transition-all ${
                                                editingFieldId === field.id
                                                    ? 'border-blue-500 bg-blue-50/30'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            {/* Field header */}
                                            <div
                                                className="flex items-center gap-3 p-4 cursor-pointer"
                                                onClick={() => setEditingFieldId(editingFieldId === field.id ? null : field.id)}
                                            >
                                                <div className="flex flex-col gap-1">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); moveField(field.id, 'up') }}
                                                        disabled={index === 0}
                                                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); moveField(field.id, 'down') }}
                                                        disabled={index === fields.length - 1}
                                                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                
                                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
                                                    {FIELD_TYPES.find(t => t.value === field.type)?.icon || '📝'}
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 truncate">
                                                        {field.label || 'Untitled Field'}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {field.name || 'no_name'} • {FIELD_TYPES.find(t => t.value === field.type)?.label}
                                                        {field.required && <span className="text-red-500 ml-1">*</span>}
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={(e) => { e.stopPropagation(); removeField(field.id) }}
                                                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>

                                                <svg
                                                    className={`w-5 h-5 text-gray-400 transition-transform ${editingFieldId === field.id ? 'rotate-180' : ''}`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>

                                            {/* Field editor */}
                                            {editingFieldId === field.id && (
                                                <div className="px-4 pb-4 pt-0 border-t border-gray-200 bg-white">
                                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Field Label *
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={field.label}
                                                                onChange={(e) => handleFieldLabelChange(field.id, e.target.value)}
                                                                placeholder="e.g., Title"
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Field Name *
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={field.name}
                                                                onChange={(e) => updateField(field.id, { name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                                                                placeholder="e.g., title"
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Field Type
                                                            </label>
                                                            <select
                                                                value={field.type}
                                                                onChange={(e) => updateField(field.id, { type: e.target.value as any })}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            >
                                                                {FIELD_TYPES.map(t => (
                                                                    <option key={t.value} value={t.value}>
                                                                        {t.icon} {t.label}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Placeholder
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={field.placeholder || ''}
                                                                onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                                                                placeholder="Enter placeholder text..."
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 mt-4">
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={field.required}
                                                                onChange={(e) => updateField(field.id, { required: e.target.checked })}
                                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                            />
                                                            <span className="text-sm text-gray-700">Required field</span>
                                                        </label>
                                                    </div>

                                                    {/* Options for select/multiselect */}
                                                    {(field.type === 'select' || field.type === 'multiselect') && (
                                                        <div className="mt-4">
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Options
                                                            </label>
                                                            <div className="space-y-2">
                                                                {(field.options || []).map((opt, optIndex) => (
                                                                    <div key={optIndex} className="flex items-center gap-2">
                                                                        <input
                                                                            type="text"
                                                                            value={opt.value}
                                                                            onChange={(e) => updateOption(field.id, optIndex, { value: e.target.value, label: opt.label || e.target.value })}
                                                                            placeholder="Value"
                                                                            className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                                                                        />
                                                                        <input
                                                                            type="text"
                                                                            value={opt.label}
                                                                            onChange={(e) => updateOption(field.id, optIndex, { label: e.target.value })}
                                                                            placeholder="Label"
                                                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                                        />
                                                                        <button
                                                                            onClick={() => removeOption(field.id, optIndex)}
                                                                            className="p-2 text-gray-400 hover:text-red-600"
                                                                        >
                                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                            </svg>
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                                <button
                                                                    onClick={() => addOption(field.id)}
                                                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                                                >
                                                                    + Add Option
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    )
}
