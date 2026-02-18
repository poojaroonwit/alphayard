'use client'

import React from 'react'

interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  center?: boolean
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = '',
  maxWidth = 'full',
  padding = 'md',
  center = true
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  }

  const paddingClasses = {
    none: '',
    sm: 'px-2 sm:px-4',
    md: 'px-4 sm:px-6 lg:px-8',
    lg: 'px-6 sm:px-8 lg:px-12'
  }

  const containerClasses = [
    'w-full',
    maxWidthClasses[maxWidth],
    paddingClasses[padding],
    center ? 'mx-auto' : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={containerClasses}>
      {children}
    </div>
  )
}

interface ResponsiveGridProps {
  children: React.ReactNode
  cols?: {
    default: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  cols = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = 'md',
  className = ''
}) => {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  }

  const gridColsClasses = [
    `grid-cols-${cols.default}`,
    cols.sm ? `sm:grid-cols-${cols.sm}` : '',
    cols.md ? `md:grid-cols-${cols.md}` : '',
    cols.lg ? `lg:grid-cols-${cols.lg}` : '',
    cols.xl ? `xl:grid-cols-${cols.xl}` : ''
  ].filter(Boolean).join(' ')

  const containerClasses = [
    'grid',
    gridColsClasses,
    gapClasses[gap],
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={containerClasses}>
      {children}
    </div>
  )
}

interface ResponsiveFlexProps {
  children: React.ReactNode
  direction?: 'row' | 'col'
  responsiveDirection?: {
    sm?: 'row' | 'col'
    md?: 'row' | 'col'
    lg?: 'row' | 'col'
  }
  wrap?: boolean
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly'
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch'
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

export const ResponsiveFlex: React.FC<ResponsiveFlexProps> = ({
  children,
  direction = 'row',
  responsiveDirection = {},
  wrap = false,
  justify = 'start',
  align = 'start',
  gap = 'md',
  className = ''
}) => {
  const directionClasses = [
    `flex-${direction}`,
    responsiveDirection.sm ? `sm:flex-${responsiveDirection.sm}` : '',
    responsiveDirection.md ? `md:flex-${responsiveDirection.md}` : '',
    responsiveDirection.lg ? `lg:flex-${responsiveDirection.lg}` : ''
  ].filter(Boolean).join(' ')

  const justifyClasses = {
    start: 'justify-start',
    end: 'justify-end',
    center: 'justify-center',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  }

  const alignClasses = {
    start: 'items-start',
    end: 'items-end',
    center: 'items-center',
    baseline: 'items-baseline',
    stretch: 'items-stretch'
  }

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  }

  const containerClasses = [
    'flex',
    directionClasses,
    wrap ? 'flex-wrap' : '',
    justifyClasses[justify],
    alignClasses[align],
    gapClasses[gap],
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={containerClasses}>
      {children}
    </div>
  )
}

interface ResponsiveTextProps {
  children: React.ReactNode
  size?: {
    default: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
    sm?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
    md?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
    lg?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
  }
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
  color?: 'gray' | 'red' | 'green' | 'blue' | 'yellow' | 'purple' | 'pink'
  className?: string
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  size = { default: 'base' },
  weight = 'normal',
  color = 'gray',
  className = ''
}) => {
  const sizeClasses = [
    `text-${size.default}`,
    size.sm ? `sm:text-${size.sm}` : '',
    size.md ? `md:text-${size.md}` : '',
    size.lg ? `lg:text-${size.lg}` : ''
  ].filter(Boolean).join(' ')

  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  }

  const colorClasses = {
    gray: 'text-gray-900',
    red: 'text-red-600',
    green: 'text-green-600',
    blue: 'text-blue-600',
    yellow: 'text-yellow-600',
    purple: 'text-purple-600',
    pink: 'text-pink-600'
  }

  const textClasses = [
    sizeClasses,
    weightClasses[weight],
    colorClasses[color],
    className
  ].filter(Boolean).join(' ')

  return (
    <span className={textClasses}>
      {children}
    </span>
  )
}
