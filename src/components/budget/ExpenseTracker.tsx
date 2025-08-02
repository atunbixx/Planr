'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { cn } from '@/utils/cn'
import { BudgetCategory, BudgetExpense, BudgetExpenseInsert } from '@/hooks/useBudget'
import {
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Receipt,
  Download,
  Upload,
  Trash2,
  Edit2,
  CreditCard,
  AlertCircle,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface ExpenseTrackerProps {
  expenses: BudgetExpense[]
  categories: BudgetCategory[]
  onAddExpense: (expense: BudgetExpenseInsert) => Promise<void>
  onUpdateExpense?: (id: string, updates: Partial<BudgetExpenseInsert>) => Promise<void>
  onDeleteExpense: (id: string) => Promise<void>
}

export function ExpenseTracker({ 
  expenses, 
  categories, 
  onAddExpense, 
  onUpdateExpense,
  onDeleteExpense 
}: ExpenseTrackerProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all')
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [expandedExpense, setExpandedExpense] = useState<string | null>(null)
  const [editingExpense, setEditingExpense] = useState<string | null>(null)

  const [formData, setFormData] = useState<BudgetExpenseInsert & { date_incurred: string }>({
    category_id: '',
    description: '',
    amount: 0,
    date_incurred: new Date().toISOString().split('T')[0],
    payment_method: '',
    notes: '',
    payment_status: 'pending'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filter and sort expenses
  const filteredExpenses = useMemo(() => {
    let filtered = [...expenses]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(expense => 
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.payment_method?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(expense => expense.category_id === selectedCategory)
    }

    // Date range filter
    if (selectedDateRange !== 'all') {
      const now = new Date()
      const ranges: Record<string, number> = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '180d': 180,
        '365d': 365
      }
      
      if (ranges[selectedDateRange]) {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - ranges[selectedDateRange])
        filtered = filtered.filter(expense => 
          new Date(expense.date_incurred) >= cutoffDate
        )
      }
    }

    // Payment status filter
    if (selectedPaymentStatus !== 'all') {
      filtered = filtered.filter(expense => 
        expense.payment_status === selectedPaymentStatus
      )
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.date_incurred).getTime()
        const dateB = new Date(b.date_incurred).getTime()
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
      } else {
        return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount
      }
    })

    return filtered
  }, [expenses, searchTerm, selectedCategory, selectedDateRange, selectedPaymentStatus, sortBy, sortOrder])

  // Calculate stats
  const stats = useMemo(() => {
    const total = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0)
    const paid = filteredExpenses.filter(exp => exp.payment_status === 'paid').reduce((sum, exp) => sum + exp.amount, 0)
    const pending = filteredExpenses.filter(exp => exp.payment_status === 'pending').reduce((sum, exp) => sum + exp.amount, 0)
    
    return {
      total,
      paid,
      pending,
      count: filteredExpenses.length,
      average: filteredExpenses.length > 0 ? total / filteredExpenses.length : 0
    }
  }, [filteredExpenses])

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors: Record<string, string> = {}
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (formData.amount <= 0) newErrors.amount = 'Amount must be greater than 0'
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    try {
      await onAddExpense(formData)
      setFormData({
        category_id: '',
        description: '',
        amount: 0,
        date_incurred: new Date().toISOString().split('T')[0],
        payment_method: '',
        notes: '',
        payment_status: 'pending'
      })
      setShowAddForm(false)
      setErrors({})
    } catch (error: any) {
      setErrors({ general: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const paymentStatusColors = {
    paid: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    partial: 'bg-orange-100 text-orange-700',
    overdue: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-700'
  }

  const paymentStatusIcons = {
    paid: CheckCircle,
    pending: AlertCircle,
    partial: AlertCircle,
    overdue: AlertCircle,
    cancelled: X
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.count} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${stats.paid.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.paid / stats.total) * 100).toFixed(0)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">${stats.pending.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              To be paid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${Math.round(stats.average).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Per transaction
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Expense Tracker</CardTitle>
            <Button onClick={() => setShowAddForm(!showAddForm)} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Expense
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="180d">Last 6 Months</option>
              <option value="365d">Last Year</option>
            </select>

            <select
              value={selectedPaymentStatus}
              onChange={(e) => setSelectedPaymentStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Sort by:</span>
            <Button
              variant={sortBy === 'date' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                setSortBy('date')
                setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
              }}
            >
              Date {sortBy === 'date' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />)}
            </Button>
            <Button
              variant={sortBy === 'amount' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                setSortBy('amount')
                setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
              }}
            >
              Amount {sortBy === 'amount' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />)}
            </Button>
          </div>

          {/* Add Expense Form */}
          {showAddForm && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-semibold mb-4">Add New Expense</h4>
              <form onSubmit={handleAddExpense} className="space-y-4">
                {errors.general && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                    {errors.general}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    error={errors.description}
                    placeholder="e.g., Venue deposit"
                    fullWidth
                    disabled={isSubmitting}
                  />

                  <Input
                    label="Amount ($)"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    error={errors.amount}
                    placeholder="1500.00"
                    fullWidth
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select
                    label="Category"
                    value={formData.category_id || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value || undefined }))}
                    fullWidth
                    disabled={isSubmitting}
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </Select>

                  <Input
                    label="Date"
                    type="date"
                    value={formData.date_incurred}
                    onChange={(e) => setFormData(prev => ({ ...prev, date_incurred: e.target.value }))}
                    fullWidth
                    disabled={isSubmitting}
                  />

                  <Select
                    label="Payment Status"
                    value={formData.payment_status || 'pending'}
                    onChange={(e) => setFormData(prev => ({ ...prev, payment_status: e.target.value as any }))}
                    fullWidth
                    disabled={isSubmitting}
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="partial">Partial</option>
                    <option value="overdue">Overdue</option>
                    <option value="cancelled">Cancelled</option>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Payment Method (Optional)"
                    value={formData.payment_method}
                    onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                    placeholder="e.g., Credit Card, Cash"
                    fullWidth
                    disabled={isSubmitting}
                  />

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
                    Add Expense
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
            </div>
          )}

          {/* Expenses List */}
          <div className="space-y-3">
            {filteredExpenses.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No expenses found matching your filters.</p>
              </div>
            ) : (
              filteredExpenses.map(expense => {
                const category = categories.find(cat => cat.id === expense.category_id)
                const isExpanded = expandedExpense === expense.id
                const StatusIcon = paymentStatusIcons[expense.payment_status || 'pending']

                return (
                  <div 
                    key={expense.id} 
                    className="border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div 
                      className="p-4 cursor-pointer"
                      onClick={() => setExpandedExpense(isExpanded ? null : expense.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className="font-semibold">{expense.description}</h4>
                            <span className={cn(
                              "px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1",
                              paymentStatusColors[expense.payment_status || 'pending']
                            )}>
                              <StatusIcon className="h-3 w-3" />
                              {expense.payment_status || 'pending'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(expense.date_incurred).toLocaleDateString()}
                            </span>
                            {category && (
                              <span>{category.name}</span>
                            )}
                            {expense.payment_method && (
                              <span className="flex items-center gap-1">
                                <CreditCard className="h-3 w-3" />
                                {expense.payment_method}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold">${expense.amount.toLocaleString()}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              onDeleteExpense(expense.id)
                            }}
                            className="text-red-600 hover:text-red-700 mt-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t">
                        <div className="pt-4 space-y-3">
                          {expense.notes && (
                            <div>
                              <p className="text-sm font-medium text-gray-600">Notes</p>
                              <p className="text-sm">{expense.notes}</p>
                            </div>
                          )}
                          {expense.payment_date && (
                            <div>
                              <p className="text-sm font-medium text-gray-600">Payment Date</p>
                              <p className="text-sm">{new Date(expense.payment_date).toLocaleDateString()}</p>
                            </div>
                          )}
                          {expense.payment_reference && (
                            <div>
                              <p className="text-sm font-medium text-gray-600">Payment Reference</p>
                              <p className="text-sm">{expense.payment_reference}</p>
                            </div>
                          )}
                          <div className="flex gap-2 pt-2">
                            {onUpdateExpense && (
                              <Button size="sm" variant="secondary">
                                <Edit2 className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                            )}
                            {expense.receipt_url && (
                              <Button size="sm" variant="secondary">
                                <Download className="h-3 w-3 mr-1" />
                                Receipt
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}