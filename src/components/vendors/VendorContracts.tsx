'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input, Select } from '@/components/ui/input'
import { 
  useVendorContracts, 
  CONTRACT_STATUSES, 
  DOCUMENT_TYPES, 
  MILESTONE_TYPES,
  VendorDocument,
  ContractMilestone
} from '@/hooks/useVendorContracts'
import { useToastContext } from '@/contexts/ToastContext'
import { cn } from '@/utils/cn'
import {
  FileText,
  Upload,
  Calendar,
  DollarSign,
  Download,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Edit,
  ChevronRight
} from 'lucide-react'

interface VendorContractsProps {
  vendorId: string
  vendorName: string
  contractStatus?: string
  contractAmount?: number
  onStatusChange?: (status: string) => void
}

export function VendorContracts({ 
  vendorId, 
  vendorName, 
  contractStatus,
  contractAmount,
  onStatusChange 
}: VendorContractsProps) {
  const { addToast } = useToastContext()
  const {
    loading,
    documents,
    milestones,
    terms,
    uploadDocument,
    deleteDocument,
    addMilestone,
    updateMilestone,
    deleteMilestone
  } = useVendorContracts(vendorId)

  const [activeTab, setActiveTab] = useState<'documents' | 'milestones' | 'terms'>('documents')
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [showMilestoneForm, setShowMilestoneForm] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  // Get status info
  const statusInfo = CONTRACT_STATUSES.find(s => s.value === contractStatus)

  // Calculate upcoming milestones
  const upcomingMilestones = milestones.filter(m => 
    !m.is_completed && new Date(m.due_date) >= new Date()
  ).slice(0, 3)

  // Document upload form
  const DocumentUploadForm = () => {
    const [formData, setFormData] = useState({
      document_type: 'contract',
      document_name: '',
      notes: ''
    })
    const [isUploading, setIsUploading] = useState(false)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0]
        setUploadFile(file)
        if (!formData.document_name) {
          setFormData(prev => ({ ...prev, document_name: file.name }))
        }
      }
    }

    const handleUpload = async () => {
      if (!uploadFile) {
        addToast({
          title: 'Error',
          description: 'Please select a file to upload',
          type: 'error'
        })
        return
      }

      setIsUploading(true)
      try {
        await uploadDocument(vendorId, uploadFile, formData.document_type, {
          document_name: formData.document_name,
          notes: formData.notes
        })
        
        setShowUploadForm(false)
        setUploadFile(null)
        setFormData({ document_type: 'contract', document_name: '', notes: '' })
      } catch (error: any) {
        addToast({
          title: 'Error',
          description: error.message || 'Failed to upload document',
          type: 'error'
        })
      } finally {
        setIsUploading(false)
      }
    }

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Upload Document</CardTitle>
          <CardDescription>Add a new document for {vendorName}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select File</label>
              <input
                type="file"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-accent file:text-white
                  hover:file:bg-accent/90"
              />
              {uploadFile && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <Select
              label="Document Type"
              value={formData.document_type}
              onChange={(e) => setFormData(prev => ({ ...prev, document_type: e.target.value }))}
              fullWidth
            >
              {DOCUMENT_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </Select>

            <Input
              label="Document Name"
              value={formData.document_name}
              onChange={(e) => setFormData(prev => ({ ...prev, document_name: e.target.value }))}
              placeholder="e.g., Photography Contract v2"
              fullWidth
            />

            <Input
              label="Notes (Optional)"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional notes..."
              fullWidth
            />

            <div className="flex gap-3">
              <Button onClick={handleUpload} loading={isUploading} disabled={!uploadFile}>
                Upload Document
              </Button>
              <Button variant="secondary" onClick={() => {
                setShowUploadForm(false)
                setUploadFile(null)
              }}>
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Milestone form
  const MilestoneForm = () => {
    const [formData, setFormData] = useState({
      milestone_type: 'payment_due',
      title: '',
      description: '',
      due_date: '',
      amount: 0,
      reminder_days: 7
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      
      if (!formData.title || !formData.due_date) {
        addToast({
          title: 'Error',
          description: 'Please fill in all required fields',
          type: 'error'
        })
        return
      }

      setIsSubmitting(true)
      try {
        await addMilestone({
          vendor_id: vendorId,
          couple_id: '', // Will be set by the hook
          milestone_type: formData.milestone_type,
          title: formData.title,
          description: formData.description,
          due_date: formData.due_date,
          amount: formData.amount || undefined,
          is_completed: false,
          reminder_days: formData.reminder_days,
          reminder_sent: false
        })
        
        setShowMilestoneForm(false)
        setFormData({
          milestone_type: 'payment_due',
          title: '',
          description: '',
          due_date: '',
          amount: 0,
          reminder_days: 7
        })
      } catch (error: any) {
        addToast({
          title: 'Error',
          description: error.message || 'Failed to add milestone',
          type: 'error'
        })
      } finally {
        setIsSubmitting(false)
      }
    }

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add Milestone</CardTitle>
          <CardDescription>Track important dates and deadlines</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Milestone Type"
                value={formData.milestone_type}
                onChange={(e) => setFormData(prev => ({ ...prev, milestone_type: e.target.value }))}
                fullWidth
              >
                {MILESTONE_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </Select>

              <Input
                label="Due Date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                required
                fullWidth
              />
            </div>

            <Input
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Final payment due"
              required
              fullWidth
            />

            <Input
              label="Description (Optional)"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Additional details..."
              fullWidth
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Amount ($)"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                placeholder="0.00"
                fullWidth
              />

              <Input
                label="Reminder (days before)"
                type="number"
                value={formData.reminder_days}
                onChange={(e) => setFormData(prev => ({ ...prev, reminder_days: Number(e.target.value) }))}
                fullWidth
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" loading={isSubmitting}>
                Add Milestone
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowMilestoneForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
        <p className="text-gray-600 mt-2">Loading contract information...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Contract Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contract Management</CardTitle>
              <CardDescription>Manage contracts and documents for {vendorName}</CardDescription>
            </div>
            {statusInfo && (
              <Badge 
                variant="outline"
                style={{ borderColor: statusInfo.color, color: statusInfo.color }}
              >
                {statusInfo.label}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {contractAmount && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <DollarSign className="h-4 w-4" />
              <span>Contract Amount: ${contractAmount.toLocaleString()}</span>
            </div>
          )}
          
          {/* Quick Actions */}
          <div className="flex gap-3">
            {onStatusChange && (
              <Select
                value={contractStatus || 'draft'}
                onChange={(e) => onStatusChange(e.target.value)}
                className="w-40"
              >
                {CONTRACT_STATUSES.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </Select>
            )}
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setShowUploadForm(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setShowMilestoneForm(true)}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Add Milestone
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upload Form */}
      {showUploadForm && <DocumentUploadForm />}
      
      {/* Milestone Form */}
      {showMilestoneForm && <MilestoneForm />}

      {/* Upcoming Milestones Summary */}
      {upcomingMilestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upcoming Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingMilestones.map(milestone => {
                const daysUntil = Math.ceil(
                  (new Date(milestone.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                )
                const milestoneType = MILESTONE_TYPES.find(t => t.value === milestone.milestone_type)
                
                return (
                  <div key={milestone.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{milestoneType?.icon}</span>
                      <div>
                        <p className="font-medium">{milestone.title}</p>
                        <p className="text-sm text-gray-600">
                          Due in {daysUntil} days • {new Date(milestone.due_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {milestone.amount && (
                      <div className="text-right">
                        <p className="font-medium">${milestone.amount.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        <Button
          variant={activeTab === 'documents' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('documents')}
          className={cn(
            "px-4 py-2",
            activeTab === 'documents' && "bg-white shadow-sm"
          )}
        >
          Documents ({documents.length})
        </Button>
        <Button
          variant={activeTab === 'milestones' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('milestones')}
          className={cn(
            "px-4 py-2",
            activeTab === 'milestones' && "bg-white shadow-sm"
          )}
        >
          Milestones ({milestones.length})
        </Button>
        <Button
          variant={activeTab === 'terms' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('terms')}
          className={cn(
            "px-4 py-2",
            activeTab === 'terms' && "bg-white shadow-sm"
          )}
        >
          Terms ({terms.length})
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === 'documents' && (
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>All documents related to this vendor</CardDescription>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No documents uploaded yet</p>
                <Button onClick={() => setShowUploadForm(true)}>
                  Upload First Document
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map(doc => {
                  const docType = DOCUMENT_TYPES.find(t => t.value === doc.document_type)
                  
                  return (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{docType?.icon}</span>
                        <div>
                          <p className="font-medium">{doc.document_name}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>{docType?.label}</span>
                            {doc.file_size && (
                              <>
                                <span>•</span>
                                <span>{(doc.file_size / 1024 / 1024).toFixed(2)} MB</span>
                              </>
                            )}
                            <span>•</span>
                            <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                            {doc.is_signed && (
                              <>
                                <span>•</span>
                                <CheckCircle className="h-3 w-3 text-green-600" />
                                <span className="text-green-600">Signed</span>
                              </>
                            )}
                          </div>
                          {doc.notes && (
                            <p className="text-sm text-gray-500 mt-1">{doc.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(doc.file_path, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            if (confirm('Are you sure you want to delete this document?')) {
                              try {
                                await deleteDocument(doc.id)
                              } catch (error: any) {
                                addToast({
                                  title: 'Error',
                                  description: 'Failed to delete document',
                                  type: 'error'
                                })
                              }
                            }
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'milestones' && (
        <Card>
          <CardHeader>
            <CardTitle>Milestones & Deadlines</CardTitle>
            <CardDescription>Track important dates and payments</CardDescription>
          </CardHeader>
          <CardContent>
            {milestones.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No milestones created yet</p>
                <Button onClick={() => setShowMilestoneForm(true)}>
                  Add First Milestone
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {milestones.map(milestone => {
                  const milestoneType = MILESTONE_TYPES.find(t => t.value === milestone.milestone_type)
                  const daysUntil = Math.ceil(
                    (new Date(milestone.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  )
                  const isOverdue = !milestone.is_completed && daysUntil < 0
                  
                  return (
                    <div key={milestone.id} className={cn(
                      "flex items-center justify-between p-3 border rounded-lg",
                      milestone.is_completed && "bg-gray-50",
                      isOverdue && "border-red-200 bg-red-50"
                    )}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{milestoneType?.icon}</span>
                        <div>
                          <p className={cn(
                            "font-medium",
                            milestone.is_completed && "line-through text-gray-500"
                          )}>
                            {milestone.title}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>{milestoneType?.label}</span>
                            <span>•</span>
                            <span>{new Date(milestone.due_date).toLocaleDateString()}</span>
                            {!milestone.is_completed && (
                              <>
                                <span>•</span>
                                {isOverdue ? (
                                  <span className="text-red-600">Overdue by {Math.abs(daysUntil)} days</span>
                                ) : (
                                  <span>Due in {daysUntil} days</span>
                                )}
                              </>
                            )}
                            {milestone.is_completed && milestone.completed_date && (
                              <>
                                <span>•</span>
                                <CheckCircle className="h-3 w-3 text-green-600" />
                                <span className="text-green-600">
                                  Completed {new Date(milestone.completed_date).toLocaleDateString()}
                                </span>
                              </>
                            )}
                          </div>
                          {milestone.description && (
                            <p className="text-sm text-gray-500 mt-1">{milestone.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {milestone.amount && (
                          <div className="text-right">
                            <p className="font-medium">${milestone.amount.toLocaleString()}</p>
                          </div>
                        )}
                        <div className="flex gap-1">
                          {!milestone.is_completed && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await updateMilestone(milestone.id, {
                                    is_completed: true,
                                    completed_date: new Date().toISOString().split('T')[0]
                                  })
                                } catch (error) {
                                  addToast({
                                    title: 'Error',
                                    description: 'Failed to update milestone',
                                    type: 'error'
                                  })
                                }
                              }}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              if (confirm('Are you sure you want to delete this milestone?')) {
                                try {
                                  await deleteMilestone(milestone.id)
                                } catch (error) {
                                  addToast({
                                    title: 'Error',
                                    description: 'Failed to delete milestone',
                                    type: 'error'
                                  })
                                }
                              }
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'terms' && (
        <Card>
          <CardHeader>
            <CardTitle>Contract Terms</CardTitle>
            <CardDescription>Key terms and conditions to track</CardDescription>
          </CardHeader>
          <CardContent>
            {terms.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No contract terms added yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {terms.map(term => (
                  <div key={term.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{term.term_title}</h4>
                          <Badge 
                            variant={term.importance === 'critical' ? 'destructive' : 
                                    term.importance === 'high' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {term.importance}
                          </Badge>
                          {term.is_agreed && (
                            <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                              Agreed
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{term.term_description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{term.term_category.replace('_', ' ')}</span>
                          {term.is_negotiable && (
                            <span className="text-amber-600">Negotiable</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}