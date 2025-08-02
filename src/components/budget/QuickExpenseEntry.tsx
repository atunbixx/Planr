'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/utils/cn'
import { BudgetExpenseInsert, useBudget } from '@/hooks/useBudget'
import { useToast } from '@/hooks/useToast'
import {
  DollarSign,
  Plus,
  ShoppingCart,
  Camera,
  Music,
  Flower,
  Car,
  Cake,
  Mail,
  Heart,
  Users,
  Sparkles
} from 'lucide-react'

const quickCategories = [
  { icon: ShoppingCart, name: 'Venue & Reception', color: 'bg-blue-500' },
  { icon: Users, name: 'Catering & Bar', color: 'bg-green-500' },
  { icon: Camera, name: 'Photography & Videography', color: 'bg-purple-500' },
  { icon: Heart, name: 'Wedding Attire', color: 'bg-pink-500' },
  { icon: Flower, name: 'Flowers & Decorations', color: 'bg-red-500' },
  { icon: Music, name: 'Music & Entertainment', color: 'bg-yellow-500' },
  { icon: Car, name: 'Transportation', color: 'bg-gray-500' },
  { icon: Cake, name: 'Wedding Cake', color: 'bg-orange-500' },
  { icon: Mail, name: 'Invitations & Stationery', color: 'bg-indigo-500' },
  { icon: Sparkles, name: 'Other', color: 'bg-gray-400' }
]

export function QuickExpenseEntry() {
  const { categories, addExpense } = useBudget()
  const { addToast } = useToast()
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleQuickAdd = async () => {
    if (!amount || !description) {
      addToast({
        title: 'Missing information',
        description: 'Please enter both amount and description',
        type: 'error'
      })
      return
    }

    const expenseAmount = parseFloat(amount)
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      addToast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount',
        type: 'error'
      })
      return
    }

    setIsSubmitting(true)
    try {
      const expenseData: BudgetExpenseInsert = {
        description,
        amount: expenseAmount,
        category_id: selectedCategory || undefined,
        date_incurred: new Date().toISOString().split('T')[0]
      }

      await addExpense(expenseData)
      
      addToast({
        title: 'Expense added',
        description: `$${expenseAmount.toLocaleString()} expense recorded`,
        type: 'success'
      })

      // Reset form
      setAmount('')
      setDescription('')
      setSelectedCategory(null)
      setIsExpanded(false)
    } catch (error) {
      console.error('Error adding expense:', error)
      addToast({
        title: 'Error',
        description: 'Failed to add expense',
        type: 'error'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getCategoryId = (categoryName: string) => {
    const category = categories.find(cat => 
      cat.name.toLowerCase().includes(categoryName.toLowerCase()) ||
      categoryName.toLowerCase().includes(cat.name.toLowerCase())
    )
    return category?.id || null
  }

  return (
    <Card className={cn(
      "transition-all duration-300",
      isExpanded ? "shadow-lg" : "hover:shadow-md cursor-pointer"
    )}>
      <CardHeader 
        onClick={() => !isExpanded && setIsExpanded(true)}
        className={cn(!isExpanded && "cursor-pointer")}
      >
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Quick Expense Entry</CardTitle>
            <CardDescription>Add expenses on the go</CardDescription>
          </div>
          {!isExpanded && (
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Amount Input */}
          <div>
            <label className="text-sm font-medium text-gray-700">Amount</label>
            <div className="relative mt-1">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-9"
                placeholder="0.00"
                autoFocus
              />
            </div>
          </div>

          {/* Description Input */}
          <div>
            <label className="text-sm font-medium text-gray-700">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Venue deposit"
              className="mt-1"
            />
          </div>

          {/* Quick Category Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Category (Optional)
            </label>
            <div className="grid grid-cols-5 gap-2">
              {quickCategories.map((cat) => {
                const categoryId = getCategoryId(cat.name)
                const Icon = cat.icon
                const isSelected = selectedCategory === categoryId

                return (
                  <button
                    key={cat.name}
                    onClick={() => setSelectedCategory(isSelected ? null : categoryId)}
                    disabled={!categoryId}
                    className={cn(
                      "p-3 rounded-lg transition-all flex flex-col items-center gap-1",
                      isSelected 
                        ? `${cat.color} text-white shadow-md scale-105`
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700",
                      !categoryId && "opacity-50 cursor-not-allowed"
                    )}
                    title={cat.name}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs truncate w-full text-center">
                      {cat.name.split(' ')[0]}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button 
              onClick={handleQuickAdd} 
              disabled={isSubmitting || !amount || !description}
              className="flex-1"
            >
              Add Expense
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsExpanded(false)
                setAmount('')
                setDescription('')
                setSelectedCategory(null)
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}