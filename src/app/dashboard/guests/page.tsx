"use client"

import { useMemo, useState, useEffect } from 'react'
import PremiumDashboardLayout from '@/components/layout/PremiumDashboardLayout'
import { useSearchParams } from 'next/navigation'
import { GuestsClient } from '@/lib/api/guests.client'
import type { GuestResponse } from '@/features/guests/dto/guest.dto'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useApiQuery } from '@/lib/api/useApiQuery'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/toast-provider'
import { useAuth } from '@/hooks/useAuth'
import { formatApiError } from '@/lib/errors/format'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { SectionCard, SectionCardBody } from '@/components/ui/section-card'
import { TableSectionSkeleton, SectionBlockSkeleton } from '@/components/ui/section-skeletons'
import { FormField } from '@/components/ui/form-field'

export default function GuestsPage() {
  const { notify } = useToast()
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  // Filters
  const [side, setSide] = useState<''|'bride'|'groom'>('')
  const [status, setStatus] = useState<''|'pending'|'accepted'|'declined'>('')
  const [category, setCategory] = useState<string>('')
  const [dietary, setDietary] = useState<string>('')

  const key = useMemo(() => `guests:list:${side}:${status}:${category}:${dietary}`, [side, status, category, dietary])

  const { data, error, isLoading, refetch } = useApiQuery(
    isAuthenticated && !authLoading ? key + `:${isAuthenticated}` : 'disabled', 
    async () => {
      if (!isAuthenticated) throw new Error('Please sign in to view guests')
      
      try {
        const params: any = { limit: 100 }
        if (side === 'bride' || side === 'groom') params.side = side
        if (status === 'pending' || status === 'accepted' || status === 'declined') params.status = status
        const allowedCategories = ['sibling','parent','relative','friend','neighbour','colleague','vendor','other']
        const normalizedCategory = (category || '').trim().toLowerCase()
        if (normalizedCategory && allowedCategories.includes(normalizedCategory)) params.category = normalizedCategory
        if (dietary && dietary.trim().length > 0) params.dietary = dietary
        
        const [{ guests }, gstats] = await Promise.all([
          GuestsClient.listGuests(params),
          GuestsClient.getStats(),
        ])
        return { guests, stats: { total: gstats.total, totalAttending: gstats.totalAttending } }
      } catch (err: any) {
        console.error('Failed to fetch guests:', err)
        if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
          // Token expired, redirect to signin
          router.push('/signin')
          throw new Error('Session expired. Please sign in again.')
        }
        throw err
      }
    }
  )
  const guests = (data?.guests || []) as GuestResponse[]
  const stats = data?.stats || null

  // Error toast is emitted centrally via fetcher

  // Selection
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const selectedIds = useMemo(() => Object.keys(selected).filter(id => selected[id]), [selected])

  // Highlight deep-linked guest
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
  }, [highlightId, guests])

  const toggleAll = (checked: boolean) => {
    const next: Record<string, boolean> = {}
    if (checked) guests.forEach(g => next[g.id] = true)
    setSelected(next)
  }

  const onBulkRsvp = async (newStatus: 'pending'|'accepted'|'declined') => {
    if (!selectedIds.length) return
    try {
      notify(`Updating ${selectedIds.length} guests…`)
      await GuestsClient.setRsvpStatusBulk(selectedIds, newStatus)
      notify('RSVP statuses updated', { variant: 'success' })
      setSelected({})
      await refetch()
    } catch (e: any) {
      notify(formatApiError(e, 'Failed to update RSVP'), { variant: 'error' })
    }
  }

  const onBulkInvite = async (invited: boolean) => {
    if (!selectedIds.length) return
    try {
      notify(`Marking ${selectedIds.length} guests as ${invited ? 'invited' : 'not invited'}…`)
      await GuestsClient.setInvitationSentBulk(selectedIds, invited)
      notify('Invitation flags updated', { variant: 'success' })
      setSelected({})
      await refetch()
    } catch (e: any) {
      notify(formatApiError(e, 'Failed to update invitations'), { variant: 'error' })
    }
  }

  // Create Guest Modal
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<{ firstName: string; lastName?: string; email?: string; phone?: string; side?: 'bride'|'groom'; plusOneAllowed?: boolean; plusOneName?: string; dietaryRestrictions?: string; relationshipCategory?: string }>({ firstName: '' })
  const canSubmit = useMemo(() => form.firstName.trim().length > 0, [form])
  const onAdd = () => { setForm({ firstName: '' }); setOpen(true) }
  const onSubmit = async () => {
    try {
      await GuestsClient.createGuest(form as any)
      notify('Guest added', { variant: 'success' })
      setOpen(false)
      await refetch()
    } catch (e: any) {
      notify(formatApiError(e, 'Failed to add guest'), { variant: 'error' })
    }
  }

  if (authLoading) {
    return (
      <PremiumDashboardLayout>
        <div className="p-6 text-sm text-dark-6">Loading…</div>
      </PremiumDashboardLayout>
    )
  }

  if (!isAuthenticated) {
    // Auto-redirect to signin for better UX
    if (typeof window !== 'undefined') router.push('/signin')
    return null
  }

  return (
    <PremiumDashboardLayout>
      <div className="p-6 space-y-6">
        <PageHeader kicker="GUEST LIST" title="Guests" subtitle="Manage your guest list and RSVPs" actions={
          <div className="flex items-center gap-3">
            {stats && (
              <>
                <Badge variant="outline">Total: {stats.total}</Badge>
                <Badge variant="success">Attending: {stats.totalAttending}</Badge>
              </>
            )}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={onAdd}>Add Guest</Button>
              </DialogTrigger>
              <DialogContent className="content-defaults form-elegant">
                <DialogHeader>
                  <DialogTitle>Add Guest</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="First Name" required>
                    <Input value={form.firstName} onChange={e=>setForm(f=>({...f, firstName: e.target.value}))} />
                  </FormField>
                  <FormField label="Last Name">
                    <Input value={form.lastName || ''} onChange={e=>setForm(f=>({...f, lastName: e.target.value}))} />
                  </FormField>
                  <FormField label="Email">
                    <Input type="email" value={form.email || ''} onChange={e=>setForm(f=>({...f, email: e.target.value}))} />
                  </FormField>
                  <FormField label="Phone">
                    <Input value={form.phone || ''} onChange={e=>setForm(f=>({...f, phone: e.target.value}))} />
                  </FormField>
                  <FormField label="Side">
                    <Select value={form.side || ''} onValueChange={(v:any)=>setForm(f=>({...f, side: v}))}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bride">Bride</SelectItem>
                        <SelectItem value="groom">Groom</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Dietary">
                    <Input value={form.dietaryRestrictions || ''} onChange={e=>setForm(f=>({...f, dietaryRestrictions: e.target.value}))} />
                  </FormField>
                </div>
                <DialogFooter className="mt-4">
                  <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
                  <Button onClick={onSubmit} disabled={!canSubmit}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        } />

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label className="mb-1 block">Side</Label>
            <Select value={side || 'all'} onValueChange={(v:any)=>setSide(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="bride">Bride</SelectItem>
                <SelectItem value="groom">Groom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1 block">RSVP</Label>
            <Select value={status || 'all'} onValueChange={(v:any)=>setStatus(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-48"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1 block">Category</Label>
            <Select value={category || 'all'} onValueChange={(v:any)=>setCategory(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-56"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="sibling">Sibling</SelectItem>
                <SelectItem value="parent">Parent</SelectItem>
                <SelectItem value="relative">Relative</SelectItem>
                <SelectItem value="friend">Friend</SelectItem>
                <SelectItem value="neighbour">Neighbour</SelectItem>
                <SelectItem value="colleague">Colleague</SelectItem>
                <SelectItem value="vendor">Vendor</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1 block">Dietary</Label>
            <Input className="w-48" value={dietary} onChange={e=>setDietary(e.target.value)} placeholder="e.g. vegan" />
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={()=>onBulkRsvp('accepted')} disabled={!selectedIds.length}>Mark Accepted</Button>
            <Button variant="outline" onClick={()=>onBulkRsvp('declined')} disabled={!selectedIds.length}>Mark Declined</Button>
            <Button variant="outline" onClick={()=>onBulkRsvp('pending')} disabled={!selectedIds.length}>Mark Pending</Button>
            <Button onClick={()=>onBulkInvite(true)} disabled={!selectedIds.length}>Mark Invited</Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <SectionBlockSkeleton lines={2} />
            <TableSectionSkeleton columns={5} rows={6} />
          </div>
        ) : error ? (
          <div className="text-sm text-red-600">{String(error)}</div>
        ) : guests.length === 0 ? (
          <EmptyState icon={<span>🧑‍🤝‍🧑</span>} title="No guests yet" description="Start by adding your first guest to build your list." action={<Button onClick={onAdd}>Add Guest</Button>} />
        ) : (
          <SectionCard>
            <SectionCardBody>
          <Table variant="bare">
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Checkbox checked={guests.length>0 && selectedIds.length===guests.length} onCheckedChange={(v:any)=>toggleAll(Boolean(v))} />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Side</TableHead>
                <TableHead>RSVP</TableHead>
                <TableHead>Invited</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guests.map(g => (
                <TableRow key={g.id} data-row-id={g.id}>
                  <TableCell>
                    <Checkbox checked={Boolean(selected[g.id])} onCheckedChange={(v:any)=>setSelected(s=>({...s,[g.id]: Boolean(v)}))} />
                  </TableCell>
                  <TableCell className="font-medium">{`${g.firstName}${g.lastName ? ` ${g.lastName}` : ''}`}</TableCell>
                  <TableCell className="capitalize text-[#475569]">{g.side || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={g.rsvpStatus === 'accepted' ? 'success' : g.rsvpStatus === 'declined' ? 'error' : 'outline'}>
                      {g.rsvpStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>{g.invitationSentAt ? 'Yes' : 'No'}</TableCell>
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
