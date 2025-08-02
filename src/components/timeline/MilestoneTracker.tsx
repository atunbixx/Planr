'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Calendar, CheckCircle, Clock, AlertCircle, Target, TrendingUp } from 'lucide-react'
import { format, isAfter, isBefore, addDays } from 'date-fns'

interface Milestone {
  id: string
  title: string
  description?: string
  target_date: string
  completed_date?: string
  status: 'pending' | 'in_progress' | 'completed' | 'delayed'
  type: string
  icon?: string
  color?: string
  progress_percentage: number
  notes?: string
  task_ids: string[]
  timeline_item_ids: string[]
}

interface MilestoneTrackerProps {
  milestones: Milestone[]
  onUpdate: (milestoneId: string, progress: number) => void
  onMilestoneClick?: (milestone: Milestone) => void
  showCompleted?: boolean
  maxDisplay?: number
}

export function MilestoneTracker({
  milestones,
  onUpdate,
  onMilestoneClick,
  showCompleted = true,
  maxDisplay = 5
}: MilestoneTrackerProps) {
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Filter milestones based on showCompleted setting
  const filteredMilestones = showCompleted 
    ? milestones 
    : milestones.filter(m => m.status !== 'completed')

  // Sort milestones by target date and status
  const sortedMilestones = filteredMilestones.sort((a, b) => {
    // Completed milestones go to the bottom
    if (a.status === 'completed' && b.status !== 'completed') return 1
    if (a.status !== 'completed' && b.status === 'completed') return -1
    
    // Sort by target date
    return new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
  })

  // Get milestones to display
  const displayMilestones = sortedMilestones.slice(0, maxDisplay)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'in_progress':
        return <TrendingUp className="h-5 w-5 text-blue-500" />
      case 'delayed':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'delayed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getDaysUntilTarget = (targetDate: string) => {
    const today = new Date()
    const target = new Date(targetDate)
    const diffTime = target.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getProgressColor = (progress: number, status: string) => {
    if (status === 'completed') return 'bg-green-500'
    if (status === 'delayed') return 'bg-red-500'
    if (progress >= 75) return 'bg-green-500'
    if (progress >= 50) return 'bg-yellow-500'
    return 'bg-blue-500'
  }

  const handleMilestoneClick = (milestone: Milestone) => {
    setSelectedMilestone(milestone)
    setIsDialogOpen(true)
    onMilestoneClick?.(milestone)
  }

  const handleProgressUpdate = (milestoneId: string, newProgress: number) => {
    onUpdate(milestoneId, newProgress)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Target className="h-5 w-5" />
          Milestones
        </h3>
        <Badge variant="outline">
          {milestones.filter(m => m.status === 'completed').length} of {milestones.length} completed
        </Badge>
      </div>

      <div className="grid gap-4">
        {displayMilestones.map((milestone) => {
          const daysUntilTarget = getDaysUntilTarget(milestone.target_date)
          const isOverdue = daysUntilTarget < 0
          const isToday = daysUntilTarget === 0
          const isUpcoming = daysUntilTarget > 0 && daysUntilTarget <= 7

          return (
            <Card 
              key={milestone.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                milestone.status === 'completed' ? 'opacity-75' : ''
              }`}
              onClick={() => handleMilestoneClick(milestone)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(milestone.status)}
                      <h4 className="font-medium text-sm">{milestone.title}</h4>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getStatusColor(milestone.status)}`}
                      >
                        {milestone.status.replace('_', ' ')}
                      </Badge>
                    </div>

                    {milestone.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {milestone.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(milestone.target_date), 'MMM dd, yyyy')}
                      </div>
                      <div className="flex items-center gap-1">
                        {milestone.task_ids.length} tasks
                      </div>
                      <div className="flex items-center gap-1">
                        {milestone.timeline_item_ids.length} timeline items
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span>Progress</span>
                        <span>{milestone.progress_percentage}%</span>
                      </div>
                      <Progress 
                        value={milestone.progress_percentage} 
                        className="h-2"
                      />
                    </div>

                    {/* Status indicators */}
                    <div className="flex items-center gap-2 mt-3">
                      {isOverdue && (
                        <Badge variant="destructive" className="text-xs">
                          {Math.abs(daysUntilTarget)} days overdue
                        </Badge>
                      )}
                      {isToday && (
                        <Badge variant="default" className="text-xs bg-orange-500">
                          Due today
                        </Badge>
                      )}
                      {isUpcoming && (
                        <Badge variant="secondary" className="text-xs">
                          Due in {daysUntilTarget} days
                        </Badge>
                      )}
                      {milestone.status === 'completed' && milestone.completed_date && (
                        <Badge variant="outline" className="text-xs">
                          Completed {format(new Date(milestone.completed_date), 'MMM dd')}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleProgressUpdate(milestone.id, Math.min(milestone.progress_percentage + 25, 100))
                      }}
                      disabled={milestone.status === 'completed'}
                    >
                      +25%
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredMilestones.length > maxDisplay && (
        <div className="text-center">
          <Button variant="outline" size="sm">
            View all {filteredMilestones.length} milestones
          </Button>
        </div>
      )}

      {/* Milestone Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedMilestone && getStatusIcon(selectedMilestone.status)}
              {selectedMilestone?.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedMilestone && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Target Date</label>
                  <p className="text-sm">
                    {format(new Date(selectedMilestone.target_date), 'EEEE, MMMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <p className="text-sm capitalize">{selectedMilestone.type.replace('_', ' ')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tasks</label>
                  <p className="text-sm">{selectedMilestone.task_ids.length} associated tasks</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Timeline Items</label>
                  <p className="text-sm">{selectedMilestone.timeline_item_ids.length} timeline items</p>
                </div>
              </div>

              {selectedMilestone.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-sm mt-1">{selectedMilestone.description}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">Progress</label>
                <div className="flex items-center gap-4 mt-2">
                  <Progress 
                    value={selectedMilestone.progress_percentage} 
                    className="flex-1"
                  />
                  <span className="text-sm font-medium">
                    {selectedMilestone.progress_percentage}%
                  </span>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleProgressUpdate(selectedMilestone.id, Math.max(selectedMilestone.progress_percentage - 25, 0))}
                    disabled={selectedMilestone.progress_percentage <= 0}
                  >
                    -25%
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleProgressUpdate(selectedMilestone.id, Math.min(selectedMilestone.progress_percentage + 25, 100))}
                    disabled={selectedMilestone.progress_percentage >= 100}
                  >
                    +25%
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleProgressUpdate(selectedMilestone.id, 100)}
                    disabled={selectedMilestone.progress_percentage >= 100}
                  >
                    Complete
                  </Button>
                </div>
              </div>

              {selectedMilestone.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notes</label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{selectedMilestone.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 