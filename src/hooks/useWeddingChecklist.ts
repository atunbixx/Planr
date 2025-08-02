'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToastContext } from '@/contexts/ToastContext'

export interface ChecklistCategory {
  id: string
  category_name: string
  icon: string
  display_order: number
  description?: string
}

export interface ChecklistItem {
  id: string
  category_id: string
  task_name: string
  description?: string
  months_before_wedding: number
  priority: 'low' | 'medium' | 'high' | 'critical'
  estimated_hours?: number
  vendor_type?: string
  is_optional: boolean
  tips?: string
  // Joined fields
  category?: ChecklistCategory
}

export interface UserChecklistItem {
  id: string
  couple_id: string
  checklist_item_id: string
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'delegated'
  completed_date?: string
  completed_by?: string
  assigned_to?: 'partner1' | 'partner2' | 'both' | 'vendor' | 'other'
  notes?: string
  actual_hours?: number
  vendor_id?: string
  due_date?: string
  reminder_date?: string
  custom_task: boolean
  created_at: string
  updated_at: string
  // Joined fields
  checklist_item?: ChecklistItem
}

export interface CustomChecklistItem {
  id: string
  couple_id: string
  category_id: string
  task_name: string
  description?: string
  due_date?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  completed_date?: string
  assigned_to?: 'partner1' | 'partner2' | 'both' | 'vendor' | 'other'
  notes?: string
  created_at: string
  updated_at: string
  // Joined fields
  category?: ChecklistCategory
}

export interface ChecklistProgress {
  total_tasks: number
  completed_tasks: number
  in_progress_tasks: number
  pending_tasks: number
  overdue_tasks: number
  completion_percentage: number
  next_due_task?: {
    id: string
    task_name: string
    category: string
    due_date: string
    priority: string
  }
}

export function useWeddingChecklist() {
  const { couple } = useAuth()
  const { addToast } = useToastContext()
  
  const [categories, setCategories] = useState<ChecklistCategory[]>([])
  const [userChecklist, setUserChecklist] = useState<UserChecklistItem[]>([])
  const [customTasks, setCustomTasks] = useState<CustomChecklistItem[]>([])
  const [progress, setProgress] = useState<ChecklistProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('checklist_categories')
        .select('*')
        .order('display_order')

      if (error) throw error
      setCategories(data || [])
    } catch (error: any) {
      console.error('Error loading categories:', error)
      addToast({
        title: 'Error',
        description: 'Failed to load checklist categories',
        type: 'error'
      })
    }
  }, [addToast])

  // Load user's checklist
  const loadUserChecklist = useCallback(async () => {
    if (!couple?.id) return

    try {
      const { data, error } = await supabase
        .from('user_checklist_items')
        .select(`
          *,
          checklist_item:checklist_items(
            *,
            category:checklist_categories(*)
          )
        `)
        .eq('couple_id', couple.id)
        .order('due_date', { ascending: true, nullsFirst: false })

      if (error) throw error
      setUserChecklist(data || [])
    } catch (error: any) {
      console.error('Error loading user checklist:', error)
      addToast({
        title: 'Error',
        description: 'Failed to load your checklist',
        type: 'error'
      })
    }
  }, [couple?.id, addToast])

  // Load custom tasks
  const loadCustomTasks = useCallback(async () => {
    if (!couple?.id) return

    try {
      const { data, error } = await supabase
        .from('custom_checklist_items')
        .select(`
          *,
          category:checklist_categories(*)
        `)
        .eq('couple_id', couple.id)
        .order('due_date', { ascending: true, nullsFirst: false })

      if (error) throw error
      setCustomTasks(data || [])
    } catch (error: any) {
      console.error('Error loading custom tasks:', error)
      addToast({
        title: 'Error',
        description: 'Failed to load custom tasks',
        type: 'error'
      })
    }
  }, [couple?.id, addToast])

  // Load progress
  const loadProgress = useCallback(async () => {
    if (!couple?.id) return

    try {
      const { data, error } = await supabase
        .rpc('get_checklist_progress', { p_couple_id: couple.id })
        .single()

      if (error) throw error
      setProgress(data)
    } catch (error: any) {
      console.error('Error loading progress:', error)
    }
  }, [couple?.id])

  // Initialize checklist for new users
  const initializeChecklist = useCallback(async () => {
    if (!couple?.id || initialized) return

    try {
      const { data, error } = await supabase
        .rpc('initialize_wedding_checklist', {
          p_couple_id: couple.id,
          p_wedding_date: couple.wedding_date
        })

      if (error) throw error

      if (data && data > 0) {
        addToast({
          title: 'Checklist Created!',
          description: `We've added ${data} tasks to help you plan your wedding`,
          type: 'success'
        })
        
        // Reload checklist
        await loadUserChecklist()
        await loadProgress()
      }
      
      setInitialized(true)
    } catch (error: any) {
      console.error('Error initializing checklist:', error)
      setInitialized(true) // Prevent repeated attempts
    }
  }, [couple?.id, couple?.wedding_date, initialized, loadUserChecklist, loadProgress, addToast])

  // Update task status
  const updateTaskStatus = useCallback(async (
    taskId: string,
    status: UserChecklistItem['status'],
    notes?: string
  ) => {
    if (!couple?.id) return

    try {
      const updates: any = {
        status,
        updated_at: new Date().toISOString()
      }

      if (status === 'completed') {
        updates.completed_date = new Date().toISOString()
        updates.completed_by = couple.partner1_name
      }

      if (notes !== undefined) {
        updates.notes = notes
      }

      const { error } = await supabase
        .from('user_checklist_items')
        .update(updates)
        .eq('id', taskId)
        .eq('couple_id', couple.id)

      if (error) throw error

      // Update local state
      setUserChecklist(prev => prev.map(item => 
        item.id === taskId ? { ...item, ...updates } : item
      ))

      // Reload progress
      await loadProgress()

      addToast({
        title: 'Success',
        description: status === 'completed' ? 'Task completed!' : 'Task updated',
        type: 'success'
      })
    } catch (error: any) {
      console.error('Error updating task:', error)
      addToast({
        title: 'Error',
        description: 'Failed to update task',
        type: 'error'
      })
    }
  }, [couple?.id, couple?.partner1_name, loadProgress, addToast])

  // Update custom task
  const updateCustomTask = useCallback(async (
    taskId: string,
    updates: Partial<CustomChecklistItem>
  ) => {
    if (!couple?.id) return

    try {
      const { error } = await supabase
        .from('custom_checklist_items')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .eq('couple_id', couple.id)

      if (error) throw error

      // Update local state
      setCustomTasks(prev => prev.map(item => 
        item.id === taskId ? { ...item, ...updates } : item
      ))

      addToast({
        title: 'Success',
        description: 'Custom task updated',
        type: 'success'
      })
    } catch (error: any) {
      console.error('Error updating custom task:', error)
      addToast({
        title: 'Error',
        description: 'Failed to update custom task',
        type: 'error'
      })
    }
  }, [couple?.id, addToast])

  // Add custom task
  const addCustomTask = useCallback(async (task: {
    category_id: string
    task_name: string
    description?: string
    due_date?: string
    priority: CustomChecklistItem['priority']
    assigned_to?: CustomChecklistItem['assigned_to']
  }) => {
    if (!couple?.id) return

    try {
      const { data, error } = await supabase
        .from('custom_checklist_items')
        .insert({
          couple_id: couple.id,
          ...task
        })
        .select(`
          *,
          category:checklist_categories(*)
        `)
        .single()

      if (error) throw error

      setCustomTasks(prev => [...prev, data])
      
      addToast({
        title: 'Success',
        description: 'Custom task added to your checklist',
        type: 'success'
      })

      return data
    } catch (error: any) {
      console.error('Error adding custom task:', error)
      addToast({
        title: 'Error',
        description: 'Failed to add custom task',
        type: 'error'
      })
      throw error
    }
  }, [couple?.id, addToast])

  // Delete custom task
  const deleteCustomTask = useCallback(async (taskId: string) => {
    if (!couple?.id) return

    try {
      const { error } = await supabase
        .from('custom_checklist_items')
        .delete()
        .eq('id', taskId)
        .eq('couple_id', couple.id)

      if (error) throw error

      setCustomTasks(prev => prev.filter(item => item.id !== taskId))
      
      addToast({
        title: 'Success',
        description: 'Custom task removed',
        type: 'success'
      })
    } catch (error: any) {
      console.error('Error deleting custom task:', error)
      addToast({
        title: 'Error',
        description: 'Failed to delete custom task',
        type: 'error'
      })
    }
  }, [couple?.id, addToast])

  // Update task assignment
  const updateTaskAssignment = useCallback(async (
    taskId: string,
    assigned_to: UserChecklistItem['assigned_to']
  ) => {
    if (!couple?.id) return

    try {
      const { error } = await supabase
        .from('user_checklist_items')
        .update({
          assigned_to,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .eq('couple_id', couple.id)

      if (error) throw error

      setUserChecklist(prev => prev.map(item => 
        item.id === taskId ? { ...item, assigned_to } : item
      ))

      addToast({
        title: 'Success',
        description: 'Task assignment updated',
        type: 'success'
      })
    } catch (error: any) {
      console.error('Error updating assignment:', error)
      addToast({
        title: 'Error',
        description: 'Failed to update task assignment',
        type: 'error'
      })
    }
  }, [couple?.id, addToast])

  // Set task reminder
  const setTaskReminder = useCallback(async (
    taskId: string,
    reminderDate: string,
    isCustomTask: boolean = false
  ) => {
    if (!couple?.id) return

    try {
      // Update the task with reminder date
      if (!isCustomTask) {
        await supabase
          .from('user_checklist_items')
          .update({
            reminder_date: reminderDate,
            updated_at: new Date().toISOString()
          })
          .eq('id', taskId)
          .eq('couple_id', couple.id)
      }

      // Create reminder record
      const { error } = await supabase
        .from('checklist_reminders')
        .insert({
          couple_id: couple.id,
          [isCustomTask ? 'custom_checklist_item_id' : 'user_checklist_item_id']: taskId,
          reminder_date: reminderDate,
          reminder_type: 'email'
        })

      if (error) throw error

      addToast({
        title: 'Success',
        description: 'Reminder set successfully',
        type: 'success'
      })
    } catch (error: any) {
      console.error('Error setting reminder:', error)
      addToast({
        title: 'Error',
        description: 'Failed to set reminder',
        type: 'error'
      })
    }
  }, [couple?.id, addToast])

  // Load all data
  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadCategories(),
        loadUserChecklist(),
        loadCustomTasks(),
        loadProgress()
      ])
    } finally {
      setLoading(false)
    }
  }, [loadCategories, loadUserChecklist, loadCustomTasks, loadProgress])

  // Initial load
  useEffect(() => {
    if (couple?.id) {
      loadAll()
    }
  }, [couple?.id, loadAll])

  // Initialize checklist after loading
  useEffect(() => {
    if (!loading && couple?.id && userChecklist.length === 0 && !initialized) {
      initializeChecklist()
    }
  }, [loading, couple?.id, userChecklist.length, initialized, initializeChecklist])

  // Get tasks by category
  const getTasksByCategory = useCallback((categoryId: string) => {
    const standardTasks = userChecklist.filter(
      item => item.checklist_item?.category_id === categoryId
    )
    const customTasksInCategory = customTasks.filter(
      item => item.category_id === categoryId
    )
    return { standardTasks, customTasks: customTasksInCategory }
  }, [userChecklist, customTasks])

  // Get upcoming tasks
  const getUpcomingTasks = useCallback((days: number = 30) => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)
    
    const upcomingStandard = userChecklist.filter(item => {
      if (item.status === 'completed' || item.status === 'skipped') return false
      if (!item.due_date) return false
      const dueDate = new Date(item.due_date)
      return dueDate <= futureDate && dueDate >= new Date()
    })

    const upcomingCustom = customTasks.filter(item => {
      if (item.status === 'completed' || item.status === 'skipped') return false
      if (!item.due_date) return false
      const dueDate = new Date(item.due_date)
      return dueDate <= futureDate && dueDate >= new Date()
    })

    return { standard: upcomingStandard, custom: upcomingCustom }
  }, [userChecklist, customTasks])

  // Get overdue tasks
  const getOverdueTasks = useCallback(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const overdueStandard = userChecklist.filter(item => {
      if (item.status === 'completed' || item.status === 'skipped') return false
      if (!item.due_date) return false
      return new Date(item.due_date) < today
    })

    const overdueCustom = customTasks.filter(item => {
      if (item.status === 'completed' || item.status === 'skipped') return false
      if (!item.due_date) return false
      return new Date(item.due_date) < today
    })

    return { standard: overdueStandard, custom: overdueCustom }
  }, [userChecklist, customTasks])

  return {
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
    getOverdueTasks,
    refresh: loadAll
  }
}