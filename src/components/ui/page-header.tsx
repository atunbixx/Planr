"use client"

import React from 'react'

type PageHeaderProps = {
  kicker?: string
  title: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ kicker, title, subtitle, actions, className = '' }: PageHeaderProps) {
  return (
    <div className={`flex items-end justify-between ${className}`}>
      <div>
        {kicker && <div className="meta mb-1">{kicker}</div>}
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-slate-600 dark:text-neutral-300">{subtitle}</p>
        )}
      </div>
      {actions ? (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  )
}

