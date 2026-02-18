'use client'

import { ReactNode } from 'react'
import { Card, CardBody } from './Card'
import { Button } from './Button'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card variant="frosted" className="text-center">
      <CardBody className="py-12">
        {icon && (
          <div className="mx-auto w-16 h-16 mb-4 flex items-center justify-center text-gray-400">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        {description && (
          <p className="text-gray-500 mb-6 max-w-md mx-auto">{description}</p>
        )}
        {action && (
          <Button onClick={action.onClick} variant="primary">
            {action.label}
          </Button>
        )}
      </CardBody>
    </Card>
  )
}
