'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/utils/cn'
import { BudgetCategory, BudgetCategoryInsert } from '@/hooks/useBudget'
import {
  Edit2,
  Trash2,
  Plus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  MoreVertical,
  Target,
  PieChart
} from 'lucide-react'

interface CategoryManagerProps {
  categories: BudgetCategory[]
  onAddCategory: (category: BudgetCategoryInsert) => Promise<void>
  onUpdateCategory: (id: string, updates: Partial<BudgetCategoryInsert>) => Promise<void>
  onDeleteCategory?: (id: string) => Promise<void>
}

export function CategoryManager({ 
  categories, 
  onAddCategory, 
  onUpdateCategory,
  onDeleteCategory 
}: CategoryManagerProps) {
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState<BudgetCategoryInsert>({
    name: '',
    allocated_amount: 0,
    priority: 3,
    notes: ''
  })
  const [editFormData, setEditFormData] = useState<BudgetCategoryInsert>({
    name: '',
    allocated_amount: 0,
    priority: 3,
    notes: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calculate total budget for percentage calculations
  const totalBudget = categories.reduce((sum, cat) => sum + cat.allocated_amount, 0)

  // Group categories by priority
  const categoriesByPriority = categories.reduce((acc, cat) => {
    const priority = cat.priority || 3
    if (!acc[priority]) acc[priority] = []
    acc[priority].push(cat)
    return acc
  }, {} as Record<number, BudgetCategory[]>)

  const priorityLabels = {
    1: { label: 'Essential', color: 'text-red-600 bg-red-50', icon: AlertCircle },
    2: { label: 'Important', color: 'text-orange-600 bg-orange-50', icon: TrendingUp },
    3: { label: 'Nice to Have', color: 'text-blue-600 bg-blue-50', icon: Target },
    4: { label: 'Optional', color: 'text-green-600 bg-green-50', icon: TrendingDown },
    5: { label: 'Low Priority', color: 'text-gray-600 bg-gray-50', icon: CheckCircle }
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = 'Category name is required'
    if (formData.allocated_amount <= 0) newErrors.allocated_amount = 'Amount must be greater than 0'
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    try {
      await onAddCategory(formData)
      setFormData({ name: '', allocated_amount: 0, priority: 3, notes: '' })
      setShowAddForm(false)
      setErrors({})
    } catch (error: any) {
      setErrors({ general: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateCategory = async (categoryId: string) => {
    const newErrors: Record<string, string> = {}
    if (!editFormData.name.trim()) newErrors.name = 'Category name is required'
    if (editFormData.allocated_amount <= 0) newErrors.allocated_amount = 'Amount must be greater than 0'
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    try {
      await onUpdateCategory(categoryId, editFormData)
      setEditingCategory(null)
      setErrors({})
    } catch (error: any) {
      setErrors({ general: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const startEditing = (category: BudgetCategory) => {
    setEditingCategory(category.id)
    setEditFormData({
      name: category.name,
      allocated_amount: category.allocated_amount,
      priority: category.priority,
      notes: category.notes || ''
    })
    setErrors({})
  }

  const cancelEditing = () => {
    setEditingCategory(null)
    setErrors({})
  }

  // Calculate budget distribution
  const budgetDistribution = Object.entries(priorityLabels).map(([priority, info]) => {
    const priorityCategories = categoriesByPriority[Number(priority)] || []
    const totalAmount = priorityCategories.reduce((sum, cat) => sum + cat.allocated_amount, 0)
    const percentage = totalBudget > 0 ? (totalAmount / totalBudget) * 100 : 0
    
    return {
      priority: Number(priority),
      label: info.label,
      amount: totalAmount,
      percentage,
      count: priorityCategories.length
    }
  }).filter(item => item.count > 0)

  return (
    <div className="space-y-6">
      {/* Budget Distribution Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-accent" />
            Budget Distribution by Priority
          </CardTitle>
          <CardDescription>How your budget is allocated across different priority levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {budgetDistribution.map(dist => {
              const info = priorityLabels[dist.priority]
              const Icon = info.icon
              
              return (
                <div key={dist.priority} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="font-medium">{dist.label}</span>
                      <span className="text-sm text-gray-500">({dist.count} categories)</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">${dist.amount.toLocaleString()}</span>
                      <span className="text-sm text-gray-500 ml-2">{dist.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                  <Progress value={dist.percentage} className="h-2" />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add Category Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Budget Categories</h3>
        <Button onClick={() => setShowAddForm(!showAddForm)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Category
        </Button>
      </div>

      {/* Add Category Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Category</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddCategory} className="space-y-4">
              {errors.general && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                  {errors.general}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Category Name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  error={errors.name}
                  placeholder="e.g., Wedding Flowers"
                  fullWidth
                  disabled={isSubmitting}
                />

                <Input
                  label="Allocated Amount ($)"
                  type="number"
                  value={formData.allocated_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, allocated_amount: Number(e.target.value) }))}
                  error={errors.allocated_amount}
                  placeholder="2500"
                  fullWidth
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Priority Level"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: Number(e.target.value) }))}
                  fullWidth
                  disabled={isSubmitting}
                >
                  {Object.entries(priorityLabels).map(([value, info]) => (
                    <option key={value} value={value}>
                      {info.label}
                    </option>
                  ))}
                </Select>

                <Input
                  label="Notes (Optional)"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional details..."
                  fullWidth
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" loading={isSubmitting}>
                  Add Category
                </Button>
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => {
                    setShowAddForm(false)
                    setErrors({})
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Categories by Priority */}
      {Object.entries(priorityLabels).map(([priority, info]) => {
        const priorityCategories = categoriesByPriority[Number(priority)]
        if (!priorityCategories || priorityCategories.length === 0) return null

        const Icon = info.icon

        return (
          <Card key={priority}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className={cn("h-5 w-5", info.color.split(' ')[0])} />
                {info.label} Categories
              </CardTitle>
              <CardDescription>
                {priorityCategories.length} {priorityCategories.length === 1 ? 'category' : 'categories'} • 
                ${priorityCategories.reduce((sum, cat) => sum + cat.allocated_amount, 0).toLocaleString()} allocated
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {priorityCategories.map(category => {
                  const percentage = category.allocated_amount > 0 
                    ? (category.spent_amount / category.allocated_amount) * 100 
                    : 0
                  const remaining = category.allocated_amount - category.spent_amount
                  const isEditing = editingCategory === category.id

                  if (isEditing) {
                    return (
                      <div key={category.id} className="p-4 bg-gray-50 rounded-lg space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            label="Category Name"
                            value={editFormData.name}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                            error={errors.name}
                            fullWidth
                            disabled={isSubmitting}
                          />

                          <Input
                            label="Allocated Amount ($)"
                            type="number"
                            value={editFormData.allocated_amount}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, allocated_amount: Number(e.target.value) }))}
                            error={errors.allocated_amount}
                            fullWidth
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Select
                            label="Priority Level"
                            value={editFormData.priority}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, priority: Number(e.target.value) }))}
                            fullWidth
                            disabled={isSubmitting}
                          >
                            {Object.entries(priorityLabels).map(([value, info]) => (
                              <option key={value} value={value}>
                                {info.label}
                              </option>
                            ))}
                          </Select>

                          <Input
                            label="Notes (Optional)"
                            value={editFormData.notes}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                            fullWidth
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleUpdateCategory(category.id)}
                            loading={isSubmitting}
                          >
                            Save Changes
                          </Button>
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            onClick={cancelEditing}
                            disabled={isSubmitting}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div 
                      key={category.id} 
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{category.name}</h4>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-sm text-gray-600">
                              ${category.spent_amount.toLocaleString()} of ${category.allocated_amount.toLocaleString()}
                            </span>
                            <span className={cn(
                              "text-sm font-medium",
                              remaining >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {remaining >= 0 ? `$${remaining.toLocaleString()} remaining` : `$${Math.abs(remaining).toLocaleString()} over`}
                            </span>
                          </div>
                          {category.notes && (
                            <p className="text-sm text-gray-500 mt-2">{category.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEditing(category)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {onDeleteCategory && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onDeleteCategory(category.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className={cn(
                            "font-medium",
                            percentage > 100 ? "text-red-600" :
                            percentage > 80 ? "text-orange-600" :
                            "text-green-600"
                          )}>
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                        <Progress 
                          value={Math.min(percentage, 100)} 
                          className={cn(
                            "h-2",
                            percentage > 100 ? "[&>div]:bg-red-500" :
                            percentage > 80 ? "[&>div]:bg-orange-500" :
                            "[&>div]:bg-green-500"
                          )}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}