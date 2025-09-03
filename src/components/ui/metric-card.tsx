"use client"

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type MetricCardProps = {
  label: string
  value: React.ReactNode
  subtitle?: string
  className?: string
}

export function MetricCard({ label, value, subtitle, className }: MetricCardProps) {
  return (
    <Card className={cn('h-full bg-white border border-stroke shadow-card-2 dark:bg-dark-2 dark:border-dark-3', className)}>
      <CardContent className="p-6">
        <div className="text-sm text-[#475569] dark:text-neutral-400">{label}</div>
        <div className="text-2xl font-bold mt-2 text-dark dark:text-white">{value}</div>
        {subtitle ? (
          <div className="text-xs text-[#64748B] mt-1 dark:text-dark-6">{subtitle}</div>
        ) : null}
      </CardContent>
    </Card>
  )
}

export default MetricCard

