'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import AuthClient from '@/lib/auth/client'
import { GuestsClient } from '@/lib/api/guests.client'
import { ArrowLeft, Users, Mail, Trash2, CheckCircle2, Clock, X, UserPlus, Edit, Group, CheckCircle, Hourglass, XCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface Guest {
  id: string
  firstName: string
  lastName: string
  rsvpStatus: 'pending' | 'accepted' | 'declined'
  dietaryRestrictions?: string
  side?: 'bride' | 'groom'
  invitationSent: boolean
  plusOneAllowed?: boolean
  plusOneName?: string | null
  householdId?: string | null
  tags?: string[]
  relationshipCategory?: string
}

export default function GuestsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [guests, setGuests] = useState<Guest[]>([])
  const [filtered, setFiltered] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [openDialog, setOpenDialog] = useState(false)
  const [editing, setEditing] = useState<Guest | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all')
  const [side, setSide] = useState<'all' | '' | 'bride' | 'groom'>('all')
  const [dietary, setDietary] = useState('')
  const [relationship, setRelationship] = useState<''|'sibling'|'parent'|'relative'|'friend'|'neighbour'|'colleague'|'vendor'|'other'>('')
  const [tagQuery, setTagQuery] = useState('')
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    rsvpStatus: 'pending' as 'pending' | 'accepted' | 'declined',
    dietaryRestrictions: '',
    side: undefined as 'bride' | 'groom' | undefined,
    invitationSent: false,
    plusOneAllowed: false,
    plusOneName: '',
    householdId: '',
    relationshipCategory: '' as '' | 'sibling'|'parent'|'relative'|'friend'|'neighbour'|'colleague'|'vendor'|'other',
    tags: '' as string,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkLoading, setBulkLoading] = useState(false)
  const [optimisticUpdates, setOptimisticUpdates] = useState<Record<string, Partial<Guest>>>({})
  const [showBulkActions, setShowBulkActions] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin')
    }
  }, [user, isLoading, router])

  const fetchGuests = useCallback(async () => {
    try {
      const { guests: guestData, total } = await GuestsClient.listGuests({
        limit: pageSize,
        offset: (page - 1) * pageSize,
        side: side !== 'all' ? (side as any) : undefined,
        status: status !== 'all' ? (status as any) : undefined,
        category: relationship || undefined,
        dietary: dietary.trim() || undefined,
      })
      // Transform LegacyGuest to Guest format
      const transformedGuests: Guest[] = (guestData || []).map((g: any) => ({
        id: g.id,
        firstName: g.firstName || g.name?.split(' ')[0] || '',
        lastName: g.lastName || g.name?.split(' ').slice(1).join(' ') || '',
        rsvpStatus: g.rsvpStatus,
        dietaryRestrictions: g.dietaryRestrictions || g.mealPreference,
        side: g.side,
        invitationSent: g.invitationSent || false,
        plusOneAllowed: g.plusOneAllowed,
        plusOneName: g.plusOneName,
        householdId: g.householdId,
        tags: g.tags || [],
        relationshipCategory: g.relationshipCategory
      }))
      setGuests(transformedGuests)
      if (typeof total === 'number') setTotal(total)
    } catch (e) {
      console.error('Error loading guests:', e)
    } finally {
      setLoading(false)
    }
  }, [side, status, dietary, page, pageSize, relationship])

  useEffect(() => {
    if (!isLoading && user) fetchGuests()
  }, [isLoading, user, fetchGuests])

  useEffect(() => {
    let list = guests
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (g) =>
          g.firstName.toLowerCase().includes(q) || g.lastName.toLowerCase().includes(q) || (g.dietaryRestrictions || '').toLowerCase().includes(q)
      )
    }
    setFiltered(list)
  }, [guests, search])

  const stats = useMemo(() => {
    const total = guests.length
    const accepted = guests.filter((g) => g.rsvpStatus === 'accepted').length
    const pending = guests.filter((g) => g.rsvpStatus === 'pending').length
    const declined = guests.filter((g) => g.rsvpStatus === 'declined').length
    return { total, accepted, pending, declined }
  }, [guests])

  const handleSave = async () => {
    const newErrors: Record<string, string> = {}
    if (!form.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required'
    setErrors(newErrors)
    if (Object.keys(newErrors).length) return

    const isEdit = Boolean(editing)
    const payload = {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean)
    }

    // Optimistic update
    const tempId = `temp_${Date.now()}`
    const optimisticGuest: Guest = {
      id: isEdit ? editing!.id : tempId,
      firstName: payload.firstName,
      lastName: payload.lastName,
      rsvpStatus: payload.rsvpStatus,
      dietaryRestrictions: payload.dietaryRestrictions,
      side: payload.side,
      invitationSent: payload.invitationSent,
      plusOneAllowed: payload.plusOneAllowed,
      plusOneName: payload.plusOneName,
      householdId: payload.householdId,
      tags: payload.tags,
      relationshipCategory: payload.relationshipCategory
    }

    if (isEdit) {
      // Optimistically update existing guest
      setGuests((prev) => prev.map((x) => (x.id === editing!.id ? optimisticGuest : x)))
    } else {
      // Optimistically add new guest
      setGuests((prev) => [optimisticGuest, ...prev])
    }
    
    setOpenDialog(false)

    try {
      if (isEdit) {
        const updated = await GuestsClient.updateGuest(editing!.id, payload)
        const transformedUpdated: Guest = {
          id: updated.id,
          firstName: (updated as any).firstName || updated.name?.split(' ')[0] || '',
          lastName: (updated as any).lastName || updated.name?.split(' ').slice(1).join(' ') || '',
          rsvpStatus: updated.rsvpStatus,
          dietaryRestrictions: (updated as any).dietaryRestrictions || updated.mealPreference,
          side: updated.side,
          invitationSent: (updated as any).invitationSent || false,
          plusOneAllowed: (updated as any).plusOneAllowed,
          plusOneName: (updated as any).plusOneName,
          householdId: (updated as any).householdId,
          tags: (updated as any).tags || [],
          relationshipCategory: (updated as any).relationshipCategory
        }
        setGuests((prev) => prev.map((x) => (x.id === editing!.id ? transformedUpdated : x)))
      } else {
        const created = await GuestsClient.createGuest(payload)
        const transformedCreated: Guest = {
          id: created.id,
          firstName: (created as any).firstName || created.name?.split(' ')[0] || '',
          lastName: (created as any).lastName || created.name?.split(' ').slice(1).join(' ') || '',
          rsvpStatus: created.rsvpStatus,
          dietaryRestrictions: (created as any).dietaryRestrictions || created.mealPreference,
          side: created.side,
          invitationSent: (created as any).invitationSent || false,
          plusOneAllowed: (created as any).plusOneAllowed,
          plusOneName: (created as any).plusOneName,
          householdId: (created as any).householdId,
          tags: (created as any).tags || [],
          relationshipCategory: (created as any).relationshipCategory
        }
        // Replace temp guest with real guest
        setGuests((prev) => prev.map((x) => (x.id === tempId ? transformedCreated : x)))
      }
    } catch (error: any) {
      // Revert optimistic update on error
      if (isEdit) {
        setGuests((prev) => prev.map((x) => (x.id === editing!.id ? editing! : x)))
      } else {
        setGuests((prev) => prev.filter((x) => x.id !== tempId))
      }
      setErrors({ submit: error?.message || `Failed to ${isEdit ? 'update' : 'add'} guest` })
      setOpenDialog(true)
    }
  }

  const openAdd = () => {
    setEditing(null)
    setForm({ firstName: '', lastName: '', rsvpStatus: 'pending', dietaryRestrictions: '', side: undefined, invitationSent: false, plusOneAllowed: false, plusOneName: '', householdId: '', relationshipCategory: '', tags: '' })
    setErrors({})
    setOpenDialog(true)
  }

  const openEdit = (g: Guest) => {
    setEditing(g)
    setForm({
        firstName: g.firstName,
        lastName: g.lastName,
        rsvpStatus: g.rsvpStatus,
        dietaryRestrictions: g.dietaryRestrictions || '',
        side: g.side,
        invitationSent: g.invitationSent,
        plusOneAllowed: g.plusOneAllowed || false,
        plusOneName: g.plusOneName || '',
        householdId: g.householdId || '',
        relationshipCategory: (g.relationshipCategory as any) || '',
        tags: (g.tags || []).join(', ')
    })
    setErrors({})
    setOpenDialog(true)
  }

  const handleDelete = async (guest: Guest) => {
    if (!confirm(`Delete ${guest.firstName} ${guest.lastName}?`)) return
    
    // Optimistic delete
    setGuests((prev) => prev.filter((x) => x.id !== guest.id))
    
    try {
      await GuestsClient.deleteGuest(guest.id)
    } catch (error: any) {
      // Revert on error
      setGuests((prev) => [...prev, guest])
      alert(error?.message || 'Failed to delete guest')
    }
  }

  // Bulk operations
  const handleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filtered.map(g => g.id))
    }
  }

  const handleSelectGuest = (guestId: string) => {
    setSelectedIds(prev => 
      prev.includes(guestId) 
        ? prev.filter(id => id !== guestId)
        : [...prev, guestId]
    )
  }

  const handleBulkRsvpStatus = async (status: 'pending' | 'accepted' | 'declined') => {
    if (!selectedIds.length) return
    
    setBulkLoading(true)
    
    // Optimistic update
    setGuests(prev => prev.map(guest => 
      selectedIds.includes(guest.id) 
        ? { ...guest, rsvpStatus: status }
        : guest
    ))
    
    try {
      await GuestsClient.setRsvpStatusBulk(selectedIds, status)
      setSelectedIds([])
    } catch (error: any) {
      // Revert on error
      fetchGuests()
      alert(error?.message || 'Failed to update RSVP status')
    } finally {
      setBulkLoading(false)
    }
  }

  const handleBulkInvitation = async (sent: boolean) => {
    if (!selectedIds.length) return
    
    setBulkLoading(true)
    
    // Optimistic update
    setGuests(prev => prev.map(guest => 
      selectedIds.includes(guest.id) 
        ? { ...guest, invitationSent: sent }
        : guest
    ))
    
    try {
      await GuestsClient.setInvitationSentBulk(selectedIds, sent)
      setSelectedIds([])
    } catch (error: any) {
      // Revert on error
      fetchGuests()
      alert(error?.message || 'Failed to update invitation status')
    } finally {
      setBulkLoading(false)
    }
  }

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return
    if (!confirm(`Delete ${selectedIds.length} selected guests?`)) return
    
    setBulkLoading(true)
    const guestsToDelete = guests.filter(g => selectedIds.includes(g.id))
    
    // Optimistic delete
    setGuests(prev => prev.filter(guest => !selectedIds.includes(guest.id)))
    
    try {
      await Promise.all(selectedIds.map(id => GuestsClient.deleteGuest(id)))
      setSelectedIds([])
    } catch (error: any) {
      // Revert on error
      setGuests(prev => [...prev, ...guestsToDelete])
      alert(error?.message || 'Failed to delete guests')
    } finally {
      setBulkLoading(false)
    }
  }

  // Update showBulkActions when selection changes
  useEffect(() => {
    setShowBulkActions(selectedIds.length > 0)
  }, [selectedIds])

  if (isLoading || loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center mb-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="mr-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold flex-grow">Guests</h1>
        <Button onClick={openAdd}>
          <UserPlus className="mr-2 h-4 w-4" /> Add Guest
        </Button>
        </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Guests</CardTitle>
            <Group className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.accepted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Hourglass className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Declined</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.declined}</div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <Alert className="mb-4 border-blue-200 bg-blue-50">
          <Users className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between w-full">
            <span className="font-medium">
              {selectedIds.length} guest{selectedIds.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkRsvpStatus('accepted')}
                disabled={bulkLoading}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Mark Accepted
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkRsvpStatus('pending')}
                disabled={bulkLoading}
              >
                <Clock className="h-4 w-4 mr-1" />
                Mark Pending
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkInvitation(true)}
                disabled={bulkLoading}
              >
                <Mail className="h-4 w-4 mr-1" />
                Mark Invited
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkDelete}
                disabled={bulkLoading}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedIds([])}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center space-x-2 mb-4">
        <Input
          placeholder="Search guests..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={status} onValueChange={(value) => setStatus(value as any)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
          </SelectContent>
        </Select>
        <Select value={side} onValueChange={(value) => setSide(value as any)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Side" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sides</SelectItem>
            <SelectItem value="bride">Bride's Side</SelectItem>
            <SelectItem value="groom">Groom's Side</SelectItem>
          </SelectContent>
        </Select>
        {filtered.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            className="ml-auto"
          >
            {selectedIds.length === filtered.length ? 'Deselect All' : 'Select All'}
          </Button>
        )}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && !loading && (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {guests.length === 0 ? 'Your guest list is empty' : 'No guests match your filters'}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {guests.length === 0 
                ? 'Add your first guest to get started planning your special day!' 
                : 'Try adjusting your search or filter criteria to find guests.'}
            </p>
            {guests.length === 0 && (
              <Button onClick={openAdd} className="mx-auto">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Your First Guest
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Guest List */}
      {filtered.length > 0 && (
        <div className="grid gap-4">
          {filtered.map((guest) => (
            <Card key={guest.id} className={cn(
              "transition-all duration-200",
              selectedIds.includes(guest.id) && "ring-2 ring-blue-500 bg-blue-50"
            )}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedIds.includes(guest.id)}
                      onCheckedChange={() => handleSelectGuest(guest.id)}
                    />
                    <span>{guest.firstName} {guest.lastName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(guest)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(guest)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{guest.side ? `${guest.side}'s side` : 'No side specified'}</span>
                  {guest.dietaryRestrictions && (
                    <span>• Dietary: {guest.dietaryRestrictions}</span>
                  )}
                  {guest.invitationSent && (
                    <span className="flex items-center gap-1 text-green-600">
                      <Mail className="h-3 w-3" />
                      Invited
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={guest.rsvpStatus === 'accepted' ? 'default' : 
                                guest.rsvpStatus === 'declined' ? 'error' : 'secondary'}>
                    {guest.rsvpStatus}
                  </Badge>
                  {guest.tags && guest.tags.length > 0 && (
                    <div className="flex gap-1">
                      {guest.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {guest.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{guest.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Guest' : 'Add Guest'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input name="firstName" value={form.firstName} onChange={(e) => setForm({...form, firstName: e.target.value})} placeholder="First Name" error={errors.firstName} />
            <Input name="lastName" value={form.lastName} onChange={(e) => setForm({...form, lastName: e.target.value})} placeholder="Last Name" error={errors.lastName} />
            <Select value={form.rsvpStatus} onValueChange={(value) => setForm({...form, rsvpStatus: value as any})}>
              <SelectTrigger><SelectValue placeholder="RSVP Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
              </SelectContent>
            </Select>
            <Select value={form.side || ''} onValueChange={(value) => setForm({...form, side: value === '' ? undefined : value as 'bride' | 'groom'})}>
              <SelectTrigger><SelectValue placeholder="Side" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">No Side</SelectItem>
                <SelectItem value="bride">Bride's Side</SelectItem>
                <SelectItem value="groom">Groom's Side</SelectItem>
              </SelectContent>
            </Select>
            <Input name="dietaryRestrictions" value={form.dietaryRestrictions} onChange={(e) => setForm({...form, dietaryRestrictions: e.target.value})} placeholder="Dietary Restrictions" />
            <Input name="tags" value={form.tags} onChange={(e) => setForm({...form, tags: e.target.value})} placeholder="Tags (comma separated)" />
            <div className="flex items-center space-x-2">
                <Checkbox id="plusOneAllowed" checked={form.plusOneAllowed} onCheckedChange={(checked) => setForm({...form, plusOneAllowed: !!checked})} />
                <label htmlFor="plusOneAllowed">Allow plus one</label>
            </div>
            {form.plusOneAllowed && (
                <Input name="plusOneName" value={form.plusOneName} onChange={(e) => setForm({...form, plusOneName: e.target.value})} placeholder="Plus one name" />
            )}
            <div className="flex items-center space-x-2">
                <Checkbox id="invitationSent" checked={form.invitationSent} onCheckedChange={(checked) => setForm({...form, invitationSent: !!checked})} />
                <label htmlFor="invitationSent">Invitation sent</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
