'use client'

import { useState } from 'react'
import { useTasks, DEFAULT_WEDDING_TASKS, TaskInsert, TaskUpdate } from '@/hooks/useTasks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { cn } from '@/utils/cn'

export default function TasksPage() {
  const {
    tasks,
    loading,
    error,
    taskStats,
    addTask,
    updateTask,
    completeTask,
    uncompleteTask,
    deleteTask,
    initializeDefaultTasks,
    refreshTasks
  } = useTasks()

  const [showAddTask, setShowAddTask] = useState(false)
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterAssignee, setFilterAssignee] = useState<string>('all')
  const [filterCompleted, setFilterCompleted] = useState<string>('pending')

  // Add Task Form
  const AddTaskForm = () => {
    const [formData, setFormData] = useState<TaskInsert>({
      title: '',
      description: '',
      category: 'planning',
      priority: 'medium',
      assigned_to: 'both',
      due_date: '',
      estimated_duration_hours: 1,
      notes: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formErrors, setFormErrors] = useState<Record<string, string>>({})

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      
      const errors: Record<string, string> = {}
      if (!formData.title.trim()) errors.title = 'Task title is required'
      
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors)
        return
      }

      setIsSubmitting(true)
      try {
        await addTask(formData)
        setFormData({
          title: '',
          description: '',
          category: 'planning',
          priority: 'medium',
          assigned_to: 'both',
          due_date: '',
          estimated_duration_hours: 1,
          notes: ''
        })
        setShowAddTask(false)
      } catch (error: any) {
        setFormErrors({ general: error.message })
      } finally {
        setIsSubmitting(false)
      }
    }

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add New Task</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formErrors.general && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {formErrors.general}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Task Title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                error={formErrors.title}
                placeholder="e.g., Book wedding photographer"
                fullWidth
                disabled={isSubmitting}
              />

              <Select
                label="Category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                fullWidth
                disabled={isSubmitting}
              >
                <option value="planning">Planning</option>
                <option value="venue">Venue</option>
                <option value="catering">Catering</option>
                <option value="photography">Photography</option>
                <option value="music">Music</option>
                <option value="flowers">Flowers</option>
                <option value="attire">Attire</option>
                <option value="invitations">Invitations</option>
                <option value="transportation">Transportation</option>
                <option value="beauty">Beauty</option>
                <option value="honeymoon">Honeymoon</option>
                <option value="legal">Legal</option>
                <option value="other">Other</option>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Priority"
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                fullWidth
                disabled={isSubmitting}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </Select>

              <Select
                label="Assigned To"
                value={formData.assigned_to}
                onChange={(e) => setFormData(prev => ({ ...prev, assigned_to: e.target.value as any }))}
                fullWidth
                disabled={isSubmitting}
              >
                <option value="both">Both Partners</option>
                <option value="partner1">Partner 1</option>
                <option value="partner2">Partner 2</option>
                <option value="planner">Wedding Planner</option>
              </Select>

              <Input
                label="Due Date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                fullWidth
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Estimated Hours"
                type="number"
                min="0.5"
                step="0.5"
                value={formData.estimated_duration_hours}
                onChange={(e) => setFormData(prev => ({ ...prev, estimated_duration_hours: Number(e.target.value) }))}
                placeholder="2"
                fullWidth
                disabled={isSubmitting}
              />

              <Input
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Task details..."
                fullWidth
                disabled={isSubmitting}
              />
            </div>

            <Input
              label="Notes (Optional)"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes..."
              fullWidth
              disabled={isSubmitting}
            />

            <div className="flex gap-4">
              <Button type="submit" loading={isSubmitting}>
                Add Task
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => setShowAddTask(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    )
  }

  // Priority badge component
  const PriorityBadge = ({ priority }: { priority: string }) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    }
    
    return (
      <span className={cn('px-2 py-1 text-xs font-medium rounded-full border', colors[priority as keyof typeof colors])}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    )
  }

  // Category badge component
  const CategoryBadge = ({ category }: { category: string }) => {
    const colors = {
      planning: 'bg-blue-100 text-blue-800',
      venue: 'bg-purple-100 text-purple-800',
      catering: 'bg-green-100 text-green-800',
      photography: 'bg-pink-100 text-pink-800',
      music: 'bg-indigo-100 text-indigo-800',
      flowers: 'bg-rose-100 text-rose-800',
      attire: 'bg-amber-100 text-amber-800',
      invitations: 'bg-teal-100 text-teal-800',
      transportation: 'bg-cyan-100 text-cyan-800',
      beauty: 'bg-violet-100 text-violet-800',
      honeymoon: 'bg-emerald-100 text-emerald-800',
      legal: 'bg-slate-100 text-slate-800',
      other: 'bg-gray-100 text-gray-800'
    }
    
    return (
      <span className={cn('px-2 py-1 text-xs font-medium rounded', colors[category as keyof typeof colors])}>
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </span>
    )
  }

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (filterCategory !== 'all' && task.category !== filterCategory) return false
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false
    if (filterAssignee !== 'all' && task.assigned_to !== filterAssignee) return false
    if (filterCompleted === 'completed' && !task.completed) return false
    if (filterCompleted === 'pending' && task.completed) return false
    return true
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-serif font-bold text-ink">Tasks</h1>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your tasks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold text-ink">Tasks</h1>
          <p className="text-gray-600 mt-1">Organize your wedding planning tasks and track progress</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddTask(true)} size="sm">
            Add Task
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <span className="text-red-500">⚠️</span>
              <p className="text-red-700">{error}</p>
              <Button variant="secondary" size="sm" onClick={refreshTasks} className="ml-auto">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Initialize Default Tasks */}
      {tasks.length === 0 && !loading && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div>
                <h3 className="font-semibold text-blue-900">Get Started with Your Wedding Tasks</h3>
                <p className="text-blue-700">We'll create a comprehensive task list to guide your wedding planning</p>
              </div>
              <Button onClick={initializeDefaultTasks}>
                Initialize Default Wedding Tasks ({DEFAULT_WEDDING_TASKS.length} tasks)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task Statistics */}
      {tasks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-ink">
                {taskStats.completionPercentage}%
              </div>
              <p className="text-xs text-gray-500">Completion Rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {taskStats.completedTasks}
              </div>
              <p className="text-xs text-gray-500">Completed Tasks</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">
                {taskStats.overdueTasks}
              </div>
              <p className="text-xs text-gray-500">Overdue Tasks</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">
                {taskStats.upcomingTasks}
              </div>
              <p className="text-xs text-gray-500">Upcoming Tasks</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Task Form */}
      {showAddTask && <AddTaskForm />}

      {/* Filters */}
      {tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Filter Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select
                label="Category"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                fullWidth
              >
                <option value="all">All Categories</option>
                <option value="planning">Planning</option>
                <option value="venue">Venue</option>
                <option value="catering">Catering</option>
                <option value="photography">Photography</option>
                <option value="music">Music</option>
                <option value="flowers">Flowers</option>
                <option value="attire">Attire</option>
                <option value="invitations">Invitations</option>
                <option value="transportation">Transportation</option>
                <option value="beauty">Beauty</option>
                <option value="honeymoon">Honeymoon</option>
                <option value="legal">Legal</option>
                <option value="other">Other</option>
              </Select>

              <Select
                label="Priority"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                fullWidth
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </Select>

              <Select
                label="Assigned To"
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                fullWidth
              >
                <option value="all">All Assignees</option>
                <option value="both">Both Partners</option>
                <option value="partner1">Partner 1</option>
                <option value="partner2">Partner 2</option>
                <option value="planner">Wedding Planner</option>
              </Select>

              <Select
                label="Status"
                value={filterCompleted}
                onChange={(e) => setFilterCompleted(e.target.value)}
                fullWidth
              >
                <option value="all">All Tasks</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task List */}
      {filteredTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tasks ({filteredTasks.length})</CardTitle>
            <CardDescription>Your wedding planning tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredTasks.map((task) => {
                const isOverdue = !task.completed && task.due_date && new Date(task.due_date) < new Date()
                
                return (
                  <div 
                    key={task.id} 
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-lg border",
                      task.completed ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200",
                      isOverdue && !task.completed && "bg-red-50 border-red-200"
                    )}
                  >
                    <div className="flex-shrink-0 pt-1">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={(e) => {
                          if (e.target.checked) {
                            completeTask(task.id)
                          } else {
                            uncompleteTask(task.id)
                          }
                        }}
                        className="h-4 w-4 text-accent focus:ring-accent border-gray-300 rounded"
                      />
                    </div>
                    
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className={cn(
                          "font-semibold",
                          task.completed && "line-through text-gray-500"
                        )}>
                          {task.title}
                        </h4>
                        <PriorityBadge priority={task.priority} />
                        <CategoryBadge category={task.category} />
                      </div>
                      
                      {task.description && (
                        <p className={cn(
                          "text-sm text-gray-600 mb-2",
                          task.completed && "line-through"
                        )}>
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Assigned to: {task.assigned_to.replace('_', ' ')}</span>
                        {task.due_date && (
                          <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                            Due: {new Date(task.due_date).toLocaleDateString()}
                            {isOverdue && " (Overdue)"}
                          </span>
                        )}
                        {task.estimated_duration_hours && (
                          <span>Est: {task.estimated_duration_hours}h</span>
                        )}
                        {task.completed && task.completed_date && (
                          <span className="text-green-600">
                            Completed: {new Date(task.completed_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      
                      {task.notes && (
                        <p className="text-xs text-gray-500 mt-2 italic">
                          Note: {task.notes}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex-shrink-0">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => deleteTask(task.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {filteredTasks.length === 0 && tasks.length > 0 && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <span className="text-6xl mb-4 block">📋</span>
            <h3 className="text-lg font-semibold text-ink mb-2">No tasks match your filters</h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your filter criteria to see more tasks.
            </p>
            <Button 
              variant="secondary"
              onClick={() => {
                setFilterCategory('all')
                setFilterPriority('all')
                setFilterAssignee('all')
                setFilterCompleted('all')
              }}
            >
              Clear All Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Completely Empty State */}
      {tasks.length === 0 && !loading && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <span className="text-6xl mb-4 block">✅</span>
            <h3 className="text-lg font-semibold text-ink mb-2">No tasks yet</h3>
            <p className="text-gray-500 mb-4">
              Get started with your wedding planning by adding your first task or initializing default tasks.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={initializeDefaultTasks}>
                Initialize Default Tasks
              </Button>
              <Button variant="secondary" onClick={() => setShowAddTask(true)}>
                Add Custom Task
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}