'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  FunnelIcon,
  XMarkIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  UserIcon,
  TagIcon
} from '@heroicons/react/24/outline'

export interface FilterOption {
  id: string
  label: string
  value: any
  count?: number
}

export interface FilterConfig {
  id: string
  label: string
  type: 'select' | 'multiselect' | 'date' | 'daterange' | 'search' | 'number'
  options?: FilterOption[]
  placeholder?: string
  multiple?: boolean
}

interface FilterSystemProps {
  filters: FilterConfig[]
  activeFilters: Record<string, any>
  onFiltersChange: (filters: Record<string, any>) => void
  onClearAll?: () => void
  className?: string
}

export function FilterSystem({ 
  filters, 
  activeFilters, 
  onFiltersChange, 
  onClearAll,
  className = '' 
}: FilterSystemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedFilter, setExpandedFilter] = useState<string | null>(null)
  const filterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setExpandedFilter(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleFilterChange = (filterId: string, value: any) => {
    onFiltersChange({
      ...activeFilters,
      [filterId]: value
    })
  }

  const clearFilter = (filterId: string) => {
    const newFilters = { ...activeFilters }
    delete newFilters[filterId]
    onFiltersChange(newFilters)
  }

  const getActiveFilterCount = () => {
    return Object.keys(activeFilters).length
  }

  const renderFilterContent = (filter: FilterConfig) => {
    switch (filter.type) {
      case 'select':
      case 'multiselect':
        return (
          <div className="space-y-2">
            {filter.options?.map((option) => (
              <label key={option.id} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type={filter.multiple ? 'checkbox' : 'radio'}
                  name={filter.id}
                  value={option.value}
                  checked={
                    filter.multiple
                      ? Array.isArray(activeFilters[filter.id]) && activeFilters[filter.id].includes(option.value)
                      : activeFilters[filter.id] === option.value
                  }
                  onChange={(e) => {
                    if (filter.multiple) {
                      const currentValues = activeFilters[filter.id] || []
                      const newValues = e.target.checked
                        ? [...currentValues, option.value]
                        : currentValues.filter((v: any) => v !== option.value)
                      handleFilterChange(filter.id, newValues)
                    } else {
                      handleFilterChange(filter.id, option.value)
                    }
                  }}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="text-sm text-gray-700 flex-1">{option.label}</span>
                {option.count !== undefined && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {option.count}
                  </span>
                )}
              </label>
            ))}
          </div>
        )

      case 'search':
        return (
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={filter.placeholder || 'Search...'}
              value={activeFilters[filter.id] || ''}
              onChange={(e) => handleFilterChange(filter.id, e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
            />
          </div>
        )

      case 'date':
        return (
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={activeFilters[filter.id] || ''}
              onChange={(e) => handleFilterChange(filter.id, e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
            />
          </div>
        )

      case 'daterange':
        return (
          <div className="space-y-2">
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                placeholder="From"
                value={activeFilters[filter.id]?.from || ''}
                onChange={(e) => handleFilterChange(filter.id, {
                  ...activeFilters[filter.id],
                  from: e.target.value
                })}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                placeholder="To"
                value={activeFilters[filter.id]?.to || ''}
                onChange={(e) => handleFilterChange(filter.id, {
                  ...activeFilters[filter.id],
                  to: e.target.value
                })}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        )

      case 'number':
        return (
          <div className="space-y-2">
            <input
              type="number"
              placeholder={filter.placeholder || 'Enter number...'}
              value={activeFilters[filter.id] || ''}
              onChange={(e) => handleFilterChange(filter.id, e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
            />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className={`relative ${className}`} ref={filterRef}>
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors duration-200"
      >
        <FunnelIcon className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">Filters</span>
        {getActiveFilterCount() > 0 && (
          <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {getActiveFilterCount()}
          </span>
        )}
        <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Filter Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              {getActiveFilterCount() > 0 && (
                <button
                  onClick={onClearAll}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {filters.map((filter) => (
              <div key={filter.id} className="border-b border-gray-100 last:border-b-0">
                <button
                  onClick={() => setExpandedFilter(expandedFilter === filter.id ? null : filter.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-150"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">{filter.label}</span>
                    {activeFilters[filter.id] && (
                      <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                    expandedFilter === filter.id ? 'rotate-180' : ''
                  }`} />
                </button>

                {expandedFilter === filter.id && (
                  <div className="px-4 pb-4">
                    {renderFilterContent(filter)}
                    {activeFilters[filter.id] && (
                      <button
                        onClick={() => clearFilter(filter.id)}
                        className="mt-3 flex items-center space-x-1 text-xs text-red-600 hover:text-red-700"
                      >
                        <XMarkIcon className="w-3 h-3" />
                        <span>Clear {filter.label}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {getActiveFilterCount()} filter{getActiveFilterCount() !== 1 ? 's' : ''} applied
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Table Header with Sortable Columns
interface SortableHeaderProps {
  label: string
  sortKey: string
  currentSort: { key: string; direction: 'asc' | 'desc' } | null
  onSort: (key: string) => void
  className?: string
}

export function SortableHeader({ label, sortKey, currentSort, onSort, className = '' }: SortableHeaderProps) {
  const isActive = currentSort?.key === sortKey
  const direction = isActive ? currentSort.direction : null

  return (
    <th 
      className={`px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-50 transition-colors duration-150 ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center space-x-2">
        <span>{label}</span>
        <div className="flex flex-col">
          <ChevronDownIcon 
            className={`w-3 h-3 transition-colors duration-150 ${
              direction === 'asc' ? 'text-red-600' : 'text-gray-300'
            }`} 
            style={{ transform: 'rotate(180deg)' }}
          />
          <ChevronDownIcon 
            className={`w-3 h-3 transition-colors duration-150 ${
              direction === 'desc' ? 'text-red-600' : 'text-gray-300'
            }`} 
          />
        </div>
      </div>
    </th>
  )
}
