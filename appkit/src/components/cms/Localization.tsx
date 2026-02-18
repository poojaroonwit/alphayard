'use client'

import { useState, useEffect } from 'react'
import { cmsService } from '../../services/cmsService'

interface LocalizationItem {
  id: string
  key: string
  value: string
  language: string
  category: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface Language {
  code: string
  name: string
  flag: string
  isDefault: boolean
}

interface Category {
  id: string
  name: string
  description: string
  color: string
}

interface PaginationState {
  currentPage: number
  itemsPerPage: number
  totalItems: number
  totalPages: number
}

interface SortState {
  column: string
  direction: 'asc' | 'desc'
}

// Fallback data functions
const getFallbackLanguages = () => [
  { id: 'en', code: 'en', name: 'English', native_name: 'English', direction: 'ltr', is_active: true, is_default: true, flag_emoji: '🇺🇸' },
  { id: 'es', code: 'es', name: 'Spanish', native_name: 'Español', direction: 'ltr', is_active: true, is_default: false, flag_emoji: '🇪🇸' },
  { id: 'fr', code: 'fr', name: 'French', native_name: 'Français', direction: 'ltr', is_active: true, is_default: false, flag_emoji: '🇫🇷' },
  { id: 'de', code: 'de', name: 'German', native_name: 'Deutsch', direction: 'ltr', is_active: true, is_default: false, flag_emoji: '🇩🇪' },
  { id: 'it', code: 'it', name: 'Italian', native_name: 'Italiano', direction: 'ltr', is_active: true, is_default: false, flag_emoji: '🇮🇹' },
  { id: 'pt', code: 'pt', name: 'Portuguese', native_name: 'Português', direction: 'ltr', is_active: true, is_default: false, flag_emoji: '🇵🇹' },
  { id: 'ru', code: 'ru', name: 'Russian', native_name: 'Русский', direction: 'ltr', is_active: true, is_default: false, flag_emoji: '🇷🇺' },
  { id: 'zh', code: 'zh', name: 'Chinese', native_name: '中文', direction: 'ltr', is_active: true, is_default: false, flag_emoji: '🇨🇳' },
  { id: 'ja', code: 'ja', name: 'Japanese', native_name: '日本語', direction: 'ltr', is_active: true, is_default: false, flag_emoji: '🇯🇵' },
  { id: 'ko', code: 'ko', name: 'Korean', native_name: '한국어', direction: 'ltr', is_active: true, is_default: false, flag_emoji: '🇰🇷' },
  { id: 'ar', code: 'ar', name: 'Arabic', native_name: 'العربية', direction: 'rtl', is_active: true, is_default: false, flag_emoji: '🇸🇦' },
  { id: 'hi', code: 'hi', name: 'Hindi', native_name: 'हिन्दी', direction: 'ltr', is_active: true, is_default: false, flag_emoji: '🇮🇳' }
]

const getFallbackCategories = () => [
  { id: 'ui', name: 'User Interface', description: 'UI elements and labels', color: '#3B82F6' },
  { id: 'navigation', name: 'Navigation', description: 'Navigation menu items', color: '#10B981' },
  { id: 'auth', name: 'Authentication', description: 'Login and registration', color: '#F59E0B' },
  { id: 'errors', name: 'Error Messages', description: 'Error and validation messages', color: '#EF4444' },
  { id: 'success', name: 'Success Messages', description: 'Success and confirmation messages', color: '#10B981' },
  { id: 'general', name: 'General', description: 'General application text', color: '#6B7280' }
]

const getFallbackTranslationKeys = () => [
  { id: 'ui.welcome.title', key: 'ui.welcome.title', category: 'ui', description: 'Welcome screen title', context: 'mobile_app', is_active: true },
  { id: 'ui.welcome.subtitle', key: 'ui.welcome.subtitle', category: 'ui', description: 'Welcome screen subtitle', context: 'mobile_app', is_active: true },
  { id: 'ui.button.save', key: 'ui.button.save', category: 'ui', description: 'Save button text', context: 'mobile_app', is_active: true },
  { id: 'ui.button.cancel', key: 'ui.button.cancel', category: 'ui', description: 'Cancel button text', context: 'mobile_app', is_active: true },
  { id: 'nav.home', key: 'nav.home', category: 'navigation', description: 'Home', context: 'mobile_app', is_active: true },
  { id: 'nav.settings', key: 'nav.settings', category: 'navigation', description: 'Settings', context: 'mobile_app', is_active: true },
  { id: 'auth.login', key: 'auth.login', category: 'auth', description: 'Login', context: 'mobile_app', is_active: true },
  { id: 'auth.register', key: 'auth.register', category: 'auth', description: 'Register', context: 'mobile_app', is_active: true },
  { id: 'error.network.message', key: 'error.network.message', category: 'errors', description: 'Network error message', context: 'mobile_app', is_active: true },
  { id: 'success.save.message', key: 'success.save.message', category: 'success', description: 'Save success message', context: 'mobile_app', is_active: true }
]

const getFallbackTranslations = () => {
  const demoEnMap: Record<string, string> = {
    'ui.welcome.title': 'Welcome to AppKit',
    'ui.welcome.subtitle': 'Connect with your platform safely',
    'ui.button.save': 'Save',
    'ui.button.cancel': 'Cancel',
    'nav.home': 'Home',
    'nav.settings': 'Settings',
    'auth.login': 'Login',
    'auth.register': 'Register',
    'error.network.message': 'Please check your internet connection and try again.',
    'success.save.message': 'Your changes have been saved.'
  }

  return Object.entries(demoEnMap).map(([key, value]) => ({
    id: `${key}-en`,
    key,
    value,
    language: 'en',
    category: getFallbackCategories().find(cat => key.includes(cat.id))?.id || 'general',
    description: getFallbackTranslationKeys().find(k => k.key === key)?.description || '',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }))
}

const getFallbackTimezones = () => [
  { id: 'America/New_York', name: 'Eastern Time', offset: 'UTC-5', region: 'North America' },
  { id: 'America/Chicago', name: 'Central Time', offset: 'UTC-6', region: 'North America' },
  { id: 'America/Denver', name: 'Mountain Time', offset: 'UTC-7', region: 'North America' },
  { id: 'America/Los_Angeles', name: 'Pacific Time', offset: 'UTC-8', region: 'North America' },
  { id: 'Europe/London', name: 'Greenwich Mean Time', offset: 'UTC+0', region: 'Europe' },
  { id: 'Europe/Paris', name: 'Central European Time', offset: 'UTC+1', region: 'Europe' },
  { id: 'Asia/Tokyo', name: 'Japan Standard Time', offset: 'UTC+9', region: 'Asia' },
  { id: 'Asia/Shanghai', name: 'China Standard Time', offset: 'UTC+8', region: 'Asia' },
  { id: 'Australia/Sydney', name: 'Australian Eastern Time', offset: 'UTC+10', region: 'Australia' }
]

export function Localization() {
  const [localizations, setLocalizations] = useState<LocalizationItem[]>([])
  const [languages, setLanguages] = useState<Language[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<LocalizationItem | null>(null)
  const [formData, setFormData] = useState({
    key: '',
    value: '',
    language: 'en',
    category: 'general',
    description: '',
    isActive: true
  })
  
  // Table and pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0
  })
  const [sortState, setSortState] = useState<SortState>({
    column: 'updatedAt',
    direction: 'desc'
  })
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [activeTab, setActiveTab] = useState<'translations' | 'languages' | 'timezones'>('translations')
  const [timezones, setTimezones] = useState<any[]>([])
  const [showLanguageForm, setShowLanguageForm] = useState(false)
  const [editingLanguage, setEditingLanguage] = useState<any>(null)
  const [languageFormData, setLanguageFormData] = useState({
    code: '',
    name: '',
    native_name: '',
    direction: 'ltr',
    flag_emoji: '',
    is_active: true,
    is_default: false
  })
  
  // Multi-language translation editing state
  const [selectedTranslationKey, setSelectedTranslationKey] = useState<string>('')
  const [multiLanguageTranslations, setMultiLanguageTranslations] = useState<Record<string, string>>({})
  const [showMultiLanguageForm, setShowMultiLanguageForm] = useState(false)
  const [translationKeys, setTranslationKeys] = useState<any[]>([])
  const [usingFallbackData, setUsingFallbackData] = useState(false)

  useEffect(() => {
    loadData()
  }, [selectedLanguage, selectedCategory, searchTerm, pagination.currentPage, pagination.itemsPerPage, sortState])

  const loadData = async () => {
    setLoading(true)
    let fallbackUsed = false
    try {
      const [langs, cats, translations, tz, keys] = await Promise.all([
        cmsService.getLanguages().catch((error) => {
          console.warn('Failed to load languages, using fallback:', error)
          fallbackUsed = true
          return getFallbackLanguages()
        }),
        cmsService.getCategories().catch((error) => {
          console.warn('Failed to load categories, using fallback:', error)
          fallbackUsed = true
          return getFallbackCategories()
        }),
        cmsService.getTranslations({
          languageCode: selectedLanguage,
          category: selectedCategory,
          page: pagination.currentPage,
          pageSize: pagination.itemsPerPage,
          search: searchTerm,
          sort: sortState.column,
          direction: sortState.direction
        }).catch((error) => {
          console.warn('Failed to load translations, using fallback:', error)
          fallbackUsed = true
          return getFallbackTranslations()
        }),
        cmsService.getTimezones().catch((error) => {
          console.warn('Failed to load timezones, using fallback:', error)
          fallbackUsed = true
          return getFallbackTimezones()
        }),
        cmsService.getTranslationKeys().catch((error) => {
          console.warn('Failed to load translation keys, using fallback:', error)
          fallbackUsed = true
          return getFallbackTranslationKeys()
        })
      ])

      const mappedLanguages: Language[] = (langs || []).map((l: any) => ({
        code: l.code,
        name: l.name || l.native_name || l.code,
        flag: l.flag_emoji || '',
        isDefault: Boolean(l.is_default)
      }))

      const mappedCategories: Category[] = (cats || []).map((c: any) => ({
        id: c.id || c.slug || c.name,
        name: c.name || c.id,
        description: c.description || '',
        color: c.color || '#6B7280'
      }))

      // Accept both array and object formats from API
      const items = Array.isArray(translations) ? translations : (translations?.items || [])
      const mappedLocalizations: LocalizationItem[] = items.map((t: any) => ({
        id: t.id || `${t.key}-${t.language}`,
        key: t.key || t.translation_keys?.key || '',
        value: t.value || '',
        language: t.language || t.languages?.code || 'en',
        category: t.category || t.translation_keys?.category || 'general',
        description: t.description || t.translation_keys?.description || '',
        isActive: t.is_active ?? true,
        createdAt: t.created_at || new Date().toISOString(),
        updatedAt: t.updated_at || new Date().toISOString()
      }))

      setLanguages(mappedLanguages)
      setCategories(mappedCategories)
      setLocalizations(mappedLocalizations)
      setTimezones(tz || [])
      setTranslationKeys(keys || [])
      setUsingFallbackData(fallbackUsed)
    } catch (error) {
      console.error('Error loading localization data:', error)
      // Set fallback data on complete failure
      setLanguages(getFallbackLanguages() as any)
      setCategories(getFallbackCategories())
      setLocalizations(getFallbackTranslations())
      setTimezones(getFallbackTimezones())
      setTranslationKeys(getFallbackTranslationKeys())
      setUsingFallbackData(true)
    } finally {
      setLoading(false)
    }
  }

  // Enhanced filtering and sorting logic
  const filteredLocalizations = localizations.filter(item => {
    const matchesSearch = item.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLanguage = selectedLanguage === 'all' || item.language === selectedLanguage
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    return matchesSearch && matchesLanguage && matchesCategory
  })

  // Sorting logic
  const sortedLocalizations = [...filteredLocalizations].sort((a, b) => {
    const aValue = a[sortState.column as keyof LocalizationItem]
    const bValue = b[sortState.column as keyof LocalizationItem]
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortState.direction === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }
    
    if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
      return sortState.direction === 'asc' 
        ? (aValue === bValue ? 0 : aValue ? 1 : -1)
        : (aValue === bValue ? 0 : aValue ? -1 : 1)
    }
    
    return 0
  })

  // Pagination logic
  const totalItems = sortedLocalizations.length
  const totalPages = Math.ceil(totalItems / pagination.itemsPerPage)
  const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage
  const endIndex = startIndex + pagination.itemsPerPage
  const paginatedLocalizations = sortedLocalizations.slice(startIndex, endIndex)

  // Update pagination state when data changes
  useEffect(() => {
    setPagination(prev => ({
      ...prev,
      totalItems,
      totalPages,
      currentPage: totalPages > 0 ? Math.min(prev.currentPage, totalPages) : 1
    }))
  }, [totalItems, totalPages])

  const handleCreate = () => {
    setEditingItem(null)
    setFormData({
      key: '',
      value: '',
      language: 'en',
      category: 'general',
      description: '',
      isActive: true
    })
    setShowForm(true)
  }

  const handleEdit = (item: LocalizationItem) => {
    setEditingItem(item)
    setFormData({
      key: item.key,
      value: item.value,
      language: item.language,
      category: item.category,
      description: item.description || '',
      isActive: item.isActive
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    try {
      if (editingItem) {
        await cmsService.updateTranslation(editingItem.id, {
          key: formData.key,
          value: formData.value,
          language: formData.language,
          category: formData.category,
          description: formData.description,
          isActive: formData.isActive
        })
      } else {
        await cmsService.createTranslation({
          key: formData.key,
          value: formData.value,
          language: formData.language,
          category: formData.category,
          description: formData.description,
          isActive: formData.isActive
        })
      }
      await loadData()
      setShowForm(false)
      setEditingItem(null)
    } catch (error) {
      console.error('Failed to save translation:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this localization item?')) return
    try {
      await cmsService.deleteTranslation(id)
      await loadData()
    } catch (error) {
      console.error('Failed to delete translation:', error)
    }
  }

  // New handler functions for table functionality
  const handleSort = (column: string) => {
    setSortState(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }))
  }

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    setPagination(prev => ({ 
      ...prev, 
      itemsPerPage, 
      currentPage: 1 
    }))
  }

  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([])
    } else {
      setSelectedItems(paginatedLocalizations.map(item => item.id))
    }
    setSelectAll(!selectAll)
  }

  const handleBulkDelete = () => {
    if (selectedItems.length === 0) return
    
    if (confirm(`Are you sure you want to delete ${selectedItems.length} selected items?`)) {
      setLocalizations(prev => prev.filter(item => !selectedItems.includes(item.id)))
      setSelectedItems([])
      setSelectAll(false)
    }
  }

  const handleBulkStatusChange = (isActive: boolean) => {
    if (selectedItems.length === 0) return
    
    setLocalizations(prev => prev.map(item => 
      selectedItems.includes(item.id) 
        ? { ...item, isActive, updatedAt: new Date().toISOString().split('T')[0] }
        : item
    ))
    setSelectedItems([])
    setSelectAll(false)
  }

  // Language management functions
  const handleCreateLanguage = () => {
    setEditingLanguage(null)
    setLanguageFormData({
      code: '',
      name: '',
      native_name: '',
      direction: 'ltr',
      flag_emoji: '',
      is_active: true,
      is_default: false
    })
    setShowLanguageForm(true)
  }

  const handleEditLanguage = (language: any) => {
    setEditingLanguage(language)
    setLanguageFormData({
      code: language.code,
      name: language.name,
      native_name: language.native_name || language.name,
      direction: language.direction || 'ltr',
      flag_emoji: language.flag || '',
      is_active: language.isActive !== false,
      is_default: language.isDefault || false
    })
    setShowLanguageForm(true)
  }

  const handleSaveLanguage = async () => {
    try {
      if (editingLanguage) {
        await cmsService.updateLanguage(editingLanguage.id, languageFormData)
      } else {
        await cmsService.createLanguage(languageFormData)
      }
      await loadData()
      setShowLanguageForm(false)
      setEditingLanguage(null)
    } catch (error) {
      console.error('Failed to save language:', error)
    }
  }

  const handleDeleteLanguage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this language?')) return
    try {
      await cmsService.deleteLanguage(id)
      await loadData()
    } catch (error) {
      console.error('Failed to delete language:', error)
    }
  }

  // Multi-language translation functions
  const handleEditMultiLanguage = async (key: string) => {
    setSelectedTranslationKey(key)
    setShowMultiLanguageForm(true)
    
    // Load existing translations for this key
    const translations: Record<string, string> = {}
    for (const language of languages) {
      try {
        const existingTranslation = localizations.find(
          t => t.key === key && t.language === language.code
        )
        translations[language.code] = existingTranslation?.value || ''
      } catch (error) {
        translations[language.code] = ''
      }
    }
    setMultiLanguageTranslations(translations)
  }

  const handleSaveMultiLanguage = async () => {
    try {
      const promises = languages.map(async (language) => {
        const value = multiLanguageTranslations[language.code]?.trim()
        if (value) {
          // Check if translation already exists
          const existingTranslation = localizations.find(
            t => t.key === selectedTranslationKey && t.language === language.code
          )
          
          if (existingTranslation) {
            // Update existing translation
            await cmsService.updateTranslation(existingTranslation.id, {
              key: selectedTranslationKey,
              value: value,
              language: language.code,
              category: 'general',
              isActive: true
            })
          } else {
            // Create new translation
            await cmsService.createTranslation({
              key: selectedTranslationKey,
              value: value,
              language: language.code,
              category: 'general',
              isActive: true
            })
          }
        }
      })
      
      await Promise.all(promises)
      await loadData()
      setShowMultiLanguageForm(false)
      setSelectedTranslationKey('')
      setMultiLanguageTranslations({})
    } catch (error) {
      console.error('Failed to save multi-language translations:', error)
    }
  }

  const handleMultiLanguageInputChange = (languageCode: string, value: string) => {
    setMultiLanguageTranslations(prev => ({
      ...prev,
      [languageCode]: value
    }))
  }

  const handleExport = () => {
    const dataToExport = filteredLocalizations.map(item => ({
      Key: item.key,
      Value: item.value,
      Language: getLanguageName(item.language),
      Category: getCategoryName(item.category),
      Status: item.isActive ? 'Active' : 'Inactive',
      Description: item.description || '',
      'Created At': item.createdAt,
      'Updated At': item.updatedAt
    }))

    const csvContent = [
      Object.keys(dataToExport[0]).join(','),
      ...dataToExport.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `localizations-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getLanguageName = (code: string) => {
    const language = languages.find(lang => lang.code === code)
    return language ? (language.flag ? `${language.flag} ${language.name}` : language.name) : code
  }

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId)
    return category?.color || '#6B7280'
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId)
    return category?.name || categoryId
  }

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">
            {editingItem ? 'Edit Localization' : 'Create Localization'}
          </h2>
          <button
            onClick={() => setShowForm(false)}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>

        <div className="card">
          <div className="card-body">
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label">Key</label>
                  <input
                    type="text"
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                    className="form-input"
                    placeholder="e.g., welcome_message"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Language</label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="form-select"
                    required
                  >
                    {languages.map(lang => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag ? `${lang.flag} ${lang.name}` : lang.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Value</label>
                <textarea
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="form-textarea"
                  rows={3}
                  placeholder="Enter the localized text..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="form-select"
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    value={formData.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                    className="form-select"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-textarea"
                  rows={2}
                  placeholder="Optional description of where this text is used..."
                />
              </div>

              <div className="flex gap-3">
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Localization Management
          </h2>
          <p className="text-gray-600">Manage multi-language content, languages, and timezones</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'translations' && (
            <>
              <button onClick={handleExport} className="btn btn-secondary flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
              <button onClick={handleCreate} className="btn btn-primary">
                + Add Translation
              </button>
            </>
          )}
          {activeTab === 'languages' && (
            <button onClick={handleCreateLanguage} className="btn btn-primary">
              + Add Language
            </button>
          )}
        </div>
      </div>

      {/* Fallback Data Notification */}
      {usingFallbackData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Using Demo Data
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  The backend server is not available. You're viewing demo localization data. 
                  To use real data, ensure the backend server is running and properly configured.
                </p>
              </div>
              <div className="mt-3">
                <button
                  onClick={() => loadData()}
                  className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-md text-sm font-medium hover:bg-yellow-200 transition-colors"
                >
                  Retry Connection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('translations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'translations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              Translations
            </span>
          </button>
          <button
            onClick={() => setActiveTab('languages')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'languages'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Languages
            </span>
          </button>
          <button
            onClick={() => setActiveTab('timezones')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'timezones'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Timezones
            </span>
          </button>
        </nav>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="stat-number text-blue-600">{localizations.length}</div>
          <div className="stat-label">Total Translations</div>
        </div>
        <div className="stat-card">
          <div className="stat-number text-green-600">{languages.length}</div>
          <div className="stat-label">Languages</div>
        </div>
        <div className="stat-card">
          <div className="stat-number text-purple-600">{categories.length}</div>
          <div className="stat-label">Categories</div>
        </div>
        <div className="stat-card">
          <div className="stat-number text-orange-600">
            {activeTab === 'timezones' ? timezones.length : localizations.filter(item => item.isActive).length}
          </div>
          <div className="stat-label">{activeTab === 'timezones' ? 'Timezones' : 'Active'}</div>
        </div>
      </div>

      {/* Language Form */}
      {showLanguageForm && (
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingLanguage ? 'Edit Language' : 'Add New Language'}
              </h3>
              <button
                onClick={() => setShowLanguageForm(false)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); handleSaveLanguage(); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Language Code *</label>
                  <input
                    type="text"
                    value={languageFormData.code}
                    onChange={(e) => setLanguageFormData({ ...languageFormData, code: e.target.value })}
                    className="form-input"
                    placeholder="e.g., en, es, fr"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Language Name *</label>
                  <input
                    type="text"
                    value={languageFormData.name}
                    onChange={(e) => setLanguageFormData({ ...languageFormData, name: e.target.value })}
                    className="form-input"
                    placeholder="e.g., English, Spanish, French"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Native Name</label>
                  <input
                    type="text"
                    value={languageFormData.native_name}
                    onChange={(e) => setLanguageFormData({ ...languageFormData, native_name: e.target.value })}
                    className="form-input"
                    placeholder="e.g., English, Español, Français"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Direction</label>
                  <select
                    value={languageFormData.direction}
                    onChange={(e) => setLanguageFormData({ ...languageFormData, direction: e.target.value })}
                    className="form-select"
                  >
                    <option value="ltr">Left to Right (LTR)</option>
                    <option value="rtl">Right to Left (RTL)</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Flag Emoji</label>
                  <input
                    type="text"
                    value={languageFormData.flag_emoji}
                    onChange={(e) => setLanguageFormData({ ...languageFormData, flag_emoji: e.target.value })}
                    className="form-input"
                    placeholder="🇺🇸"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={languageFormData.is_active}
                        onChange={(e) => setLanguageFormData({ ...languageFormData, is_active: e.target.checked })}
                        className="form-checkbox"
                      />
                      <span className="ml-2">Active</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={languageFormData.is_default}
                        onChange={(e) => setLanguageFormData({ ...languageFormData, is_default: e.target.checked })}
                        className="form-checkbox"
                      />
                      <span className="ml-2">Default</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button type="submit" className="btn btn-primary">
                  {editingLanguage ? 'Update Language' : 'Create Language'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowLanguageForm(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Multi-Language Translation Modal */}
      {showMultiLanguageForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">
                  Edit Translations: <code className="bg-gray-100 px-2 py-1 rounded">{selectedTranslationKey}</code>
                </h3>
                <button
                  onClick={() => setShowMultiLanguageForm(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {languages.map((language) => (
                  <div key={language.code} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      {language.flag ? (
                        <span className="text-xl">{language.flag}</span>
                      ) : (
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      <div>
                        <div className="font-medium">{language.name}</div>
                        <div className="text-sm text-gray-500 font-mono">{language.code}</div>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Translation</label>
                      <textarea
                        value={multiLanguageTranslations[language.code] || ''}
                        onChange={(e) => handleMultiLanguageInputChange(language.code, e.target.value)}
                        className="form-textarea"
                        rows={4}
                        placeholder="Enter translation..."
                      />
                    </div>
                    <div className="text-xs text-gray-500">
                      {multiLanguageTranslations[language.code]?.length || 0} characters
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-3 mt-6 pt-6 border-t">
                <button
                  onClick={handleSaveMultiLanguage}
                  className="btn btn-primary"
                >
                  Save All Translations
                </button>
                <button
                  onClick={() => setShowMultiLanguageForm(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'translations' && (
        <>

      {/* Filters and Controls */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search translations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input"
                />
              </div>
              
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="form-select w-auto"
              >
                <option value="all">All Languages</option>
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag ? `${lang.flag} ${lang.name}` : lang.name}
                  </option>
                ))}
              </select>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="form-select w-auto"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={pagination.itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="form-select w-auto"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <span className="text-blue-700 font-medium">
                {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkStatusChange(true)}
                  className="btn btn-sm btn-success"
                >
                  Activate
                </button>
                <button
                  onClick={() => handleBulkStatusChange(false)}
                  className="btn btn-sm btn-warning"
                >
                  Deactivate
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="btn btn-sm btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table View */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner"></div>
        </div>
      ) : filteredLocalizations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="empty-state-title">No translations found</h3>
          <p className="empty-state-description">Create your first translation to get started.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block card">
            <div className="card-body p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={handleSelectAll}
                          className="form-checkbox"
                        />
                      </th>
                      <th 
                        className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('key')}
                      >
                        <div className="flex items-center gap-2">
                          Key
                          {sortState.column === 'key' && (
                            <span>{sortState.direction === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left">Value</th>
                      <th 
                        className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('language')}
                      >
                        <div className="flex items-center gap-2">
                          Language
                          {sortState.column === 'language' && (
                            <span>{sortState.direction === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('category')}
                      >
                        <div className="flex items-center gap-2">
                          Category
                          {sortState.column === 'category' && (
                            <span>{sortState.direction === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('isActive')}
                      >
                        <div className="flex items-center gap-2">
                          Status
                          {sortState.column === 'isActive' && (
                            <span>{sortState.direction === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('updatedAt')}
                      >
                        <div className="flex items-center gap-2">
                          Updated
                          {sortState.column === 'updatedAt' && (
                            <span>{sortState.direction === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedLocalizations.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item.id)}
                            onChange={() => handleSelectItem(item.id)}
                            className="form-checkbox"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{item.key}</div>
                          {item.description && (
                            <div className="text-sm text-gray-500">{item.description}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="max-w-xs truncate" title={item.value}>
                            {item.value}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getLanguageName(item.language)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span 
                            className="badge"
                            style={{ backgroundColor: getCategoryColor(item.category) }}
                          >
                            {getCategoryName(item.category)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {item.isActive ? (
                            <span className="badge badge-success">Active</span>
                          ) : (
                            <span className="badge badge-warning">Inactive</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-500">
                            {new Date(item.updatedAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="btn btn-ghost btn-sm text-blue-600 hover:text-blue-700"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="btn btn-ghost btn-sm text-red-600 hover:text-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {paginatedLocalizations.map((item) => (
              <div key={item.id} className="card">
                <div className="card-body">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => handleSelectItem(item.id)}
                        className="form-checkbox"
                      />
                      <div className="font-medium text-gray-900">{item.key}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="btn btn-ghost btn-sm text-blue-600 hover:text-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="btn btn-ghost btn-sm text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Value:</span>
                      <p className="text-gray-900">{item.value}</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500">Language:</span>
                        <span className="text-lg">{getLanguageName(item.language)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500">Category:</span>
                        <span 
                          className="badge"
                          style={{ backgroundColor: getCategoryColor(item.category) }}
                        >
                          {getCategoryName(item.category)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Status:</span>
                        {item.isActive ? (
                          <span className="badge badge-success ml-2">Active</span>
                        ) : (
                          <span className="badge badge-warning ml-2">Inactive</span>
                        )}
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-gray-500">Updated:</span>
                        <span className="text-sm text-gray-500 ml-2">
                          {new Date(item.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    {item.description && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Description:</span>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="card">
          <div className="card-body">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} entries
              </div>
              
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={pagination.currentPage === 1}
                  className="btn btn-sm btn-ghost disabled:opacity-50 hidden sm:block"
                >
                  First
                </button>
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="btn btn-sm btn-ghost disabled:opacity-50"
                >
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">‹</span>
                </button>
                
                {/* Page numbers - responsive */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const startPage = Math.max(1, pagination.currentPage - 2)
                    const pageNum = startPage + i
                    if (pageNum > totalPages) return null
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`btn btn-sm ${
                          pageNum === pagination.currentPage 
                            ? 'btn-primary' 
                            : 'btn-ghost'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === totalPages}
                  className="btn btn-sm btn-ghost disabled:opacity-50"
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">›</span>
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={pagination.currentPage === totalPages}
                  className="btn btn-sm btn-ghost disabled:opacity-50 hidden sm:block"
                >
                  Last
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* Languages Tab */}
      {activeTab === 'languages' && (
        <div className="space-y-6">
          {/* Language Management Section */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Language Management</h3>
              <p className="text-gray-600">Manage available languages and their settings</p>
            </div>
            <div className="card-body">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left">Flag</th>
                      <th className="px-4 py-3 text-left">Code</th>
                      <th className="px-4 py-3 text-left">Name</th>
                      <th className="px-4 py-3 text-left">Native Name</th>
                      <th className="px-4 py-3 text-left">Direction</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {languages.map((language) => (
                      <tr key={language.code} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          {language.flag ? (
                            <span className="text-2xl">{language.flag}</span>
                          ) : (
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {language.code}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium">{language.name}</td>
                        <td className="px-4 py-3">{(language as any).native_name || language.name}</td>
                        <td className="px-4 py-3">
                          <span className="badge badge-secondary">
                            {(language as any).direction || 'ltr'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {language.isDefault && (
                              <span className="badge badge-primary">Default</span>
                            )}
                            {(language as any).isActive !== false ? (
                              <span className="badge badge-success">Active</span>
                            ) : (
                              <span className="badge badge-warning">Inactive</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditLanguage(language)}
                              className="btn btn-ghost btn-sm text-blue-600 hover:text-blue-700"
                            >
                              Edit
                            </button>
                            {!language.isDefault && (
                              <button
                                onClick={() => handleDeleteLanguage((language as any).id || language.code)}
                                className="btn btn-ghost btn-sm text-red-600 hover:text-red-700"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Multi-Language Translation Section */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Multi-Language Translation Editor</h3>
              <p className="text-gray-600">Edit translations for all languages at once</p>
            </div>
            <div className="card-body">
              {translationKeys.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-600 mb-2">No Translation Keys Found</h4>
                  <p className="text-gray-500">Create some translation keys first to use the multi-language editor.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="form-group">
                    <label className="form-label">Select Translation Key</label>
                    <select
                      value={selectedTranslationKey}
                      onChange={(e) => setSelectedTranslationKey(e.target.value)}
                      className="form-select"
                    >
                      <option value="">Choose a translation key...</option>
                      {translationKeys.map((key) => (
                        <option key={key.id || key.key} value={key.key}>
                          {key.key} {key.description && `- ${key.description}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedTranslationKey && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Translations for: <code className="bg-gray-100 px-2 py-1 rounded">{selectedTranslationKey}</code></h4>
                        <button
                          onClick={() => handleEditMultiLanguage(selectedTranslationKey)}
                          className="btn btn-primary btn-sm"
                        >
                          Edit All Languages
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {languages.map((language) => {
                          const existingTranslation = localizations.find(
                            t => t.key === selectedTranslationKey && t.language === language.code
                          )
                          return (
                            <div key={language.code} className="border rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-3">
                                {language.flag ? (
                                  <span className="text-xl">{language.flag}</span>
                                ) : (
                                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                )}
                                <div>
                                  <div className="font-medium">{language.name}</div>
                                  <div className="text-sm text-gray-500 font-mono">{language.code}</div>
                                </div>
                              </div>
                              <div className="form-group">
                                <textarea
                                  value={existingTranslation?.value || ''}
                                  onChange={(e) => {
                                    // This is read-only in this view, editing happens in the modal
                                  }}
                                  className="form-textarea"
                                  rows={3}
                                  placeholder="No translation available"
                                  readOnly
                                />
                              </div>
                              {existingTranslation ? (
                                <div className="text-xs text-green-600">✓ Translated</div>
                              ) : (
                                <div className="text-xs text-orange-600">⚠ Missing translation</div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Timezones Tab */}
      {activeTab === 'timezones' && (
        <div className="card">
          <div className="card-body">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Available Timezones</h3>
              <p className="text-gray-600">These timezones are available for user selection in the mobile app.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {timezones.map((timezone) => (
                <div key={timezone.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{timezone.name}</h4>
                    <span className="text-sm text-gray-500">{timezone.offset}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{timezone.id}</p>
                  <span className="badge badge-secondary">{timezone.region}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

