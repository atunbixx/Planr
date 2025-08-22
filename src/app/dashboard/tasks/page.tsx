'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Calendar, User, Tag, Filter, CheckCircle2, Clock, AlertCircle, Play, Pause, X, Users, CheckSquare } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
// Note: Using native textarea and label elements since shadcn components may not be available
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useAuth } from '@/hooks/useAuth'
import { TasksClient } from '@/lib/api/tasks.client'
import { TaskResponse, CreateTaskInput, UpdateTaskInput, TaskStatsResponse } from '@/features/tasks/dto/task.dto'

type TaskFormData = {
  title: string
  description: string
  category: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold'
  dueDate: string
  assignedTo: string
  timeline: string
  tags: string
  notes: string
}

const initialFormData: TaskFormData = {
  title: '',
  description: '',
  category: '',
  priority: 'medium',
  status: 'pending',
  dueDate: '',
  assignedTo: '',
  timeline: '',
  tags: '',
  notes: ''
}

const categories = [
  'Planning', 'Venue', 'Catering', 'Photography', 'Videography', 
  'Flowers', 'Music', 'Attire', 'Transportation', 'Invitations',
  'Decorations', 'Honeymoon', 'Events', 'Vendors', 'Budget', 
  'Guests', 'Self-Care', 'Preparation', 'Other'
]

export default function TasksPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  
  // State management
  const [tasks, setTasks] = useState<TaskResponse[]>([])
  const [stats, setStats] = useState<TaskStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)
  
  // Dialog state
  const [openDialog, setOpenDialog] = useState(false)
  const [editing, setEditing] = useState<TaskResponse | null>(null)
  const [formData, setFormData] = useState<TaskFormData>(initialFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Filter state
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [timelineFilter, setTimelineFilter] = useState('all')
  const [includeCompleted, setIncludeCompleted] = useState(true)

  // Auth check
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin')
    }
  }, [user, isLoading, router])

  // Fetch tasks and stats
  const fetchTasks = async () => {
    try {
      setLoading(true)
      const [tasksData, statsData] = await Promise.all([
        TasksClient.list({
          status: statusFilter !== 'all' ? statusFilter as any : undefined,
          priority: priorityFilter !== 'all' ? priorityFilter as any : undefined,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          timeline: timelineFilter !== 'all' ? timelineFilter : undefined,
          includeCompleted,
          limit: 100,
          offset: 0
        }),
        TasksClient.getStats()
      ])
      setTasks(tasksData.tasks)
      setStats(statsData)
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isLoading && user) {
      fetchTasks()
    }
  }, [isLoading, user, statusFilter, priorityFilter, categoryFilter, timelineFilter, includeCompleted])

  // Filter tasks based on search
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const searchLower = search.toLowerCase()
      return (
        task.title.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower) ||
        task.category?.toLowerCase().includes(searchLower) ||
        task.tags.some(tag => tag.toLowerCase().includes(searchLower))
      )
    })
  }, [tasks, search])

  // Update bulk actions visibility
  useEffect(() => {
    setShowBulkActions(selectedIds.length > 0)
  }, [selectedIds])

  // Form handlers
  const openAdd = () => {
    setEditing(null)
    setFormData(initialFormData)
    setErrors({})
    setOpenDialog(true)
  }

  const openEdit = (task: TaskResponse) => {
    setEditing(task)
    setFormData({
      title: task.title,
      description: task.description || '',
      category: task.category || '',
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      assignedTo: task.assignedTo || '',
      timeline: task.timeline || '',
      tags: task.tags.join(', '),
      notes: task.notes || ''
    })
    setErrors({})
    setOpenDialog(true)
  }

  const handleSave = async () => {
    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) newErrors.title = 'Title is required'
    setErrors(newErrors)
    if (Object.keys(newErrors).length) return

    const isEdit = Boolean(editing)
    const payload: CreateTaskInput | UpdateTaskInput = {
      title: formData.title,
      description: formData.description || undefined,
      category: formData.category || undefined,
      priority: formData.priority,
      status: formData.status,
      dueDate: formData.dueDate || undefined,
      assignedTo: formData.assignedTo || undefined,
      timeline: formData.timeline || undefined,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      notes: formData.notes || undefined
    }

    setSaving(true)
    
    // Optimistic update
    const tempId = `temp_${Date.now()}`
    const optimisticTask: TaskResponse = {
      id: isEdit ? editing!.id : tempId,
      userId: user!.id,
      title: payload.title || '',
      description: payload.description || null,
      category: payload.category || null,
      priority: payload.priority || 'medium',
      status: payload.status || 'pending',
      dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
      completedAt: payload.status === 'completed' ? new Date() : null,
      assignedTo: payload.assignedTo || null,
      isTemplate: false,
      templateId: null,
      timeline: payload.timeline || null,
      order: null,
      tags: payload.tags || [],
      notes: payload.notes || null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    if (isEdit) {
      setTasks(prev => prev.map(t => t.id === editing!.id ? optimisticTask : t))
    } else {
      setTasks(prev => [optimisticTask, ...prev])
    }
    
    setOpenDialog(false)

    try {
      if (isEdit) {
        const updated = await TasksClient.update(editing!.id, payload as UpdateTaskInput)
        setTasks(prev => prev.map(t => t.id === editing!.id ? updated : t))
      } else {
        const created = await TasksClient.create(payload as CreateTaskInput)
        setTasks(prev => prev.map(t => t.id === tempId ? created : t))
      }
      
      // Refresh stats
      const newStats = await TasksClient.getStats()
      setStats(newStats)
    } catch (error: any) {
      // Revert optimistic update
      if (isEdit) {
        setTasks(prev => prev.map(t => t.id === editing!.id ? editing! : t))
      } else {
        setTasks(prev => prev.filter(t => t.id !== tempId))
      }
      setErrors({ submit: error?.message || `Failed to ${isEdit ? 'update' : 'create'} task` })
      setOpenDialog(true)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (task: TaskResponse) => {
    if (!confirm(`Delete "${task.title}"?`)) return
    
    // Optimistic delete
    setTasks(prev => prev.filter(t => t.id !== task.id))
    
    try {
      await TasksClient.delete(task.id)
      const newStats = await TasksClient.getStats()
      setStats(newStats)
    } catch (error: any) {
      // Revert on error
      setTasks(prev => [...prev, task])
      alert(error?.message || 'Failed to delete task')
    }
  }

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedIds.length === filteredTasks.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredTasks.map(t => t.id))
    }
  }

  const handleSelectTask = (taskId: string) => {
    setSelectedIds(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    )
  }

  // Bulk operations
  const handleBulkStatus = async (status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold') => {
    if (!selectedIds.length) return
    
    setBulkLoading(true)
    
    // Optimistic update
    setTasks(prev => prev.map(task => 
      selectedIds.includes(task.id) 
        ? { ...task, status, completedAt: status === 'completed' ? new Date() : task.completedAt }
        : task
    ))
    
    try {
      await TasksClient.bulkUpdateStatus(selectedIds, status)
      setSelectedIds([])
      const newStats = await TasksClient.getStats()
      setStats(newStats)
    } catch (error: any) {
      // Revert on error
      fetchTasks()
      alert(error?.message || 'Failed to update task status')
    } finally {
      setBulkLoading(false)
    }
  }

  // Template creation
  const handleCreateFromTemplate = async (timeline: string) => {
    try {
      const newTasks = await TasksClient.createFromTemplate(timeline)
      setTasks(prev => [...newTasks, ...prev])
      const newStats = await TasksClient.getStats()
      setStats(newStats)
    } catch (error: any) {
      alert(error?.message || 'Failed to create tasks from template')
    }
  }

  // Priority and status styling
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'on_hold': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (isLoading || !user) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Task Management</h1>
          <p className="text-muted-foreground">Organize and track your wedding planning tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <Select onValueChange={handleCreateFromTemplate}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Create from template" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TasksClient.getAvailableTemplates()).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.in_progress}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
              {stats.total > 0 && (
                <Progress value={(stats.completed / stats.total) * 100} className="mt-2" />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completedThisWeek}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <Alert className="border-blue-200 bg-blue-50">
          <Users className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between w-full">
            <span className="font-medium">
              {selectedIds.length} task{selectedIds.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => handleBulkStatus('completed')} disabled={bulkLoading}>
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Mark Completed
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkStatus('in_progress')} disabled={bulkLoading}>
                <Play className="h-4 w-4 mr-1" />
                Mark In Progress
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkStatus('on_hold')} disabled={bulkLoading}>
                <Pause className="h-4 w-4 mr-1" />
                Put On Hold
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <Input
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={timelineFilter} onValueChange={setTimelineFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Timelines</SelectItem>
                {Object.entries(TasksClient.getAvailableTemplates()).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-completed"
                checked={includeCompleted}
                onCheckedChange={(checked) => setIncludeCompleted(checked === true)}
              />
              <label htmlFor="include-completed" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Include completed</label>
            </div>
            {filteredTasks.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleSelectAll} className="ml-auto">
                {selectedIds.length === filteredTasks.length ? 'Deselect All' : 'Select All'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-muted-foreground">Loading tasks...</div>
          </CardContent>
        </Card>
      ) : filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {tasks.length === 0 ? 'No tasks yet' : 'No tasks match your filters'}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {tasks.length === 0 
                ? 'Create your first task or use a template to get started with your wedding planning!' 
                : 'Try adjusting your search or filter criteria to find tasks.'}
            </p>
            {tasks.length === 0 && (
              <div className="flex items-center justify-center gap-2">
                <Button onClick={openAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Task
                </Button>
                <Select onValueChange={handleCreateFromTemplate}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Use template" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TasksClient.getAvailableTemplates()).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredTasks.map((task) => (
            <Card key={task.id} className={cn(
              "transition-all duration-200",
              selectedIds.includes(task.id) && "ring-2 ring-blue-500 bg-blue-50",
              task.status === 'completed' && "opacity-75"
            )}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedIds.includes(task.id)}
                    onCheckedChange={() => handleSelectTask(task.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className={cn(
                          "font-semibold",
                          task.status === 'completed' && "line-through text-muted-foreground"
                        )}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(task)}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(task)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {task.category && (
                        <Badge variant="outline">{task.category}</Badge>
                      )}
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                      {task.timeline && (
                        <Badge variant="outline">
                          {TasksClient.getAvailableTemplates()[task.timeline] || task.timeline}
                        </Badge>
                      )}
                      {task.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      {task.assignedTo && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {task.assignedTo}
                        </span>
                      )}
                    </div>
                    
                    {task.tags.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Tag className="h-3 w-3 text-muted-foreground" />
                        <div className="flex gap-1">
                          {task.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {task.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{task.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Task Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Task' : 'Create Task'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Title *</label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })}
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="description" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Description</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="category" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Category</label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="priority" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Priority</label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="status" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Status</label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="dueDate" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Due Date</label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="assignedTo" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Assigned To</label>
                <Input
                  id="assignedTo"
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  placeholder="bride, groom, planner, or email"
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="timeline" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Timeline</label>
                <Select value={formData.timeline} onValueChange={(value) => setFormData({ ...formData, timeline: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeline" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TasksClient.getAvailableTemplates()).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="tags" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Tags</label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="venue, flowers, photography (comma separated)"
              />
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="notes" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Notes</label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            
            {errors.submit && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.submit}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}