'use client'

import { useState } from 'react'
import { UserChecklistItem, CustomChecklistItem } from '@/hooks/useWeddingChecklist'
import { useSettings } from '@/hooks/useSettings'
import { Button } from '@/components/ui/button'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utils/cn'
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  AlertCircle,
  CheckCircle2,
  Circle,
  DollarSign,
  FileText,
  Bell
} from 'lucide-react'

interface TaskDetailsDialogProps {
  task: UserChecklistItem | CustomChecklistItem
  isCustom: boolean
  onUpdate: (updates: any) => Promise<void>
  onSetReminder: (date: string) => void
  onClose: () => void
}

export function TaskDetailsDialog({ 
  task, 
  isCustom, 
  onUpdate, 
  onSetReminder,
  onClose 
}: TaskDetailsDialogProps) {
  const { formatDate } = useSettings()
  const [loading, setLoading] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [showReminder, setShowReminder] = useState(false)
  const [reminderDate, setReminderDate] = useState('')
  
  // Form data
  const [notes, setNotes] = useState(task.notes || '')
  const [status, setStatus] = useState(task.status)
  const [assignedTo, setAssignedTo] = useState(task.assigned_to || '')
  const [actualHours, setActualHours] = useState(
    'actual_hours' in task ? task.actual_hours?.toString() || '' : ''
  )

  // Get task details
  const taskDetails = isCustom || !('checklist_item' in task)
    ? {
        task_name: (task as CustomChecklistItem).task_name,
        description: (task as CustomChecklistItem).description,
        priority: (task as CustomChecklistItem).priority,
        category_name: (task as CustomChecklistItem).category?.category_name || 'General',
        category_icon: (task as CustomChecklistItem).category?.icon || '📋',
        estimated_hours: undefined,
        vendor_type: undefined,
        tips: undefined
      }
    : {
        task_name: task.checklist_item?.task_name || '',
        description: task.checklist_item?.description,
        priority: task.checklist_item?.priority || 'medium',
        category_name: task.checklist_item?.category?.category_name || 'General',
        category_icon: task.checklist_item?.category?.icon || '📋',
        estimated_hours: task.checklist_item?.estimated_hours,
        vendor_type: task.checklist_item?.vendor_type,
        tips: task.checklist_item?.tips
      }

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'

  const handleSave = async () => {
    setLoading(true)
    try {
      const updates: any = { notes }
      
      if (status !== task.status) {
        updates.status = status
      }
      
      if (assignedTo !== task.assigned_to) {
        updates.assigned_to = assignedTo || undefined
      }
      
      if (actualHours && !isCustom) {
        updates.actual_hours = parseFloat(actualHours)
      }
      
      await onUpdate(updates)
      setEditMode(false)
    } finally {
      setLoading(false)
    }
  }

  const handleSetReminder = () => {
    if (reminderDate) {
      onSetReminder(reminderDate)
      setShowReminder(false)
      setReminderDate('')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-600" />
      case 'skipped':
        return <X className="h-5 w-5 text-gray-400" />
      default:
        return <Circle className="h-5 w-5 text-gray-400" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'destructive'
      case 'high':
        return 'default'
      case 'medium':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{taskDetails.category_icon}</span>
            <div>
              <h2 className="text-xl font-semibold">{taskDetails.task_name}</h2>
              <p className="text-sm text-gray-600">{taskDetails.category_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Status and Priority */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              {getStatusIcon(status)}
              <span className="font-medium">
                {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
              </span>
            </div>
            <Badge variant={getPriorityColor(taskDetails.priority) as any}>
              {taskDetails.priority} priority
            </Badge>
            {isCustom && (
              <Badge variant="secondary">Custom Task</Badge>
            )}
          </div>

          {/* Description */}
          {taskDetails.description && (
            <div className="mb-6">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Description
              </h3>
              <p className="text-gray-600">{taskDetails.description}</p>
            </div>
          )}

          {/* Task Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {task.due_date && (
              <div className={cn(
                "p-4 rounded-lg border",
                isOverdue ? "border-red-200 bg-red-50" : "border-gray-200"
              )}>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Calendar className="h-4 w-4" />
                  Due Date
                </div>
                <p className={cn(
                  "font-medium",
                  isOverdue && "text-red-600"
                )}>
                  {formatDate(task.due_date)}
                  {isOverdue && " (Overdue)"}
                </p>
              </div>
            )}

            {task.assigned_to && (
              <div className="p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <User className="h-4 w-4" />
                  Assigned To
                </div>
                <p className="font-medium">
                  {task.assigned_to === 'partner1' ? 'Partner 1' :
                   task.assigned_to === 'partner2' ? 'Partner 2' :
                   task.assigned_to === 'both' ? 'Both Partners' :
                   task.assigned_to === 'vendor' ? 'Vendor' :
                   'Other'}
                </p>
              </div>
            )}

            {taskDetails.estimated_hours && (
              <div className="p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Clock className="h-4 w-4" />
                  Estimated Time
                </div>
                <p className="font-medium">{taskDetails.estimated_hours} hours</p>
              </div>
            )}

            {taskDetails.vendor_type && (
              <div className="p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <DollarSign className="h-4 w-4" />
                  Vendor Type
                </div>
                <p className="font-medium">
                  {taskDetails.vendor_type.replace('_', ' ')}
                </p>
              </div>
            )}
          </div>

          {/* Tips */}
          {taskDetails.tips && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium mb-2 flex items-center gap-2 text-blue-900">
                <AlertCircle className="h-4 w-4" />
                Tips
              </h3>
              <p className="text-sm text-blue-800">{taskDetails.tips}</p>
            </div>
          )}

          {/* Notes and Updates */}
          {editMode ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  fullWidth
                >
                  <option value="pending">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="skipped">Skipped</option>
                  {!isCustom && <option value="delegated">Delegated</option>}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned To
                </label>
                <Select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  fullWidth
                >
                  <option value="">Not assigned</option>
                  <option value="partner1">Partner 1</option>
                  <option value="partner2">Partner 2</option>
                  <option value="both">Both Partners</option>
                  <option value="vendor">Vendor</option>
                  <option value="other">Other</option>
                </Select>
              </div>

              {!isCustom && taskDetails.estimated_hours && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Actual Hours Spent
                  </label>
                  <Input
                    type="number"
                    step="0.5"
                    value={actualHours}
                    onChange={(e) => setActualHours(e.target.value)}
                    placeholder={`Estimated: ${taskDetails.estimated_hours} hours`}
                    fullWidth
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this task..."
                  rows={4}
                  fullWidth
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditMode(false)
                    setNotes(task.notes || '')
                    setStatus(task.status)
                    setAssignedTo(task.assigned_to || '')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  loading={loading}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {task.notes && (
                <div className="mb-4">
                  <h3 className="font-medium mb-2">Notes</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{task.notes}</p>
                </div>
              )}
              
              {task.completed_date && (
                <p className="text-sm text-gray-500">
                  Completed on {formatDate(task.completed_date)}
                  {task.completed_by && ` by ${task.completed_by}`}
                </p>
              )}
            </div>
          )}

          {/* Set Reminder */}
          {!editMode && showReminder && (
            <div className="mt-6 p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Set Reminder
              </h3>
              <div className="flex gap-3">
                <Input
                  type="date"
                  value={reminderDate}
                  onChange={(e) => setReminderDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  fullWidth
                />
                <Button
                  onClick={handleSetReminder}
                  disabled={!reminderDate}
                >
                  Set
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReminder(false)
                    setReminderDate('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center p-6 border-t">
          <div className="flex gap-3">
            {!editMode && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowReminder(!showReminder)}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Set Reminder
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditMode(true)}
                >
                  Edit Task
                </Button>
              </>
            )}
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}