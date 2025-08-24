"use client"

import { useEffect, useMemo, useState } from 'react'
import PremiumDashboardLayout from '@/components/layout/PremiumDashboardLayout'
import { BudgetClient, type RawBudgetItem, type BudgetSummary } from '@/lib/api/budget.client'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function BudgetPage() {
  const [items, setItems] = useState<RawBudgetItem[]>([])
  const [summary, setSummary] = useState<BudgetSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      const { items, summary } = await BudgetClient.list()
      setItems(items)
      setSummary(summary)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load budget')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

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
      setLoading(true)
      await BudgetClient.remove(id)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete item')
    } finally {
      setLoading(false)
    }
  }
  const onSubmit = async () => {
    try {
      setLoading(true)
      const payload: Partial<RawBudgetItem> = {
        category: form.category,
        // server adapter maps name/title to service name
        ...(form.name ? { name: form.name } as any : {}),
        allocated: Number(form.allocated),
        actual: Number(form.actual || 0),
        status: form.status
      }
      if (form.id) await BudgetClient.update(form.id, payload)
      else await BudgetClient.create(payload)
      setOpen(false)
      resetForm()
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save item')
    } finally {
      setLoading(false)
    }
  }

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
                  <label className="block text-xs text-[#475569] mb-1">Name</label>
                  <Input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Venue deposit" />
                </div>
                <div>
                  <label className="block text-xs text-[#475569] mb-1">Category</label>
                  <Input value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} placeholder="e.g. venue" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#475569] mb-1">Allocated</label>
                    <Input type="number" value={form.allocated} onChange={e=>setForm(f=>({...f,allocated:e.target.value}))} />
                  </div>
                  <div>
                    <label className="block text-xs text-[#475569] mb-1">Actual</label>
                    <Input type="number" value={form.actual} onChange={e=>setForm(f=>({...f,actual:e.target.value}))} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[#475569] mb-1">Status</label>
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

        {loading ? (
          <div className="text-sm text-dark-6">Loading budget…</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Allocated</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
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
