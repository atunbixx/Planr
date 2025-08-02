'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { format, startOfWeek, addDays, differenceInDays, isWithinInterval } from 'date-fns'
import { Task, TimelineItem, Milestone } from '@/types/timeline'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/button'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  Circle,
  Square
} from 'lucide-react'

interface TimelineGanttChartProps {
  tasks: Task[]
  timelineItems: TimelineItem[]
  milestones: Milestone[]
  viewMode: 'day' | 'week' | 'month'
  startDate?: Date
  endDate?: Date
  onItemClick?: (item: Task | TimelineItem | Milestone) => void
  onItemDrag?: (item: Task | TimelineItem, newDate: Date) => void
  showCriticalPath?: boolean
  showDependencies?: boolean
}

export function TimelineGanttChart({
  tasks,
  timelineItems,
  milestones,
  viewMode = 'month',
  startDate: propStartDate,
  endDate: propEndDate,
  onItemClick,
  onItemDrag,
  showCriticalPath = true,
  showDependencies = true
}: TimelineGanttChartProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [draggedItem, setDraggedItem] = useState<Task | TimelineItem | null>(null)
  const [dragOffset, setDragOffset] = useState(0)

  // Calculate date range
  const { startDate, endDate, days } = useMemo(() => {
    let start = propStartDate || new Date()
    let end = propEndDate || addDays(new Date(), 365)

    // Adjust based on view mode
    if (viewMode === 'day') {
      start = addDays(currentDate, -3)
      end = addDays(currentDate, 3)
    } else if (viewMode === 'week') {
      start = startOfWeek(currentDate)
      end = addDays(start, 28) // 4 weeks
    } else {
      start = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
      end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0)
    }

    const dayCount = differenceInDays(end, start) + 1
    return { startDate: start, endDate: end, days: dayCount }
  }, [currentDate, viewMode, propStartDate, propEndDate])

  // Generate date columns
  const dateColumns = useMemo(() => {
    const columns = []
    for (let i = 0; i < days; i++) {
      columns.push(addDays(startDate, i))
    }
    return columns
  }, [startDate, days])

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups = new Map<string, (Task | TimelineItem | Milestone)[]>()

    // Add milestones
    milestones.forEach(milestone => {
      const category = 'Milestones'
      if (!groups.has(category)) groups.set(category, [])
      groups.get(category)!.push(milestone)
    })

    // Add tasks by category
    tasks.forEach(task => {
      const category = task.category || 'Other Tasks'
      if (!groups.has(category)) groups.set(category, [])
      groups.get(category)!.push(task)
    })

    // Add timeline items
    timelineItems.forEach(item => {
      const category = 'Wedding Day Timeline'
      if (!groups.has(category)) groups.set(category, [])
      groups.get(category)!.push(item)
    })

    return groups
  }, [tasks, timelineItems, milestones])

  // Calculate item position and width
  const getItemStyle = useCallback((item: Task | TimelineItem | Milestone) => {
    let itemStart: Date
    let itemEnd: Date

    if ('target_date' in item) {
      // Milestone
      itemStart = new Date(item.target_date)
      itemEnd = itemStart
    } else if ('start_time' in item) {
      // Timeline item
      const weddingDate = new Date() // TODO: Get from context
      itemStart = new Date(weddingDate)
      itemEnd = item.end_time ? new Date(weddingDate) : itemStart
    } else {
      // Task
      itemStart = item.due_date ? new Date(item.due_date) : new Date()
      itemEnd = itemStart
    }

    const startDiff = differenceInDays(itemStart, startDate)
    const duration = differenceInDays(itemEnd, itemStart) + 1
    const left = (startDiff / days) * 100
    const width = (duration / days) * 100

    return {
      left: `${Math.max(0, left)}%`,
      width: `${Math.max(0.5, width)}%`,
      display: startDiff + duration < 0 || startDiff > days ? 'none' : 'block'
    }
  }, [startDate, days])

  // Get item color based on status and type
  const getItemColor = useCallback((item: Task | TimelineItem | Milestone) => {
    if ('status' in item && 'type' in item) {
      // Milestone
      switch (item.status) {
        case 'completed': return 'bg-green-500'
        case 'in_progress': return 'bg-blue-500'
        case 'delayed': return 'bg-red-500'
        default: return 'bg-gray-400'
      }
    } else if ('confirmed' in item) {
      // Timeline item
      return item.confirmed ? 'bg-green-600' : 'bg-orange-500'
    } else {
      // Task
      if (item.completed) return 'bg-green-500'
      if (item.critical_path && showCriticalPath) return 'bg-red-600'
      if (item.status === 'blocked') return 'bg-gray-500'
      
      switch (item.priority) {
        case 'urgent': return 'bg-red-500'
        case 'high': return 'bg-orange-500'
        case 'medium': return 'bg-blue-500'
        default: return 'bg-gray-400'
      }
    }
  }, [showCriticalPath])

  // Handle navigation
  const navigate = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      if (viewMode === 'day') {
        return direction === 'prev' ? addDays(prev, -1) : addDays(prev, 1)
      } else if (viewMode === 'week') {
        return direction === 'prev' ? addDays(prev, -7) : addDays(prev, 7)
      } else {
        const newDate = new Date(prev)
        if (direction === 'prev') {
          newDate.setMonth(newDate.getMonth() - 1)
        } else {
          newDate.setMonth(newDate.getMonth() + 1)
        }
        return newDate
      }
    })
  }

  // Handle drag and drop
  const handleDragStart = (e: React.DragEvent, item: Task | TimelineItem) => {
    setDraggedItem(item)
    const rect = e.currentTarget.getBoundingClientRect()
    setDragOffset(e.clientX - rect.left)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault()
    if (draggedItem && onItemDrag) {
      onItemDrag(draggedItem, date)
    }
    setDraggedItem(null)
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Timeline & Tasks</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[150px] text-center">
              {viewMode === 'day' && format(currentDate, 'MMMM d, yyyy')}
              {viewMode === 'week' && `Week of ${format(startOfWeek(currentDate), 'MMM d, yyyy')}`}
              {viewMode === 'month' && format(currentDate, 'MMMM yyyy')}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showCriticalPath && (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 bg-red-600 rounded" />
              <span>Critical Path</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-orange-500" />
            <span>Pending</span>
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="overflow-x-auto">
        <div className="min-w-[1200px]">
          {/* Date Headers */}
          <div className="flex border-b">
            <div className="w-64 p-2 border-r bg-gray-50">
              <span className="text-sm font-medium">Item</span>
            </div>
            <div className="flex-1 relative">
              <div className="flex">
                {dateColumns.map((date, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex-1 p-2 text-center text-xs border-r",
                      date.getDay() === 0 || date.getDay() === 6 ? "bg-gray-50" : ""
                    )}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, date)}
                  >
                    {viewMode === 'day' && format(date, 'EEE d')}
                    {viewMode === 'week' && format(date, 'd')}
                    {viewMode === 'month' && date.getDate() === 1 ? format(date, 'MMM d') : format(date, 'd')}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chart Rows */}
          {Array.from(groupedItems.entries()).map(([category, items]) => (
            <div key={category} className="border-b">
              {/* Category Header */}
              <div className="flex bg-gray-50">
                <div className="w-64 p-2 border-r font-medium text-sm">
                  {category}
                </div>
                <div className="flex-1"></div>
              </div>

              {/* Items */}
              {items.map((item, index) => (
                <div key={`${category}-${index}`} className="flex hover:bg-gray-50">
                  <div className="w-64 p-2 border-r">
                    <div className="flex items-center gap-2">
                      {'status' in item && 'type' in item ? (
                        <Square className="h-4 w-4" />
                      ) : 'confirmed' in item ? (
                        <Calendar className="h-4 w-4" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                      <span className="text-sm truncate">
                        {item.title || ('task_name' in item ? item.task_name : '')}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 relative h-12">
                    <div className="absolute inset-0 flex items-center">
                      {dateColumns.map((_, index) => (
                        <div
                          key={index}
                          className="flex-1 h-full border-r"
                        />
                      ))}
                    </div>
                    <div
                      className={cn(
                        "absolute top-2 h-8 rounded cursor-pointer transition-all hover:shadow-md",
                        getItemColor(item),
                        draggedItem === item && "opacity-50"
                      )}
                      style={getItemStyle(item)}
                      draggable={!('status' in item && 'type' in item)}
                      onDragStart={(e) => !('status' in item && 'type' in item) && handleDragStart(e, item as Task | TimelineItem)}
                      onClick={() => onItemClick?.(item)}
                    >
                      <div className="px-2 py-1 text-xs text-white truncate">
                        {item.title || ('task_name' in item ? item.task_name : '')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span className="font-medium">Priority:</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded" />
              <span>Urgent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded" />
              <span>High</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded" />
              <span>Low</span>
            </div>
          </div>
          <div className="text-gray-500">
            Drag items to reschedule • Click for details
          </div>
        </div>
      </div>
    </div>
  )
}