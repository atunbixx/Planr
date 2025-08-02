'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Users, 
  Edit2, 
  Trash2, 
  Save,
  X,
  RotateCw
} from 'lucide-react'
import { cn } from '@/utils/cn'

export interface Table {
  id: string
  name: string
  table_type: 'round' | 'rectangle' | 'square' | 'custom'
  capacity: number
  x_position: number
  y_position: number
  width: number
  height: number
  rotation: number
  notes?: string
}

export interface Guest {
  id: string
  name: string
  email?: string
  rsvp_status?: string
}

interface SeatingTableProps {
  table: Table
  guests: Guest[]
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<Table>) => void
  onDelete: () => void
  isDraggable?: boolean
}

export function SeatingTable({ 
  table, 
  guests, 
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  isDraggable = true
}: SeatingTableProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: table.name,
    capacity: table.capacity
  })

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({
    id: table.id,
    disabled: !isDraggable || isEditing,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    left: `${table.x_position}px`,
    top: `${table.y_position}px`,
    width: `${table.width}px`,
    height: `${table.height}px`,
    transform: `rotate(${table.rotation}deg)`,
  }

  const handleSave = () => {
    onUpdate({
      name: editForm.name,
      capacity: editForm.capacity
    })
    setIsEditing(false)
  }

  const handleRotate = () => {
    onUpdate({
      rotation: (table.rotation + 45) % 360
    })
  }

  const occupancy = guests.length
  const occupancyPercentage = (occupancy / table.capacity) * 100
  const isFull = occupancy >= table.capacity
  const isOverCapacity = occupancy > table.capacity

  const getTableShape = () => {
    switch (table.table_type) {
      case 'round':
        return 'rounded-full'
      case 'square':
        return 'rounded-lg'
      case 'rectangle':
        return 'rounded-lg'
      default:
        return 'rounded-lg'
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'absolute cursor-move transition-all',
        isDragging && 'opacity-50 z-50',
        isSelected && 'ring-4 ring-accent ring-offset-2'
      )}
      onClick={onSelect}
      {...attributes}
      {...listeners}
    >
      <div
        className={cn(
          'relative bg-white border-2 shadow-lg flex flex-col items-center justify-center p-4',
          getTableShape(),
          isOverCapacity ? 'border-red-500 bg-red-50' : 
          isFull ? 'border-orange-500 bg-orange-50' : 
          'border-gray-300',
          'hover:shadow-xl transition-shadow'
        )}
        style={{
          width: table.width,
          height: table.height,
        }}
      >
        {/* Table content */}
        {!isEditing ? (
          <>
            <h3 className="font-semibold text-center mb-1">{table.name}</h3>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span className={cn(
                isOverCapacity && 'text-red-600 font-semibold'
              )}>
                {occupancy}/{table.capacity}
              </span>
            </div>
            
            {/* Occupancy indicator */}
            <div className="w-full max-w-[100px] bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className={cn(
                  "h-2 rounded-full transition-all",
                  isOverCapacity ? "bg-red-500" :
                  occupancyPercentage > 80 ? "bg-orange-500" :
                  "bg-green-500"
                )}
                style={{ width: `${Math.min(occupancyPercentage, 100)}%` }}
              />
            </div>

            {/* Guest preview */}
            {guests.length > 0 && (
              <div className="mt-2 text-xs text-gray-500 text-center">
                {guests.slice(0, 3).map(g => g.name.split(' ')[0]).join(', ')}
                {guests.length > 3 && ` +${guests.length - 3}`}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-2 w-full max-w-[120px]">
            <Input
              value={editForm.name}
              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Table name"
              className="text-center text-sm"
              onClick={(e) => e.stopPropagation()}
            />
            <Input
              type="number"
              value={editForm.capacity}
              onChange={(e) => setEditForm(prev => ({ ...prev, capacity: parseInt(e.target.value) || 1 }))}
              min={1}
              max={20}
              className="text-center text-sm"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* Action buttons */}
        {isSelected && (
          <div className="absolute -top-10 right-0 flex gap-1">
            {!isEditing ? (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsEditing(true)
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRotate()
                  }}
                  className="h-8 w-8 p-0"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="default"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSave()
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Save className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditForm({
                      name: table.name,
                      capacity: table.capacity
                    })
                    setIsEditing(false)
                  }}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}