'use client'

import { useState, useEffect } from 'react'
import { DndContext, DragEndEvent, DragOverlay, closestCenter, pointerWithin, rectIntersection, useDroppable } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SeatingTable, Table, Guest as TableGuest } from './SeatingTable'
import { GuestList, Guest } from './GuestList'
import { GuestCard } from './GuestCard'
import { TableDropZone } from './TableDropZone'
import { useToast } from '@/hooks/useToast'
import { Save, Plus, Download, LayoutGrid } from 'lucide-react'
import { cn } from '@/utils/cn'
import { ExportDialog } from './ExportDialog'

interface SeatingChartProps {
  coupleId: string
}

interface SeatingAssignment {
  id: string
  guest_id: string
  table_id: string
  seat_number?: number
}

export function SeatingChart({ coupleId }: SeatingChartProps) {
  const [tables, setTables] = useState<Table[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [assignments, setAssignments] = useState<SeatingAssignment[]>([])
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)

  const supabase = createClientComponentClient()
  const { addToast } = useToast()

  // Load data
  useEffect(() => {
    loadSeatingData()
  }, [coupleId])

  const loadSeatingData = async () => {
    try {
      // Load tables
      const { data: tablesData, error: tablesError } = await supabase
        .from('seating_tables')
        .select('*')
        .eq('couple_id', coupleId)
        .order('name')

      if (tablesError) throw tablesError

      // Load guests
      const { data: guestsData, error: guestsError } = await supabase
        .from('wedding_guests')
        .select('*')
        .eq('couple_id', coupleId)
        .order('name')

      if (guestsError) throw guestsError

      // Load assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('seating_assignments')
        .select('*')
        .eq('couple_id', coupleId)

      if (assignmentsError) throw assignmentsError

      setTables(tablesData || [])
      setGuests(guestsData || [])
      setAssignments(assignmentsData || [])
    } catch (error) {
      console.error('Error loading seating data:', error)
      addToast({
        title: 'Error',
        description: 'Failed to load seating data',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  // Get guests assigned to a specific table
  const getTableGuests = (tableId: string): Guest[] => {
    const tableAssignments = assignments.filter(a => a.table_id === tableId)
    return tableAssignments.map(a => {
      const guest = guests.find(g => g.id === a.guest_id)
      return guest ? { ...guest, table_id: tableId } : null
    }).filter(Boolean) as Guest[]
  }

  // Add new table
  const addTable = () => {
    const newTable: Table = {
      id: `temp-${Date.now()}`,
      name: `Table ${tables.length + 1}`,
      table_type: 'round',
      capacity: 8,
      x_position: 100 + (tables.length % 3) * 200,
      y_position: 100 + Math.floor(tables.length / 3) * 200,
      width: 150,
      height: 150,
      rotation: 0
    }
    setTables([...tables, newTable])
    setHasChanges(true)
  }

  // Update table
  const updateTable = (tableId: string, updates: Partial<Table>) => {
    setTables(prev => prev.map(table => 
      table.id === tableId ? { ...table, ...updates } : table
    ))
    setHasChanges(true)
  }

  // Delete table
  const deleteTable = (tableId: string) => {
    if (!confirm('Are you sure you want to delete this table? All guest assignments will be removed.')) {
      return
    }

    setTables(prev => prev.filter(t => t.id !== tableId))
    setAssignments(prev => prev.filter(a => a.table_id !== tableId))
    setHasChanges(true)
  }

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) return

    const activeGuest = guests.find(g => g.id === active.id)
    if (!activeGuest) return

    // If dropping on a table
    if (over.id.toString().startsWith('table-')) {
      const tableId = over.id.toString().replace('table-', '')
      const table = tables.find(t => t.id === tableId)
      
      if (table) {
        // Check capacity
        const currentGuests = getTableGuests(tableId)
        if (currentGuests.length >= table.capacity) {
          addToast({
            title: 'Table full',
            description: `${table.name} is at capacity`,
            type: 'error'
          })
          return
        }

        // Remove from previous table if assigned
        setAssignments(prev => prev.filter(a => a.guest_id !== activeGuest.id))

        // Add to new table
        const newAssignment: SeatingAssignment = {
          id: `temp-${Date.now()}`,
          guest_id: activeGuest.id,
          table_id: tableId
        }
        setAssignments(prev => [...prev, newAssignment])
        setHasChanges(true)
      }
    } else if (over.id === 'guest-list') {
      // Remove from table
      setAssignments(prev => prev.filter(a => a.guest_id !== activeGuest.id))
      setHasChanges(true)
    }

    setActiveId(null)
  }

  // Save changes
  const saveChanges = async () => {
    try {
      // Save tables
      for (const table of tables) {
        if (table.id.startsWith('temp-')) {
          // Create new table
          const { data, error } = await supabase
            .from('seating_tables')
            .insert({
              couple_id: coupleId,
              name: table.name,
              table_type: table.table_type,
              capacity: table.capacity,
              x_position: table.x_position,
              y_position: table.y_position,
              width: table.width,
              height: table.height,
              rotation: table.rotation,
              notes: table.notes
            })
            .select()
            .single()

          if (error) throw error

          // Update temp IDs in assignments
          setAssignments(prev => prev.map(a => 
            a.table_id === table.id ? { ...a, table_id: data.id } : a
          ))
          
          // Update table ID
          table.id = data.id
        } else {
          // Update existing table
          const { error } = await supabase
            .from('seating_tables')
            .update({
              name: table.name,
              table_type: table.table_type,
              capacity: table.capacity,
              x_position: table.x_position,
              y_position: table.y_position,
              width: table.width,
              height: table.height,
              rotation: table.rotation,
              notes: table.notes,
              updated_at: new Date().toISOString()
            })
            .eq('id', table.id)

          if (error) throw error
        }
      }

      // Clear existing assignments
      await supabase
        .from('seating_assignments')
        .delete()
        .eq('couple_id', coupleId)

      // Save new assignments
      const validAssignments = assignments.filter(a => !a.id.startsWith('temp-'))
      if (validAssignments.length > 0) {
        const { error } = await supabase
          .from('seating_assignments')
          .insert(
            validAssignments.map(a => ({
              couple_id: coupleId,
              guest_id: a.guest_id,
              table_id: a.table_id,
              seat_number: a.seat_number
            }))
          )

        if (error) throw error
      }

      setHasChanges(false)
      addToast({
        title: 'Saved!',
        description: 'Seating arrangement has been saved',
        type: 'success'
      })

      // Reload to get fresh data
      await loadSeatingData()
    } catch (error) {
      console.error('Error saving seating:', error)
      addToast({
        title: 'Error',
        description: 'Failed to save seating arrangement',
        type: 'error'
      })
    }
  }

  // Get active dragging item
  const activeGuest = activeId ? guests.find(g => g.id === activeId) : null

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    )
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={(event) => setActiveId(event.active.id.toString())}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 h-[800px]">
        {/* Guest List Sidebar */}
        <Card className="w-80 flex-shrink-0">
          <GuestList
            guests={guests}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </Card>

        {/* Seating Chart Area */}
        <Card className="flex-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Seating Arrangement</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={addTable}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Table
              </Button>
              <ExportDialog 
                elementId="seating-chart-canvas"
                filename={`seating-chart-${new Date().toISOString().split('T')[0]}`}
              />
              <Button
                size="sm"
                onClick={saveChanges}
                disabled={!hasChanges}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            <div id="seating-chart-canvas" className="relative bg-gray-50 rounded-lg h-[700px] overflow-auto">
              <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
              
              {/* Tables */}
              <div className="relative" style={{ width: '1200px', height: '1000px' }}>
                {tables.map(table => {
                  const tableGuests = getTableGuests(table.id)
                  const isOverCapacity = tableGuests.length >= table.capacity
                  
                  return (
                    <TableDropZone
                      key={table.id}
                      tableId={table.id}
                      isOverCapacity={isOverCapacity}
                    >
                      <SeatingTable
                        table={table}
                        guests={tableGuests}
                        isSelected={selectedTableId === table.id}
                        onSelect={() => setSelectedTableId(table.id)}
                        onUpdate={(updates) => updateTable(table.id, updates)}
                        onDelete={() => deleteTable(table.id)}
                        isDraggable={false}
                      />
                    </TableDropZone>
                  )
                })}
              </div>

              {/* Empty state */}
              {tables.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <LayoutGrid className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">No tables yet</p>
                    <Button onClick={addTable}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Table
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="mt-4 flex gap-4 text-sm text-gray-600">
              <span>{tables.length} tables</span>
              <span>•</span>
              <span>{assignments.length} of {guests.length} guests assigned</span>
              <span>•</span>
              <span>Total capacity: {tables.reduce((sum, t) => sum + t.capacity, 0)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeGuest && (
          <GuestCard
            guest={activeGuest}
            isAssigned={!!assignments.find(a => a.guest_id === activeGuest.id)}
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}