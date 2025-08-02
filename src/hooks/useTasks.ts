'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase, logActivity } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

// =============================================
// TASK MANAGEMENT HOOK
// =============================================
// Comprehensive task management for wedding planning

export interface Task {
  id: string
  couple_id: string
  vendor_id?: string
  title: string
  description?: string
  category: 'planning' | 'venue' | 'catering' | 'photography' | 'music' | 'flowers' | 'attire' | 'invitations' | 'transportation' | 'beauty' | 'honeymoon' | 'legal' | 'other'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to: 'partner1' | 'partner2' | 'both' | 'planner'
  due_date?: string
  estimated_duration_hours?: number
  actual_duration_hours?: number
  completed: boolean
  completed_date?: string
  completed_by_user_id?: string
  depends_on_task_id?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface TaskInsert {
  vendor_id?: string
  title: string
  description?: string
  category?: 'planning' | 'venue' | 'catering' | 'photography' | 'music' | 'flowers' | 'attire' | 'invitations' | 'transportation' | 'beauty' | 'honeymoon' | 'legal' | 'other'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to?: 'partner1' | 'partner2' | 'both' | 'planner'
  due_date?: string
  estimated_duration_hours?: number
  depends_on_task_id?: string
  notes?: string
}

export interface TaskUpdate {
  title?: string
  description?: string
  category?: 'planning' | 'venue' | 'catering' | 'photography' | 'music' | 'flowers' | 'attire' | 'invitations' | 'transportation' | 'beauty' | 'honeymoon' | 'legal' | 'other'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to?: 'partner1' | 'partner2' | 'both' | 'planner'
  due_date?: string
  estimated_duration_hours?: number
  actual_duration_hours?: number
  depends_on_task_id?: string
  notes?: string
}

export const DEFAULT_WEDDING_TASKS = [
  // Planning & Organization (12+ months before)
  { title: 'Set wedding date and budget', category: 'planning', priority: 'urgent', assigned_to: 'both', estimated_duration_hours: 2, description: 'Decide on wedding date and establish overall budget' },
  { title: 'Create guest list draft', category: 'planning', priority: 'high', assigned_to: 'both', estimated_duration_hours: 3, description: 'Initial guest list to determine venue size needs' },
  { title: 'Research and book venue', category: 'venue', priority: 'urgent', assigned_to: 'both', estimated_duration_hours: 8, description: 'Visit venues, compare options, and secure booking' },
  { title: 'Hire wedding planner (optional)', category: 'planning', priority: 'medium', assigned_to: 'both', estimated_duration_hours: 4, description: 'Interview and hire professional wedding planner' },
  
  // Vendors & Services (10-12 months before)
  { title: 'Book photographer and videographer', category: 'photography', priority: 'high', assigned_to: 'both', estimated_duration_hours: 6, description: 'Research, interview, and book photography team' },
  { title: 'Choose and book caterer', category: 'catering', priority: 'high', assigned_to: 'both', estimated_duration_hours: 5, description: 'Taste test, review menus, and book catering service' },
  { title: 'Book wedding officiant', category: 'planning', priority: 'high', assigned_to: 'both', estimated_duration_hours: 2, description: 'Find and book ceremony officiant' },
  { title: 'Book music/DJ for reception', category: 'music', priority: 'high', assigned_to: 'both', estimated_duration_hours: 3, description: 'Research and book reception entertainment' },
  
  // Attire & Beauty (8-10 months before)
  { title: 'Shop for wedding dress/suit', category: 'attire', priority: 'high', assigned_to: 'partner1', estimated_duration_hours: 12, description: 'Try on and order wedding attire' },
  { title: 'Shop for partner attire', category: 'attire', priority: 'high', assigned_to: 'partner2', estimated_duration_hours: 6, description: 'Select and order partner wedding attire' },
  { title: 'Book hair and makeup artist', category: 'beauty', priority: 'medium', assigned_to: 'partner1', estimated_duration_hours: 3, description: 'Research and book wedding day beauty team' },
  
  // Flowers & Decorations (6-8 months before)
  { title: 'Meet with florist', category: 'flowers', priority: 'medium', assigned_to: 'both', estimated_duration_hours: 2, description: 'Discuss floral arrangements and book florist' },
  { title: 'Plan ceremony decorations', category: 'flowers', priority: 'medium', assigned_to: 'both', estimated_duration_hours: 3, description: 'Design ceremony space decorations' },
  { title: 'Plan reception decorations', category: 'flowers', priority: 'medium', assigned_to: 'both', estimated_duration_hours: 3, description: 'Design reception space decorations' },
  
  // Invitations & Communication (4-6 months before)
  { title: 'Design and order invitations', category: 'invitations', priority: 'medium', assigned_to: 'both', estimated_duration_hours: 4, description: 'Create invitation design and place print order' },
  { title: 'Finalize guest list', category: 'planning', priority: 'high', assigned_to: 'both', estimated_duration_hours: 2, description: 'Complete final guest list with addresses' },
  { title: 'Send save-the-dates', category: 'invitations', priority: 'medium', assigned_to: 'both', estimated_duration_hours: 2, description: 'Mail save-the-date cards to guests' },
  
  // Transportation & Honeymoon (3-4 months before)
  { title: 'Book wedding transportation', category: 'transportation', priority: 'low', assigned_to: 'both', estimated_duration_hours: 2, description: 'Arrange transportation for wedding day' },
  { title: 'Plan honeymoon', category: 'honeymoon', priority: 'medium', assigned_to: 'both', estimated_duration_hours: 6, description: 'Research and book honeymoon travel' },
  
  // Legal & Administrative (2-3 months before)
  { title: 'Apply for marriage license', category: 'legal', priority: 'high', assigned_to: 'both', estimated_duration_hours: 2, description: 'Complete marriage license application' },
  { title: 'Plan name change process', category: 'legal', priority: 'low', assigned_to: 'partner1', estimated_duration_hours: 3, description: 'Research name change requirements and process' },
  
  // Final Details (1-2 months before)
  { title: 'Send wedding invitations', category: 'invitations', priority: 'high', assigned_to: 'both', estimated_duration_hours: 3, description: 'Mail wedding invitations to all guests' },
  { title: 'Schedule dress fittings', category: 'attire', priority: 'medium', assigned_to: 'partner1', estimated_duration_hours: 4, description: 'Book and attend dress alteration appointments' },
  { title: 'Finalize catering headcount', category: 'catering', priority: 'high', assigned_to: 'both', estimated_duration_hours: 1, description: 'Provide final guest count to caterer' },
  { title: 'Create seating chart', category: 'planning', priority: 'medium', assigned_to: 'both', estimated_duration_hours: 3, description: 'Assign guests to reception tables' },
  { title: 'Write wedding vows', category: 'planning', priority: 'high', assigned_to: 'both', estimated_duration_hours: 4, description: 'Draft and practice personal wedding vows' },
  
  // Week Of Wedding
  { title: 'Confirm all vendor details', category: 'planning', priority: 'urgent', assigned_to: 'both', estimated_duration_hours: 2, description: 'Final confirmation calls to all vendors' },
  { title: 'Pack for honeymoon', category: 'honeymoon', priority: 'medium', assigned_to: 'both', estimated_duration_hours: 2, description: 'Pack bags for post-wedding travel' },
  { title: 'Wedding rehearsal', category: 'planning', priority: 'high', assigned_to: 'both', estimated_duration_hours: 2, description: 'Practice ceremony with wedding party' },
  { title: 'Rehearsal dinner', category: 'planning', priority: 'medium', assigned_to: 'both', estimated_duration_hours: 3, description: 'Host dinner for wedding party and family' }
]

interface TaskStats {
  totalTasks: number
  completedTasks: number
  overdueTasks: number
  upcomingTasks: number
  completionPercentage: number
  averageTaskDuration: number
  tasksByPriority: Record<string, number>
  tasksByCategory: Record<string, number>
  tasksByAssignee: Record<string, number>
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { user, couple } = useAuth()

  // Load tasks
  const loadTasks = useCallback(async () => {
    if (!couple?.id) {
      setTasks([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('couple_id', couple.id)
        .order('due_date', { ascending: true, nullsLast: true })
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to load tasks: ${error.message}`)
      }

      setTasks(data || [])

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load tasks'
      console.error('Task loading error:', errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [couple?.id])

  // Initialize default tasks for new couples
  const initializeDefaultTasks = useCallback(async () => {
    if (!couple?.id || !user?.id) {
      throw new Error('Authentication required to initialize tasks')
    }

    try {
      const tasksWithCoupleId = DEFAULT_WEDDING_TASKS.map(task => ({
        ...task,
        couple_id: couple.id
      }))

      const { data, error } = await supabase
        .from('tasks')
        .insert(tasksWithCoupleId)
        .select()

      if (error) {
        throw new Error(`Failed to initialize default tasks: ${error.message}`)
      }

      // Log activity
      try {
        await logActivity(
          couple.id,
          user.id,
          'profile_updated',
          'tasks',
          couple.id,
          'Wedding Tasks',
          { action: 'initialized_default_tasks', count: data.length }
        )
      } catch (activityError) {
        console.warn('Activity logging failed:', activityError)
      }

      setTasks(data)
      return data

    } catch (err) {
      console.error('Error initializing default tasks:', err)
      throw err
    }
  }, [couple?.id, user?.id])

  // Add new task
  const addTask = useCallback(async (taskData: TaskInsert) => {
    if (!couple?.id || !user?.id) {
      throw new Error('Authentication required to add task')
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...taskData,
          couple_id: couple.id,
          category: taskData.category || 'planning',
          priority: taskData.priority || 'medium',
          assigned_to: taskData.assigned_to || 'both',
          completed: false
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to add task: ${error.message}`)
      }

      // Log activity
      try {
        await logActivity(
          couple.id,
          user.id,
          'task_created',
          'task',
          data.id,
          data.title,
          { 
            category: data.category, 
            priority: data.priority,
            assigned_to: data.assigned_to,
            due_date: data.due_date
          }
        )
      } catch (activityError) {
        console.warn('Activity logging failed:', activityError)
      }

      setTasks(prev => [data, ...prev])
      return data

    } catch (err) {
      console.error('Error adding task:', err)
      throw err
    }
  }, [couple?.id, user?.id])

  // Update task
  const updateTask = useCallback(async (taskId: string, updates: TaskUpdate) => {
    if (!couple?.id || !user?.id) {
      throw new Error('Authentication required to update task')
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .eq('couple_id', couple.id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update task: ${error.message}`)
      }

      setTasks(prev => prev.map(task => task.id === taskId ? data : task))
      return data

    } catch (err) {
      console.error('Error updating task:', err)
      throw err
    }
  }, [couple?.id, user?.id])

  // Complete task
  const completeTask = useCallback(async (taskId: string) => {
    if (!couple?.id || !user?.id) {
      throw new Error('Authentication required to complete task')
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          completed: true,
          completed_date: new Date().toISOString().split('T')[0],
          completed_by_user_id: user.id
        })
        .eq('id', taskId)
        .eq('couple_id', couple.id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to complete task: ${error.message}`)
      }

      // Log activity
      try {
        await logActivity(
          couple.id,
          user.id,
          'task_completed',
          'task',
          data.id,
          data.title,
          { completed_date: data.completed_date }
        )
      } catch (activityError) {
        console.warn('Activity logging failed:', activityError)
      }

      setTasks(prev => prev.map(task => task.id === taskId ? data : task))
      return data

    } catch (err) {
      console.error('Error completing task:', err)
      throw err
    }
  }, [couple?.id, user?.id])

  // Uncomplete task
  const uncompleteTask = useCallback(async (taskId: string) => {
    if (!couple?.id || !user?.id) {
      throw new Error('Authentication required to uncomplete task')
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          completed: false,
          completed_date: null,
          completed_by_user_id: null
        })
        .eq('id', taskId)
        .eq('couple_id', couple.id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to uncomplete task: ${error.message}`)
      }

      setTasks(prev => prev.map(task => task.id === taskId ? data : task))
      return data

    } catch (err) {
      console.error('Error uncompleting task:', err)
      throw err
    }
  }, [couple?.id, user?.id])

  // Delete task
  const deleteTask = useCallback(async (taskId: string) => {
    if (!couple?.id || !user?.id) {
      throw new Error('Authentication required to delete task')
    }

    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) {
        throw new Error('Task not found')
      }

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('couple_id', couple.id)

      if (error) {
        throw new Error(`Failed to delete task: ${error.message}`)
      }

      // Log activity
      try {
        await logActivity(
          couple.id,
          user.id,
          'task_deleted',
          'task',
          taskId,
          task.title,
          { category: task.category, priority: task.priority }
        )
      } catch (activityError) {
        console.warn('Activity logging failed:', activityError)
      }

      setTasks(prev => prev.filter(t => t.id !== taskId))
      return true

    } catch (err) {
      console.error('Error deleting task:', err)
      throw err
    }
  }, [couple?.id, user?.id, tasks])

  // Calculate task statistics
  const taskStats: TaskStats = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.completed).length,
    overdueTasks: tasks.filter(t => !t.completed && t.due_date && new Date(t.due_date) < new Date()).length,
    upcomingTasks: tasks.filter(t => !t.completed && t.due_date && new Date(t.due_date) >= new Date()).length,
    completionPercentage: tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0,
    averageTaskDuration: tasks.filter(t => t.actual_duration_hours).length > 0 
      ? tasks.filter(t => t.actual_duration_hours).reduce((sum, t) => sum + (t.actual_duration_hours || 0), 0) / tasks.filter(t => t.actual_duration_hours).length
      : 0,
    tasksByPriority: {
      urgent: tasks.filter(t => t.priority === 'urgent').length,
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length
    },
    tasksByCategory: tasks.reduce((acc, task) => {
      acc[task.category] = (acc[task.category] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    tasksByAssignee: {
      partner1: tasks.filter(t => t.assigned_to === 'partner1').length,
      partner2: tasks.filter(t => t.assigned_to === 'partner2').length,
      both: tasks.filter(t => t.assigned_to === 'both').length,
      planner: tasks.filter(t => t.assigned_to === 'planner').length
    }
  }

  // Load data on mount
  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  return {
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
    refreshTasks: loadTasks
  }
}