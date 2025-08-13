'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { enterpriseApi } from '@/lib/api/enterprise-client'

const predefinedCategories = [
  { name: 'Venue', icon: '🏛️', color: '#8B5CF6', priority: 'essential' },
  { name: 'Catering', icon: '🍽️', color: '#EF4444', priority: 'essential' },
  { name: 'Photography', icon: '📸', color: '#F59E0B', priority: 'important' },
  { name: 'Videography', icon: '🎥', color: '#10B981', priority: 'important' },
  { name: 'Music/DJ', icon: '🎵', color: '#3B82F6', priority: 'important' },
  { name: 'Flowers', icon: '💐', color: '#EC4899', priority: 'important' },
  { name: 'Attire', icon: '👗', color: '#6366F1', priority: 'essential' },
  { name: 'Transportation', icon: '🚗', color: '#84CC16', priority: 'nice_to_have' },
  { name: 'Decorations', icon: '🎊', color: '#F97316', priority: 'nice_to_have' },
  { name: 'Stationery', icon: '💌', color: '#06B6D4', priority: 'nice_to_have' },
  { name: 'Rings', icon: '💍', color: '#D97706', priority: 'essential' },
  { name: 'Cake', icon: '🎂', color: '#BE185D', priority: 'important' },
  { name: 'Honeymoon', icon: '✈️', color: '#0891B2', priority: 'nice_to_have' },
  { name: 'Beauty', icon: '💄', color: '#C2410C', priority: 'important' },
  { name: 'Miscellaneous', icon: '📝', color: '#6B7280', priority: 'nice_to_have' },
]

export default function AddCategoryDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isCustom, setIsCustom] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    icon: '💰',
    color: '#3B82F6',
    allocatedAmount: '',
    priority: 'important'
  })
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const category = await enterpriseApi.budget.categories.create({
        name: formData.name,
        icon: formData.icon,
        color: formData.color,
        allocatedAmount: Number(formData.allocatedAmount) || 0,
        priority: formData.priority as any
      })
      
      console.log('Category created successfully:', category)
      setOpen(false)
      setFormData({
          name: '',
          icon: '💰',
          color: '#3B82F6',
          allocatedAmount: '',
          priority: 'important'
        })
        setIsCustom(false)
        router.refresh()
    } catch (error) {
      console.error('Error creating category:', error)
      alert('Failed to create category. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const selectPredefinedCategory = (category: typeof predefinedCategories[0]) => {
    setFormData({
      ...formData,
      name: category.name,
      icon: category.icon,
      color: category.color,
      priority: category.priority
    })
    setIsCustom(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Budget Category</DialogTitle>
          <DialogDescription>
            Choose a predefined category or create a custom one for your wedding budget.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isCustom && (
            <div>
              <Label>Quick Categories</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {predefinedCategories.map((category) => (
                  <button
                    key={category.name}
                    type="button"
                    onClick={() => selectPredefinedCategory(category)}
                    className="p-2 border rounded-lg hover:bg-gray-50 text-center transition-colors"
                  >
                    <div className="text-lg">{category.icon}</div>
                    <div className="text-xs text-muted-foreground">{category.name}</div>
                  </button>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCustom(true)}
                className="w-full mt-3"
              >
                Create Custom Category
              </Button>
            </div>
          )}

          {(isCustom || formData.name) && (
            <>
              <div>
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="icon">Icon</Label>
                  <Input
                    id="icon"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="💰"
                  />
                </div>
                <div>
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="allocatedAmount">Allocated Amount ($)</Label>
                <Input
                  id="allocatedAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.allocatedAmount}
                  onChange={(e) => setFormData({ ...formData, allocatedAmount: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="essential">🔴 Essential</SelectItem>
                    <SelectItem value="important">🟡 Important</SelectItem>
                    <SelectItem value="nice_to_have">🟢 Nice to have</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-between pt-4">
                {isCustom && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCustom(false)
                      setFormData({
                        name: '',
                        icon: '💰',
                        color: '#3B82F6',
                        allocatedAmount: '',
                        priority: 'important'
                      })
                    }}
                  >
                    Back to Quick Categories
                  </Button>
                )}
                <Button type="submit" disabled={loading} className="ml-auto">
                  {loading ? 'Creating...' : 'Create Category'}
                </Button>
              </div>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}