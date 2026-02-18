'use client'

import React, { useState, useRef, useEffect } from 'react'

// Popular Google Fonts
const GOOGLE_FONTS = [
  { name: 'Inter', category: 'sans-serif' },
  { name: 'Roboto', category: 'sans-serif' },
  { name: 'Open Sans', category: 'sans-serif' },
  { name: 'Lato', category: 'sans-serif' },
  { name: 'Montserrat', category: 'sans-serif' },
  { name: 'Poppins', category: 'sans-serif' },
  { name: 'Outfit', category: 'sans-serif' },
  { name: 'Plus Jakarta Sans', category: 'sans-serif' },
  { name: 'DM Sans', category: 'sans-serif' },
  { name: 'Nunito', category: 'sans-serif' },
  { name: 'Raleway', category: 'sans-serif' },
  { name: 'Ubuntu', category: 'sans-serif' },
  { name: 'Manrope', category: 'sans-serif' },
  { name: 'Space Grotesk', category: 'sans-serif' },
  { name: 'Figtree', category: 'sans-serif' },
  { name: 'Playfair Display', category: 'serif' },
  { name: 'Merriweather', category: 'serif' },
  { name: 'Lora', category: 'serif' },
  { name: 'Libre Baskerville', category: 'serif' },
  { name: 'Source Serif Pro', category: 'serif' },
  { name: 'Fira Code', category: 'monospace' },
  { name: 'JetBrains Mono', category: 'monospace' },
  { name: 'Source Code Pro', category: 'monospace' },
]

interface FontSelectorProps {
  value: string
  onChange: (font: string) => void
  label?: string
}

export function FontSelector({ value, onChange, label }: FontSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const popoverRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredFonts = GOOGLE_FONTS.filter(font => 
    font.name.toLowerCase().includes(search.toLowerCase())
  )

  const selectedFont = GOOGLE_FONTS.find(f => f.name === value) || { name: value, category: 'sans-serif' }

  return (
    <div className="relative">
      {label && <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>}
      
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full h-10 px-3 border border-gray-300 rounded-lg bg-white hover:border-pink-400 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500"
      >
        <div className="flex items-center gap-2">
          <span 
            className="text-sm font-medium"
            style={{ fontFamily: `"${selectedFont.name}", ${selectedFont.category}` }}
          >
            {selectedFont.name}
          </span>
          <span className="text-xs text-gray-400 px-1.5 py-0.5 bg-gray-100 rounded">
            {selectedFont.category}
          </span>
        </div>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div 
          ref={popoverRef}
          className="absolute z-50 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
        >
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search fonts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                autoFocus
              />
            </div>
          </div>

          {/* Font List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredFonts.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                No fonts found
              </div>
            ) : (
              <div className="py-1">
                {filteredFonts.map((font) => (
                  <button
                    key={font.name}
                    onClick={() => {
                      onChange(font.name)
                      setIsOpen(false)
                      setSearch('')
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors ${
                      value === font.name ? 'bg-pink-50' : ''
                    }`}
                  >
                    <span 
                      className={`text-sm ${value === font.name ? 'text-pink-600 font-medium' : 'text-gray-700'}`}
                      style={{ fontFamily: `"${font.name}", ${font.category}` }}
                    >
                      {font.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {font.category}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

