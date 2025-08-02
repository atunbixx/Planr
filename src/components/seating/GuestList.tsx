'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { GuestCard } from './GuestCard'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Users } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface Guest {
  id: string
  name: string
  email?: string
  rsvp_status?: string
  table_id?: string | null
}

interface GuestListProps {
  guests: Guest[]
  searchTerm: string
  onSearchChange: (term: string) => void
}

export function GuestList({ guests, searchTerm, onSearchChange }: GuestListProps) {
  const [filterStatus, setFilterStatus] = useState<string | null>(null)

  const { setNodeRef, isOver } = useDroppable({
    id: 'guest-list',
  })

  // Filter guests
  const filteredGuests = guests.filter(guest => {
    const matchesSearch = searchTerm === '' || 
      guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.email?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = !filterStatus || guest.rsvp_status === filterStatus

    return matchesSearch && matchesStatus
  })

  // Count guests by status
  const statusCounts = guests.reduce((acc, guest) => {
    const status = guest.rsvp_status || 'pending'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const unassignedCount = guests.filter(g => !g.table_id).length

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-3">Guest List</h2>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search guests..."
            className="pl-10"
          />
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {guests.length} total guests
          </span>
          <Badge variant={unassignedCount > 0 ? "destructive" : "secondary"}>
            {unassignedCount} unassigned
          </Badge>
        </div>

        {/* RSVP Status Filters */}
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={filterStatus === null ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilterStatus(null)}
          >
            All ({guests.length})
          </Badge>
          {Object.entries(statusCounts).map(([status, count]) => (
            <Badge
              key={status}
              variant={filterStatus === status ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setFilterStatus(status)}
            >
              {status} ({count})
            </Badge>
          ))}
        </div>
      </div>

      {/* Guest List */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 overflow-y-auto p-4 space-y-2",
          isOver && "bg-accent/10"
        )}
      >
        <SortableContext
          items={filteredGuests.map(g => g.id)}
          strategy={verticalListSortingStrategy}
        >
          {filteredGuests.length > 0 ? (
            filteredGuests.map(guest => (
              <GuestCard
                key={guest.id}
                guest={guest}
                isAssigned={!!guest.table_id}
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No guests found</p>
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  )
}