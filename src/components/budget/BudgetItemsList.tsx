'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/utils/cn'
import { useBudgetItems } from '@/hooks/useBudgetItems'
import { format } from 'date-fns'
import {
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  Building2,
  Tag,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  Search,
  Download,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface BudgetItemsListProps {
  coupleId: string
  periodId: string
  categoryFilter?: string
  vendorFilter?: string
}

export function BudgetItemsList({ 
  coupleId, 
  periodId, 
  categoryFilter, 
  vendorFilter 
}: BudgetItemsListProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  
  const { toast } = useToast()
  const { 
    items, 
    categories, 
    subcategories,
    vendors, 
    loading, 
    addItem, 
    updateItem, 
    deleteItem 
  } = useBudgetItems(coupleId, periodId)

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !categoryFilter || item.category_type_id === categoryFilter
    const matchesVendor = !vendorFilter || item.vendor_id === vendorFilter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    
    return matchesSearch && matchesCategory && matchesVendor && matchesStatus
  })

  // Group items by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    const category = categories.find(c => c.id === item.category_type_id)
    const categoryName = category?.name || 'Uncategorized'
    if (!acc[categoryName]) {
      acc[categoryName] = {
        category,
        items: [],
        total: 0,
        paid: 0
      }
    }
    acc[categoryName].items.push(item)
    const amount = item.final_amount || item.contracted_amount || item.estimated_amount
    acc[categoryName].total += amount
    if (item.status === 'paid') {
      acc[categoryName].paid += amount
    }
    return acc
  }, {} as Record<string, any>)

  const toggleRowExpansion = (itemId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedRows(newExpanded)
  }

  const handleAddItem = async (data: any) => {
    try {
      await addItem(data)
      setShowAddDialog(false)
      toast({
        title: 'Budget item added',
        description: 'Your budget item has been added successfully.'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add budget item. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const handleUpdateItem = async (itemId: string, data: any) => {
    try {
      await updateItem(itemId, data)
      setEditingItem(null)
      toast({
        title: 'Budget item updated',
        description: 'Your budget item has been updated successfully.'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update budget item. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this budget item?')) return
    
    try {
      await deleteItem(itemId)
      toast({
        title: 'Budget item deleted',
        description: 'Your budget item has been deleted successfully.'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete budget item. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      planned: { label: 'Planned', className: 'bg-gray-100 text-gray-700' },
      committed: { label: 'Committed', className: 'bg-blue-100 text-blue-700' },
      partial: { label: 'Partial', className: 'bg-orange-100 text-orange-700' },
      paid: { label: 'Paid', className: 'bg-green-100 text-green-700' },
      cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
      refunded: { label: 'Refunded', className: 'bg-purple-100 text-purple-700' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.planned
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const getPriorityBadge = (priority: number) => {
    const priorityConfig = {
      1: { label: 'Critical', className: 'bg-red-100 text-red-700' },
      2: { label: 'High', className: 'bg-orange-100 text-orange-700' },
      3: { label: 'Medium', className: 'bg-yellow-100 text-yellow-700' },
      4: { label: 'Low', className: 'bg-green-100 text-green-700' },
      5: { label: 'Optional', className: 'bg-gray-100 text-gray-700' }
    }
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig[3]
    return <Badge className={config.className}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-gray-500">Loading budget items...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Budget Items</CardTitle>
              <CardDescription>Detailed tracking of all wedding expenses</CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="committed">Committed</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold">{filteredItems.length}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Estimated</p>
              <p className="text-2xl font-bold">
                ${filteredItems.reduce((sum, item) => sum + item.estimated_amount, 0).toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Committed</p>
              <p className="text-2xl font-bold text-blue-600">
                ${filteredItems.reduce((sum, item) => sum + (item.contracted_amount || item.estimated_amount), 0).toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Paid</p>
              <p className="text-2xl font-bold text-green-600">
                ${filteredItems
                  .filter(item => item.status === 'paid')
                  .reduce((sum, item) => sum + (item.final_amount || item.contracted_amount || item.estimated_amount), 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grouped Items */}
      {Object.entries(groupedItems).map(([categoryName, categoryData]) => (
        <Card key={categoryName}>
          <CardHeader className="bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="h-10 w-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: categoryData.category?.color + '20' }}
                >
                  <span className="text-xl">{categoryData.category?.icon || '📦'}</span>
                </div>
                <div>
                  <CardTitle className="text-lg">{categoryName}</CardTitle>
                  <CardDescription>
                    {categoryData.items.length} items • ${categoryData.total.toLocaleString()} total
                  </CardDescription>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Paid</p>
                <p className="text-lg font-semibold text-green-600">
                  ${categoryData.paid.toLocaleString()}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">Item</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Estimated</TableHead>
                  <TableHead className="text-right">Actual</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryData.items.map((item: any) => (
                  <>
                    <TableRow key={item.id} className="cursor-pointer hover:bg-gray-50">
                      <TableCell onClick={() => toggleRowExpansion(item.id)}>
                        <div className="flex items-center gap-2">
                          {expandedRows.has(item.id) ? 
                            <ChevronUp className="h-4 w-4 text-gray-400" /> : 
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          }
                          <div>
                            <p className="font-medium">{item.name}</p>
                            {item.description && (
                              <p className="text-sm text-gray-600 line-clamp-1">{item.description}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.vendor_id ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              {vendors.find(v => v.id === item.vendor_id)?.business_name || 'Unknown'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">No vendor</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>{getPriorityBadge(item.priority_level || 3)}</TableCell>
                      <TableCell>
                        {item.due_date ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className={cn(
                              "text-sm",
                              new Date(item.due_date) < new Date() && item.status !== 'paid' && "text-red-600 font-medium"
                            )}>
                              {format(new Date(item.due_date), 'MMM d, yyyy')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">No due date</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${item.estimated_amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.final_amount ? (
                          <span className={cn(
                            item.final_amount > item.estimated_amount ? "text-red-600" : "text-green-600"
                          )}>
                            ${item.final_amount.toLocaleString()}
                          </span>
                        ) : item.contracted_amount ? (
                          <span className="text-blue-600">
                            ${item.contracted_amount.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingItem(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedRows.has(item.id) && (
                      <TableRow>
                        <TableCell colSpan={8} className="bg-gray-50">
                          <div className="p-4 space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <p className="text-sm font-medium text-gray-600">Subcategory</p>
                                <p className="text-sm">
                                  {subcategories.find(s => s.id === item.subcategory_type_id)?.name || 'None'}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-600">Contract Date</p>
                                <p className="text-sm">
                                  {item.contract_date ? format(new Date(item.contract_date), 'MMM d, yyyy') : 'Not set'}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-600">Service Date</p>
                                <p className="text-sm">
                                  {item.service_date ? format(new Date(item.service_date), 'MMM d, yyyy') : 'Not set'}
                                </p>
                              </div>
                            </div>
                            {item.notes && (
                              <div>
                                <p className="text-sm font-medium text-gray-600">Notes</p>
                                <p className="text-sm">{item.notes}</p>
                              </div>
                            )}
                            {item.tags && item.tags.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-gray-600 mb-2">Tags</p>
                                <div className="flex gap-2">
                                  {item.tags.map((tag: string, index: number) => (
                                    <Badge key={index} variant="secondary">
                                      <Tag className="h-3 w-3 mr-1" />
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog || !!editingItem} onOpenChange={(open) => {
        if (!open) {
          setShowAddDialog(false)
          setEditingItem(null)
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Budget Item' : 'Add Budget Item'}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update the details of your budget item.' : 'Add a new item to track in your wedding budget.'}
            </DialogDescription>
          </DialogHeader>
          <BudgetItemForm
            item={editingItem}
            categories={categories}
            subcategories={subcategories}
            vendors={vendors}
            onSubmit={editingItem ? 
              (data) => handleUpdateItem(editingItem.id, data) : 
              handleAddItem
            }
            onCancel={() => {
              setShowAddDialog(false)
              setEditingItem(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Budget Item Form Component
function BudgetItemForm({ 
  item, 
  categories, 
  subcategories, 
  vendors, 
  onSubmit, 
  onCancel 
}: any) {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    category_type_id: item?.category_type_id || '',
    subcategory_type_id: item?.subcategory_type_id || '',
    vendor_id: item?.vendor_id || '',
    estimated_amount: item?.estimated_amount || '',
    contracted_amount: item?.contracted_amount || '',
    final_amount: item?.final_amount || '',
    status: item?.status || 'planned',
    priority_level: item?.priority_level || 3,
    due_date: item?.due_date || '',
    contract_date: item?.contract_date || '',
    service_date: item?.service_date || '',
    quantity: item?.quantity || 1,
    unit_price: item?.unit_price || '',
    is_deposit: item?.is_deposit || false,
    is_gratuity: item?.is_gratuity || false,
    is_tax_included: item?.is_tax_included || true,
    requires_contract: item?.requires_contract || false,
    contract_signed: item?.contract_signed || false,
    notes: item?.notes || '',
    tags: item?.tags || []
  })

  const [tagInput, setTagInput] = useState('')

  const filteredSubcategories = subcategories.filter(
    sub => sub.category_type_id === formData.category_type_id
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      estimated_amount: parseFloat(formData.estimated_amount as any) || 0,
      contracted_amount: formData.contracted_amount ? parseFloat(formData.contracted_amount as any) : null,
      final_amount: formData.final_amount ? parseFloat(formData.final_amount as any) : null,
      unit_price: formData.unit_price ? parseFloat(formData.unit_price as any) : null,
      vendor_id: formData.vendor_id || null,
      subcategory_type_id: formData.subcategory_type_id || null,
      due_date: formData.due_date || null,
      contract_date: formData.contract_date || null,
      service_date: formData.service_date || null
    })
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      })
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="name">Item Name*</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g., Wedding Photography Package"
          />
        </div>

        <div>
          <Label htmlFor="category">Category*</Label>
          <Select
            value={formData.category_type_id}
            onValueChange={(value) => setFormData({ 
              ...formData, 
              category_type_id: value,
              subcategory_type_id: '' 
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category: any) => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center gap-2">
                    <span>{category.icon}</span>
                    <span>{category.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="subcategory">Subcategory</Label>
          <Select
            value={formData.subcategory_type_id}
            onValueChange={(value) => setFormData({ ...formData, subcategory_type_id: value })}
            disabled={!formData.category_type_id}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select subcategory" />
            </SelectTrigger>
            <SelectContent>
              {filteredSubcategories.map((sub: any) => (
                <SelectItem key={sub.id} value={sub.id}>
                  {sub.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="vendor">Vendor</Label>
          <Select
            value={formData.vendor_id}
            onValueChange={(value) => setFormData({ ...formData, vendor_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select vendor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No vendor</SelectItem>
              {vendors.map((vendor: any) => (
                <SelectItem key={vendor.id} value={vendor.id}>
                  {vendor.business_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="committed">Committed</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={formData.priority_level.toString()}
            onValueChange={(value) => setFormData({ ...formData, priority_level: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Critical</SelectItem>
              <SelectItem value="2">High</SelectItem>
              <SelectItem value="3">Medium</SelectItem>
              <SelectItem value="4">Low</SelectItem>
              <SelectItem value="5">Optional</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="estimated">Estimated Amount*</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="estimated"
              type="number"
              step="0.01"
              value={formData.estimated_amount}
              onChange={(e) => setFormData({ ...formData, estimated_amount: e.target.value })}
              className="pl-10"
              required
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="contracted">Contracted Amount</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="contracted"
              type="number"
              step="0.01"
              value={formData.contracted_amount}
              onChange={(e) => setFormData({ ...formData, contracted_amount: e.target.value })}
              className="pl-10"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="final">Final Amount</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="final"
              type="number"
              step="0.01"
              value={formData.final_amount}
              onChange={(e) => setFormData({ ...formData, final_amount: e.target.value })}
              className="pl-10"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="due_date">Due Date</Label>
          <Input
            id="due_date"
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="contract_date">Contract Date</Label>
          <Input
            id="contract_date"
            type="date"
            value={formData.contract_date}
            onChange={(e) => setFormData({ ...formData, contract_date: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="service_date">Service Date</Label>
          <Input
            id="service_date"
            type="date"
            value={formData.service_date}
            onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          placeholder="Add any additional details about this expense..."
        />
      </div>

      <div>
        <Label>Tags</Label>
        <div className="flex gap-2 mb-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Add a tag"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          />
          <Button type="button" variant="outline" onClick={addTag}>
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.tags.map((tag: string, index: number) => (
            <Badge key={index} variant="secondary">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-2 text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_deposit}
              onChange={(e) => setFormData({ ...formData, is_deposit: e.target.checked })}
            />
            <span className="text-sm">This is a deposit</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_gratuity}
              onChange={(e) => setFormData({ ...formData, is_gratuity: e.target.checked })}
            />
            <span className="text-sm">This is gratuity</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_tax_included}
              onChange={(e) => setFormData({ ...formData, is_tax_included: e.target.checked })}
            />
            <span className="text-sm">Tax included</span>
          </label>
        </div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.requires_contract}
              onChange={(e) => setFormData({ ...formData, requires_contract: e.target.checked })}
            />
            <span className="text-sm">Requires contract</span>
          </label>
          {formData.requires_contract && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.contract_signed}
                onChange={(e) => setFormData({ ...formData, contract_signed: e.target.checked })}
              />
              <span className="text-sm">Contract signed</span>
            </label>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={2}
          placeholder="Any additional notes..."
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {item ? 'Update Item' : 'Add Item'}
        </Button>
      </DialogFooter>
    </form>
  )
}