'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utils/cn'
import { useToast } from '@/hooks/useToast'
import { BudgetExpense, useBudget } from '@/hooks/useBudget'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  CreditCard,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
  DollarSign
} from 'lucide-react'

interface PaymentTrackingProps {
  expense: BudgetExpense & {
    category?: { name: string }
    vendor?: { business_name: string }
    payment_status?: string
    is_paid?: boolean
    payment_date?: string
  }
  onPaymentUpdate: () => void
}

export function PaymentTracking({ expense, onPaymentUpdate }: PaymentTrackingProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [paymentData, setPaymentData] = useState({
    amount: expense.amount,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: '',
    payment_reference: '',
    notes: ''
  })
  
  const { recordPayment } = useBudget()
  const { addToast } = useToast()

  const paymentStatusConfig = {
    paid: { label: 'Paid', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
    partial: { label: 'Partial', icon: Clock, color: 'text-orange-600 bg-orange-50' },
    pending: { label: 'Pending', icon: AlertCircle, color: 'text-yellow-600 bg-yellow-50' },
    overdue: { label: 'Overdue', icon: XCircle, color: 'text-red-600 bg-red-50' },
    cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-gray-600 bg-gray-50' }
  }

  const status = expense.payment_status || 'pending'
  const statusConfig = paymentStatusConfig[status as keyof typeof paymentStatusConfig]
  const StatusIcon = statusConfig.icon

  const handleRecordPayment = async () => {
    setIsLoading(true)
    
    try {
      await recordPayment(expense.id, paymentData)

      addToast({
        title: 'Payment recorded',
        description: `Payment of $${paymentData.amount.toLocaleString()} has been recorded`,
        type: 'success'
      })

      setIsOpen(false)
      onPaymentUpdate()
    } catch (error) {
      console.error('Error recording payment:', error)
      addToast({
        title: 'Error',
        description: 'Failed to record payment',
        type: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className={cn("cursor-pointer", statusConfig.color)}
          >
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig.label}
          </Badge>
          {!expense.is_paid && (
            <Button size="sm" variant="outline">
              <CreditCard className="h-4 w-4 mr-2" />
              Pay
            </Button>
          )}
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment for {expense.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Expense Details */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Expense</span>
              <span className="font-medium">{expense.description}</span>
            </div>
            {expense.category && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Category</span>
                <span>{expense.category.name}</span>
              </div>
            )}
            {expense.vendor && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Vendor</span>
                <span>{expense.vendor.business_name}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Amount</span>
              <span className="font-bold">${expense.amount.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Payment Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  className="pl-9"
                  placeholder="0.00"
                />
              </div>
              {paymentData.amount < expense.amount && (
                <p className="text-xs text-orange-600 mt-1">
                  This is a partial payment. Remaining: ${(expense.amount - paymentData.amount).toLocaleString()}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="payment_date">Payment Date</Label>
              <Input
                id="payment_date"
                type="date"
                value={paymentData.payment_date}
                onChange={(e) => setPaymentData(prev => ({ ...prev, payment_date: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="payment_method">Payment Method</Label>
              <select
                id="payment_method"
                value={paymentData.payment_method}
                onChange={(e) => setPaymentData(prev => ({ ...prev, payment_method: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select method</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Cash">Cash</option>
                <option value="Check">Check</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="PayPal">PayPal</option>
                <option value="Venmo">Venmo</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <Label htmlFor="payment_reference">Reference/Check Number (Optional)</Label>
              <Input
                id="payment_reference"
                value={paymentData.payment_reference}
                onChange={(e) => setPaymentData(prev => ({ ...prev, payment_reference: e.target.value }))}
                placeholder="e.g., Check #1234"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={paymentData.notes}
                onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes..."
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleRecordPayment} disabled={isLoading || paymentData.amount <= 0}>
            Record Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}