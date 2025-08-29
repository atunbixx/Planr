"use client"

import { useEffect, useState } from 'react'
import PremiumDashboardLayout from '@/components/layout/PremiumDashboardLayout'
import { SeatingClient } from '@/lib/api/seating.client'
import { GuestsClient, type LegacyGuest } from '@/lib/api/guests.client'
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

type TableItem = { id: string; name: string; capacity: number; seats?: Array<{ id: string; guestId?: string | null }> }

export default function SeatingPage() {
  const [tables, setTables] = useState<TableItem[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [guestMap, setGuestMap] = useState<Record<string, LegacyGuest>>({})
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

  const load = async () => {
    try {
      setLoading(true)
      const [tables, guests] = await Promise.all([
        SeatingClient.listTables(),
        GuestsClient.listGuests({ limit: 1000 }).catch(() => ({ guests: [] as LegacyGuest[] })),
      ])
      setTables(tables as any)
      const map: Record<string, LegacyGuest> = {}
      for (const g of guests.guests) map[g.id] = g
      setGuestMap(map)
      const totalTables = tables.length
      const totalSeats = tables.reduce((sum, t:any) => sum + (t.seats?.length || 0), 0)
      const seatedGuests = tables.reduce((sum, t:any) => sum + (t.seats || []).filter((s:any)=>s.guestId).length, 0)
      const stats = { totalTables, totalSeats, seatedGuests, unseatedGuests: Math.max(0, totalSeats - seatedGuests) }
      setStats(stats)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load seating')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const unseatedGuests = (() => {
    const assignedIds = new Set<string>()
    for (const t of tables) {
      for (const s of (t.seats || [])) if (s.guestId) assignedIds.add(s.guestId as string)
    }
    return Object.values(guestMap).filter(g => !assignedIds.has(g.id))
  })()

  const createTable = async () => {
    try {
      setCreating(true)
      const t = await SeatingClient.createTable({ name: newTableName || 'Table', capacity: Number(newTableCapacity) || 1 } as any)
      // Optimistically update list
      setTables(prev => [...prev, t as any])
      setNewTableOpen(false)
      setNewTableName('Table')
      setNewTableCapacity(8 as any)
      // Recompute stats
      await load()
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
    setTables(prev => prev.map(t => {
      const seats = (t.seats || []).map(s => {
        if (s.id === seat.id) return { ...s, guestId }
        if (s.guestId === guestId) return { ...s, guestId: null }
        return s
      })
      return t.id === seat.tableId ? { ...t, seats } : { ...t, seats }
    }))
    SeatingClient.assignSeat(String(seat.id), String(guestId)).catch(() => {/* ignore in temp mode */})
  }

  const unassignSeat = (seat: any) => {
    setTables(prev => prev.map(t => {
      const seats = (t.seats || []).map(s => (s.id === seat.id ? { ...s, guestId: null } : s))
      return t.id === seat.tableId ? { ...t, seats } : { ...t, seats }
    }))
    SeatingClient.assignSeat(String(seat.id), null).catch(() => {/* ignore */})
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
      const updated = await SeatingClient.updateTable(editingTable.id, { name: editName, capacity: editCapacity } as any)
      setTables(prev => prev.map(t => (t.id === updated.id ? (updated as any) : t)))
      setEditingTable(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update table')
    } finally {
      setSavingEdit(false)
    }
  }

  const deleteTable = async (id: string) => {
    try {
      await SeatingClient.deleteTable(id)
      setTables(prev => prev.filter(t => t.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete table')
    }
  }

  const autoAssign = async () => {
    try {
      const tables = await SeatingClient.autoAssign(true)
      setTables(tables as any)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to auto-assign')
    }
  }

  // DnD Kit handlers
  const onDragStart = (e: DragStartEvent) => {
    const gid = (e.active.data?.current as any)?.guestId as string | undefined
    if (gid) setActiveGuestId(gid)
    if (gid) setLiveMessage(`Start dragging ${guestMap[gid]?.name || 'guest'}`)
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
    setLiveMessage(`${guestMap[gid]?.name || 'Guest'} placed on seat`)
  }

  return (
    <PremiumDashboardLayout>
      <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-dark dark:text-white">Table Seating</h1>
          <div className="flex items-center gap-2">
          <Button data-testid="auto-assign" variant="outline" onClick={autoAssign}>Auto Assign</Button>
          <Dialog open={newTableOpen} onOpenChange={setNewTableOpen}>
             <DialogTrigger asChild>
              <Button data-testid="new-table" variant="primary">New Table</Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Table</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tname">Name</Label>
                    <Input id="tname" value={newTableName} onChange={e => setNewTableName(e.target.value)} placeholder="Table name" />
                  </div>
                  <div>
                    <Label htmlFor="tcap">Capacity</Label>
                    <Input id="tcap" type="number" min={1} max={20} value={newTableCapacity} onChange={e => setNewTableCapacity(parseInt(e.target.value || '0'))} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewTableOpen(false)}>Cancel</Button>
                <Button variant="primary" onClick={createTable} isLoading={creating}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card><CardContent className="p-6"><div className="text-sm text-[#475569]">Tables</div><div className="text-2xl font-bold mt-2">{stats.totalTables}</div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="text-sm text-[#475569]">Seats</div><div className="text-2xl font-bold mt-2">{stats.totalSeats}</div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="text-sm text-[#475569]">Seated</div><div className="text-2xl font-bold mt-2">{stats.seatedGuests}</div></CardContent></Card>
            <Card><CardContent className="p-6"><div className="text-sm text-[#475569]">Unseated</div><div className="text-2xl font-bold mt-2">{stats.unseatedGuests}</div></CardContent></Card>
          </div>
        )}

        {loading ? (
          <div className="text-sm text-dark-6">Loading seating…</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : (
          <Table>
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
                  .map((s: any) => s.guest?.name || (s.guestId ? guestMap[s.guestId]?.name : undefined))
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
                    <DraggableGuest key={g.id} guestId={g.id} label={g.name} />
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
                          label={s.guestId ? (guestMap[s.guestId]?.name || 'Assigned') : 'Empty'}
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
                {guestMap[activeGuestId]?.name || 'Guest'}
              </div>
            ) : null}
          </DragOverlay>
          </DndContext>
        )}

        {/* Edit Table Dialog */}
        <Dialog open={!!editingTable} onOpenChange={(v) => !v ? setEditingTable(null) : null}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Table</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ename">Name</Label>
                  <Input id="ename" value={editName} onChange={e => setEditName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="ecap">Capacity</Label>
                  <Input id="ecap" type="number" min={1} max={20} value={editCapacity} onChange={e => setEditCapacity(parseInt(e.target.value || '0'))} />
                </div>
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
  const style: React.CSSProperties = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined
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
