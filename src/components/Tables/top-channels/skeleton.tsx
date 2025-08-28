"use client"

import React from 'react'

export function TopChannelsSkeleton() {
  return (
    <div className="rounded-lg border p-4 bg-white dark:bg-gray-50">
      <div className="h-4 w-40 bg-gray-200 animate-pulse rounded mb-3" />
      <div className="space-y-2">
        <div className="h-3 w-5/6 bg-gray-200 animate-pulse rounded" />
        <div className="h-3 w-4/6 bg-gray-200 animate-pulse rounded" />
        <div className="h-3 w-3/6 bg-gray-200 animate-pulse rounded" />
      </div>
    </div>
  )
}

