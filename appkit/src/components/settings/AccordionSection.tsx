'use client'

import React, { useState, createContext, useContext } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface AccordionContextType {
  openSection: string | null
  setOpenSection: (sectionId: string | null) => void
}

const AccordionContext = createContext<AccordionContextType | null>(null)

interface AccordionProviderProps {
  children: React.ReactNode
}

function AccordionProvider({ children }: AccordionProviderProps) {
  const [openSection, setOpenSection] = useState<string | null>(null)

  return (
    <AccordionContext.Provider value={{ openSection, setOpenSection }}>
      {children}
    </AccordionContext.Provider>
  )
}

function useAccordion() {
  const context = useContext(AccordionContext)
  if (!context) {
    throw new Error('useAccordion must be used within an AccordionProvider')
  }
  return context
}

interface AccordionSectionProps {
  title: string
  description?: string
  defaultOpen?: boolean
  children: React.ReactNode
  sectionId: string
}

export function AccordionSection({ title, description, defaultOpen = false, children, sectionId }: AccordionSectionProps) {
  const { openSection, setOpenSection } = useAccordion()
  const isOpen = openSection === sectionId

  const handleClick = () => {
    if (isOpen) {
      setOpenSection(null)
    } else {
      setOpenSection(sectionId)
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={handleClick}
        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left"
      >
        <div>
          <h3 className="text-md font-medium">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
        <div className="flex items-center">
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-500" />
          )}
        </div>
      </button>
      
      {isOpen && (
        <div className="p-4 bg-white">
          {children}
        </div>
      )}
    </div>
  )
}

// Export the provider to wrap the entire accordion group
export { AccordionProvider }
