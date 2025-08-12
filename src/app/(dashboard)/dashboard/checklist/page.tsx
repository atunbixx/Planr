'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { 
  Plus, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Circle, 
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  Filter,
  Download
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ChecklistItem {
  id: string
  title: string
  description?: string
  category: string
  timeframe: string
  daysBeforeWedding: number
  isCompleted: boolean
  completedAt?: string
  priority: 'low' | 'medium' | 'high'
  notes?: string
}

interface TimeframeGroup {
  title: string
  range: string
  minDays: number
  maxDays: number
  items: ChecklistItem[]
  color: string
  icon: typeof Calendar
}

// Helper function to determine timeframe from due date
function getTimeframeFromDueDate(dueDate?: string): string {
  if (!dueDate) return '6-months'
  
  const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  
  if (days >= 365) return '12-months'
  if (days >= 270) return '9-months'
  if (days >= 180) return '6-months'
  if (days >= 90) return '3-months'
  if (days >= 60) return '2-months'
  if (days >= 30) return '1-month'
  if (days >= 14) return '2-weeks'
  if (days >= 7) return '1-week'
  return '1-week'
}

export default function ChecklistPage() {
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [editingItem, setEditingItem] = useState<string | null>(null)
  
  // New item form state
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    category: 'planning',
    timeframe: '12-months',
    priority: 'medium' as const
  })

  // Define timeframe groups
  const timeframeGroups: TimeframeGroup[] = [
    {
      title: '12+ Months Before',
      range: '12+ months',
      minDays: 365,
      maxDays: 9999,
      items: [],
      color: 'text-purple-600',
      icon: Calendar
    },
    {
      title: '9-12 Months Before',
      range: '9-12 months',
      minDays: 270,
      maxDays: 365,
      items: [],
      color: 'text-blue-600',
      icon: Calendar
    },
    {
      title: '6-9 Months Before',
      range: '6-9 months',
      minDays: 180,
      maxDays: 270,
      items: [],
      color: 'text-green-600',
      icon: Calendar
    },
    {
      title: '3-6 Months Before',
      range: '3-6 months',
      minDays: 90,
      maxDays: 180,
      items: [],
      color: 'text-yellow-600',
      icon: Clock
    },
    {
      title: '1-3 Months Before',
      range: '1-3 months',
      minDays: 30,
      maxDays: 90,
      items: [],
      color: 'text-orange-600',
      icon: Clock
    },
    {
      title: 'Final Month',
      range: '<1 month',
      minDays: 0,
      maxDays: 30,
      items: [],
      color: 'text-red-600',
      icon: AlertCircle
    }
  ]

  // Load checklist items
  useEffect(() => {
    loadChecklist()
  }, [])

  const loadChecklist = async () => {
    try {
      const response = await fetch('/api/checklist')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setItems(data.data || [])
          // Expand groups with incomplete items by default
          const groupsWithPending = timeframeGroups
            .filter(group => {
              const groupItems = data.data?.filter((item: ChecklistItem) => 
                item.daysBeforeWedding >= group.minDays && 
                item.daysBeforeWedding < group.maxDays &&
                !item.isCompleted
              ) || []
              return groupItems.length > 0
            })
            .map(g => g.title)
          setExpandedGroups(groupsWithPending)
        }
      }
    } catch (error) {
      console.error('Failed to load checklist:', error)
      toast.error('Failed to load checklist')
    } finally {
      setLoading(false)
    }
  }

  // Group items by timeframe
  const groupedItems = timeframeGroups.map(group => ({
    ...group,
    items: items.filter(item => 
      item.daysBeforeWedding >= group.minDays && 
      item.daysBeforeWedding < group.maxDays
    )
  }))

  // Filter items
  const filteredGroupedItems = groupedItems.map(group => ({
    ...group,
    items: group.items.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === 'all' ||
                          (filterStatus === 'completed' && item.isCompleted) ||
                          (filterStatus === 'pending' && !item.isCompleted)
      return matchesSearch && matchesStatus
    })
  }))

  // Calculate progress
  const totalItems = items.length
  const completedItems = items.filter(item => item.isCompleted).length
  const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

  // Toggle item completion
  const toggleItemCompletion = async (itemId: string) => {
    const item = items.find(i => i.id === itemId)
    if (!item) return

    try {
      const response = await api.checklist.toggleComplete(itemId)

      if (response.success) {
        await loadChecklist()
        toast.success(item.isCompleted ? 'Task marked as pending' : 'Task completed!')
      }
    } catch (error) {
      toast.error('Failed to update task')
    }
  }

  // Add new item
  const addItem = async () => {
    if (!newItem.title.trim()) {
      toast.error('Please enter a task title')
      return
    }

    // Calculate days before wedding based on timeframe
    const daysMap: Record<string, number> = {
      '12-months': 365,
      '9-months': 270,
      '6-months': 180,
      '3-months': 90,
      '1-month': 30,
      '2-weeks': 14,
      '1-week': 7
    }

    try {
      const response = await fetch('/api/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newItem,
          daysBeforeWedding: daysMap[newItem.timeframe] || 180,
          isCompleted: false
        })
      })

      if (response.ok) {
        await loadChecklist()
        setNewItem({
          title: '',
          description: '',
          category: 'planning',
          timeframe: '12-months',
          priority: 'medium'
        })
        setIsAddingItem(false)
        toast.success('Task added successfully!')
      }
    } catch (error) {
      toast.error('Failed to add task')
    }
  }

  // Delete item
  const deleteItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/checklist/${itemId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadChecklist()
        toast.success('Task deleted')
      }
    } catch (error) {
      toast.error('Failed to delete task')
    }
  }

  // Export checklist
  const exportChecklist = () => {
    const csvContent = [
      ['Task', 'Description', 'Timeframe', 'Priority', 'Status', 'Completed Date'],
      ...items.map(item => [
        item.title,
        item.description || '',
        item.timeframe,
        item.priority,
        item.isCompleted ? 'Completed' : 'Pending',
        item.completedAt || ''
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'wedding-checklist.csv'
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Checklist exported!')
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="px-8 py-12">
        <div className="animate-pulse">
          <div className="h-16 bg-gray-200/50 rounded-sm mb-8"></div>
          <div className="h-32 bg-gray-200/50 rounded-sm mb-8"></div>
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200/50 rounded-sm"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-8 py-12">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-5xl font-light tracking-wide text-gray-900 mb-2 uppercase">Wedding Checklist</h1>
        <p className="text-lg font-light text-gray-600">Stay organized with your wedding planning tasks</p>
      </div>

      {/* Progress Overview */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-light tracking-wide uppercase">Progress Overview</CardTitle>
          <CardDescription className="font-light">Track your wedding planning journey</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-light text-gray-600">Overall Progress</span>
                <span className="text-sm font-medium text-gray-900">
                  {completedItems} of {totalItems} tasks completed
                </span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
              <p className="text-xs font-light text-gray-500 mt-2">{progressPercentage}% Complete</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-light text-gray-900">{totalItems}</p>
                <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mt-1">Total Tasks</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-light text-[#7a9b7f]">{completedItems}</p>
                <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mt-1">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-light text-amber-600">{totalItems - completedItems}</p>
                <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mt-1">Remaining</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-light text-blue-600">
                  {items.filter(i => i.priority === 'high' && !i.isCompleted).length}
                </p>
                <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mt-1">High Priority</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions Bar */}
      <div className="bg-white p-6 rounded-sm shadow-sm mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-4 py-2 border border-gray-200 rounded-sm text-sm font-light focus:outline-none focus:border-gray-400"
              />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 border border-gray-200 rounded-sm text-sm font-light focus:outline-none focus:border-gray-400"
            >
              <option value="all">All Tasks</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={exportChecklist}
              variant="outline"
              className="border-gray-300 text-gray-600 hover:bg-gray-50 rounded-sm px-4 py-2 text-sm font-light"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={() => setIsAddingItem(true)}
              className="bg-[#7a9b7f] hover:bg-[#6a8b6f] text-white rounded-sm px-4 py-2 text-sm font-light"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </div>
        </div>
      </div>

      {/* Add Task Form */}
      {isAddingItem && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-light">Add New Task</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title" className="text-sm font-light">Task Title</Label>
                <Input
                  id="title"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  placeholder="e.g., Book photographer"
                  className="font-light"
                />
              </div>
              <div>
                <Label htmlFor="timeframe" className="text-sm font-light">Timeframe</Label>
                <select
                  id="timeframe"
                  value={newItem.timeframe}
                  onChange={(e) => setNewItem({ ...newItem, timeframe: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-sm text-sm font-light focus:outline-none focus:border-gray-400"
                >
                  <option value="12-months">12+ Months Before</option>
                  <option value="9-months">9-12 Months Before</option>
                  <option value="6-months">6-9 Months Before</option>
                  <option value="3-months">3-6 Months Before</option>
                  <option value="1-month">1-3 Months Before</option>
                  <option value="2-weeks">2 Weeks Before</option>
                  <option value="1-week">1 Week Before</option>
                </select>
              </div>
              <div>
                <Label htmlFor="category" className="text-sm font-light">Category</Label>
                <select
                  id="category"
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-sm text-sm font-light focus:outline-none focus:border-gray-400"
                >
                  <option value="planning">Planning</option>
                  <option value="venue">Venue</option>
                  <option value="vendors">Vendors</option>
                  <option value="attire">Attire</option>
                  <option value="guests">Guests</option>
                  <option value="decor">Decor</option>
                  <option value="legal">Legal</option>
                </select>
              </div>
              <div>
                <Label htmlFor="priority" className="text-sm font-light">Priority</Label>
                <select
                  id="priority"
                  value={newItem.priority}
                  onChange={(e) => setNewItem({ ...newItem, priority: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-sm text-sm font-light focus:outline-none focus:border-gray-400"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="description" className="text-sm font-light">Description (Optional)</Label>
                <Input
                  id="description"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Add any additional details..."
                  className="font-light"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <Button
                onClick={addItem}
                className="bg-[#7a9b7f] hover:bg-[#6a8b6f] text-white rounded-sm px-4 py-2 text-sm font-light"
              >
                Add Task
              </Button>
              <Button
                onClick={() => setIsAddingItem(false)}
                variant="outline"
                className="border-gray-300 text-gray-600 hover:bg-gray-50 rounded-sm px-4 py-2 text-sm font-light"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline Sections */}
      <div className="space-y-6">
        {filteredGroupedItems.map((group) => {
          const isExpanded = expandedGroups.includes(group.title)
          const completedInGroup = group.items.filter(i => i.isCompleted).length
          const totalInGroup = group.items.length

          if (totalInGroup === 0 && searchTerm) return null

          return (
            <Card key={group.title} className="overflow-hidden">
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setExpandedGroups(prev =>
                    prev.includes(group.title)
                      ? prev.filter(g => g !== group.title)
                      : [...prev, group.title]
                  )
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    <CardTitle className="flex items-center gap-3">
                      <span className={cn("w-3 h-3 rounded-full", group.color.replace('text-', 'bg-'))} />
                      <span className="font-light tracking-wide">{group.title}</span>
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-4">
                    {totalInGroup > 0 && (
                      <>
                        <span className="text-sm font-light text-gray-600">
                          {completedInGroup}/{totalInGroup} completed
                        </span>
                        <Progress 
                          value={totalInGroup > 0 ? (completedInGroup / totalInGroup) * 100 : 0} 
                          className="w-24 h-2"
                        />
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {isExpanded && (
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {group.items.length === 0 ? (
                      <p className="text-sm font-light text-gray-500 text-center py-8">
                        No tasks in this timeframe
                      </p>
                    ) : (
                      group.items.map((item) => (
                        <div
                          key={item.id}
                          className={cn(
                            "flex items-start gap-3 p-4 rounded-sm border transition-all",
                            item.isCompleted
                              ? "bg-green-50/50 border-green-200"
                              : "bg-white border-gray-200 hover:border-gray-300"
                          )}
                        >
                          <Checkbox
                            checked={item.isCompleted}
                            onCheckedChange={() => toggleItemCompletion(item.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className={cn(
                                  "font-light text-gray-900",
                                  item.isCompleted && "line-through text-gray-500"
                                )}>
                                  {item.title}
                                </h4>
                                {item.description && (
                                  <p className="text-sm font-light text-gray-600 mt-1">
                                    {item.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-3 mt-2">
                                  <Badge 
                                    variant="outline" 
                                    className={cn(
                                      "text-xs font-light",
                                      getPriorityColor(item.priority)
                                    )}
                                  >
                                    {item.priority}
                                  </Badge>
                                  <span className="text-xs font-light text-gray-500">
                                    {item.category}
                                  </span>
                                  {item.completedAt && (
                                    <span className="text-xs font-light text-green-600">
                                      Completed {new Date(item.completedAt).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                                  onClick={() => setEditingItem(item.id)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                                  onClick={() => deleteItem(item.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}