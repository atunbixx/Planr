'use client'

import React, { useState, useCallback } from 'react'
import { format } from 'date-fns'
import {
  Task,
  TaskUpdate,
  TaskStatus,
  TaskPriority,
  TaskCategory,
  TaskAssignment,
  TaskComment,
  TaskReminder,
  TaskWithDependencies
} from '@/types/timeline'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/utils/cn'
import {
  Calendar,
  Clock,
  User,
  Flag,
  Tag,
  Paperclip,
  MessageSquare,
  GitBranch,
  Bell,
  Edit3,
  Save,
  X,
  Upload,
  Plus,
  CheckCircle2,
  Circle,
  PlayCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

interface TaskDetailModalProps {
  task: TaskWithDependencies
  open: boolean
  onClose: () => void
  onUpdate: (updates: TaskUpdate) => Promise<void>
  onAssign?: (userId: string, type: 'user' | 'vendor') => Promise<void>
  onAddComment?: (comment: string) => Promise<void>
  onAddAttachment?: (file: File) => Promise<void>
  onAddReminder?: (date: Date, type: 'email' | 'sms' | 'push' | 'in_app') => Promise<void>
  onStatusChange?: (status: TaskStatus) => Promise<void>
  comments?: TaskComment[]
  reminders?: TaskReminder[]
  currentUserId?: string
}

const STATUS_OPTIONS: { value: TaskStatus; label: string; icon: React.ElementType }[] = [
  { value: 'todo', label: 'To Do', icon: Circle },
  { value: 'in_progress', label: 'In Progress', icon: PlayCircle },
  { value: 'completed', label: 'Completed', icon: CheckCircle2 },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle },
  { value: 'blocked', label: 'Blocked', icon: AlertCircle }
]

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'text-gray-600' },
  { value: 'medium', label: 'Medium', color: 'text-blue-600' },
  { value: 'high', label: 'High', color: 'text-orange-600' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-600' }
]

const CATEGORY_OPTIONS: TaskCategory[] = [
  'planning', 'venue', 'catering', 'photography', 'music',
  'flowers', 'attire', 'invitations', 'transportation',
  'beauty', 'honeymoon', 'legal', 'other'
]

const ASSIGNMENT_OPTIONS: { value: TaskAssignment; label: string }[] = [
  { value: 'partner1', label: 'Partner 1' },
  { value: 'partner2', label: 'Partner 2' },
  { value: 'both', label: 'Both Partners' },
  { value: 'planner', label: 'Wedding Planner' }
]

export function TaskDetailModal({
  task,
  open,
  onClose,
  onUpdate,
  onAssign,
  onAddComment,
  onAddAttachment,
  onAddReminder,
  onStatusChange,
  comments = [],
  reminders = [],
  currentUserId
}: TaskDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTask, setEditedTask] = useState<TaskUpdate>({})
  const [newComment, setNewComment] = useState('')
  const [showDependencies, setShowDependencies] = useState(true)
  const [showComments, setShowComments] = useState(true)
  const [saving, setSaving] = useState(false)

  // Handle save
  const handleSave = useCallback(async () => {
    if (Object.keys(editedTask).length === 0) return

    try {
      setSaving(true)
      await onUpdate(editedTask)
      setIsEditing(false)
      setEditedTask({})
    } catch (error) {
      console.error('Failed to update task:', error)
    } finally {
      setSaving(false)
    }
  }, [editedTask, onUpdate])

  // Handle status change
  const handleStatusChange = useCallback(async (status: TaskStatus) => {
    if (onStatusChange) {
      await onStatusChange(status)
    } else {
      await onUpdate({ status })
    }
  }, [onStatusChange, onUpdate])

  // Handle comment submission
  const handleAddComment = useCallback(async () => {
    if (!newComment.trim() || !onAddComment) return

    try {
      await onAddComment(newComment.trim())
      setNewComment('')
    } catch (error) {
      console.error('Failed to add comment:', error)
    }
  }, [newComment, onAddComment])

  // Handle file upload
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onAddAttachment) return

    try {
      await onAddAttachment(file)
    } catch (error) {
      console.error('Failed to upload file:', error)
    }
  }, [onAddAttachment])

  const StatusIcon = STATUS_OPTIONS.find(s => s.value === task.status)?.icon || Circle

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StatusIcon className={cn(
                "h-6 w-6",
                task.status === 'completed' && "text-green-600",
                task.status === 'in_progress' && "text-blue-600",
                task.status === 'blocked' && "text-red-600"
              )} />
              <h2 className="text-xl font-semibold">
                {isEditing ? (
                  <Input
                    value={editedTask.title ?? task.title}
                    onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                    className="text-xl font-semibold"
                  />
                ) : (
                  task.title
                )}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false)
                      setEditedTask({})
                    }}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="p-6 space-y-6">
              {/* Status Bar */}
              <div className="flex items-center gap-2">
                {STATUS_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <Button
                    key={value}
                    size="sm"
                    variant={task.status === value ? 'default' : 'outline'}
                    onClick={() => handleStatusChange(value)}
                    className="flex-1"
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {label}
                  </Button>
                ))}
              </div>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Progress</Label>
                  <span className="text-sm text-gray-600">{task.progress_percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${task.progress_percentage}%` }}
                  />
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Priority */}
                <div>
                  <Label>Priority</Label>
                  {isEditing ? (
                    <select
                      value={editedTask.priority ?? task.priority}
                      onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value as TaskPriority })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg"
                    >
                      {PRIORITY_OPTIONS.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="mt-1">
                      <Badge className={cn(
                        "capitalize",
                        PRIORITY_OPTIONS.find(p => p.value === task.priority)?.color
                      )}>
                        <Flag className="h-3 w-3 mr-1" />
                        {task.priority}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Category */}
                <div>
                  <Label>Category</Label>
                  {isEditing ? (
                    <select
                      value={editedTask.category ?? task.category}
                      onChange={(e) => setEditedTask({ ...editedTask, category: e.target.value as TaskCategory })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg"
                    >
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="mt-1">
                      <Badge variant="outline" className="capitalize">
                        {task.category}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Due Date */}
                <div>
                  <Label>Due Date</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editedTask.due_date ?? task.due_date}
                      onChange={(e) => setEditedTask({ ...editedTask, due_date: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <div className="mt-1 flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : 'No due date'}
                    </div>
                  )}
                </div>

                {/* Assigned To */}
                <div>
                  <Label>Assigned To</Label>
                  {isEditing ? (
                    <select
                      value={editedTask.assigned_to ?? task.assigned_to}
                      onChange={(e) => setEditedTask({ ...editedTask, assigned_to: e.target.value as TaskAssignment })}
                      className="w-full mt-1 px-3 py-2 border rounded-lg"
                    >
                      {ASSIGNMENT_OPTIONS.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="mt-1 flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-gray-400" />
                      {ASSIGNMENT_OPTIONS.find(a => a.value === task.assigned_to)?.label}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <Label>Description</Label>
                {isEditing ? (
                  <Textarea
                    value={editedTask.description ?? task.description ?? ''}
                    onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                    className="mt-1"
                    rows={3}
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-600">
                    {task.description || 'No description'}
                  </p>
                )}
              </div>

              {/* Tags */}
              <div>
                <Label>Tags</Label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {task.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                  {isEditing && (
                    <Button size="sm" variant="outline">
                      <Plus className="h-3 w-3 mr-1" />
                      Add Tag
                    </Button>
                  )}
                </div>
              </div>

              {/* Dependencies */}
              {(task.dependencies?.length > 0 || task.dependents?.length > 0) && (
                <div>
                  <button
                    onClick={() => setShowDependencies(!showDependencies)}
                    className="flex items-center gap-2 text-sm font-medium mb-2"
                  >
                    {showDependencies ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <GitBranch className="h-4 w-4" />
                    Dependencies
                  </button>
                  {showDependencies && (
                    <div className="space-y-2 ml-6">
                      {task.dependencies?.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Depends on:</p>
                          {task.dependencies.map((dep) => (
                            <div key={dep.id} className="flex items-center gap-2 text-sm">
                              <StatusIcon className="h-3 w-3" />
                              <span className={cn(dep.completed && "line-through text-gray-400")}>
                                {dep.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {task.dependents?.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Blocks:</p>
                          {task.dependents.map((dep) => (
                            <div key={dep.id} className="flex items-center gap-2 text-sm">
                              <StatusIcon className="h-3 w-3" />
                              <span>{dep.title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Attachments */}
              <div>
                <Label>Attachments</Label>
                <div className="mt-2 space-y-2">
                  {task.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded">
                      <Paperclip className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{attachment.name || 'Attachment'}</span>
                    </div>
                  ))}
                  <label className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                    <Upload className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Upload attachment</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              </div>

              {/* Comments */}
              <div>
                <button
                  onClick={() => setShowComments(!showComments)}
                  className="flex items-center gap-2 text-sm font-medium mb-2"
                >
                  {showComments ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <MessageSquare className="h-4 w-4" />
                  Comments ({comments.length})
                </button>
                {showComments && (
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">User</span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                          </span>
                        </div>
                        <p className="text-sm">{comment.comment}</p>
                      </div>
                    ))}
                    {onAddComment && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                        />
                        <Button size="sm" onClick={handleAddComment}>
                          Send
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Critical Path & Blocked Info */}
              {(task.critical_path || task.status === 'blocked') && (
                <div className="space-y-2">
                  {task.critical_path && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">This task is on the critical path</span>
                    </div>
                  )}
                  {task.status === 'blocked' && task.blocked_reason && (
                    <div className="flex items-start gap-2 p-3 bg-orange-50 text-orange-700 rounded-lg">
                      <AlertCircle className="h-4 w-4 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Blocked</p>
                        <p className="text-sm">{task.blocked_reason}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  )
}