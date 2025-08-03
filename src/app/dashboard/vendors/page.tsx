'use client'

import { useState } from 'react'
import { useVendors, VENDOR_CATEGORIES, VENDOR_STATUSES } from '@/hooks/useVendors'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { cn } from '@/utils/cn'
import { VendorCategory, VendorStatus } from '@/types/database'
import { PullToRefresh } from '@/components/ui/pull-to-refresh'

export default function VendorsPage() {
  const { 
    vendors, 
    loading, 
    error, 
    vendorStats, 
    addVendor, 
    updateVendor, 
    deleteVendor,
    refreshVendors 
  } = useVendors()

  const [isAddingVendor, setIsAddingVendor] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<VendorCategory | 'all'>('all')
  const [selectedStatus, setSelectedStatus] = useState<VendorStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter vendors based on selection
  const filteredVendors = vendors.filter(vendor => {
    const matchesCategory = selectedCategory === 'all' || vendor.category === selectedCategory
    const matchesStatus = selectedStatus === 'all' || vendor.status === selectedStatus
    const matchesSearch = searchQuery === '' || 
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.contact_person?.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesCategory && matchesStatus && matchesSearch
  })

  // Add vendor form component
  const AddVendorForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      business_name: '',
      category: 'venue' as VendorCategory,
      status: 'researching' as VendorStatus,
      email: '',
      phone: '',
      website: '',
      contact_person: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      estimated_cost: '',
      notes: '',
      referral_source: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formErrors, setFormErrors] = useState<Record<string, string>>({})

    const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }))
      // Clear error for this field
      if (formErrors[field]) {
        setFormErrors(prev => ({ ...prev, [field]: '' }))
      }
    }

    const validateForm = () => {
      const errors: Record<string, string> = {}
      
      if (!formData.name.trim()) {
        errors.name = 'Vendor name is required'
      }
      
      if (!formData.category) {
        errors.category = 'Category is required'
      }

      if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = 'Invalid email format'
      }

      if (formData.estimated_cost && isNaN(Number(formData.estimated_cost))) {
        errors.estimated_cost = 'Estimated cost must be a number'
      }

      setFormErrors(errors)
      return Object.keys(errors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      
      if (!validateForm()) {
        return
      }

      setIsSubmitting(true)
      
      try {
        await addVendor({
          name: formData.name.trim(),
          business_name: formData.business_name.trim() || null,
          category: formData.category,
          status: formData.status,
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          website: formData.website.trim() || null,
          contact_person: formData.contact_person.trim() || null,
          address: formData.address.trim() || null,
          city: formData.city.trim() || null,
          state: formData.state.trim() || null,
          zip_code: formData.zip_code.trim() || null,
          estimated_cost: formData.estimated_cost ? Number(formData.estimated_cost) : null,
          notes: formData.notes.trim() || null,
          referral_source: formData.referral_source.trim() || null,
        })
        
        // Reset form and close
        setFormData({
          name: '', business_name: '', category: 'venue', status: 'researching',
          email: '', phone: '', website: '', contact_person: '', address: '',
          city: '', state: '', zip_code: '', estimated_cost: '', notes: '', referral_source: ''
        })
        setIsAddingVendor(false)
        
      } catch (error: any) {
        console.error('Failed to add vendor:', error)
        setFormErrors({ general: error.message || 'Failed to add vendor' })
      } finally {
        setIsSubmitting(false)
      }
    }

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add New Vendor</CardTitle>
          <CardDescription>
            Add a vendor to your wedding planning list
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formErrors.general && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
                {formErrors.general}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Vendor Name"
                value={formData.name}
                onChange={handleChange('name')}
                error={formErrors.name}
                placeholder="e.g., The Grand Ballroom"
                fullWidth
                disabled={isSubmitting}
              />

              <Input
                label="Business Name (Optional)"
                value={formData.business_name}
                onChange={handleChange('business_name')}
                error={formErrors.business_name}
                placeholder="e.g., Grand Events LLC"
                fullWidth
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Category"
                value={formData.category}
                onChange={handleChange('category')}
                error={formErrors.category}
                fullWidth
                disabled={isSubmitting}
              >
                {VENDOR_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </Select>

              <Select
                label="Status"
                value={formData.status}
                onChange={handleChange('status')}
                error={formErrors.status}
                fullWidth
                disabled={isSubmitting}
              >
                {VENDOR_STATUSES.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Contact Person (Optional)"
                value={formData.contact_person}
                onChange={handleChange('contact_person')}
                error={formErrors.contact_person}
                placeholder="e.g., Jennifer Martinez"
                fullWidth
                disabled={isSubmitting}
              />

              <Input
                label="Email (Optional)"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                error={formErrors.email}
                placeholder="e.g., info@venue.com"
                fullWidth
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Phone (Optional)"
                value={formData.phone}
                onChange={handleChange('phone')}
                error={formErrors.phone}
                placeholder="e.g., (555) 123-4567"
                fullWidth
                disabled={isSubmitting}
              />

              <Input
                label="Website (Optional)"
                value={formData.website}
                onChange={handleChange('website')}
                error={formErrors.website}
                placeholder="e.g., https://venue.com"
                fullWidth
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Estimated Cost (Optional)"
                type="number"
                value={formData.estimated_cost}
                onChange={handleChange('estimated_cost')}
                error={formErrors.estimated_cost}
                placeholder="e.g., 15000"
                helperText="USD amount"
                fullWidth
                disabled={isSubmitting}
              />

              <Input
                label="Referral Source (Optional)"
                value={formData.referral_source}
                onChange={handleChange('referral_source')}
                error={formErrors.referral_source}
                placeholder="e.g., Google search, friend recommendation"
                fullWidth
                disabled={isSubmitting}
              />
            </div>

            <Input
              label="Notes (Optional)"
              value={formData.notes}
              onChange={handleChange('notes')}
              error={formErrors.notes}
              placeholder="Any additional notes about this vendor..."
              fullWidth
              disabled={isSubmitting}
            />

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding Vendor...' : 'Add Vendor'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsAddingVendor(false)}
                disabled={isSubmitting}
              >
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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-serif font-bold text-ink">Vendors</h1>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your vendors...</p>
        </div>
      </div>
    )
  }

  return (
    <PullToRefresh
      onRefresh={refreshVendors}
      className="min-h-screen"
      pullText="Pull to refresh vendors"
      releaseText="Release to refresh"
      loadingText="Updating vendor list..."
      successText="Vendors updated!"
    >
      <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold text-ink">Vendors</h1>
          <p className="text-gray-600 mt-1">Manage your wedding vendors and service providers</p>
        </div>
        <Button onClick={() => setIsAddingVendor(true)} disabled={isAddingVendor}>
          Add Vendor
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <span className="text-red-500">⚠️</span>
              <p className="text-red-700">{error}</p>
              <Button variant="secondary" size="sm" onClick={refreshVendors} className="ml-auto">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-ink">{vendorStats.totalVendors}</div>
            <p className="text-xs text-gray-500">Total Vendors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{vendorStats.bookedVendors}</div>
            <p className="text-xs text-gray-500">Booked</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-accent">
              ${vendorStats.totalEstimatedCost.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500">Estimated Cost</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {vendorStats.averageRating > 0 ? vendorStats.averageRating.toFixed(1) : '—'}
            </div>
            <p className="text-xs text-gray-500">Avg Rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Vendor Form */}
      {isAddingVendor && <AddVendorForm />}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Search Vendors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, business, or contact..."
              fullWidth
            />
            
            <Select
              label="Filter by Category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as VendorCategory | 'all')}
              fullWidth
            >
              <option value="all">All Categories</option>
              {VENDOR_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </Select>

            <Select
              label="Filter by Status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as VendorStatus | 'all')}
              fullWidth
            >
              <option value="all">All Statuses</option>
              {VENDOR_STATUSES.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Vendors List */}
      {filteredVendors.length > 0 ? (
        <div className="grid gap-4">
          {filteredVendors.map((vendor) => {
            const category = VENDOR_CATEGORIES.find(c => c.value === vendor.category)
            const status = VENDOR_STATUSES.find(s => s.value === vendor.status)
            
            return (
              <Card key={vendor.id} className="card-hover">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-xl"
                        style={{ backgroundColor: `${category?.color}20` }}
                      >
                        {category?.icon}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-ink">{vendor.name}</h3>
                        {vendor.business_name && (
                          <p className="text-sm text-gray-600">{vendor.business_name}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>{category?.label}</span>
                          <span 
                            className="px-2 py-1 rounded text-xs font-medium"
                            style={{ 
                              backgroundColor: `${status?.color}20`,
                              color: status?.color 
                            }}
                          >
                            {status?.label}
                          </span>
                          {vendor.estimated_cost && (
                            <span>${vendor.estimated_cost.toLocaleString()}</span>
                          )}
                        </div>
                        
                        {vendor.contact_person && (
                          <p className="text-sm text-gray-600 mt-1">
                            Contact: {vendor.contact_person}
                          </p>
                        )}
                        
                        <div className="flex gap-2 mt-2">
                          {vendor.email && (
                            <a 
                              href={`mailto:${vendor.email}`}
                              className="text-xs text-accent hover:underline"
                            >
                              Email
                            </a>
                          )}
                          {vendor.phone && (
                            <a 
                              href={`tel:${vendor.phone}`}
                              className="text-xs text-accent hover:underline"
                            >
                              Call
                            </a>
                          )}
                          {vendor.website && (
                            <a 
                              href={vendor.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-accent hover:underline"
                            >
                              Website
                            </a>
                          )}
                        </div>
                        
                        {vendor.notes && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {vendor.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => window.location.href = `/dashboard/vendors/${vendor.id}/messages`}
                      >
                        <i className="fas fa-comment mr-1"></i>
                        Message
                      </Button>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this vendor?')) {
                            deleteVendor(vendor.id)
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : vendors.length > 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <p className="text-gray-500">No vendors match your current filters.</p>
            <Button 
              variant="secondary" 
              onClick={() => {
                setSelectedCategory('all')
                setSelectedStatus('all')
                setSearchQuery('')
              }}
              className="mt-4"
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <span className="text-6xl mb-4 block">🏪</span>
            <h3 className="text-lg font-semibold text-ink mb-2">No vendors yet</h3>
            <p className="text-gray-500 mb-4">
              Start building your dream team by adding your first vendor.
            </p>
            <Button onClick={() => setIsAddingVendor(true)}>
              Add Your First Vendor
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
    </PullToRefresh>
  )
}