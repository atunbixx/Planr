'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { Badge } from '@/components/ui/badge'
import { Plus, Calendar, Tag, User, AlertCircle } from 'lucide-react'
import { taskFormSchema, TaskFormData } from '@/lib/validations/task'
import { cn } from '@/utils/cn'

interface QuickTaskAddProps {
  onAdd: (task: TaskFormData) => Promise<void>
  categories?: Array<{ value: string; label: string }>
  vendors?: Array<{ id: string; name: string; type: string }>
  milestones?: Array<{ id: string; title: string; target_date: string }>
  isLoading?: boolean
}

export function QuickTaskAdd({
  onAdd,
  categories = [],
  vendors = [],
  milestones = [],
  isLoading = false
}: QuickTaskAddProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'planning',
      priority: 'medium',
      assigned_to: 'both',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      estimated_duration_hours: 2,
      tags: [],
      critical_path: false,
      weather_dependent: false
    }
  })

  const onSubmit = async (data: TaskFormData) => {
    try {
      setIsSubmitting(true)
      await onAdd(data)
      form.reset()
      setIsOpen(false)
    } catch (error) {
      console.error('Error creating task:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQuickAdd = async () => {
    const quickData: TaskFormData = {
      title: form.getValues('title'),
      category: 'planning',
      priority: 'medium',
      assigned_to: 'both',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }

    try {
      setIsSubmitting(true)
      await onAdd(quickData)
      form.reset()
    } catch (error) {
      console.error('Error creating quick task:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const canQuickAdd = form.watch('title')?.trim().length > 0

  return (
    <div className="space-y-4">
      {/* Quick Add Bar */}
      <Card className="border-dashed border-2 border-muted-foreground/20 hover:border-muted-foreground/40 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Input
              placeholder="Add a quick task..."
              value={form.watch('title')}
              onChange={(e) => form.setValue('title', e.target.value)}
              className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canQuickAdd) {
                  e.preventDefault()
                  handleQuickAdd()
                }
              }}
            />
            <Button
              onClick={handleQuickAdd}
              disabled={!canQuickAdd || isSubmitting}
              size="sm"
              className="shrink-0"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </Button>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="shrink-0">
                  Advanced
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Create New Task
                  </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Task Title *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter task title..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Add task description..." 
                                className="resize-none" 
                                rows={3}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Category and Priority */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories.map((category) => (
                                  <SelectItem key={category.value} value={category.value}>
                                    {category.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="low">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                                    Low
                                  </div>
                                </SelectItem>
                                <SelectItem value="medium">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                                    Medium
                                  </div>
                                </SelectItem>
                                <SelectItem value="high">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                                    High
                                  </div>
                                </SelectItem>
                                <SelectItem value="urgent">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                                    Urgent
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Assignment and Due Date */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="assigned_to"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Assigned To *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select assignment" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="both">
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Both Partners
                                  </div>
                                </SelectItem>
                                <SelectItem value="partner1">Partner 1</SelectItem>
                                <SelectItem value="partner2">Partner 2</SelectItem>
                                <SelectItem value="vendor">Vendor</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="due_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Due Date *</FormLabel>
                            <FormControl>
                              <DatePicker
                                date={field.value}
                                onSelect={field.onChange}
                                placeholder="Select due date"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Duration and Vendor */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="estimated_duration_hours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estimated Duration (hours)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0.5" 
                                max="168" 
                                step="0.5"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="vendor_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vendor (Optional)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select vendor" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">No vendor</SelectItem>
                                {vendors.map((vendor) => (
                                  <SelectItem key={vendor.id} value={vendor.id}>
                                    {vendor.name} ({vendor.type})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Milestone and Special Options */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="milestone_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Milestone (Optional)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select milestone" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">No milestone</SelectItem>
                                {milestones.map((milestone) => (
                                  <SelectItem key={milestone.id} value={milestone.id}>
                                    {milestone.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-3">
                        <FormField
                          control={form.control}
                          name="critical_path"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Critical Path</FormLabel>
                                <div className="text-sm text-muted-foreground">
                                  This task is critical to the timeline
                                </div>
                              </div>
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="h-4 w-4"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="weather_dependent"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Weather Dependent</FormLabel>
                                <div className="text-sm text-muted-foreground">
                                  This task depends on weather conditions
                                </div>
                              </div>
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="h-4 w-4"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Weather Alternative */}
                    {form.watch('weather_dependent') && (
                      <FormField
                        control={form.control}
                        name="indoor_alternative"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" />
                              Indoor Alternative
                            </FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe the indoor alternative plan..." 
                                className="resize-none" 
                                rows={2}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Creating...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            Create Task
                          </div>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 