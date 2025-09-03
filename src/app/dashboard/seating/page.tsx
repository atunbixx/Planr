"use client"

import { useEffect, useState } from 'react'
import PremiumDashboardLayout from '@/components/layout/PremiumDashboardLayout'
import { PageHeader } from '@/components/ui/page-header'
import { SectionCard, SectionCardBody } from '@/components/ui/section-card'
import { SeatingClient } from '@/lib/api/seating.client'
import type { GuestResponse } from '@/features/guests/dto/guest.dto'
import { useGuests } from '@/lib/api/queries/useGuests'
import { useSeating, useCreateTable, useAssignSeat, useUpdateTable, useDeleteTable, useAutoAssign } from '@/lib/api/queries/useSeating'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { MetricCardsSkeleton, TableSectionSkeleton } from '@/components/ui/section-skeletons'

type TableItem = { id: string; name: string; capacity: number; seats?: Array<{ id: string; guestId?: string | null }> }

export default function SeatingPage() {
  const seatingQuery = useSeating()
  const guestsQuery = useGuests()
  const [error, setError] = useState<string | null>(null)
  const [guestMap, setGuestMap] = useState<Record<string, GuestResponse>>({})
  const [newTableOpen, setNewTableOpen] = useState(false)
  const [newTableName, setNewTableName] = useState('Table')
  const [newTableCapacity, setNewTableCapacity] = useState<number>(8)
  const [creating, setCreating] = useState(false)
  const [editingTable, setEditingTable] = useState<any | null>(null)
  const [editName, setEditName] = useState('')
  const [editCapacity, setEditCapacity] = useState<number>(8)
  const [savingEdit, setSavingEdit] = useState(false)
  const [activeGuestId, setActiveGuestId] = useState<string | null>(null)
  const [liveMessage, setLiveMessage] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor)
  )

  useEffect(() => {
    const guests = (guestsQuery.data || []) as GuestResponse[]
    const map: Record<string, GuestResponse> = {}
    for (const g of guests) map[g.id] = g
    setGuestMap(map)
  }, [guestsQuery.data])

  const displayName = (g?: GuestResponse) => g ? `${g.firstName}${g.lastName ? ` ${g.lastName}` : ''}` : ''

  const tables = (seatingQuery.data as any as TableItem[]) || []
  const loading = seatingQuery.isLoading || guestsQuery.isLoading
  const stats = (() => {
    const totalTables = tables.length
    const totalSeats = tables.reduce((sum, t:any) => sum + (t.seats?.length || 0), 0)
    const seatedGuests = tables.reduce((sum, t:any) => sum + (t.seats || []).filter((s:any)=>s.guestId).length, 0)
    return { totalTables, totalSeats, seatedGuests, unseatedGuests: Math.max(0, totalSeats - seatedGuests) }
  })()

  const unseatedGuests = (() => {
    const assignedIds = new Set<string>()
    for (const t of tables) {
      for (const s of (t.seats || [])) if (s.guestId) assignedIds.add(s.guestId as string)
    }
    return Object.values(guestMap).filter(g => !assignedIds.has(g.id))
  })()

  const createMutation = useCreateTable()
  const updateMutation = useUpdateTable()
  const deleteMutation = useDeleteTable()
  const assignMutation = useAssignSeat()
  const autoAssignMutation = useAutoAssign()

  const createTable = async () => {
    try {
      setCreating(true)
      await createMutation.mutateAsync({ name: newTableName || 'Table', capacity: Number(newTableCapacity) || 1 } as any)
      setNewTableOpen(false)
      setNewTableName('Table')
      setNewTableCapacity(8 as any)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create table')
    } finally {
      setCreating(false)
    }
  }

  const handleDropOnSeat = async (seat: any, ev: React.DragEvent) => {
    ev.preventDefault()
    const guestId = ev.dataTransfer.getData('text/guest-id')
    if (!guestId) return
    // Optimistic UI update regardless of API response
    assignMutation.mutate({ seatId: String(seat.id), guestId: String(guestId) })
  }

  const unassignSeat = (seat: any) => {
    assignMutation.mutate({ seatId: String(seat.id), guestId: null })
  }

  const openEditTable = (t: any) => {
    setEditingTable(t)
    setEditName(t.name)
    setEditCapacity(t.capacity)
  }

  const saveEditTable = async () => {
    if (!editingTable) return
    try {
      setSavingEdit(true)
      // Confirm capacity shrink if it would drop assigned seats
      const current = tables.find(t => (t as any).id === editingTable.id) as any
      const assigned = (current?.seats || []).filter((s: any) => s.guestId).length
      if (editCapacity < assigned) {
        const ok = window.confirm(`Reducing capacity to ${editCapacity} will remove ${assigned - editCapacity} assigned seat(s). Continue?`)
        if (!ok) { setSavingEdit(false); return }
      }
      await updateMutation.mutateAsync({ id: editingTable.id, payload: { name: editName, capacity: editCapacity } })
      setEditingTable(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update table')
    } finally {
      setSavingEdit(false)
    }
  }

  const deleteTable = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete table')
    }
  }

  const autoAssign = async () => {
    try {
      await autoAssignMutation.mutateAsync(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to auto-assign')
    }
  }

  // DnD Kit handlers
  const onDragStart = (e: DragStartEvent) => {
    const gid = (e.active.data?.current as any)?.guestId as string | undefined
    if (gid) setActiveGuestId(gid)
    if (gid) setLiveMessage(`Start dragging ${displayName(guestMap[gid]) || 'guest'}`)
  }
  const onDragEnd = (e: DragEndEvent) => {
    const gid = (e.active.data?.current as any)?.guestId as string | undefined
    const overId = e.over?.id as string | undefined
    setActiveGuestId(null)
    if (!gid || !overId) return
    if (!overId.startsWith('seat-')) return
    const seatId = overId.slice('seat-'.length)
    // Find seat details (tableId needed for local state update)
    let targetSeat: any | null = null
    tables.find((t: any) => {
      const s = (t.seats || []).find((x: any) => x.id === seatId)
      if (s) targetSeat = { ...s, tableId: t.id }
      return Boolean(s)
    })
    if (!targetSeat) {
      // synthesized seat case
      const parts = seatId.split('_')
      const tableId = parts[1]
      targetSeat = { id: seatId, tableId }
    }
    // Reuse existing assignment helper (optimistic + API)
    const fakeEvent = { preventDefault() {}, dataTransfer: { getData: () => gid } } as any
    handleDropOnSeat(targetSeat, fakeEvent)
    setLiveMessage(`${displayName(guestMap[gid]) || 'Guest'} placed on seat`)
  }

  return (
    <PremiumDashboardLayout>
      <div className="p-6 space-y-6">
          <PageHeader kicker="SEATING" title="Table Seating" actions={
            <div className="flex items-center gap-2">
              <Button data-testid="auto-assign" variant="outline" onClick={autoAssign}>Auto Assign</Button>
              <Dialog open={newTableOpen} onOpenChange={setNewTableOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="new-table" variant="primary">New Table</Button>
                </DialogTrigger>
                <DialogContent className="content-defaults form-elegant">
                  <DialogHeader>
                    <DialogTitle>Create Table</DialogTitle>
                  </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Name" htmlFor="tname" required>
                      <Input id="tname" value={newTableName} onChange={e => setNewTableName(e.target.value)} placeholder="Table name" />
                    </FormField>
                    <FormField label="Capacity" htmlFor="tcap" required help="1–20">
                      <Input id="tcap" type="number" min={1} max={20} value={newTableCapacity} onChange={e => setNewTableCapacity(parseInt(e.target.value || '0'))} />
                    </FormField>
                  </div>
                </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setNewTableOpen(false)}>Cancel</Button>
                    <Button variant="primary" onClick={createTable} isLoading={creating}>Create</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          } />

        {stats && (
          <SectionCard>
            <SectionCardBody>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card><CardContent className="p-6"><div className="text-sm text-[#475569]">Tables</div><div className="text-2xl font-bold mt-2">{stats.totalTables}</div></CardContent></Card>
                <Card><CardContent className="p-6"><div className="text-sm text-[#475569]">Seats</div><div className="text-2xl font-bold mt-2">{stats.totalSeats}</div></CardContent></Card>
                <Card><CardContent className="p-6"><div className="text-sm text-[#475569]">Seated</div><div className="text-2xl font-bold mt-2">{stats.seatedGuests}</div></CardContent></Card>
                <Card><CardContent className="p-6"><div className="text-sm text-[#475569]">Unseated</div><div className="text-2xl font-bold mt-2">{stats.unseatedGuests}</div></CardContent></Card>
              </div>
            </SectionCardBody>
          </SectionCard>
        )}

        {loading ? (
          <div className="space-y-4">
            <MetricCardsSkeleton count={4} />
            <TableSectionSkeleton columns={4} rows={6} />
          </div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : (
          <SectionCard>
            <SectionCardBody>
          <Table variant="bare">
            <TableHeader>
              <TableRow>
                <TableHead>Table</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Guests</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tables.map(t => {
                const assigned = (t.seats || []).filter(s => s.guestId).length
                const names = (t.seats || [])
                  .filter(s => s.guestId)
                  .map((s: any) => s.guest?.name || (s.guestId ? displayName(guestMap[s.guestId]) : undefined))
                  .filter(Boolean)
                  .join(', ')
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>{t.capacity}</TableCell>
                    <TableCell>{assigned}</TableCell>
                    <TableCell className="text-sm text-dark dark:text-white">{names || '—'}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
            </SectionCardBody>
          </SectionCard>
        )}

        {/* Arrange seating board with drag-and-drop */}
        {!loading && !error && (
          <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="sr-only" aria-live="polite">{liveMessage}</div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-4">
                <div className="font-semibold mb-2 text-dark dark:text-white">Unseated Guests</div>
                <div data-testid="unseated-list" className="space-y-2 max-h-96 overflow-auto">
                  {Object.values(guestMap).length === 0 && (
                    <div className="text-sm text-dark-6">
                      No guests found. Add guests to start arranging seating.
                      <div className="mt-3">
                        <Link href="/dashboard/guests" className="inline-flex items-center text-[hsl(var(--primary))] underline underline-offset-4 hover:opacity-80">
                          Go to Guests
                        </Link>
                      </div>
                    </div>
                  )}
                  {Object.values(guestMap).length > 0 && unseatedGuests.length === 0 && (
                    <div className="text-sm text-dark-6">All guests are seated</div>
                  )}
                  {unseatedGuests.map(g => (
                    <DraggableGuest key={g.id} guestId={g.id} label={displayName(g)} />
                  ))}
                </div>
              </CardContent>
            </Card>
            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {tables.map((t: any) => (
                <Card key={t.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-semibold text-dark dark:text-white">{t.name}</div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-dark-6">{(t.seats || []).filter((s:any)=>s.guestId).length}/{t.capacity} seated</div>
                        <Button size="sm" variant="ghost" onClick={() => openEditTable(t)}>Edit</Button>
                        <Button size="sm" variant="outline" onClick={() => deleteTable(t.id)}>Delete</Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {(t.seats || Array.from({ length: t.capacity }, (_, i) => ({ id: `seat_${t.id}_${i+1}`, tableId: t.id, guestId: null, seatNumber: i+1 }))).map((s:any) => (
                        <DroppableSeat
                          key={s.id}
                          id={`seat-${s.id}`}
                          label={s.guestId ? (displayName(guestMap[s.guestId]) || 'Assigned') : 'Empty'}
                          onUnassign={() => unassignSeat({ ...s, tableId: t.id })}
                          hasGuest={Boolean(s.guestId)}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <DragOverlay>
            {activeGuestId ? (
              <div className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-[hsl(var(--primary))] shadow-md dark:border-dark-3 dark:bg-dark-2 dark:text-neutral-100">
                {displayName(guestMap[activeGuestId]) || 'Guest'}
              </div>
            ) : null}
          </DragOverlay>
          </DndContext>
        )}

        {/* Edit Table Dialog */}
        <Dialog open={!!editingTable} onOpenChange={(v) => !v ? setEditingTable(null) : null}>
          <DialogContent className="content-defaults form-elegant">
            <DialogHeader>
              <DialogTitle>Edit Table</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Name" htmlFor="ename" required>
                  <Input id="ename" value={editName} onChange={e => setEditName(e.target.value)} />
                </FormField>
                <FormField label="Capacity" htmlFor="ecap" required help="1–20">
                  <Input id="ecap" type="number" min={1} max={20} value={editCapacity} onChange={e => setEditCapacity(parseInt(e.target.value || '0'))} />
                </FormField>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingTable(null)}>Cancel</Button>
              <Button variant="primary" onClick={saveEditTable} isLoading={savingEdit}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PremiumDashboardLayout>
  )
}

function DraggableGuest({ guestId, label }: { guestId: string; label: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `guest-${guestId}`, data: { guestId } })
  const style: React.CSSProperties = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : {}
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      tabIndex={0}
      role="button"
      aria-label={`Guest ${label}`}
      className={`px-3 py-2 rounded-lg border border-slate-200 bg-white text-[hsl(var(--primary))] hover:bg-slate-50 cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] dark:border-dark-3 dark:bg-transparent dark:text-neutral-100 ${isDragging ? 'opacity-50' : ''}`}
      title="Drag to a seat"
    >
      {label}
    </div>
  )
}

function DroppableSeat({ id, label, hasGuest, onUnassign }: { id: string; label: string; hasGuest: boolean; onUnassign: () => void }) {
  const { isOver, setNodeRef } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      tabIndex={0}
      role="button"
      aria-label={`Seat ${label}`}
      className={`relative h-10 rounded-md border flex items-center justify-center text-sm text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] ${
        isOver ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))/0.07]' : 'border-slate-200 bg-slate-50 dark:border-dark-3 dark:bg-dark-2'
      }`}
      title={label}
    >
      {label}
      {hasGuest && (
        <button
          onClick={(e) => { e.stopPropagation(); onUnassign() }}
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white text-slate-600 border border-slate-200 flex items-center justify-center hover:bg-slate-100 dark:bg-dark-2 dark:text-neutral-100 dark:border-dark-3"
          title="Unassign"
        >
          ×
        </button>
      )}
    </div>
  )
}
