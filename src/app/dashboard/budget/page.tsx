"use client"

import { useMemo, useState, useEffect } from 'react'
import PremiumDashboardLayout from '@/components/layout/PremiumDashboardLayout'
import { BudgetClient, type RawBudgetItem, type BudgetSummary } from '@/lib/api/budget.client'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useApiQuery } from '@/lib/api/useApiQuery'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast-provider'

export default function BudgetPage() {
  const { notify } = useToast()
  const { data, error, isLoading, refetch } = useApiQuery('budget:list', async () => {
    const { items, summary } = await BudgetClient.list()
    return { items, summary }
  })
  const items = (data?.items || []) as RawBudgetItem[]
  const summary = (data?.summary || null) as BudgetSummary | null

  // Create/Edit dialog state
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<{ id?: string; name: string; category: string; allocated: string; actual: string; status: 'planned'|'quoted'|'booked'|'paid' }>(
    { name: '', category: '', allocated: '', actual: '0', status: 'planned' }
  )
  const canSubmit = useMemo(() => form.category.trim().length > 0 && form.name.trim().length > 0 && !Number.isNaN(Number(form.allocated)), [form])
  const resetForm = () => setForm({ name: '', category: '', allocated: '', actual: '0', status: 'planned' })

  const onAdd = () => { resetForm(); setOpen(true) }
  const onEdit = (item: RawBudgetItem) => {
    setForm({ id: item.id, name: (item as any).name || '', category: item.category, allocated: String(item.allocated ?? ''), actual: String(item.actual ?? '0'), status: item.status })
    setOpen(true)
  }
  const onDelete = async (id: string) => {
    try {
      await BudgetClient.remove(id)
      notify('Budget item deleted', { variant: 'success' })
      await refetch()
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Failed to delete item', { variant: 'error' })
    }
  }
  const onSubmit = async () => {
    try {
      const payload: Partial<RawBudgetItem> = {
        category: form.category,
        // server adapter maps name/title to service name
        ...(form.name ? { name: form.name } as any : {}),
        allocated: Number(form.allocated),
        actual: Number(form.actual || 0),
        status: form.status
      }
      if (form.id) {
        await BudgetClient.update(form.id, payload)
        notify('Budget item updated', { variant: 'success' })
      } else {
        await BudgetClient.create(payload)
        notify('Budget item created', { variant: 'success' })
      }
      setOpen(false)
      resetForm()
      await refetch()
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Failed to save item', { variant: 'error' })
    }
  }

  useEffect(() => {
    if (error) notify(String(error), { variant: 'error', title: 'Failed to load budget' })
  }, [error, notify])

  return (
    <PremiumDashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-end justify-between">
          <h1 className="text-2xl font-bold text-dark dark:text-white">Budget</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={onAdd}>Add Item</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{form.id ? 'Edit Budget Item' : 'Add Budget Item'}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs text-[#475569] dark:text-neutral-300 mb-1">Name</label>
                  <Input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Venue deposit" />
                </div>
                <div>
                  <label className="block text-xs text-[#475569] dark:text-neutral-300 mb-1">Category</label>
                  <Input value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} placeholder="e.g. venue" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#475569] dark:text-neutral-300 mb-1">Allocated</label>
                    <Input type="number" value={form.allocated} onChange={e=>setForm(f=>({...f,allocated:e.target.value}))} />
                  </div>
                  <div>
                    <label className="block text-xs text-[#475569] dark:text-neutral-300 mb-1">Actual</label>
                    <Input type="number" value={form.actual} onChange={e=>setForm(f=>({...f,actual:e.target.value}))} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[#475569] dark:text-neutral-300 mb-1">Status</label>
                  <Select value={form.status} onValueChange={(v:any)=>setForm(f=>({...f,status:v}))}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="quoted">Quoted</SelectItem>
                      <SelectItem value="booked">Booked</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
                <Button onClick={onSubmit} disabled={!canSubmit}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {summary && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-[#475569]">Total Budget</div>
                <div className="text-2xl font-bold mt-2">${summary.totalAmount.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-[#475569]">Allocated</div>
                <div className="text-2xl font-bold mt-2">${summary.totalAllocated.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-[#475569]">Actual</div>
                <div className="text-2xl font-bold mt-2">${summary.totalActual.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-[#475569]">Remaining</div>
                <div className="text-2xl font-bold mt-2">${summary.remainingBudget.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_,i)=>(
                <div key={i} className="bg-white dark:bg-gray-50 p-6 rounded-lg border shadow-sm">
                  <div className="h-4 w-24 bg-gray-200 animate-pulse rounded mb-3" />
                  <div className="h-6 w-32 bg-gray-200 animate-pulse rounded" />
                </div>
              ))}
            </div>
            <div className="bg-white dark:bg-gray-50 p-4 rounded-lg border shadow-sm">
              <div className="h-6 w-56 bg-gray-200 animate-pulse rounded mb-3" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-200 animate-pulse rounded" />
                <div className="h-4 w-5/6 bg-gray-200 animate-pulse rounded" />
                <div className="h-4 w-4/6 bg-gray-200 animate-pulse rounded" />
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="text-sm text-red-600">{String(error)}</div>
        ) : items.length === 0 ? (
          <div className="bg-white dark:bg-gray-50 p-10 rounded-lg border text-center">
            <div className="text-3xl mb-2">💸</div>
            <h3 className="text-lg font-semibold mb-1">No budget items yet</h3>
            <p className="text-sm text-gray-600 mb-4">Add your first expense or line item to track your budget.</p>
            <Button onClick={onAdd}>Add Item</Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Allocated</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">{(i as any).name || '—'}</TableCell>
                  <TableCell className="capitalize">{i.category}</TableCell>
                  <TableCell className="text-right">${Number(i.allocated).toLocaleString()}</TableCell>
                  <TableCell className="text-right">${Number(i.actual).toLocaleString()}</TableCell>
                  <TableCell className="capitalize">{i.status}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={()=>onEdit(i)}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={()=>onDelete(i.id)}>Delete</Button>
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
