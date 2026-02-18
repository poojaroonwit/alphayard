
import React from 'react'
import { clsx } from 'clsx'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { CategoryIcons } from './appearance.config'

interface SidebarItem {
    id: string
    name: string
    icon: string
    count?: number
}

interface SidebarSection {
    id: string
    title: string
    items: SidebarItem[]
}

interface AppearanceSidebarProps {
    sections: SidebarSection[]
    selectedCategory: string
    onSelectCategory: (id: string) => void
    expandedSection: string | null
    onToggleSection: (id: string) => void
}

export function AppearanceSidebar({ 
    sections, 
    selectedCategory, 
    onSelectCategory, 
    expandedSection, 
    onToggleSection 
}: AppearanceSidebarProps) {
    return (
        <aside className="w-full lg:w-72 shrink-0">
            <div className="sticky top-4 bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden text-sm">
                <nav className="space-y-1 p-2">
                    {sections.map((section) => {
                        const isExpanded = expandedSection === section.id
                        const hasActiveChild = section.items.some(i => i.id === selectedCategory)

                        return (
                            <div key={section.id} className="overflow-hidden rounded-xl bg-white mb-2 last:mb-0 border border-transparent has-[.active-child]:border-blue-100 has-[.expanded]:border-gray-200/50 shadow-sm transition-all duration-300">
                                <button
                                    onClick={() => onToggleSection(section.id)}
                                    className={clsx(
                                        "w-full flex items-center justify-between px-4 py-3 text-sm font-bold transition-colors outline-none expanded",
                                        isExpanded ? "text-gray-900 bg-gray-50/50" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50",
                                        hasActiveChild && !isExpanded && "text-blue-600 active-child"
                                    )}
                                >
                                    <span className="uppercase tracking-widest text-[10px]">{section.title}</span>
                                    <ChevronDownIcon 
                                        className={clsx(
                                            "w-4 h-4 text-gray-400 transition-transform duration-300",
                                            isExpanded ? "rotate-180" : ""
                                        )} 
                                    />
                                </button>
                                
                                <div 
                                    className={clsx(
                                        "space-y-0.5 px-2 transition-all duration-300 ease-in-out origin-top",
                                        isExpanded ? "max-h-[500px] opacity-100 pb-2 scale-y-100" : "max-h-0 opacity-0 scale-y-95"
                                    )}
                                >
                                    {section.items.map((item) => {
                                        const isActive = selectedCategory === item.id
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => onSelectCategory(item.id)}
                                                className={clsx(
                                                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-200 group relative",
                                                    isActive 
                                                        ? "bg-blue-600 text-white font-medium shadow-md shadow-blue-500/20" 
                                                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={clsx(
                                                        "transition-colors duration-200", 
                                                        isActive ? "text-blue-200" : "text-gray-400 group-hover:text-blue-600"
                                                    )}>
                                                        {item.icon && CategoryIcons[item.icon]}
                                                    </div>
                                                    <span>{item.name}</span>
                                                </div>
                                                {item.count !== undefined && (
                                                     <span className={clsx(
                                                         "text-[10px] py-0.5 px-1.5 rounded-full font-bold", 
                                                         isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                                                     )}>
                                                        {item.count}
                                                     </span>
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </nav>
            </div>
        </aside>
    )
}
