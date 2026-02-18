import React from 'react'

import { ComponentConfig, ComponentStyle } from './types'
import { colorValueToCss } from '../ui/ColorPickerPopover'
import { clsx } from 'clsx'
import * as HeroIcons from '@heroicons/react/24/outline'
import { SelectionTabs } from '../ui/SelectionTabs'

// Helper to get shadow style
export const getShadowStyle = (styles: any) => {
    const level = styles?.shadowLevel || 'none'
    
    if (level !== 'custom') {
        switch (level) {
            case 'sm': return '0 1px 2px rgba(0,0,0,0.05)'
            case 'md': return '0 4px 6px rgba(0,0,0,0.1)'
            case 'lg': return '0 10px 15px rgba(0,0,0,0.1)'
            default: return 'none'
        }
    }

    const color = styles?.shadowColor || { mode: 'solid', solid: '#000000' }
    const blur = styles?.shadowBlur ?? 10
    const spread = styles?.shadowSpread ?? 0
    const offsetX = styles?.shadowOffsetX ?? 0
    const offsetY = styles?.shadowOffsetY ?? 4
    
    return `${offsetX}px ${offsetY}px ${blur}px ${spread}px ${colorValueToCss(color)}`
}

// Helper to render icons
export const RenderIcon = ({ style }: { style: any }) => {
    if (!style?.icon) return null
    
    const IconComp = (HeroIcons as any)[style.icon]
    if (!IconComp) return null

    const iconColor = style.iconColor?.solid || 'currentColor'
    const hasBackground = style.showIconBackground
    const bgColor = style.iconBackgroundColor?.solid || '#ffffff'
    const bgOpacity = (style.iconBackgroundOpacity ?? 20) / 100

    return (
        <div 
            className="flex items-center justify-center rounded-md relative overflow-hidden shrink-0"
            style={{
                width: hasBackground ? '24px' : '16px',
                height: hasBackground ? '24px' : '16px',
            }}
        >
             {hasBackground && (
                 <div 
                    className="absolute inset-0" 
                    style={{ backgroundColor: bgColor, opacity: bgOpacity }} 
                 />
             )}
             
             <IconComp 
                className="relative z-10" 
                style={{ 
                    width: '14px', 
                    height: '14px', 
                    color: iconColor 
                }} 
             />
        </div>
    )
}

// Interactive button preview
export const AnimatedButtonPreview = ({ component, styles, baseStyle }: { 
    component: ComponentConfig, 
    styles: any, 
    baseStyle: React.CSSProperties 
}) => {
    const clickAnimation = styles?.clickAnimation || 'scale'
    const [animationKey, setAnimationKey] = React.useState(0)
    
    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setAnimationKey(prev => prev + 1)
    }
    
    const getAnimationName = () => {
        switch (clickAnimation) {
            case 'scale': return 'btnScaleAnim'
            case 'pulse': return 'btnPulseAnim'
            case 'opacity': return 'btnOpacityAnim'
            default: return 'none'
        }
    }
    
    const animationStyle: React.CSSProperties = clickAnimation !== 'none' ? {
        animation: `${getAnimationName()} 0.3s ease-out`,
    } : {}
    
    return (
        <>
            <style>{`
                @keyframes btnScaleAnim {
                    0% { transform: scale(1); }
                    50% { transform: scale(0.88); }
                    100% { transform: scale(1); }
                }
                @keyframes btnPulseAnim {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.12); }
                    100% { transform: scale(1); }
                }
                @keyframes btnOpacityAnim {
                    0% { opacity: 1; }
                    50% { opacity: 0.4; }
                    100% { opacity: 1; }
                }
            `}</style>
            <button 
                key={animationKey}
                type="button"
                className="px-6 py-3 font-semibold text-sm cursor-pointer select-none flex items-center justify-center gap-2"
                style={{ 
                    ...baseStyle, 
                    ...animationStyle,
                    pointerEvents: 'auto' 
                }}
                onClick={handleClick}
            >
                {styles?.iconPosition !== 'right' && <RenderIcon style={styles} />}
                <span className="truncate">{component.name}</span>
                {styles?.iconPosition === 'right' && <RenderIcon style={styles} />}
            </button>
        </>
    )
}

// Interactive Input Preview
export const InteractiveInputPreview = ({ styles, baseStyle }: { styles: any, baseStyle: React.CSSProperties }) => {
    const [value, setValue] = React.useState('')
    const [isFocused, setIsFocused] = React.useState(false)
    const [inputState, setInputState] = React.useState<'default' | 'valid' | 'invalid'>('default')
    
    const getStateStyles = () => {
        switch (inputState) {
            case 'valid':
                return { 
                    borderColor: colorValueToCss(styles?.validBorderColor || { mode: 'solid', solid: '#10B981' }),
                    backgroundColor: colorValueToCss(styles?.validBackgroundColor || (styles?.backgroundColor || { mode: 'solid', solid: '#f9fafb' })),
                    boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.1)' 
                }
            case 'invalid':
                return { 
                    borderColor: colorValueToCss(styles?.invalidBorderColor || { mode: 'solid', solid: '#EF4444' }),
                    backgroundColor: colorValueToCss(styles?.invalidBackgroundColor || (styles?.backgroundColor || { mode: 'solid', solid: '#f9fafb' })),
                    boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)' 
                }
            default:
                if (isFocused) {
                    return { 
                        borderColor: colorValueToCss(styles?.focusBorderColor || styles?.borderColor || { mode: 'solid', solid: '#3B82F6' }),
                        backgroundColor: colorValueToCss(styles?.focusBackgroundColor || (styles?.backgroundColor || { mode: 'solid', solid: '#f9fafb' })),
                        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)' 
                    }
                }
                return {}
        }
    }
    
    return (
        <div className="w-full max-w-xs space-y-3">
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">Email Address</label>
                <div className="relative flex items-center">
                    {styles?.icon && styles.iconPosition !== 'right' && (
                        <div className="absolute left-3">
                            <RenderIcon style={styles} />
                        </div>
                    )}
                    <input
                        type="text"
                        placeholder="name@example.com"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        className={clsx(
                            "w-full py-3 text-sm outline-none transition-all",
                            styles?.icon && styles.iconPosition !== 'right' ? "pl-11 pr-4" : "px-4",
                            styles?.icon && styles.iconPosition === 'right' ? "pr-11 pl-4" : "px-4"
                        )}
                        style={{
                            ...baseStyle,
                            backgroundColor: styles?.backgroundColor?.solid || '#f9fafb',
                            ...getStateStyles()
                        }}
                    />
                    {styles?.icon && styles.iconPosition === 'right' && (
                        <div className="absolute right-3">
                            <RenderIcon style={styles} />
                        </div>
                    )}
                </div>
            </div>
            <div className="flex gap-1">
                {(['default', 'valid', 'invalid'] as const).map((state) => (
                    <button
                        key={state}
                        onClick={() => setInputState(state)}
                        className={clsx(
                            "px-2 py-1 text-[10px] font-medium rounded transition-all capitalize",
                            inputState === state 
                                ? "bg-gray-900 text-white" 
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                    >
                        {state}
                    </button>
                ))}
            </div>
        </div>
    )
}

// Interactive Tabbar Preview
export const InteractiveTabbarPreview = ({ styles }: { styles: any }) => {
    const [activeTab, setActiveTab] = React.useState(0)
    const tabs = ['Home', 'Profile', 'Settings']
    
    return (
        <div 
            className="flex gap-1 p-1 rounded-xl"
            style={{ backgroundColor: styles?.backgroundColor?.solid || '#f1f5f9' }}
        >
            {tabs.map((tab, i) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(i)}
                    className={clsx(
                        "px-4 py-2 text-xs font-medium rounded-lg transition-all",
                        activeTab === i ? "bg-white" : "hover:bg-white/50"
                    )}
                    style={{ color: activeTab === i ? styles?.textColor?.solid || '#000' : '#64748b' }}
                >
                    {tab}
                </button>
            ))}
        </div>
    )
}

// Interactive Accordion Preview
export const InteractiveAccordionPreview = ({ styles, baseStyle, componentName }: { styles: any, baseStyle: React.CSSProperties, componentName: string }) => {
    const [isOpen, setIsOpen] = React.useState(false)
    
    return (
        <div className="w-full max-w-sm" style={baseStyle}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-black/5 transition-colors"
                style={{ color: styles?.textColor?.solid || '#000' }}
            >
                <div className="flex items-center gap-2">
                    <RenderIcon style={styles} />
                    <span className="text-sm font-medium">Click to expand</span>
                </div>
                <svg 
                    className={clsx("w-4 h-4 transition-transform", isOpen && "rotate-180")} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="px-4 pb-3 text-xs text-gray-600 animate-in slide-in-from-top-2 duration-200">
                    This is the accordion content that shows when expanded.
                </div>
            )}
        </div>
    )
}

// Avatar/Profile Preview
export const AvatarPreview = ({ styles, baseStyle }: { styles: any, baseStyle: React.CSSProperties }) => {
    return (
        <div className="flex items-center gap-4">
            <div 
                className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-xl overflow-hidden"
                style={{
                    borderRadius: styles?.borderRadius ?? '50%',
                    border: baseStyle.border,
                    boxShadow: baseStyle.boxShadow,
                }}
            >
                JD
            </div>
            <div className="space-y-1">
                <div className="font-semibold text-sm" style={{ color: styles?.textColor?.solid || '#1f2937' }}>John Doe</div>
                <div className="text-xs text-gray-500">@johndoe</div>
            </div>
        </div>
    )
}

// Navigation Item Preview
export const NavigationItemPreview = ({ styles, baseStyle }: { styles: any, baseStyle: React.CSSProperties }) => {
    const [activeIndex, setActiveIndex] = React.useState(0)
    const items = [
        { icon: 'HomeIcon', label: 'Home' },
        { icon: 'UserIcon', label: 'Profile' },
        { icon: 'Cog6ToothIcon', label: 'Settings' },
    ]

    return (
        <div 
            className="flex flex-col w-full max-w-xs rounded-xl overflow-hidden"
            style={{ backgroundColor: styles?.backgroundColor?.solid || '#f9fafb' }}
        >
            {items.map((item, i) => {
                const IconComp = (HeroIcons as any)[item.icon]
                const isActive = activeIndex === i
                return (
                    <button
                        key={item.label}
                        onClick={() => setActiveIndex(i)}
                        className={clsx(
                            "flex items-center gap-3 px-4 py-3 transition-all",
                            isActive && "bg-blue-50"
                        )}
                        style={{
                            color: isActive 
                                ? (styles?.textColor?.solid || '#3B82F6') 
                                : '#6B7280',
                        }}
                    >
                        {IconComp && <IconComp className="w-5 h-5" />}
                        <span className="text-sm font-medium">{item.label}</span>
                        {isActive && <div className="ml-auto w-1 h-5 rounded-full bg-blue-500" />}
                    </button>
                )
            })}
        </div>
    )
}

// Map Marker Preview
export const MapMarkerPreview = ({ styles, baseStyle }: { styles: any, baseStyle: React.CSSProperties }) => {
    return (
        <div className="relative w-full max-w-xs h-32 bg-gradient-to-br from-green-100 to-blue-100 rounded-xl overflow-hidden">
            {/* Fake map background */}
            <div className="absolute inset-0 opacity-30">
                <div className="absolute top-1/4 left-1/3 w-20 h-1 bg-gray-400 rotate-45" />
                <div className="absolute top-1/2 left-1/4 w-16 h-1 bg-gray-400 -rotate-12" />
                <div className="absolute bottom-1/3 right-1/3 w-24 h-1 bg-gray-400 rotate-12" />
            </div>
            {/* Map marker */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
                <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
                    style={{
                        backgroundColor: styles?.backgroundColor?.solid || '#3B82F6',
                        border: baseStyle.border,
                    }}
                >
                    <HeroIcons.MapPinIcon 
                        className="w-4 h-4" 
                        style={{ color: styles?.textColor?.solid || '#FFFFFF' }} 
                    />
                </div>
                <div 
                    className="w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent mx-auto -mt-1"
                    style={{ borderTopColor: styles?.backgroundColor?.solid || '#3B82F6' }}
                />
            </div>
        </div>
    )
}

// Calendar Event Preview
export const CalendarEventPreview = ({ styles, baseStyle }: { styles: any, baseStyle: React.CSSProperties }) => {
    return (
        <div className="w-full max-w-xs space-y-2">
            <div 
                className="p-3 rounded-lg border-l-4"
                style={{
                    backgroundColor: styles?.backgroundColor?.solid || '#EFF6FF',
                    borderLeftColor: styles?.borderColor?.solid || '#3B82F6',
                }}
            >
                <div className="flex items-start justify-between">
                    <div>
                        <div className="font-medium text-sm" style={{ color: styles?.textColor?.solid || '#1E40AF' }}>
                            Team Meeting
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">10:00 AM - 11:00 AM</div>
                    </div>
                    <div className="flex -space-x-2">
                        <div className="w-6 h-6 rounded-full bg-blue-400 border-2 border-white" />
                        <div className="w-6 h-6 rounded-full bg-green-400 border-2 border-white" />
                    </div>
                </div>
            </div>
            <div 
                className="p-3 rounded-lg border-l-4 opacity-60"
                style={{
                    backgroundColor: '#FEF3C7',
                    borderLeftColor: '#F59E0B',
                }}
            >
                <div className="font-medium text-sm text-amber-800">Lunch Break</div>
                <div className="text-xs text-gray-500 mt-0.5">12:00 PM - 1:00 PM</div>
            </div>
        </div>
    )
}

// Chat Bubble Preview
export const ChatBubblePreview = ({ styles, baseStyle }: { styles: any, baseStyle: React.CSSProperties }) => {
    return (
        <div className="w-full max-w-xs space-y-3">
            {/* Received message */}
            <div className="flex items-end gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-300 shrink-0" />
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-2 max-w-[200px]">
                    <p className="text-sm text-gray-800">Hey, how are you?</p>
                    <span className="text-[10px] text-gray-400 mt-1 block">10:30 AM</span>
                </div>
            </div>
            {/* Sent message */}
            <div className="flex items-end gap-2 justify-end">
                <div 
                    className="rounded-2xl rounded-br-sm px-4 py-2 max-w-[200px]"
                    style={{
                        backgroundColor: styles?.backgroundColor?.solid || '#3B82F6',
                        borderRadius: styles?.borderRadius ?? 16,
                    }}
                >
                    <p className="text-sm" style={{ color: styles?.textColor?.solid || '#FFFFFF' }}>
                        I'm doing great, thanks!
                    </p>
                    <span className="text-[10px] opacity-70 mt-1 block" style={{ color: styles?.textColor?.solid || '#FFFFFF' }}>
                        10:31 AM
                    </span>
                </div>
            </div>
        </div>
    )
}

// Widget Preview
export const WidgetPreview = ({ styles, baseStyle, componentName }: { styles: any, baseStyle: React.CSSProperties, componentName: string }) => {
    const isWeather = componentName?.toLowerCase().includes('weather')
    const isNews = componentName?.toLowerCase().includes('news')
    
    return (
        <div 
            className="w-full max-w-xs p-4 rounded-xl"
            style={baseStyle}
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <RenderIcon style={styles} />
                    <span className="font-semibold text-sm" style={{ color: styles?.textColor?.solid || '#1f2937' }}>
                        {isWeather ? 'Weather' : isNews ? 'News' : 'Widget'}
                    </span>
                </div>
                <HeroIcons.EllipsisHorizontalIcon className="w-5 h-5 text-gray-400" />
            </div>
            {isWeather ? (
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-3xl font-light" style={{ color: styles?.textColor?.solid || '#1f2937' }}>24°C</div>
                        <div className="text-xs text-gray-500">Partly Cloudy</div>
                    </div>
                    <HeroIcons.SunIcon className="w-12 h-12 text-yellow-400" />
                </div>
            ) : (
                <div className="space-y-2">
                    <div className="h-2 bg-gray-200 rounded w-full" />
                    <div className="h-2 bg-gray-200 rounded w-4/5" />
                    <div className="h-2 bg-gray-200 rounded w-3/5" />
                </div>
            )}
        </div>
    )
}

// Emergency/SOS Preview
export const EmergencyButtonPreview = ({ styles, baseStyle }: { styles: any, baseStyle: React.CSSProperties }) => {
    const [isPulsing, setIsPulsing] = React.useState(true)
    
    return (
        <div className="flex flex-col items-center gap-4">
            <button
                onClick={() => setIsPulsing(!isPulsing)}
                className={clsx(
                    "relative w-20 h-20 rounded-full flex items-center justify-center font-bold text-lg",
                    isPulsing && "animate-pulse"
                )}
                style={{
                    backgroundColor: styles?.backgroundColor?.solid || '#EF4444',
                    color: styles?.textColor?.solid || '#FFFFFF',
                    boxShadow: isPulsing ? '0 0 0 8px rgba(239, 68, 68, 0.3)' : baseStyle.boxShadow,
                }}
                title="Emergency SOS Button - Click to toggle pulse animation"
                aria-label="Emergency SOS Button"
            >
                <HeroIcons.ExclamationTriangleIcon className="w-8 h-8" />
            </button>
            <span className="text-xs text-gray-500">Tap to toggle pulse</span>
        </div>
    )
}

// Toggle/Switch Preview  
export const ToggleSwitchPreview = ({ styles }: { styles: any }) => {
    const [isOn, setIsOn] = React.useState(true)
    
    return (
        <div className="flex items-center gap-4">
            <button
                onClick={() => setIsOn(!isOn)}
                className={clsx(
                    "relative w-12 h-7 rounded-full transition-colors duration-200"
                )}
                style={{
                    backgroundColor: isOn 
                        ? (styles?.backgroundColor?.solid || '#3B82F6')
                        : '#D1D5DB',
                }}
                title={`Toggle switch - currently ${isOn ? 'On' : 'Off'}`}
                aria-label={`Toggle switch - ${isOn ? 'On' : 'Off'}`}
                role="switch"
                aria-checked={isOn ? "true" : "false"}
            >
                <div 
                    className={clsx(
                        "absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200",
                        isOn ? "translate-x-6" : "translate-x-1"
                    )}
                />
            </button>
            <span className="text-sm font-medium text-gray-700">
                {isOn ? 'On' : 'Off'}
            </span>
        </div>
    )
}

// Loading Spinner Preview
export const LoadingSpinnerPreview = ({ styles }: { styles: any }) => {
    return (
        <div className="flex flex-col items-center gap-4">
            <div 
                className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin"
                style={{
                    borderTopColor: styles?.backgroundColor?.solid || '#3B82F6',
                }}
            />
            <span className="text-sm text-gray-500">Loading...</span>
        </div>
    )
}

// Progress Bar Preview
export const ProgressBarPreview = ({ styles, baseStyle }: { styles: any, baseStyle: React.CSSProperties }) => {
    const [progress, setProgress] = React.useState(65)
    
    return (
        <div className="w-full max-w-xs space-y-3">
            <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm text-gray-500">{progress}%</span>
            </div>
            <div 
                className="w-full h-3 bg-gray-200 rounded-full overflow-hidden"
                style={{ borderRadius: styles?.borderRadius ?? 9999 }}
            >
                <div 
                    className="h-full transition-all duration-300"
                    style={{
                        width: `${progress}%`,
                        backgroundColor: styles?.backgroundColor?.solid || '#3B82F6',
                        borderRadius: styles?.borderRadius ?? 9999,
                    }}
                />
            </div>
            <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => setProgress(parseInt(e.target.value))}
                className="w-full accent-blue-500"
                title="Adjust progress value"
                aria-label="Progress slider"
            />
        </div>
    )
}

// Infer component type from id and name
const inferComponentType = (component: ComponentConfig): string => {
    const id = component.id?.toLowerCase() || ''
    const name = component.name?.toLowerCase() || ''
    const filePath = component.mobileConfig?.filePath?.toLowerCase() || ''
    
    // Check explicit type first
    if (component.type) return component.type
    
    // Infer from identifiers
    if (id.includes('button') || name.includes('button')) return 'button'
    if (id.includes('input') || name.includes('input') || id.includes('form') || id.includes('field') || id.includes('text-field')) return 'input'
    if (id.includes('card') || name.includes('card') || id.includes('toast') || id.includes('modal') || id.includes('sheet')) return 'card'
    if (id.includes('tab') || id.includes('nav') || id.includes('menu')) return 'tabbar'
    if (id.includes('accordion') || id.includes('collapse') || id.includes('expand')) return 'accordion'
    if (id.includes('badge') || id.includes('status') || id.includes('indicator') || id.includes('dot') || id.includes('chip')) return 'badge'
    if (id.includes('avatar') || id.includes('profile') || name.includes('avatar') || name.includes('profile')) return 'avatar'
    if (id.includes('map') || id.includes('marker') || id.includes('location') || filePath.includes('map')) return 'map'
    if (id.includes('calendar') || id.includes('event') || id.includes('schedule') || filePath.includes('calendar')) return 'calendar'
    if (id.includes('chat') || id.includes('message') || id.includes('bubble') || filePath.includes('chat')) return 'chat'
    if (id.includes('widget') || id.includes('weather') || id.includes('news') || filePath.includes('widget')) return 'widget'
    if (id.includes('sos') || id.includes('emergency') || id.includes('panic') || filePath.includes('emergency') || filePath.includes('safety')) return 'emergency'
    if (id.includes('toggle') || id.includes('switch')) return 'toggle'
    if (id.includes('loading') || id.includes('spinner') || id.includes('loader')) return 'loading'
    if (id.includes('progress') || id.includes('bar')) return 'progress'
    if (id.includes('navigation') || filePath.includes('navigation')) return 'navigation'
    
    return 'generic'
}

// Type-specific preview renderer
export const renderPreview = (component: ComponentConfig, styles: any) => {
    const bgValue = styles?.backgroundColor
    const bgCss = bgValue ? colorValueToCss(bgValue) : 'transparent'
    
    const baseStyle = {
        background: bgCss,
        color: styles?.textColor?.solid || '#000',
        borderRadius: styles?.borderRadius || 0,
        border: `${styles?.borderWidth || 1}px solid ${styles?.borderColor?.solid || 'transparent'}`,
        padding: styles?.padding !== undefined ? `${styles.padding}px` : '12px 24px',
        boxShadow: getShadowStyle(styles),
        opacity: (styles?.opacity !== undefined ? styles.opacity : 100) / 100,
        transition: 'all 0.3s ease'
    }

    const componentType = inferComponentType(component)

    switch (componentType) {
        case 'button':
            return <AnimatedButtonPreview 
                key={`btn-${styles?.clickAnimation || 'default'}`}
                component={component} 
                styles={styles} 
                baseStyle={baseStyle} 
            />

        case 'input':
            return <InteractiveInputPreview styles={styles} baseStyle={baseStyle} />

        case 'card':
            return (
                <div 
                    className="w-full max-w-xs"
                    style={{
                        ...baseStyle,
                        padding: 0,
                        overflow: 'hidden'
                    }}
                >
                    <div className="h-24 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <RenderIcon style={styles} />
                            <h4 className="font-semibold text-sm" style={{ color: styles?.textColor?.solid || '#1f2937' }}>
                                Card Title
                            </h4>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">
                            Sample card description with preview content.
                        </p>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-300" />
                            <span className="text-xs text-gray-600">John Doe</span>
                        </div>
                    </div>
                </div>
            )

        case 'badge':
            return (
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div 
                            className="w-2.5 h-2.5 rounded-full animate-pulse"
                            style={{ backgroundColor: styles?.backgroundColor?.solid || '#10B981' }}
                        />
                        <span className="text-sm font-medium" style={{ color: styles?.textColor?.solid || '#059669' }}>
                            Online
                        </span>
                    </div>
                    <span 
                        className="px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5"
                        style={{ 
                            backgroundColor: styles?.backgroundColor?.solid || '#10B981',
                            color: styles?.textColor?.solid || '#FFFFFF'
                        }}
                    >
                        <RenderIcon style={styles} />
                        New
                    </span>
                </div>
            )

        case 'tabbar':
            // Robust check for Icon Selection Tabs
            if (component.id === 'selection-tabs' || component.mobileConfig?.componentName === 'CircleSelectionTabs') {
                return (
                   <div style={{ padding: 8, borderRadius: 12, boxShadow: 'none' }}>
                        <SelectionTabs 
                            activeTab="personal"
                            onChange={() => {}}
                            tabs={[
                                { id: 'personal', label: 'Personal', icon: <HeroIcons.UserIcon className="w-6 h-6" /> },
                                { id: 'finance', label: 'Finance', icon: <HeroIcons.BanknotesIcon className="w-6 h-6" /> },
                                { id: 'health', label: 'Health', icon: <HeroIcons.HeartIcon className="w-6 h-6" /> },
                            ]}
                            activeColor={component.config?.activeColor}
                            inactiveColor={component.config?.inactiveColor}
                            activeTextColor={component.config?.activeTextColor}
                            inactiveTextColor={component.config?.inactiveTextColor}
                            activeIconColor={component.config?.activeIconColor}
                            inactiveIconColor={component.config?.inactiveIconColor}
                            menuBackgroundColor={component.config?.menuBackgroundColor}
                            borderRadius={styles?.borderRadius}
                            fit={component.config?.fit ?? true}
                            menuShowShadow={component.config?.menuShowShadow}
                            activeShowShadow={component.config?.activeShowShadow}
                            inactiveShowShadow={component.config?.inactiveShowShadow}
                        />
                   </div>
                )
            }
            return <InteractiveTabbarPreview styles={styles} />

        case 'accordion':
            return <InteractiveAccordionPreview styles={styles} baseStyle={baseStyle} componentName={component.name} />

        case 'avatar':
            return <AvatarPreview styles={styles} baseStyle={baseStyle} />

        case 'navigation':
            return <NavigationItemPreview styles={styles} baseStyle={baseStyle} />

        case 'map':
            return <MapMarkerPreview styles={styles} baseStyle={baseStyle} />

        case 'calendar':
            return <CalendarEventPreview styles={styles} baseStyle={baseStyle} />

        case 'chat':
            return <ChatBubblePreview styles={styles} baseStyle={baseStyle} />

        case 'widget':
            return <WidgetPreview styles={styles} baseStyle={baseStyle} componentName={component.name} />

        case 'emergency':
            return <EmergencyButtonPreview styles={styles} baseStyle={baseStyle} />

        case 'toggle':
            return <ToggleSwitchPreview styles={styles} />

        case 'loading':
            return <LoadingSpinnerPreview styles={styles} />

        case 'progress':
            return <ProgressBarPreview styles={styles} baseStyle={baseStyle} />

        default:
            if (component.id?.includes('toast') || component.name?.toLowerCase().includes('toast')) {
                return (
                    <div 
                        className="w-full max-w-xs flex items-start gap-3 p-4 shadow-xl"
                        style={baseStyle}
                    >
                        <div className="flex-shrink-0">
                            <RenderIcon style={styles} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold" style={{ color: styles?.textColor?.solid || '#FFFFFF' }}>Success!</p>
                            <p className="text-xs opacity-80" style={{ color: styles?.textColor?.solid || '#FFFFFF' }}>Your changes have been saved.</p>
                        </div>
                    </div>
                )
            }
            return (
                <div 
                    className="px-6 py-4 text-sm font-medium rounded-lg flex items-center gap-2"
                    style={baseStyle}
                >
                    <RenderIcon style={styles} />
                    {component.name}
                </div>
            )
    }
}
