'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { FileText, Upload, Download, Eye, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Contract {
  id?: string
  vendorId: string
  contractType: 'service' | 'rental' | 'venue' | 'other'
  contractValue: number
  currency: string
  signedDate?: string
  startDate: string
  endDate?: string
  paymentSchedule: string
  cancellationPolicy?: string
  notes?: string
  contractUrl?: string
  status: 'draft' | 'sent' | 'signed' | 'expired'
  paymentStatus: 'pending' | 'deposit_paid' | 'partial' | 'paid_full'
}

interface ContractDialogProps {
  vendor: {
    id: string
    name: string
    contactName?: string
    estimatedCost?: number
  }
  contract?: Contract
  onSave: (contract: Contract) => void
  children: React.ReactNode
}

export default function ContractDialog({ vendor, contract, onSave, children }: ContractDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [contractData, setContractData] = useState<Contract>({
    vendorId: vendor.id,
    contractType: 'service',
    contractValue: vendor.estimatedCost || 0,
    currency: 'USD',
    startDate: '',
    paymentSchedule: 'full_upfront',
    status: 'draft',
    paymentStatus: 'pending',
    ...contract
  })

  const handleSave = async () => {
    setLoading(true)
    try {
      // Validate required fields
      if (!contractData.contractValue || !contractData.startDate) {
        toast.error('Please fill in all required fields')
        return
      }

      // TODO: Make API call to save contract
      const response = await fetch('/api/vendors/contracts', {
        method: contract?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...contractData,
          id: contract?.id
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save contract')
      }

      const savedContract = await response.json()
      onSave(savedContract)
      toast.success(contract?.id ? 'Contract updated successfully!' : 'Contract created successfully!')
      setOpen(false)
    } catch (error) {
      console.error('Error saving contract:', error)
      toast.error('Failed to save contract')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    // TODO: Implement file upload to cloud storage
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('vendorId', vendor.id)

      const response = await fetch('/api/vendors/contracts/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to upload file')
      }

      const { url } = await response.json()
      setContractData(prev => ({ ...prev, contractUrl: url }))
      toast.success('Contract file uploaded successfully!')
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error('Failed to upload contract file')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'signed': return 'bg-green-100 text-green-800'
      case 'sent': return 'bg-blue-100 text-blue-800'
      case 'expired': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid_full': return 'bg-green-100 text-green-800'
      case 'deposit_paid': case 'partial': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {contract?.id ? 'Edit Contract' : 'Add Contract'} - {vendor.name}
          </DialogTitle>
          <DialogDescription>
            Manage contract details, payment schedule, and important dates
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badges */}
          {contract?.id && (
            <div className="flex gap-2">
              <Badge className={getStatusColor(contractData.status)}>
                {contractData.status.replace('_', ' ')}
              </Badge>
              <Badge className={getPaymentStatusColor(contractData.paymentStatus)}>
                {contractData.paymentStatus.replace('_', ' ')}
              </Badge>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contractType">Contract Type *</Label>
              <Select 
                value={contractData.contractType} 
                onValueChange={(value: any) => setContractData(prev => ({ ...prev, contractType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="service">Service Agreement</SelectItem>
                  <SelectItem value="rental">Equipment Rental</SelectItem>
                  <SelectItem value="venue">Venue Booking</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractValue">Contract Value *</Label>
              <div className="flex">
                <Select 
                  value={contractData.currency} 
                  onValueChange={(value) => setContractData(prev => ({ ...prev, currency: value }))}
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
                  value={contractData.contractValue}
                  onChange={(e) => setContractData(prev => ({ ...prev, contractValue: Number(e.target.value) }))}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Service Date *</Label>
              <Input 
                type="date" 
                value={contractData.startDate}
                onChange={(e) => setContractData(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date (if applicable)</Label>
              <Input 
                type="date" 
                value={contractData.endDate || ''}
                onChange={(e) => setContractData(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>

          {/* Payment Schedule */}
          <div className="space-y-2">
            <Label htmlFor="paymentSchedule">Payment Schedule</Label>
            <Select 
              value={contractData.paymentSchedule} 
              onValueChange={(value) => setContractData(prev => ({ ...prev, paymentSchedule: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full_upfront">Full Payment Upfront</SelectItem>
                <SelectItem value="50_50">50% Deposit, 50% on Service</SelectItem>
                <SelectItem value="30_70">30% Deposit, 70% on Service</SelectItem>
                <SelectItem value="25_75">25% Deposit, 75% on Service</SelectItem>
                <SelectItem value="installments">Monthly Installments</SelectItem>
                <SelectItem value="custom">Custom Schedule</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Contract File */}
          <div className="space-y-2">
            <Label>Contract Document</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              {contractData.contractUrl ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">Contract uploaded</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Upload contract PDF</p>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file)
                    }}
                    className="hidden"
                    id="contract-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('contract-upload')?.click()}
                  >
                    Choose File
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Additional Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cancellationPolicy">Cancellation Policy</Label>
              <Textarea 
                value={contractData.cancellationPolicy || ''}
                onChange={(e) => setContractData(prev => ({ ...prev, cancellationPolicy: e.target.value }))}
                placeholder="Describe the cancellation terms and any fees..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea 
                value={contractData.notes || ''}
                onChange={(e) => setContractData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any special terms, requirements, or notes..."
                rows={3}
              />
            </div>
          </div>

          {/* Status Updates (for existing contracts) */}
          {contract?.id && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="status">Contract Status</Label>
                <Select 
                  value={contractData.status} 
                  onValueChange={(value: any) => setContractData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent for Signing</SelectItem>
                    <SelectItem value="signed">Signed</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentStatus">Payment Status</Label>
                <Select 
                  value={contractData.paymentStatus} 
                  onValueChange={(value: any) => setContractData(prev => ({ ...prev, paymentStatus: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="deposit_paid">Deposit Paid</SelectItem>
                    <SelectItem value="partial">Partial Payment</SelectItem>
                    <SelectItem value="paid_full">Paid in Full</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Warnings */}
          {contractData.status === 'signed' && contractData.paymentStatus === 'pending' && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Payment Required</p>
                <p className="text-yellow-700">Contract is signed but payment is still pending.</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : contract?.id ? 'Update Contract' : 'Create Contract'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}