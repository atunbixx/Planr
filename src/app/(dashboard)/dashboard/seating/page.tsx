'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Users, Trash2, Save, Edit, UserPlus, Shuffle, Download, X } from 'lucide-react'
import { toast } from 'sonner'

interface Guest {
  id: string
  firstName: string
  lastName: string
  email?: string
  dietary?: string
  side?: string
  relationship?: string
}

interface Table {
  id: string
  name: string
  number: number
  capacity: number
  shape: 'round' | 'rectangular' | 'square'
  guests: Guest[]
}

interface SeatingData {
  tables: Table[]
  unassignedGuests: Guest[]
}

export default function SeatingChartPage() {
  const [seatingData, setSeatingData] = useState<SeatingData>({ tables: [], unassignedGuests: [] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingTable, setEditingTable] = useState<Table | null>(null)
  const [newTableForm, setNewTableForm] = useState({
    name: '',
    capacity: 8,
    shape: 'round' as 'round' | 'rectangular' | 'square'
  })

  // Ensure seatingData always has valid arrays
  const safeSeatingData = {
    tables: seatingData?.tables || [],
    unassignedGuests: seatingData?.unassignedGuests || []
  }

  // Load seating data and guests
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load existing seating arrangement
        const seatingResponse = await fetch('/api/seating', {
          credentials: 'include'
        })
        
        // Load guests
        const guestsResponse = await fetch('/api/guests', {
          credentials: 'include'
        })

        if (guestsResponse.ok) {
          const guestsData = await guestsResponse.json()
          const allGuests = guestsData.success && guestsData.guests ? guestsData.guests : []

          if (seatingResponse.ok) {
            const seatingResult = await seatingResponse.json()
            if (seatingResult.success && seatingResult.data) {
              // Use existing arrangement
              setSeatingData(seatingResult.data)
            } else {
              // Create default arrangement with unassigned guests
              setSeatingData({
                tables: [],
                unassignedGuests: allGuests
              })
            }
          } else {
            // Create default arrangement with unassigned guests
            setSeatingData({
              tables: [],
              unassignedGuests: allGuests
            })
          }
        }
      } catch (error) {
        console.error('Failed to load seating data:', error)
        toast.error('Failed to load seating data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Save seating arrangement
  const saveArrangement = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/seating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(seatingData)
      })

      if (response.ok) {
        toast.success('Seating arrangement saved successfully')
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      console.error('Failed to save seating arrangement:', error)
      toast.error('Failed to save seating arrangement')
    } finally {
      setSaving(false)
    }
  }

  // Create new table
  const createTable = () => {
    if (!newTableForm.name.trim()) {
      toast.error('Please enter a table name')
      return
    }

    const newTable: Table = {
      id: `table-${Date.now()}`,
      name: newTableForm.name,
      number: seatingData.tables.length + 1,
      capacity: newTableForm.capacity,
      shape: newTableForm.shape,
      guests: []
    }

    setSeatingData(prev => ({
      ...prev,
      tables: [...prev.tables, newTable]
    }))

    setNewTableForm({ name: '', capacity: 8, shape: 'round' })
    toast.success('Table created successfully')
  }

  // Delete table
  const deleteTable = (tableId: string) => {
    setSeatingData(prev => {
      const tableToDelete = prev.tables.find(t => t.id === tableId)
      if (!tableToDelete) return prev

      return {
        tables: prev.tables.filter(t => t.id !== tableId),
        unassignedGuests: [...prev.unassignedGuests, ...tableToDelete.guests]
      }
    })
    toast.success('Table deleted')
  }

  // Assign guest to table
  const assignGuestToTable = (guestId: string, tableId: string) => {
    setSeatingData(prev => {
      const guest = prev.unassignedGuests.find(g => g.id === guestId)
      if (!guest) return prev

      const updatedTables = prev.tables.map(table => {
        if (table.id === tableId && table.guests.length < table.capacity) {
          return { ...table, guests: [...table.guests, guest] }
        }
        return table
      })

      return {
        tables: updatedTables,
        unassignedGuests: prev.unassignedGuests.filter(g => g.id !== guestId)
      }
    })
  }

  // Remove guest from table
  const removeGuestFromTable = (guestId: string, tableId: string) => {
    setSeatingData(prev => {
      let removedGuest: Guest | null = null
      
      const updatedTables = prev.tables.map(table => {
        if (table.id === tableId) {
          const guest = table.guests.find(g => g.id === guestId)
          if (guest) {
            removedGuest = guest
            return { ...table, guests: table.guests.filter(g => g.id !== guestId) }
          }
        }
        return table
      })

      return {
        tables: updatedTables,
        unassignedGuests: removedGuest ? [...prev.unassignedGuests, removedGuest] : prev.unassignedGuests
      }
    })
  }

  if (loading) {
    return (
      <div className="px-8 py-12">
        <div className="animate-pulse">
          <div className="h-16 bg-gray-200/50 rounded-sm mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="h-64 bg-gray-200/50 rounded-sm"></div>
            <div className="h-64 bg-gray-200/50 rounded-sm"></div>
            <div className="h-64 bg-gray-200/50 rounded-sm"></div>
          </div>
        </div>
      </div>
    )
  }

  const totalGuests = safeSeatingData.tables.reduce((acc, table) => acc + table.guests.length, 0) + safeSeatingData.unassignedGuests.length
  const assignedGuests = seatingData.tables.reduce((acc, table) => acc + table.guests.length, 0)

  return (
    <div className="px-8 py-12">
      {/* Header */}
      <div className="mb-12">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-5xl font-light tracking-wide text-gray-900 mb-2 uppercase">Seating Chart</h1>
            <p className="text-lg font-light text-gray-600">Arrange your guests for the perfect reception</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={saveArrangement} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Arrangement'}
            </Button>
          </div>
        </div>
        
        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Guests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-light">{totalGuests}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide">Assigned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-light text-[#7a9b7f]">{assignedGuests}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide">Tables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-light">{seatingData.tables.length}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tables Section */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-light text-gray-900 uppercase tracking-wide">Tables</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Table
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Table</DialogTitle>
                  <DialogDescription>Add a new table to your seating arrangement</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="table-name">Table Name</Label>
                    <Input
                      id="table-name"
                      placeholder="e.g., Head Table, Table 1"
                      value={newTableForm.name}
                      onChange={(e) => setNewTableForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="table-capacity">Capacity</Label>
                    <Input
                      id="table-capacity"
                      type="number"
                      min="1"
                      max="20"
                      value={newTableForm.capacity}
                      onChange={(e) => setNewTableForm(prev => ({ ...prev, capacity: parseInt(e.target.value) || 8 }))}
                    />
                  </div>
                  <div>
                    <Label>Shape</Label>
                    <div className="flex gap-2 mt-2">
                      {(['round', 'rectangular', 'square'] as const).map((shape) => (
                        <Button
                          key={shape}
                          variant={newTableForm.shape === shape ? 'secondary' : 'outline'}
                          size="sm"
                          onClick={() => setNewTableForm(prev => ({ ...prev, shape }))}
                        >
                          {shape.charAt(0).toUpperCase() + shape.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Button onClick={createTable} className="w-full">
                    Create Table
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {seatingData.tables.map((table) => (
              <Card key={table.id} className="relative">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-light">{table.name}</CardTitle>
                      <CardDescription>
                        {table.guests.length}/{table.capacity} seats • {table.shape}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTable(table.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {table.guests.map((guest) => (
                      <div key={guest.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-sm">
                        <div>
                          <span className="font-light">{guest.firstName} {guest.lastName}</span>
                          {guest.side && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {guest.side}
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeGuestFromTable(guest.id, table.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {table.guests.length === 0 && (
                      <p className="text-sm text-gray-500 italic text-center py-4">No guests assigned</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {seatingData.tables.length === 0 && (
              <div className="col-span-2 text-center py-12 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-light mb-2">No tables created yet</p>
                <p className="text-sm">Create your first table to start arranging guests</p>
              </div>
            )}
          </div>
        </div>

        {/* Unassigned Guests Section */}
        <div>
          <h2 className="text-xl font-light text-gray-900 uppercase tracking-wide mb-6">
            Unassigned Guests ({seatingData.unassignedGuests.length})
          </h2>
          
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {seatingData.unassignedGuests.map((guest) => (
                  <div key={guest.id} className="p-3 border rounded-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-light">{guest.firstName} {guest.lastName}</span>
                        {guest.side && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {guest.side}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {seatingData.tables.length > 0 && (
                      <div>
                        <Label className="text-xs text-gray-500">Assign to table:</Label>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {seatingData.tables
                            .filter(table => table.guests.length < table.capacity)
                            .map((table) => (
                              <Button
                                key={table.id}
                                variant="outline"
                                size="sm"
                                onClick={() => assignGuestToTable(guest.id, table.id)}
                                className="text-xs"
                              >
                                {table.name} ({table.guests.length}/{table.capacity})
                              </Button>
                            ))
                          }
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {seatingData.unassignedGuests.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <UserPlus className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">All guests have been assigned</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}