import React from 'react'

type EmptyStateProps = {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`bg-white dark:bg-gray-50 p-10 rounded-lg border text-center ${className}`}>
      {icon && <div className="text-3xl mb-2">{icon}</div>}
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-600 mb-4">{description}</p>}
      {action}
    </div>
  )
}

