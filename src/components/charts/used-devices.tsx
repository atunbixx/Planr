"use client"

import React from 'react'

type Props = {
  className?: string
  timeFrame?: string
}

export function UsedDevices({ className }: Props) {
  return (
    <div className={className}>
      <div className="rounded-lg border p-4 bg-white dark:bg-gray-50">
        <div className="text-sm text-[#475569]">Used Devices</div>
        <div className="text-xs text-[#64748b] mt-1">Chart placeholder</div>
      </div>
    </div>
  )
}

