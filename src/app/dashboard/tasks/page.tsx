"use client"

import { useEffect, useState } from 'react'
import PremiumDashboardLayout from '@/components/layout/PremiumDashboardLayout'
import { TasksClient } from '@/lib/api/tasks.client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useApiQuery } from '@/lib/api/useApiQuery'
import { useToast } from '@/components/ui/toast-provider'

type Task = {
  id: string
  userId: string
  title: string
  description: string | null
  category: string | null
  priority: 'low'|'medium'|'high'|'urgent'
  status: 'pending'|'in_progress'|'completed'|'cancelled'|'on_hold'
  dueDate: Date | null
  completedAt: Date | null
  assignedTo: string | null
  isTemplate: boolean
  templateId: string | null
  timeline: string | null
  order: number | null
  tags: string[]
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export default function TasksPage() {
  const { notify } = useToast()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [localError, setLocalError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium' as const,
    dueDate: ''
  })

  const { data, error, isLoading, refetch } = useApiQuery('tasks:list', async () => {
    const data = await TasksClient.list({ limit: 100, offset: 0, includeCompleted: true })
    return { tasks: data.tasks as any }
  })
  useEffect(() => { if (data?.tasks) setTasks(data.tasks) }, [data])
  useEffect(() => { if (error) notify(String(error), { variant: 'error', title: 'Failed to load tasks' }) }, [error, notify])

  // Calculate task statistics
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length
  }

  const markCompleted = async (taskId: string) => {
    try {
      setUpdating(taskId)
      // optimistic update
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed', completedAt: new Date() as any } : t))
      await TasksClient.update(taskId, { status: 'completed' })
      notify('Task marked as completed', { variant: 'success' })
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Failed to update task', { variant: 'error' })
      // revert by refetching
      await refetch()
    } finally {
      setUpdating(null)
    }
  }

  const createTask = async () => {
    try {
      if (!newTask.title.trim()) return
      
      await TasksClient.create({
        title: newTask.title,
        description: newTask.description || undefined,
        category: newTask.category || undefined,
        priority: newTask.priority,
        dueDate: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : undefined,
        status: 'pending',
        tags: []
      })
      
      setShowCreateDialog(false)
      setNewTask({ title: '', description: '', category: '', priority: 'medium', dueDate: '' })
      notify('Task created', { variant: 'success' })
      await refetch()
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Failed to create task', { variant: 'error' })
    }
  }

  const createFromTemplate = async (timeline: string) => {
    try {
      await TasksClient.createFromTemplate(timeline)
      setShowTemplateDialog(false)
      notify('Tasks added from template', { variant: 'success' })
      await refetch()
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Failed to create tasks from template', { variant: 'error' })
    }
  }

  return (
    <PremiumDashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-dark dark:text-white">Tasks</h1>
          <div className="flex gap-2">
            <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">Add from Template</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Tasks from Template</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">Choose a wedding planning timeline to add relevant tasks:</p>
                  {Object.entries(TasksClient.getAvailableTemplates()).map(([key, label]) => (
                    <Button
                      key={key}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => createFromTemplate(key)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>Cancel</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>Add Task</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Title</label>
                    <Input 
                      value={newTask.title} 
                      onChange={e => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Task title"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Description</label>
                    <Input 
                      value={newTask.description} 
                      onChange={e => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Task description (optional)"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Category</label>
                    <Input 
                      value={newTask.category} 
                      onChange={e => setNewTask(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="e.g. Planning, Venue, Catering"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Priority</label>
                    <Select value={newTask.priority} onValueChange={(value: any) => setNewTask(prev => ({ ...prev, priority: value }))}>
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
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Due Date</label>
                    <Input 
                      type="date"
                      value={newTask.dueDate} 
                      onChange={e => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                  <Button onClick={createTask} disabled={!newTask.title.trim()}>Create Task</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Task Statistics */}
        {!isLoading && !error && !localError && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-50 p-4 rounded-lg border shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600 dark:text-gray-700">Total Tasks</div>
            </div>
            <div className="bg-white dark:bg-gray-50 p-4 rounded-lg border shadow-sm">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600 dark:text-gray-700">Pending</div>
            </div>
            <div className="bg-white dark:bg-gray-50 p-4 rounded-lg border shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
              <div className="text-sm text-gray-600 dark:text-gray-700">In Progress</div>
            </div>
            <div className="bg-white dark:bg-gray-50 p-4 rounded-lg border shadow-sm">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-gray-600 dark:text-gray-700">Completed</div>
            </div>
            <div className="bg-white dark:bg-gray-50 p-4 rounded-lg border shadow-sm">
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
              <div className="text-sm text-gray-600 dark:text-gray-700">Overdue</div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white dark:bg-gray-50 p-4 rounded-lg border shadow-sm">
              <div className="h-6 w-48 bg-gray-200 animate-pulse rounded mb-3" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-200 animate-pulse rounded" />
                <div className="h-4 w-5/6 bg-gray-200 animate-pulse rounded" />
                <div className="h-4 w-4/6 bg-gray-200 animate-pulse rounded" />
              </div>
            </div>
          </div>
        ) : error || localError ? (
          <div className="text-sm text-red-600">{String(error || localError)}</div>
        ) : tasks.length === 0 ? (
          <div className="bg-white dark:bg-gray-50 p-10 rounded-lg border text-center">
            <div className="text-3xl mb-2">📋</div>
            <h3 className="text-lg font-semibold mb-1">No tasks yet</h3>
            <p className="text-sm text-gray-600 mb-4">Create a task or add a full planning template to get started.</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => setShowCreateDialog(true)}>Add Task</Button>
              <Button variant="outline" onClick={() => setShowTemplateDialog(true)}>Add from Template</Button>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Timeline</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{t.title}</div>
                      {t.description && (
                        <div className="text-sm text-gray-500 mt-1">{t.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{t.category || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={t.priority === 'urgent' ? 'error' : t.priority === 'high' ? 'warning' : t.priority === 'medium' ? 'primary' : 'outline'}>
                      {t.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.status === 'completed' ? 'success' : t.status === 'in_progress' ? 'primary' : 'outline'}>
                      {t.status.replace('_',' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{t.dueDate ? (t.dueDate instanceof Date ? t.dueDate : new Date(t.dueDate)).toLocaleDateString() : '—'}</TableCell>
                  <TableCell className="text-sm text-gray-600">{t.assignedTo || '—'}</TableCell>
                  <TableCell className="text-sm text-gray-600">{t.timeline?.replace('_', ' ') || '—'}</TableCell>
                  <TableCell className="text-right">
                    {t.status !== 'completed' && (
                      <Button size="sm" onClick={() => markCompleted(t.id)} isLoading={updating === t.id}>Complete</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </PremiumDashboardLayout>
  )
}
