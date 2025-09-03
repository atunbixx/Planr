"use client"

import { useMemo, useState, useEffect } from 'react'
import PremiumDashboardLayout from '@/components/layout/PremiumDashboardLayout'
import { useSearchParams } from 'next/navigation'
import { BudgetClient, type RawBudgetItem, type BudgetSummary } from '@/lib/api/budget.client'
import { MetricCard } from '@/components/ui/metric-card'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useApiQuery } from '@/lib/api/useApiQuery'
import { SectionCard, SectionCardBody } from '@/components/ui/section-card'
import { FormField } from '@/components/ui/form-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast-provider'
import { MetricCardsSkeleton, TableSectionSkeleton } from '@/components/ui/section-skeletons'

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

  // Error toast is emitted centrally via fetcher

  // Highlight deep-linked row
  const sp = useSearchParams()
  const highlightId = sp.get('highlight')
  useEffect(() => {
    if (!highlightId) return
    const el = document.querySelector(`[data-row-id="${CSS.escape(highlightId)}"]`)
    if (el) {
      el.classList.add('row-highlight')
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => el.classList.remove('row-highlight'), 1800)
    }
  }, [highlightId, items])

  return (
    <PremiumDashboardLayout>
      <div className="p-6 space-y-6">
        <PageHeader kicker="BUDGET" title="Budget" actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={onAdd}>Add Item</Button>
            </DialogTrigger>
            <DialogContent className="content-defaults form-elegant">
              <DialogHeader>
                <DialogTitle>{form.id ? 'Edit Budget Item' : 'Add Budget Item'}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-4">
                <FormField label="Name" required>
                  <Input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Venue deposit" />
                </FormField>
                <FormField label="Category" required>
                  <Input value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} placeholder="e.g. venue" />
                </FormField>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Allocated" required>
                    <Input type="number" value={form.allocated} onChange={e=>setForm(f=>({...f,allocated:e.target.value}))} />
                  </FormField>
                  <FormField label="Actual">
                    <Input type="number" value={form.actual} onChange={e=>setForm(f=>({...f,actual:e.target.value}))} />
                  </FormField>
                </div>
                <FormField label="Status" required>
                  <Select value={form.status} onValueChange={(v:any)=>setForm(f=>({...f,status:v}))}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="quoted">Quoted</SelectItem>
                      <SelectItem value="booked">Booked</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
                <Button onClick={onSubmit} disabled={!canSubmit}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        } />

        {summary && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Total Budget"
              value={`$${summary.totalAmount.toLocaleString()}`}
            />
            <MetricCard
              label="Allocated"
              value={`$${summary.totalAllocated.toLocaleString()}`}
            />
            <MetricCard
              label="Actual"
              value={`$${summary.totalActual.toLocaleString()}`}
              subtitle={`${summary.percentSpent}% of budget`}
            />
            <MetricCard
              label="Remaining"
              value={`$${summary.remainingBudget.toLocaleString()}`}
            />
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            <MetricCardsSkeleton count={4} />
            <TableSectionSkeleton columns={6} rows={6} />
          </div>
        ) : error ? (
          <div className="text-sm text-red-600">{String(error)}</div>
        ) : items.length === 0 ? (
          <EmptyState icon={<span>💸</span>} title="No budget items yet" description="Add your first expense or line item to track your budget." action={<Button onClick={onAdd}>Add Item</Button>} />
        ) : (
          <SectionCard>
            <SectionCardBody>
          <Table variant="bare">
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
                <TableRow key={i.id} data-row-id={i.id as any}>
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
            </SectionCardBody>
          </SectionCard>
        )}
      </div>
    </PremiumDashboardLayout>
  )
}
