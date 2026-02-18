'use client'

import { HTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface TableProps extends HTMLAttributes<HTMLTableElement> {
  variant?: 'default' | 'frosted'
}

export const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <div className="overflow-x-auto rounded-xl macos-card">
        <table
          ref={ref}
          className={clsx(
            'w-full border-collapse',
            className
          )}
          {...props}
        >
          {children}
        </table>
      </div>
    )
  }
)

Table.displayName = 'Table'

export const TableHeader = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead
      ref={ref}
      className={clsx('bg-gray-50/50 border-b border-gray-200/50', className)}
      {...props}
    />
  )
)

TableHeader.displayName = 'TableHeader'

export const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody
      ref={ref}
      className={clsx('divide-y divide-gray-200/30', className)}
      {...props}
    />
  )
)

TableBody.displayName = 'TableBody'

export const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement> & { hoverable?: boolean }>(
  ({ className, hoverable = true, ...props }, ref) => (
    <tr
      ref={ref}
      className={clsx(
        'transition-colors duration-200',
        hoverable && 'hover:bg-gray-50/50 cursor-pointer',
        className
      )}
      {...props}
    />
  )
)

TableRow.displayName = 'TableRow'

export const TableHead = forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={clsx(
        'px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider',
        className
      )}
      {...props}
    />
  )
)

TableHead.displayName = 'TableHead'

export const TableCell = forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={clsx('px-6 py-4 text-sm text-gray-900', className)}
      {...props}
    />
  )
)

TableCell.displayName = 'TableCell'

