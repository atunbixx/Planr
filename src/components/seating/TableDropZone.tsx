'use client'

import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/utils/cn'

interface TableDropZoneProps {
  tableId: string
  children: React.ReactNode
  isOverCapacity?: boolean
}

export function TableDropZone({ tableId, children, isOverCapacity }: TableDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `table-${tableId}`,
    disabled: isOverCapacity,
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative transition-all",
        isOver && !isOverCapacity && "ring-4 ring-accent ring-offset-2",
        isOver && isOverCapacity && "ring-4 ring-red-500 ring-offset-2"
      )}
    >
      {children}
    </div>
  )
}