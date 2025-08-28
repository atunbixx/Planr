"use client"

import React from 'react'

type Props = {
  className?: string
}

export function TopChannels({ className }: Props) {
  return (
    <div className={className}>
      <div className="rounded-lg border p-4 bg-white dark:bg-gray-50">
        <div className="text-sm text-[#475569]">Top Channels</div>
        <ul className="mt-2 text-xs text-[#64748b] list-disc pl-4">
          <li>Email</li>
          <li>SMS</li>
          <li>WhatsApp</li>
        </ul>
      </div>
    </div>
  )
}

