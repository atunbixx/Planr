"use client"

import { useEffect, useMemo, useState } from 'react'
import PremiumDashboardLayout from '@/components/layout/PremiumDashboardLayout'
import { VendorsClient, type Vendor } from '@/lib/api/vendors.client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useApiQuery } from '@/lib/api/useApiQuery'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function VendorsPage() {
  const { data, error, isLoading } = useApiQuery('vendors:list', async () => {
    const { vendors } = await VendorsClient.listVendors({ pageSize: 50 })
    return { vendors }
  })
  const vendors = (data?.vendors || []) as Vendor[]

  // Create/Edit Modal
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Partial<Vendor & { id?: string }>>({ name: '', category: 'other', status: 'inquiry', contact: '' })
  const canSubmit = useMemo(() => (form?.name || '').trim().length > 0 && (form?.category || '').trim().length > 0, [form])

  const onAdd = () => { setForm({ name: '', category: 'other', status: 'inquiry', contact: '' }); setOpen(true) }
  const onEdit = (v: Vendor) => { setForm({ ...v }); setOpen(true) }
  const onSubmit = async () => {
    if (!form?.name || !form?.category) return
    if (form.id) await VendorsClient.updateVendor(form.id, { name: form.name, category: form.category, status: form.status as any, contact: form.contact })
    else await VendorsClient.createVendor({ name: form.name, category: form.category, status: form.status as any, contact: form.contact })
    setOpen(false)
    // naive refetch: reload page data
    window.location.reload()
  }

  return (
    <PremiumDashboardLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-dark dark:text-white">My Vendors</h1>

        <div className="flex items-end justify-between">
          <h1 className="text-2xl font-bold text-dark dark:text-white">My Vendors</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={onAdd}>Add Vendor</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{form.id ? 'Edit Vendor' : 'Add Vendor'}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs text-[#475569] dark:text-neutral-300 mb-1">Name</label>
                  <Input value={form.name || ''} onChange={e=>setForm(f=>({ ...(f||{}), name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs text-[#475569] dark:text-neutral-300 mb-1">Category</label>
                  <Input value={form.category || ''} onChange={e=>setForm(f=>({ ...(f||{}), category: e.target.value }))} placeholder="e.g. photography" />
                </div>
                <div>
                  <label className="block text-xs text-[#475569] dark:text-neutral-300 mb-1">Status</label>
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
                </div>
                <div>
                  <label className="block text-xs text-[#475569] dark:text-neutral-300 mb-1">Contact</label>
                  <Input value={form.contact || ''} onChange={e=>setForm(f=>({ ...(f||{}), contact: e.target.value }))} placeholder="email or phone" />
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
                <Button onClick={onSubmit} disabled={!canSubmit}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-sm text-dark-6">Loading vendors…</div>
        ) : error ? (
          <div className="text-sm text-red-600">{String(error)}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.map(v => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.name}</TableCell>
                  <TableCell className="capitalize">{v.category}</TableCell>
                  <TableCell>
                    <Badge variant={v.status === 'booked' || v.status === 'contracted' || v.status === 'paid' ? 'success' : v.status === 'quoted' || v.status === 'inquiry' ? 'primary' : 'outline'}>
                      {v.status || '—'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[#475569]">{v.contact || v.email || v.phone || '—'}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={()=>onEdit(v)}>Edit</Button>
                    {/* Delete could be added similarly via VendorsClient.deleteVendor(v.id) */}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </PremiumDashboardLayout>
  )
}
