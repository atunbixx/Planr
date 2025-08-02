'use client'

import { useState } from 'react'
import { ChecklistCategory } from '@/hooks/useWeddingChecklist'
import { Button } from '@/components/ui/button'
import { Input, Select, Textarea } from '@/components/ui/input'
import { X } from 'lucide-react'

interface AddCustomTaskDialogProps {
  categories: ChecklistCategory[]
  onAdd: (task: {
    category_id: string
    task_name: string
    description?: string
    due_date?: string
    priority: 'low' | 'medium' | 'high' | 'critical'
    assigned_to?: 'partner1' | 'partner2' | 'both' | 'vendor' | 'other'
  }) => Promise<void>
  onClose: () => void
}

export function AddCustomTaskDialog({ categories, onAdd, onClose }: AddCustomTaskDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    category_id: categories[0]?.id || '',
    task_name: '',
    description: '',
    due_date: '',
    priority: 'medium' as const,
    assigned_to: undefined as any
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.task_name.trim() || !formData.category_id) {
      return
    }

    setLoading(true)
    try {
      await onAdd({
        ...formData,
        description: formData.description || undefined,
        due_date: formData.due_date || undefined,
        assigned_to: formData.assigned_to || undefined
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Add Custom Task</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Name *
            </label>
            <Input
              value={formData.task_name}
              onChange={(e) => setFormData(prev => ({ ...prev, task_name: e.target.value }))}
              placeholder="Enter task name"
              required
              fullWidth
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <Select
              value={formData.category_id}
              onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
              fullWidth
              required
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.category_name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Add any additional details..."
              rows={3}
              fullWidth
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                fullWidth
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <Select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                fullWidth
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign To
            </label>
            <Select
              value={formData.assigned_to || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, assigned_to: e.target.value || undefined }))}
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

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.task_name.trim()}
              loading={loading}
            >
              Add Task
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}