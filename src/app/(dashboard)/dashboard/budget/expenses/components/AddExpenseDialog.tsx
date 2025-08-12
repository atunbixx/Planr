'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api/client'

interface Category {
  id: string
  name: string
  icon: string
  color: string
}

interface Vendor {
  id: string
  name: string
}

interface AddExpenseDialogProps {
  categories: Category[]
  vendors: Vendor[]
}

export default function AddExpenseDialog({ categories, vendors }: AddExpenseDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    categoryId: '',
    vendorId: '',
    expense_date: new Date().toISOString().split('T')[0],
    paymentMethod: 'other',
    receiptUrl: '',
    notes: ''
  })
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await api.budget.expenses.create({
        description: formData.description,
        amount: Number(formData.amount),
        categoryId: formData.categoryId,
        vendorId: formData.vendorId === 'none' ? undefined : formData.vendorId || undefined,
        dueDate: formData.expense_date,
        paymentStatus: 'pending',
        paymentMethod: formData.paymentMethod,
        notes: formData.notes || undefined
      })
      
      if (response.success && response.data) {
        console.log('Expense created successfully:', response.data)
        setOpen(false)
        setFormData({
          description: '',
          amount: '',
          categoryId: '',
          vendorId: '',
          expense_date: new Date().toISOString().split('T')[0],
          paymentMethod: 'other',
          receiptUrl: '',
          notes: ''
        })
        router.refresh()
      } else {
        console.error('Error creating expense:', response)
        alert('Failed to create expense. Please try again.')
      }
    } catch (error) {
      console.error('Error creating expense:', error)
      alert('Failed to create expense. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
          <DialogDescription>
            Record a new wedding-related expense to track your budget.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., Wedding venue deposit"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount ($) *</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <Label htmlFor="expense_date">Date</Label>
              <Input
                id="expense_date"
                type="date"
                value={formData.expense_date}
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="categoryId">Category</Label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center space-x-2">
                      <span>{category.icon}</span>
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="vendorId">Vendor (Optional)</Label>
            <Select
              value={formData.vendorId}
              onValueChange={(value) => setFormData({ ...formData, vendorId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No vendor</SelectItem>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">💵 Cash</SelectItem>
                <SelectItem value="credit_card">💳 Credit Card</SelectItem>
                <SelectItem value="debit_card">💳 Debit Card</SelectItem>
                <SelectItem value="check">📝 Check</SelectItem>
                <SelectItem value="bank_transfer">🏦 Bank Transfer</SelectItem>
                <SelectItem value="other">❓ Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="receiptUrl">Receipt URL (Optional)</Label>
            <Input
              id="receiptUrl"
              type="url"
              value={formData.receiptUrl}
              onChange={(e) => setFormData({ ...formData, receiptUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional details about this expense..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Expense'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}