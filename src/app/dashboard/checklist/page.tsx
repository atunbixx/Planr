'use client'

import { useState, useMemo } from 'react'
import { useWeddingChecklist, ChecklistCategory, UserChecklistItem, CustomChecklistItem } from '@/hooks/useWeddingChecklist'
import { useAuth } from '@/contexts/AuthContext'
import { useSettings } from '@/hooks/useSettings'
import { useToastContext } from '@/contexts/ToastContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utils/cn'
import { AddCustomTaskDialog } from '@/components/checklist/AddCustomTaskDialog'
import { TaskDetailsDialog } from '@/components/checklist/TaskDetailsDialog'
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle, 
  Calendar,
  ChevronDown,
  ChevronRight,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  User,
  Users,
  UserCheck,
  Building,
  X
} from 'lucide-react'

export default function ChecklistPage() {
  const { couple } = useAuth()
  const { formatDate } = useSettings()
  const { addToast } = useToastContext()
  const {
    categories,
    userChecklist,
    customTasks,
    progress,
    loading,
    updateTaskStatus,
    updateCustomTask,
    addCustomTask,
    deleteCustomTask,
    updateTaskAssignment,
    setTaskReminder,
    getTasksByCategory,
    getUpcomingTasks,
    getOverdueTasks
  } = useWeddingChecklist()

  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [showCustomTaskDialog, setShowCustomTaskDialog] = useState(false)
  const [selectedTask, setSelectedTask] = useState<UserChecklistItem | CustomChecklistItem | null>(null)
  const [viewMode, setViewMode] = useState<'category' | 'timeline' | 'priority'>('category')
  const [exportLoading, setExportLoading] = useState(false)

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let allTasks: (UserChecklistItem | CustomChecklistItem)[] = []
    
    // Combine standard and custom tasks
    userChecklist.forEach(task => {
      allTasks.push(task)
    })
    customTasks.forEach(task => {
      allTasks.push(task)
    })

    // Apply filters
    return allTasks.filter(task => {
      // Search filter
      if (searchQuery) {
        const taskName = 'checklist_item' in task 
          ? task.checklist_item?.task_name || ''
          : task.task_name
        const description = 'checklist_item' in task
          ? task.checklist_item?.description || ''
          : task.description || ''
        
        const searchLower = searchQuery.toLowerCase()
        if (!taskName.toLowerCase().includes(searchLower) && 
            !description.toLowerCase().includes(searchLower)) {
          return false
        }
      }

      // Status filter
      if (filterStatus !== 'all' && task.status !== filterStatus) {
        return false
      }

      // Priority filter
      if (filterPriority !== 'all') {
        const priority = 'checklist_item' in task
          ? task.checklist_item?.priority
          : task.priority
        if (priority !== filterPriority) {
          return false
        }
      }

      // Category filter
      if (filterCategory !== 'all') {
        const categoryId = 'checklist_item' in task
          ? task.checklist_item?.category_id
          : task.category_id
        if (categoryId !== filterCategory) {
          return false
        }
      }

      return true
    })
  }, [userChecklist, customTasks, searchQuery, filterStatus, filterPriority, filterCategory])

  // Get overdue and upcoming tasks
  const overdueTasks = useMemo(() => getOverdueTasks(), [getOverdueTasks])
  const upcomingTasks = useMemo(() => getUpcomingTasks(7), [getUpcomingTasks])

  // Export checklist to CSV
  const exportChecklist = async () => {
    setExportLoading(true)
    try {
      // Prepare data for export
      const exportData: any[] = []
      
      // Add standard tasks
      userChecklist.forEach(task => {
        exportData.push({
          'Task Name': task.checklist_item?.task_name || '',
          'Category': task.checklist_item?.category?.category_name || '',
          'Description': task.checklist_item?.description || '',
          'Priority': task.checklist_item?.priority || 'medium',
          'Status': task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('_', ' '),
          'Assigned To': task.assigned_to ? 
            (task.assigned_to === 'partner1' ? 'Partner 1' :
             task.assigned_to === 'partner2' ? 'Partner 2' :
             task.assigned_to === 'both' ? 'Both Partners' :
             task.assigned_to === 'vendor' ? 'Vendor' : 'Other') : '',
          'Due Date': task.due_date ? formatDate(task.due_date) : '',
          'Completed Date': task.completed_date ? formatDate(task.completed_date) : '',
          'Notes': task.notes || '',
          'Type': 'Standard'
        })
      })
      
      // Add custom tasks
      customTasks.forEach(task => {
        exportData.push({
          'Task Name': task.task_name,
          'Category': task.category?.category_name || '',
          'Description': task.description || '',
          'Priority': task.priority,
          'Status': task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('_', ' '),
          'Assigned To': task.assigned_to ? 
            (task.assigned_to === 'partner1' ? 'Partner 1' :
             task.assigned_to === 'partner2' ? 'Partner 2' :
             task.assigned_to === 'both' ? 'Both Partners' :
             task.assigned_to === 'vendor' ? 'Vendor' : 'Other') : '',
          'Due Date': task.due_date ? formatDate(task.due_date) : '',
          'Completed Date': task.completed_date ? formatDate(task.completed_date) : '',
          'Notes': task.notes || '',
          'Type': 'Custom'
        })
      })
      
      // Convert to CSV
      const headers = Object.keys(exportData[0])
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header]
            // Escape quotes and wrap in quotes if contains comma
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value
          }).join(',')
        )
      ].join('\n')
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `wedding-checklist-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      addToast({
        title: 'Success',
        description: 'Checklist exported successfully',
        type: 'success'
      })
    } catch (error) {
      console.error('Error exporting checklist:', error)
      addToast({
        title: 'Error',
        description: 'Failed to export checklist',
        type: 'error'
      })
    } finally {
      setExportLoading(false)
    }
  }

  // Render task item
  const renderTaskItem = (task: UserChecklistItem | CustomChecklistItem, isCustom: boolean = false) => {
    const taskName = isCustom || !('checklist_item' in task)
      ? (task as CustomChecklistItem).task_name
      : task.checklist_item?.task_name || ''
    
    const priority = isCustom || !('checklist_item' in task)
      ? (task as CustomChecklistItem).priority
      : task.checklist_item?.priority || 'medium'
    
    const isOverdue = task.due_date && new Date(task.due_date) < new Date()
    
    return (
      <div
        key={task.id}
        className={cn(
          "flex items-start gap-3 p-4 rounded-lg border transition-all cursor-pointer",
          task.status === 'completed' && "bg-green-50 border-green-200",
          task.status === 'in_progress' && "bg-blue-50 border-blue-200",
          isOverdue && task.status !== 'completed' && "bg-red-50 border-red-200",
          task.status === 'pending' && !isOverdue && "hover:bg-gray-50"
        )}
        onClick={() => setSelectedTask(task)}
      >
        <button
          className="mt-0.5"
          onClick={(e) => {
            e.stopPropagation()
            if (isCustom) {
              updateCustomTask(task.id, {
                status: task.status === 'completed' ? 'pending' : 'completed',
                completed_date: task.status === 'completed' ? undefined : new Date().toISOString()
              })
            } else {
              updateTaskStatus(
                task.id,
                task.status === 'completed' ? 'pending' : 'completed'
              )
            }
          }}
        >
          {task.status === 'completed' ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : task.status === 'in_progress' ? (
            <Clock className="h-5 w-5 text-blue-600" />
          ) : (
            <Circle className="h-5 w-5 text-gray-400" />
          )}
        </button>

        <div className="flex-1">
          <h4 className={cn(
            "font-medium",
            task.status === 'completed' && "line-through text-gray-500"
          )}>
            {taskName}
            {isCustom && (
              <Badge variant="secondary" className="ml-2 text-xs">
                Custom
              </Badge>
            )}
          </h4>
          
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
            {task.due_date && (
              <span className={cn(
                "flex items-center gap-1",
                isOverdue && task.status !== 'completed' && "text-red-600 font-medium"
              )}>
                <Calendar className="h-3 w-3" />
                {formatDate(task.due_date)}
              </span>
            )}
            
            <Badge
              variant={
                priority === 'critical' ? 'destructive' :
                priority === 'high' ? 'default' :
                priority === 'medium' ? 'secondary' :
                'outline'
              }
              className="text-xs"
            >
              {priority}
            </Badge>

            {task.assigned_to && (
              <span className="flex items-center gap-1">
                {task.assigned_to === 'partner1' ? <User className="h-3 w-3" /> :
                 task.assigned_to === 'partner2' ? <UserCheck className="h-3 w-3" /> :
                 task.assigned_to === 'both' ? <Users className="h-3 w-3" /> :
                 task.assigned_to === 'vendor' ? <Building className="h-3 w-3" /> :
                 <User className="h-3 w-3" />}
                {task.assigned_to}
              </span>
            )}
          </div>

          {task.notes && (
            <p className="text-sm text-gray-600 mt-2">{task.notes}</p>
          )}
        </div>

        {isCustom && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              deleteCustomTask(task.id)
            }}
            className="text-gray-400 hover:text-red-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-serif font-bold text-ink">Wedding Checklist</h1>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your checklist...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-ink">Wedding Checklist</h1>
          <p className="text-gray-600 mt-1">Track your wedding planning progress</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setShowCustomTaskDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Custom Task
          </Button>
          <Button 
            variant="outline"
            onClick={exportChecklist}
            loading={exportLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
      {progress && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Overall Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>{progress.completed_tasks} of {progress.total_tasks} tasks completed</span>
                    <span className="font-medium">{progress.completion_percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-accent h-3 rounded-full transition-all duration-500"
                      style={{ width: `${progress.completion_percentage}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{progress.pending_tasks}</p>
                    <p className="text-sm text-gray-600">To Do</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{progress.in_progress_tasks}</p>
                    <p className="text-sm text-gray-600">In Progress</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{progress.completed_tasks}</p>
                    <p className="text-sm text-gray-600">Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{progress.overdue_tasks}</p>
                    <p className="text-sm text-gray-600">Overdue</p>
                  </div>
                </div>

                {progress.next_due_task && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-1">Next Task Due</h4>
                    <p className="text-sm text-blue-800">
                      {progress.next_due_task.task_name} - Due {formatDate(progress.next_due_task.due_date)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">This Week</p>
                    <p className="text-2xl font-bold mt-1">
                      {upcomingTasks.standard.filter(t => {
                        if (!t.due_date) return false
                        const dueDate = new Date(t.due_date)
                        const weekEnd = new Date()
                        weekEnd.setDate(weekEnd.getDate() + 7)
                        return dueDate <= weekEnd
                      }).length + upcomingTasks.custom.filter(t => {
                        if (!t.due_date) return false
                        const dueDate = new Date(t.due_date)
                        const weekEnd = new Date()
                        weekEnd.setDate(weekEnd.getDate() + 7)
                        return dueDate <= weekEnd
                      }).length}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">tasks due</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">High Priority</p>
                    <p className="text-2xl font-bold mt-1">
                      {userChecklist.filter(t => 
                        t.checklist_item?.priority === 'high' || t.checklist_item?.priority === 'critical'
                      ).filter(t => t.status !== 'completed').length + 
                      customTasks.filter(t => 
                        t.priority === 'high' || t.priority === 'critical'
                      ).filter(t => t.status !== 'completed').length}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">tasks remaining</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Custom Tasks</p>
                    <p className="text-2xl font-bold mt-1">{customTasks.length}</p>
                    <p className="text-xs text-gray-500 mt-1">added by you</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Plus className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Alerts */}
      {(overdueTasks.standard.length > 0 || overdueTasks.custom.length > 0) && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-900">
                  You have {overdueTasks.standard.length + overdueTasks.custom.length} overdue tasks
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  Review and update these tasks to stay on track with your wedding planning.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  fullWidth
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="skipped">Skipped</option>
              </Select>

              <Select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </Select>

              <Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.category_name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              variant={viewMode === 'category' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('category')}
            >
              By Category
            </Button>
            <Button
              variant={viewMode === 'timeline' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('timeline')}
            >
              By Timeline
            </Button>
            <Button
              variant={viewMode === 'priority' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('priority')}
            >
              By Priority
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      {viewMode === 'category' && (
        <div className="space-y-4">
          {categories.map(category => {
            const { standardTasks, customTasks: categoryCustomTasks } = getTasksByCategory(category.id)
            const categoryTasks = [...standardTasks, ...categoryCustomTasks].filter(task => {
              // Apply filters
              if (filterStatus !== 'all' && task.status !== filterStatus) return false
              if (filterPriority !== 'all') {
                const priority = 'checklist_item' in task
                  ? task.checklist_item?.priority
                  : task.priority
                if (priority !== filterPriority) return false
              }
              if (searchQuery) {
                const taskName = 'checklist_item' in task 
                  ? task.checklist_item?.task_name || ''
                  : task.task_name
                const description = 'checklist_item' in task
                  ? task.checklist_item?.description || ''
                  : task.description || ''
                
                const searchLower = searchQuery.toLowerCase()
                if (!taskName.toLowerCase().includes(searchLower) && 
                    !description.toLowerCase().includes(searchLower)) {
                  return false
                }
              }
              return true
            })

            if (categoryTasks.length === 0) return null

            const isExpanded = expandedCategories.has(category.id)

            return (
              <Card key={category.id}>
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => toggleCategory(category.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category.icon}</span>
                      <div>
                        <CardTitle className="text-lg">{category.category_name}</CardTitle>
                        {category.description && (
                          <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {categoryTasks.filter(t => t.status === 'completed').length} / {categoryTasks.length}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-accent h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${categoryTasks.length > 0 
                                  ? (categoryTasks.filter(t => t.status === 'completed').length / categoryTasks.length * 100) 
                                  : 0}%` 
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-600">
                            {categoryTasks.length > 0 
                              ? Math.round(categoryTasks.filter(t => t.status === 'completed').length / categoryTasks.length * 100) 
                              : 0}%
                          </span>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent className="space-y-2">
                    {categoryTasks.map(task => {
                      const isCustom = 'custom_task' in task ? task.custom_task : !('checklist_item' in task)
                      return renderTaskItem(task, isCustom)
                    })}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <div className="space-y-6">
          {/* Overdue Tasks */}
          {(overdueTasks.standard.length > 0 || overdueTasks.custom.length > 0) && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-lg text-red-900 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Overdue Tasks ({overdueTasks.standard.length + overdueTasks.custom.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {overdueTasks.standard.map(task => renderTaskItem(task, false))}
                {overdueTasks.custom.map(task => renderTaskItem(task, true))}
              </CardContent>
            </Card>
          )}

          {/* This Week */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">This Week</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {filteredTasks
                .filter(task => {
                  if (!task.due_date) return false
                  const dueDate = new Date(task.due_date)
                  const today = new Date()
                  const weekEnd = new Date()
                  weekEnd.setDate(weekEnd.getDate() + 7)
                  return dueDate >= today && dueDate <= weekEnd
                })
                .map(task => {
                  const isCustom = 'custom_task' in task ? task.custom_task : !('checklist_item' in task)
                  return renderTaskItem(task, isCustom)
                })}
            </CardContent>
          </Card>

          {/* Next Month */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Next Month</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {filteredTasks
                .filter(task => {
                  if (!task.due_date) return false
                  const dueDate = new Date(task.due_date)
                  const weekEnd = new Date()
                  weekEnd.setDate(weekEnd.getDate() + 7)
                  const monthEnd = new Date()
                  monthEnd.setDate(monthEnd.getDate() + 30)
                  return dueDate > weekEnd && dueDate <= monthEnd
                })
                .map(task => {
                  const isCustom = 'custom_task' in task ? task.custom_task : !('checklist_item' in task)
                  return renderTaskItem(task, isCustom)
                })}
            </CardContent>
          </Card>

          {/* Tasks Without Due Date */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">No Due Date</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {filteredTasks
                .filter(task => !task.due_date)
                .map(task => {
                  const isCustom = 'custom_task' in task ? task.custom_task : !('checklist_item' in task)
                  return renderTaskItem(task, isCustom)
                })}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Priority View */}
      {viewMode === 'priority' && (
        <div className="space-y-4">
          {['critical', 'high', 'medium', 'low'].map(priorityLevel => {
            const priorityTasks = filteredTasks.filter(task => {
              const priority = 'checklist_item' in task
                ? task.checklist_item?.priority
                : task.priority
              return priority === priorityLevel
            })

            if (priorityTasks.length === 0) return null

            return (
              <Card key={priorityLevel}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Badge
                      variant={
                        priorityLevel === 'critical' ? 'destructive' :
                        priorityLevel === 'high' ? 'default' :
                        priorityLevel === 'medium' ? 'secondary' :
                        'outline'
                      }
                    >
                      {priorityLevel.charAt(0).toUpperCase() + priorityLevel.slice(1)} Priority
                    </Badge>
                    <span className="text-sm font-normal text-gray-600">
                      ({priorityTasks.length} tasks)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {priorityTasks.map(task => {
                    const isCustom = 'custom_task' in task ? task.custom_task : !('checklist_item' in task)
                    return renderTaskItem(task, isCustom)
                  })}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialogs */}
      {showCustomTaskDialog && (
        <AddCustomTaskDialog
          categories={categories}
          onAdd={async (task) => {
            await addCustomTask(task)
            setShowCustomTaskDialog(false)
          }}
          onClose={() => setShowCustomTaskDialog(false)}
        />
      )}

      {selectedTask && (
        <TaskDetailsDialog
          task={selectedTask}
          isCustom={'custom_task' in selectedTask ? selectedTask.custom_task : !('checklist_item' in selectedTask)}
          onUpdate={async (updates) => {
            if ('custom_task' in selectedTask && selectedTask.custom_task) {
              await updateCustomTask(selectedTask.id, updates)
            } else if (!('checklist_item' in selectedTask)) {
              await updateCustomTask(selectedTask.id, updates)
            } else {
              if ('status' in updates) {
                await updateTaskStatus(selectedTask.id, updates.status as any, updates.notes)
              }
              if ('assigned_to' in updates && updates.assigned_to) {
                await updateTaskAssignment(selectedTask.id, updates.assigned_to as any)
              }
            }
          }}
          onSetReminder={(date) => {
            const isCustom = 'custom_task' in selectedTask ? selectedTask.custom_task : !('checklist_item' in selectedTask)
            setTaskReminder(selectedTask.id, date, isCustom)
          }}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  )
}