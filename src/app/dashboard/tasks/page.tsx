"use client"

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import PremiumDashboardLayout from '@/components/layout/PremiumDashboardLayout'
import { TasksClient } from '@/lib/api/tasks.client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useApiQuery } from '@/lib/api/useApiQuery'
import { useToast } from '@/components/ui/toast-provider'
import { formatApiError } from '@/lib/errors/format'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { MetricCard } from '@/components/ui/metric-card'
import { SectionCard, SectionCardBody } from '@/components/ui/section-card'
import { TableSectionSkeleton } from '@/components/ui/section-skeletons'
import { FormField } from '@/components/ui/form-field'

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
  // Error toast is emitted centrally via fetcher

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
      notify(formatApiError(e, 'Failed to update task'), { variant: 'error' })
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
      notify(formatApiError(e, 'Failed to create task'), { variant: 'error' })
    }
  }

  const createFromTemplate = async (timeline: string) => {
    try {
      await TasksClient.createFromTemplate(timeline)
      setShowTemplateDialog(false)
      notify('Tasks added from template', { variant: 'success' })
      await refetch()
    } catch (e) {
      notify(formatApiError(e, 'Failed to create tasks from template'), { variant: 'error' })
    }
  }

  return (
    <PremiumDashboardLayout>
      <div className="p-6 space-y-6">
        <PageHeader
          kicker="TASKS"
          title="Tasks"
          actions={
            <div className="flex gap-2">
              <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">Add from Template</Button>
                </DialogTrigger>
                <DialogContent className="content-defaults form-elegant">
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
                <DialogContent className="content-defaults form-elegant">
                  <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-1 gap-4">
                    <FormField label="Title" required>
                      <Input 
                        value={newTask.title} 
                        onChange={e => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Task title"
                      />
                    </FormField>
                    <FormField label="Description">
                      <Input 
                        value={newTask.description} 
                        onChange={e => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Task description (optional)"
                      />
                    </FormField>
                    <FormField label="Category">
                      <Input 
                        value={newTask.category} 
                        onChange={e => setNewTask(prev => ({ ...prev, category: e.target.value }))}
                        placeholder="e.g. Planning, Venue, Catering"
                      />
                    </FormField>
                    <FormField label="Priority">
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
                    </FormField>
                    <FormField label="Due Date">
                      <Input 
                        type="date"
                        value={newTask.dueDate} 
                        onChange={e => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                      />
                    </FormField>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                    <Button onClick={createTask} disabled={!newTask.title.trim()}>Create Task</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          }
        />
        {/* Deep-link highlight */}
        <DeepLinkHighlighter items={tasks} />
        {/* Task Statistics */}
        {!isLoading && !error && !localError && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <MetricCard label="Total Tasks" value={<span className="text-blue-600">{stats.total}</span>} />
            <MetricCard label="Pending" value={<span className="text-yellow-600">{stats.pending}</span>} />
            <MetricCard label="In Progress" value={<span className="text-blue-600">{stats.inProgress}</span>} />
            <MetricCard label="Completed" value={<span className="text-green-600">{stats.completed}</span>} />
            <MetricCard label="Overdue" value={<span className="text-red-600">{stats.overdue}</span>} />
          </div>
        )}

        {isLoading ? (
          <TableSectionSkeleton columns={8} rows={8} />
        ) : error || localError ? (
          <div className="text-sm text-red-600">{String(error || localError)}</div>
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={<span>📋</span>}
            title="No tasks yet"
            description="Create a task or add a full planning template to get started."
            action={
              <div className="flex gap-2 justify-center">
                <Button onClick={() => setShowCreateDialog(true)}>Add Task</Button>
                <Button variant="outline" onClick={() => setShowTemplateDialog(true)}>Add from Template</Button>
              </div>
            }
          />
        ) : (
          <SectionCard>
            <SectionCardBody>
          <Table variant="bare">
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
                <TableRow key={t.id} data-row-id={t.id}>
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
            </SectionCardBody>
          </SectionCard>
        )}
      </div>
    </PremiumDashboardLayout>
  )
}

function DeepLinkHighlighter({ items }: { items: { id: string }[] }) {
  const sp = useSearchParams()
  const highlightId = sp.get('highlight')
  useEffect(() => {
    if (!highlightId) return
    const el = document.querySelector(`[data-row-id="${CSS.escape(highlightId)}"]`)
    if (el) {
      el.classList.add('row-highlight')
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => el.classList.remove('row-highlight'), 1800)
    }
  }, [highlightId, items])
  return null
}
