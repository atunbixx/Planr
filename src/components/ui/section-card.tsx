import React from 'react'

export function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-dark-2 rounded-lg border border-stroke dark:border-dark-3 ${className}`}>
      {children}
    </div>
  )
}

export function SectionCardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-6 border-b border-stroke dark:border-dark-3 ${className}`}>{children}</div>
}

export function SectionCardBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-6 ${className}`}>{children}</div>
}

export function SectionCardTitle({ kicker, title, actions, className = '' }: { kicker?: string; title: React.ReactNode; actions?: React.ReactNode; className?: string }) {
  return (
    <SectionCardHeader className={`flex items-end justify-between ${className}`}>
      <div>
        {kicker && <div className="meta mb-1">{kicker}</div>}
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </SectionCardHeader>
  )
}
