'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Calendar, DollarSign, Plus, X, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface PaymentScheduleItem {
  id?: string
  description: string
  amount: number
  dueDate: string
  status: 'pending' | 'paid' | 'overdue'
  notes?: string
}

interface PaymentSchedule {
  id?: string
  vendorId?: string
  categoryId?: string
  totalAmount: number
  currency: string
  schedule: PaymentScheduleItem[]
  createdAt?: string
  updatedAt?: string
}

interface PaymentScheduleDialogProps {
  vendor?: {
    id: string
    name: string
    estimatedCost?: number
  }
  category?: {
    id: string
    name: string
    allocatedAmount?: number
  }
  schedule?: PaymentSchedule
  onSave: (schedule: PaymentSchedule) => void
  children: React.ReactNode
}

export default function PaymentScheduleDialog({ 
  vendor, 
  category, 
  schedule, 
  onSave, 
  children 
}: PaymentScheduleDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [scheduleData, setScheduleData] = useState<PaymentSchedule>({
    vendorId: vendor?.id,
    categoryId: category?.id,
    totalAmount: vendor?.estimatedCost || category?.allocatedAmount || 0,
    currency: 'USD',
    schedule: [
      {
        description: 'Initial Deposit',
        amount: (vendor?.estimatedCost || category?.allocatedAmount || 0) * 0.5,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        status: 'pending'
      },
      {
        description: 'Final Payment',
        amount: (vendor?.estimatedCost || category?.allocatedAmount || 0) * 0.5,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        status: 'pending'
      }
    ],
    ...schedule
  })

  const handleSave = async () => {
    setLoading(true)
    try {
      // Validate schedule
      if (scheduleData.schedule.length === 0) {
        toast.error('Please add at least one payment')
        return
      }

      const totalScheduled = scheduleData.schedule.reduce((sum, item) => sum + item.amount, 0)
      if (Math.abs(totalScheduled - scheduleData.totalAmount) > 1) {
        toast.error('Scheduled payments must equal total amount')
        return
      }

      // TODO: Make API call to save payment schedule
      const response = await fetch('/api/budget/payment-schedules', {
        method: schedule?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...scheduleData,
          id: schedule?.id
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save payment schedule')
      }

      const savedSchedule = await response.json()
      onSave(savedSchedule.data)
      toast.success('Payment schedule saved successfully!')
      setOpen(false)
    } catch (error) {
      console.error('Error saving payment schedule:', error)
      toast.error('Failed to save payment schedule')
    } finally {
      setLoading(false)
    }
  }

  const addPaymentItem = () => {
    setScheduleData(prev => ({
      ...prev,
      schedule: [
        ...prev.schedule,
        {
          description: `Payment ${prev.schedule.length + 1}`,
          amount: 0,
          dueDate: new Date().toISOString().split('T')[0],
          status: 'pending'
        }
      ]
    }))
  }

  const removePaymentItem = (index: number) => {
    setScheduleData(prev => ({
      ...prev,
      schedule: prev.schedule.filter((_, i) => i !== index)
    }))
  }

  const updatePaymentItem = (index: number, updates: Partial<PaymentScheduleItem>) => {
    setScheduleData(prev => ({
      ...prev,
      schedule: prev.schedule.map((item, i) => 
        i === index ? { ...item, ...updates } : item
      )
    }))
  }

  const generateQuickSchedule = (type: 'deposit_final' | 'installments_3' | 'installments_6') => {
    const total = scheduleData.totalAmount
    let newSchedule: PaymentScheduleItem[] = []

    switch (type) {
      case 'deposit_final':
        newSchedule = [
          {
            description: 'Deposit (50%)',
            amount: total * 0.5,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'pending'
          },
          {
            description: 'Final Payment (50%)',
            amount: total * 0.5,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'pending'
          }
        ]
        break
      case 'installments_3':
        for (let i = 0; i < 3; i++) {
          newSchedule.push({
            description: `Installment ${i + 1} (33%)`,
            amount: Math.round((total / 3) * 100) / 100,
            dueDate: new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'pending'
          })
        }
        break
      case 'installments_6':
        for (let i = 0; i < 6; i++) {
          newSchedule.push({
            description: `Monthly Payment ${i + 1}`,
            amount: Math.round((total / 6) * 100) / 100,
            dueDate: new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'pending'
          })
        }
        break
    }

    setScheduleData(prev => ({ ...prev, schedule: newSchedule }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  const totalScheduled = scheduleData.schedule.reduce((sum, item) => sum + item.amount, 0)
  const isBalanced = Math.abs(totalScheduled - scheduleData.totalAmount) < 1

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment Schedule - {vendor?.name || category?.name}
          </DialogTitle>
          <DialogDescription>
            Create and manage payment schedules for better budget planning
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Templates */}
          <div className="space-y-2">
            <Label>Quick Templates</Label>
            <div className="flex gap-2 flex-wrap">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => generateQuickSchedule('deposit_final')}
              >
                50/50 Split
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => generateQuickSchedule('installments_3')}
              >
                3 Installments
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => generateQuickSchedule('installments_6')}
              >
                6 Monthly Payments
              </Button>
            </div>
          </div>

          {/* Total Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Total Amount</Label>
              <div className="flex">
                <Select 
                  value={scheduleData.currency} 
                  onValueChange={(value) => setScheduleData(prev => ({ ...prev, currency: value }))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">$</SelectItem>
                    <SelectItem value="EUR">€</SelectItem>
                    <SelectItem value="GBP">£</SelectItem>
                    <SelectItem value="NGN">₦</SelectItem>
                  </SelectContent>
                </Select>
                <Input 
                  type="number" 
                  value={scheduleData.totalAmount}
                  onChange={(e) => setScheduleData(prev => ({ ...prev, totalAmount: Number(e.target.value) }))}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Balance Check</Label>
              <div className={`p-2 rounded border ${isBalanced ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-2">
                  {isBalanced ? 
                    <span className="text-green-700 text-sm">✓ Balanced</span> : 
                    <span className="text-red-700 text-sm flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      Off by ${Math.abs(totalScheduled - scheduleData.totalAmount).toFixed(2)}
                    </span>
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Payment Schedule */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Payment Schedule</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={addPaymentItem}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Payment
              </Button>
            </div>

            <div className="space-y-3">
              {scheduleData.schedule.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Payment {index + 1}</h4>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePaymentItem(index)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updatePaymentItem(index, { description: e.target.value })}
                        placeholder="Payment description"
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Amount</Label>
                      <Input
                        type="number"
                        value={item.amount}
                        onChange={(e) => updatePaymentItem(index, { amount: Number(e.target.value) })}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Due Date</Label>
                      <Input
                        type="date"
                        value={item.dueDate}
                        onChange={(e) => updatePaymentItem(index, { dueDate: e.target.value })}
                        className="h-8"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Status</Label>
                      <Select 
                        value={item.status} 
                        onValueChange={(value: any) => updatePaymentItem(index, { status: value })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Notes</Label>
                      <Textarea 
                        value={item.notes || ''}
                        onChange={(e) => updatePaymentItem(index, { notes: e.target.value })}
                        placeholder="Optional notes"
                        className="h-8 resize-none"
                        rows={1}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {scheduleData.schedule.length === 0 && (
              <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                <Calendar className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500 mb-4">No payments scheduled yet</p>
                <Button onClick={addPaymentItem} variant="outline">
                  Add First Payment
                </Button>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Schedule Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Total Payments</p>
                <p className="font-medium">{scheduleData.schedule.length}</p>
              </div>
              <div>
                <p className="text-gray-600">Total Amount</p>
                <p className="font-medium">${scheduleData.totalAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600">Scheduled</p>
                <p className="font-medium">${totalScheduled.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600">Next Due</p>
                <p className="font-medium">
                  {scheduleData.schedule
                    .filter(item => item.status === 'pending')
                    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]?.dueDate
                    ? new Date(scheduleData.schedule
                        .filter(item => item.status === 'pending')
                        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0].dueDate
                      ).toLocaleDateString()
                    : 'None'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || !isBalanced}>
            {loading ? 'Saving...' : schedule?.id ? 'Update Schedule' : 'Create Schedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}