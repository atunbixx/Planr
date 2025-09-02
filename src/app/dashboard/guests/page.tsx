"use client"

import { useMemo, useState, useEffect } from 'react'
import PremiumDashboardLayout from '@/components/layout/PremiumDashboardLayout'
import { GuestsClient, type LegacyGuest } from '@/lib/api/guests.client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useApiQuery } from '@/lib/api/useApiQuery'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/toast-provider'
import { useAuth } from '@/hooks/useAuth'
import { formatApiError } from '@/lib/errors/format'
import { useRouter } from 'next/navigation'

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
  const guests = (data?.guests || []) as LegacyGuest[]
  const stats = data?.stats || null

  useEffect(() => {
    if (error) notify(String(error), { variant: 'error', title: 'Guest load failed' })
  }, [error, notify])

  // Selection
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const selectedIds = useMemo(() => Object.keys(selected).filter(id => selected[id]), [selected])

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
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dark dark:text-white">Guests</h1>
            <p className="text-dark-6 dark:text-dark-4 mt-1">Manage your guest list and RSVPs</p>
          </div>
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
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Guest</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#475569] dark:text-neutral-300 mb-1">First Name</label>
                    <Input value={form.firstName} onChange={e=>setForm(f=>({...f, firstName: e.target.value}))} />
                  </div>
                  <div>
                    <label className="block text-xs text-[#475569] dark:text-neutral-300 mb-1">Last Name</label>
                    <Input value={form.lastName || ''} onChange={e=>setForm(f=>({...f, lastName: e.target.value}))} />
                  </div>
                  <div>
                    <label className="block text-xs text-[#475569] dark:text-neutral-300 mb-1">Email</label>
                    <Input type="email" value={form.email || ''} onChange={e=>setForm(f=>({...f, email: e.target.value}))} />
                  </div>
                  <div>
                    <label className="block text-xs text-[#475569] dark:text-neutral-300 mb-1">Phone</label>
                    <Input value={form.phone || ''} onChange={e=>setForm(f=>({...f, phone: e.target.value}))} />
                  </div>
                  <div>
                    <label className="block text-xs text-[#475569] dark:text-neutral-300 mb-1">Side</label>
                    <Select value={form.side || ''} onValueChange={(v:any)=>setForm(f=>({...f, side: v}))}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bride">Bride</SelectItem>
                        <SelectItem value="groom">Groom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs text-[#475569] dark:text-neutral-300 mb-1">Dietary</label>
                    <Input value={form.dietaryRestrictions || ''} onChange={e=>setForm(f=>({...f, dietaryRestrictions: e.target.value}))} />
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
                  <Button onClick={onSubmit} disabled={!canSubmit}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-[#475569] dark:text-neutral-300 mb-1">Side</label>
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
            <label className="block text-xs text-[#475569] dark:text-neutral-300 mb-1">RSVP</label>
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
            <label className="block text-xs text-[#475569] dark:text-neutral-300 mb-1">Category</label>
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
            <label className="block text-xs text-[#475569] dark:text-neutral-300 mb-1">Dietary</label>
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
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white dark:bg-gray-50 p-4 rounded-lg border shadow-sm">
              <div className="h-6 w-40 bg-gray-200 animate-pulse rounded mb-2" />
              <div className="h-4 w-64 bg-gray-200 animate-pulse rounded" />
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
        ) : guests.length === 0 ? (
          <div className="bg-white dark:bg-gray-50 p-10 rounded-lg border text-center">
            <div className="text-3xl mb-2">🧑‍🤝‍🧑</div>
            <h3 className="text-lg font-semibold mb-1">No guests yet</h3>
            <p className="text-sm text-gray-600 mb-4">Start by adding your first guest to build your list.</p>
            <Button onClick={onAdd}>Add Guest</Button>
          </div>
        ) : (
          <Table>
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
                <TableRow key={g.id}>
                  <TableCell>
                    <Checkbox checked={Boolean(selected[g.id])} onCheckedChange={(v:any)=>setSelected(s=>({...s,[g.id]: Boolean(v)}))} />
                  </TableCell>
                  <TableCell className="font-medium">{g.name}</TableCell>
                  <TableCell className="capitalize text-[#475569]">{g.side || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={g.rsvpStatus === 'accepted' ? 'success' : g.rsvpStatus === 'declined' ? 'error' : 'outline'}>
                      {g.rsvpStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>{g.invitationSent ? 'Yes' : 'No'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </PremiumDashboardLayout>
  )
}
