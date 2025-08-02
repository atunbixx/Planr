'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Filter, Search, X, RefreshCw } from 'lucide-react'
import { DatePicker } from '@/components/ui/date-picker'
import { cn } from '@/utils/cn'
import { taskFilterSchema, TaskFilterData } from '@/lib/validations/task'

export interface TaskFilters {
  search?: string
  status?: string
  category?: string
  priority?: string
  assignedTo?: string
  vendorId?: string
  milestoneId?: string
  criticalPath?: boolean
  dueDateFrom?: string
  dueDateTo?: string
  completed?: boolean
  tags?: string[]
}

interface TaskFiltersProps {
  filters: TaskFilters
  onFilterChange: (filters: TaskFilters) => void
  onClearFilters: () => void
  categories?: Array<{ value: string; label: string }>
  vendors?: Array<{ id: string; name: string; type: string }>
  milestones?: Array<{ id: string; title: string; target_date: string }>
  isLoading?: boolean
}

export function TaskFilters({
  filters,
  onFilterChange,
  onClearFilters,
  categories = [],
  vendors = [],
  milestones = [],
  isLoading = false
}: TaskFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [localFilters, setLocalFilters] = useState<TaskFilters>(filters)

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const handleFilterChange = (key: keyof TaskFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleClearFilter = (key: keyof TaskFilters) => {
    const newFilters = { ...localFilters }
    delete newFilters[key]
    setLocalFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleClearAll = () => {
    setLocalFilters({})
    onClearFilters()
  }

  const activeFiltersCount = Object.keys(filters).filter(key => 
    filters[key as keyof TaskFilters] !== undefined && 
    filters[key as keyof TaskFilters] !== '' &&
    filters[key as keyof TaskFilters] !== false
  ).length

  const statusOptions = [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'blocked', label: 'Blocked' }
  ]

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ]

  const assignedToOptions = [
    { value: 'both', label: 'Both Partners' },
    { value: 'partner1', label: 'Partner 1' },
    { value: 'partner2', label: 'Partner 2' },
    { value: 'vendor', label: 'Vendor' }
  ]

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Task Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount} active
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Search Bar */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={localFilters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFilterChange(localFilters)}
            disabled={isLoading}
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Filter className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant={filters.completed === false ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterChange('completed', filters.completed === false ? undefined : false)}
          >
            Pending
          </Button>
          <Button
            variant={filters.completed === true ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterChange('completed', filters.completed === true ? undefined : true)}
          >
            Completed
          </Button>
          <Button
            variant={filters.criticalPath === true ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterChange('criticalPath', filters.criticalPath === true ? undefined : true)}
          >
            Critical Path
          </Button>
          <Button
            variant={filters.priority === 'urgent' ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterChange('priority', filters.priority === 'urgent' ? undefined : 'urgent')}
          >
            Urgent
          </Button>
        </div>

        {/* Active Filters */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.status && (
              <Badge 
                variant="secondary" 
                className={cn(
                  "flex items-center gap-1 border",
                  getStatusColor(filters.status)
                )}
              >
                Status: {statusOptions.find(s => s.value === filters.status)?.label}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors"
                  onClick={() => handleClearFilter('status')}
                />
              </Badge>
            )}
            {filters.category && (
              <Badge 
                variant="secondary" 
                className="flex items-center gap-1 border bg-purple-50 text-purple-700 border-purple-200"
              >
                Category: {categories.find(c => c.value === filters.category)?.label || filters.category}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors"
                  onClick={() => handleClearFilter('category')}
                />
              </Badge>
            )}
            {filters.priority && (
              <Badge 
                variant="secondary" 
                className={cn(
                  "flex items-center gap-1 border",
                  filters.priority === 'urgent' && "bg-red-50 text-red-700 border-red-200",
                  filters.priority === 'high' && "bg-orange-50 text-orange-700 border-orange-200",
                  filters.priority === 'medium' && "bg-yellow-50 text-yellow-700 border-yellow-200",
                  filters.priority === 'low' && "bg-green-50 text-green-700 border-green-200"
                )}
              >
                Priority: {priorityOptions.find(p => p.value === filters.priority)?.label}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors"
                  onClick={() => handleClearFilter('priority')}
                />
              </Badge>
            )}
            {filters.vendorId && (
              <Badge 
                variant="secondary" 
                className="flex items-center gap-1 border bg-blue-50 text-blue-700 border-blue-200"
              >
                Vendor: {vendors.find(v => v.id === filters.vendorId)?.name}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors"
                  onClick={() => handleClearFilter('vendorId')}
                />
              </Badge>
            )}
            {filters.milestoneId && (
              <Badge 
                variant="secondary" 
                className="flex items-center gap-1 border bg-indigo-50 text-indigo-700 border-indigo-200"
              >
                Milestone: {milestones.find(m => m.id === filters.milestoneId)?.title}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors"
                  onClick={() => handleClearFilter('milestoneId')}
                />
              </Badge>
            )}
          </div>
        )}

        {/* Advanced Filters */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={localFilters.status || ''}
                onValueChange={(value) => handleFilterChange('status', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select
                value={localFilters.category || ''}
                onValueChange={(value) => handleFilterChange('category', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select
                value={localFilters.priority || ''}
                onValueChange={(value) => handleFilterChange('priority', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All priorities</SelectItem>
                  {priorityOptions.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assigned To Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Assigned To</label>
              <Select
                value={localFilters.assignedTo || ''}
                onValueChange={(value) => handleFilterChange('assignedTo', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All assignments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All assignments</SelectItem>
                  {assignedToOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Vendor Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Vendor</label>
              <Select
                value={localFilters.vendorId || ''}
                onValueChange={(value) => handleFilterChange('vendorId', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All vendors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All vendors</SelectItem>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name} ({vendor.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Milestone Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Milestone</label>
              <Select
                value={localFilters.milestoneId || ''}
                onValueChange={(value) => handleFilterChange('milestoneId', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All milestones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All milestones</SelectItem>
                  {milestones.map((milestone) => (
                    <SelectItem key={milestone.id} value={milestone.id}>
                      {milestone.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Due Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Due Date From</label>
              <DatePicker
                date={localFilters.dueDateFrom ? new Date(localFilters.dueDateFrom) : undefined}
                onSelect={(date) => handleFilterChange('dueDateFrom', date?.toISOString().split('T')[0])}
                placeholder="Select start date"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Due Date To</label>
              <DatePicker
                date={localFilters.dueDateTo ? new Date(localFilters.dueDateTo) : undefined}
                onSelect={(date) => handleFilterChange('dueDateTo', date?.toISOString().split('T')[0])}
                placeholder="Select end date"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 