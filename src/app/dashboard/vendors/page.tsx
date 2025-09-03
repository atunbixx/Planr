"use client"

import { useEffect, useMemo, useState } from 'react'
import PremiumDashboardLayout from '@/components/layout/PremiumDashboardLayout'
import { useSearchParams } from 'next/navigation'
import { VendorsClient, type Vendor } from '@/lib/api/vendors.client'
import { useToast } from '@/components/ui/toast-provider'

import { Badge } from '@/components/ui/badge'
import { useApiQuery } from '@/lib/api/useApiQuery'
import { formatApiError } from '@/lib/errors/format'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormField } from '@/components/ui/form-field'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'

export default function VendorsPage() {
  const { notify } = useToast()
  const { data, error, isLoading, refetch } = useApiQuery('vendors:list', async () => {
    try {
      console.log('Fetching vendors...')
      const { vendors } = await VendorsClient.listVendors({ pageSize: 50 })
      console.log('Vendors fetched:', vendors)
      return { vendors }
    } catch (err) {
      console.error('Error fetching vendors:', err)
      throw err
    }
  })
  const vendors = (data?.vendors || []) as Vendor[]

  // Create/Edit Modal
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Partial<Vendor & { id?: string }>>({ name: '', category: 'other', status: 'inquiry', contact: '' })
  const canSubmit = useMemo(() => (form?.name || '').trim().length > 0 && (form?.category || '').trim().length > 0, [form])

  const onAdd = () => { setForm({ name: '', category: 'other', status: 'inquiry', contact: '', logoUrl: '', priceRange: '', notes: '' }); setOpen(true) }
  const onEdit = (v: Vendor) => { setForm({ ...v }); setOpen(true) }
  const onSubmit = async () => {
    if (!form?.name || !form?.category) return
    try {
      if (form.id) {
        console.log('Updating vendor:', form.id, form)
        await VendorsClient.updateVendor(form.id, { 
          name: form.name, 
          category: form.category, 
          status: form.status as any, 
          contact: form.contact,
          logoUrl: form.logoUrl,
          priceRange: form.priceRange,
          notes: form.notes
        })
      } else {
        console.log('Creating vendor:', form)
        await VendorsClient.createVendor({ 
          name: form.name, 
          category: form.category, 
          status: form.status as any, 
          contact: form.contact,
          logoUrl: form.logoUrl,
          priceRange: form.priceRange,
          notes: form.notes
        })
      }
      setOpen(false)
      await refetch()
    } catch (e: any) {
      console.error('Error saving vendor:', e)
      notify(formatApiError(e, 'Failed to save vendor'), { variant: 'error' })
    }
  }

  const onDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vendor?')) return
    try {
      console.log('Deleting vendor:', id)
      await VendorsClient.deleteVendor(id)
      await refetch()
    } catch (e: any) {
      console.error('Error deleting vendor:', e)
      notify(formatApiError(e, 'Failed to delete vendor'), { variant: 'error' })
    }
  }

  // Highlight deep-linked vendor
  const sp = useSearchParams()
  const highlightId = sp.get('highlight')
  useEffect(() => {
    if (!highlightId) return
    const el = document.querySelector(`[data-card-id="${CSS.escape(highlightId)}"]`)
    if (el) {
      el.classList.add('row-highlight')
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => el.classList.remove('row-highlight'), 1800)
    }
  }, [highlightId, vendors])

  return (
    <PremiumDashboardLayout>
      <div className="p-6 space-y-6">
        <PageHeader kicker="VENDORS" title="My Vendors" actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={onAdd}>Add Vendor</Button>
            </DialogTrigger>
            <DialogContent className="content-defaults form-elegant">
              <DialogHeader>
                <DialogTitle>{form.id ? 'Edit Vendor' : 'Add Vendor'}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-4">
                <FormField label="Name" required>
                  <Input value={form.name || ''} onChange={e=>setForm(f=>({ ...(f||{}), name: e.target.value }))} />
                </FormField>
                <FormField label="Category" required>
                  <Input value={form.category || ''} onChange={e=>setForm(f=>({ ...(f||{}), category: e.target.value }))} placeholder="e.g. photography" />
                </FormField>
                <FormField label="Status">
                  <Select value={(form.status as any) || 'inquiry'} onValueChange={(v:any)=>setForm(f=>({ ...(f||{}), status: v }))}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inquiry">Inquiry</SelectItem>
                      <SelectItem value="shortlisted">Shortlisted</SelectItem>
                      <SelectItem value="quoted">Quoted</SelectItem>
                      <SelectItem value="booked">Booked</SelectItem>
                      <SelectItem value="contracted">Contracted</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Contact">
                  <Input value={form.contact || ''} onChange={e=>setForm(f=>({ ...(f||{}), contact: e.target.value }))} placeholder="email or phone" />
                </FormField>
                <FormField label="Logo URL">
                  <Input value={form.logoUrl || ''} onChange={e=>setForm(f=>({ ...(f||{}), logoUrl: e.target.value }))} placeholder="https://example.com/logo.jpg" />
                </FormField>
                <FormField label="Price Range">
                  <Input value={form.priceRange || ''} onChange={e=>setForm(f=>({ ...(f||{}), priceRange: e.target.value }))} placeholder="e.g. $, $$, $$$" />
                </FormField>
                <FormField label="Notes">
                  <Input value={form.notes || ''} onChange={e=>setForm(f=>({ ...(f||{}), notes: e.target.value }))} placeholder="Additional notes..." />
                </FormField>
              </div>
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
                <Button onClick={onSubmit} disabled={!canSubmit}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        } />

        {isLoading ? (
          <div className="text-sm text-gray-600">Loading vendors…</div>
        ) : error ? (
          <div className="text-sm text-red-600">{String(error)}</div>
        ) : vendors.length === 0 ? (
          <EmptyState icon={<span>🏢</span>} title="No vendors yet" description="Add your first vendor to start managing bookings and quotes." action={<Button onClick={onAdd}>Add Vendor</Button>} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {vendors.map(v => (
              <div key={v.id} data-card-id={v.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Vendor Image */}
                <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 relative">
                  {v.logoUrl ? (
                    <img 
                      src={v.logoUrl} 
                      alt={v.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-4xl text-gray-400 dark:text-gray-500">
                        {v.category === 'photography' ? '📸' : 
                         v.category === 'catering' ? '🍽️' : 
                         v.category === 'venue' ? '🏛️' : 
                         v.category === 'flowers' ? '🌸' : 
                         v.category === 'music' ? '🎵' : 
                         v.category === 'cake' ? '🎂' : 
                         v.category === 'attire' ? '👗' : 
                         v.category === 'transportation' ? '🚗' : '🏢'}
                      </div>
                    </div>
                  )}
                  {/* Favorite Heart */}
                  {v.isFavorite && (
                    <div className="absolute top-3 right-3">
                      <div className="bg-red-500 text-white rounded-full p-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate">{v.name}</h3>
                    <Badge variant={v.status === 'booked' || v.status === 'contracted' || v.status === 'paid' ? 'success' : v.status === 'quoted' || v.status === 'inquiry' ? 'primary' : 'outline'}>
                      {v.status || 'inquiry'}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 capitalize mb-2">{v.category}</p>
                  
                  {v.priceRange && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Price: {v.priceRange}</p>
                  )}
                  
                  {(v.contact || v.email || v.phone) && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 truncate">
                      {v.contact || v.email || v.phone}
                    </p>
                  )}

                  {v.notes && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                      {v.notes}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => onEdit(v)} className="flex-1">
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onDelete(v.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Empty State */}
            {vendors.length === 0 && (
              <div className="col-span-full text-center py-12">
                <div className="text-6xl mb-4">🏢</div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No vendors yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Start building your vendor list by adding your first vendor.</p>
                <Button onClick={onAdd}>Add Your First Vendor</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </PremiumDashboardLayout>
  )
}
