import React, { useRef, useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface TabsContextType {
    activeTab: string
    onChange: (value: string) => void
    variant?: 'default' | 'pills' | 'segmented'
}

const TabsContext = createContext<TabsContextType | undefined>(undefined)

interface Tab {
    id: string
    label: string
    icon?: React.ReactNode
}

interface TabsProps {
    tabs?: Tab[]
    activeTab?: string
    onChange?: (tabId: string) => void
    defaultValue?: string
    className?: string
    variant?: 'default' | 'pills' | 'segmented'
    children?: ReactNode
}

export function Tabs({ 
    tabs, 
    activeTab: externalActiveTab, 
    onChange: externalOnChange, 
    defaultValue,
    className = '', 
    variant = 'pills',
    children 
}: TabsProps) {
    const [internalActiveTab, setInternalActiveTab] = useState(defaultValue || (tabs && tabs[0]?.id) || '')
    const activeTab = externalActiveTab !== undefined ? externalActiveTab : internalActiveTab
    
    const onChange = (value: string) => {
        if (externalOnChange) {
            externalOnChange(value)
        } else {
            setInternalActiveTab(value)
        }
    }

    const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 })
    const tabsRef = useRef<(HTMLButtonElement | null)[]>([])

    useEffect(() => {
        if (tabs) {
            const activeIndex = tabs.findIndex(t => t.id === activeTab)
            const activeElement = tabsRef.current[activeIndex]

            if (activeElement) {
                setIndicatorStyle({
                    left: activeElement.offsetLeft,
                    width: activeElement.offsetWidth,
                    opacity: 1
                })
            }
        }
    }, [activeTab, tabs])

    if (children) {
        return (
            <TabsContext.Provider value={{ activeTab, onChange, variant }}>
                <div className={cn('w-full', className)}>
                    {children}
                </div>
            </TabsContext.Provider>
        )
    }

    if (!tabs) return null

    return (
        <div className={cn(
            'relative',
            variant === 'default' && 'border-b border-gray-200',
            className
        )}>
            {/* Pill/Segmented Background */}
            {(variant === 'pills' || variant === 'segmented') && (
                <div className={cn(
                    "flex p-1 rounded-xl relative w-full",
                    variant === 'segmented' ? "bg-gray-100/50 border border-gray-200/50" : "bg-transparent gap-2"
                )}>
                    {/* Floating Indicator */}
                    <div
                        className={cn(
                            "absolute top-1 bottom-1 bg-white shadow-sm rounded-lg transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
                            variant === 'pills' && "!bg-white !shadow-sm ring-1 ring-black/5 top-0 bottom-0 rounded-xl",
                            indicatorStyle.opacity === 0 && "opacity-0"
                        )}
                        style={{
                            left: indicatorStyle.left,
                            width: indicatorStyle.width
                        }}
                    />

                    {tabs.map((tab, index) => {
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                ref={el => { tabsRef.current[index] = el }}
                                onClick={() => onChange(tab.id)}
                                type="button"
                                className={cn(
                                    "relative z-10 flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-lg whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-gray-900",
                                    isActive ? "text-gray-900" : "text-gray-500 hover:text-gray-900"
                                )}
                            >
                                {tab.icon && (
                                    <span className={cn(
                                        "w-4 h-4 transition-transform duration-300",
                                        isActive && "scale-110"
                                    )}>
                                        {tab.icon}
                                    </span>
                                )}
                                {tab.label}
                            </button>
                        )
                    })}
                </div>
            )}

            {/* Default Underline Style */}
            {variant === 'default' && (
                <nav className="flex space-x-8 -mb-px" aria-label="Tabs">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => onChange(tab.id)}
                                type="button"
                                className={cn(
                                    "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-all duration-200",
                                    isActive
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                )}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        )
                    })}
                </nav>
            )}
        </div>
    )
}

export const TabsList = ({ children, className }: { children: ReactNode, className?: string }) => {
    const context = useContext(TabsContext)
    if (!context) return null
    
    return (
        <div className={cn(
            "flex p-1 rounded-xl bg-gray-100/50 border border-gray-200/50 gap-1",
            className
        )}>
            {children}
        </div>
    )
}

export const TabsTrigger = ({ value, children, className }: { value: string, children: ReactNode, className?: string }) => {
    const context = useContext(TabsContext)
    if (!context) return null
    
    const isActive = context.activeTab === value
    
    return (
        <button
            onClick={() => context.onChange(value)}
            className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg transition-all",
                isActive ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/50",
                className
            )}
        >
            {children}
        </button>
    )
}

export const TabsContent = ({ value, children, className }: { value: string, children: ReactNode, className?: string }) => {
    const context = useContext(TabsContext)
    if (!context) return null
    
    if (context.activeTab !== value) return null
    
    return (
        <div className={cn("mt-4", className)}>
            {children}
        </div>
    )
}
