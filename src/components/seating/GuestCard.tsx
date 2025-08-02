'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Badge } from '@/components/ui/badge'
import { GripVertical, Mail, CheckCircle, XCircle, Clock } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface Guest {
  id: string
  name: string
  email?: string
  rsvp_status?: string
  table_id?: string | null
}

interface GuestCardProps {
  guest: Guest
  isAssigned: boolean
}

export function GuestCard({ guest, isAssigned }: GuestCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: guest.id,
    data: {
      type: 'guest',
      guest,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const getRsvpIcon = () => {
    switch (guest.rsvp_status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'declined':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getRsvpBadgeVariant = () => {
    switch (guest.rsvp_status) {
      case 'confirmed':
        return 'default' as const
      case 'declined':
        return 'destructive' as const
      default:
        return 'secondary' as const
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-white border rounded-lg p-3 cursor-move transition-all",
        isDragging && "opacity-50 shadow-lg z-50",
        isAssigned && "opacity-60"
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-3">
        <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium truncate">{guest.name}</h4>
            {getRsvpIcon()}
          </div>
          {guest.email && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Mail className="h-3 w-3" />
              <span className="truncate">{guest.email}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {guest.rsvp_status && (
            <Badge variant={getRsvpBadgeVariant()} className="text-xs">
              {guest.rsvp_status}
            </Badge>
          )}
          {isAssigned && (
            <Badge variant="outline" className="text-xs">
              Seated
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}