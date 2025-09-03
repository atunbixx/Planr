"use client"

import React from 'react'
import { SectionCard, SectionCardBody } from '@/components/ui/section-card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/ui/skeleton'

export function TableSectionSkeleton({ columns = 5, rows = 6 }: { columns?: number; rows?: number }) {
  const cols = Array.from({ length: columns })
  const rws = Array.from({ length: rows })
  return (
    <SectionCard>
      <SectionCardBody>
        <Table variant="bare">
          <TableHeader>
            <TableRow>
              {cols.map((_, i) => (
                <TableHead key={i}><Skeleton className="h-4 w-24" /></TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rws.map((_, r) => (
              <TableRow key={r}>
                {cols.map((__, c) => (
                  <TableCell key={c}><Skeleton className="h-4 w-full max-w-[200px]" /></TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCardBody>
    </SectionCard>
  )
}

export function MetricCardsSkeleton({ count = 4 }: { count?: number }) {
  const items = Array.from({ length: count })
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((_, i) => (
        <div key={i} className="bg-white border border-stroke shadow-card-2 dark:bg-dark-2 dark:border-dark-3 rounded-none">
          <div className="p-6">
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SectionBlockSkeleton({ lines = 3 }: { lines?: number }) {
  const arr = Array.from({ length: lines })
  return (
    <SectionCard>
      <SectionCardBody>
        <div className="space-y-2">
          {arr.map((_, i) => (
            <Skeleton key={i} className={`h-4 ${i === 0 ? 'w-3/4' : i === arr.length - 1 ? 'w-4/6' : 'w-full'}`} />
          ))}
        </div>
      </SectionCardBody>
    </SectionCard>
  )
}

