'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Users, Settings, RotateCcw, Trash2, Edit, UserPlus, UserMinus, Circle, Square, Minus } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useAuth } from '@/hooks/useAuth'
import { SeatingClient } from '@/lib/api/seating.client'
import { GuestsClient } from '@/lib/api/guests.client'
import { TableResponse, SeatingChartResponse, CreateTableInput, UpdateTableInput } from '@/features/seating/dto/seating.dto'

type TableFormData = {
  name: string
  shape: 'round' | 'rectangle' | 'square' | 'oval'
  capacity: number
  color: string
  notes: string
}

const initialFormData: TableFormData = {
  name: '',
  shape: 'round',
  capacity: 8,
  color: '#3B82F6',
  notes: ''
}

export default function SeatingPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  
  // State management
  const [seatingChart, setSeatingChart] = useState<SeatingChartResponse | null>(null)
  const [guests, setGuests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Dialog state
  const [openTableDialog, setOpenTableDialog] = useState(false)
  const [openGuestDialog, setOpenGuestDialog] = useState(false)
  const [editingTable, setEditingTable] = useState<TableResponse | null>(null)
  const [selectedSeat, setSelectedSeat] = useState<{ tableId: string; seatId: string; seatNumber: number } | null>(null)
  const [formData, setFormData] = useState<TableFormData>(initialFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Canvas state
  const [canvasSize] = useState({ width: 800, height: 600 })
  const [draggedTable, setDraggedTable] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // Auth check
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin')
    }
  }, [user, isLoading, router])

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true)
      const [chartData, guestsData] = await Promise.all([
        SeatingClient.getSeatingChart(),
        GuestsClient.listGuests()
      ])
      setSeatingChart(chartData)
      setGuests(guestsData.guests)
    } catch (error) {
      console.error('Failed to fetch seating data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isLoading && user) {
      fetchData()
    }
  }, [isLoading, user])

  // Available guests (not assigned to any seat)
  const availableGuests = useMemo(() => {
    if (!seatingChart || !guests) return []
    
    const assignedGuestIds = new Set()
    seatingChart.tables.forEach(table => {
      table.seats.forEach(seat => {
        if (seat.guestId) assignedGuestIds.add(seat.guestId)
      })
    })
    
    return guests.filter(guest => !assignedGuestIds.has(guest.id))
  }, [seatingChart, guests])

  // Table operations
  const openAddTable = () => {
    setEditingTable(null)
    setFormData(initialFormData)
    setErrors({})
    setOpenTableDialog(true)
  }

  const openEditTable = (table: TableResponse) => {
    setEditingTable(table)
    setFormData({
      name: table.name,
      shape: table.shape,
      capacity: table.capacity,
      color: table.color || '#3B82F6',
      notes: table.notes || ''
    })
    setErrors({})
    setOpenTableDialog(true)
  }

  const handleSaveTable = async () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = 'Table name is required'
    if (formData.capacity < 1 || formData.capacity > 20) newErrors.capacity = 'Capacity must be between 1 and 20'
    setErrors(newErrors)
    if (Object.keys(newErrors).length) return

    const isEdit = Boolean(editingTable)
    const dimensions = SeatingClient.getDefaultDimensions(formData.shape)
    
    const payload: CreateTableInput | UpdateTableInput = {
      name: formData.name,
      shape: formData.shape,
      capacity: formData.capacity,
      color: formData.color,
      notes: formData.notes,
      positionX: isEdit ? editingTable!.positionX : canvasSize.width / 2,
      positionY: isEdit ? editingTable!.positionY : canvasSize.height / 2,
      rotation: isEdit ? editingTable!.rotation : 0,
      width: dimensions.width,
      height: dimensions.height,
      diameter: dimensions.diameter
    }

    setSaving(true)
    
    try {
      if (isEdit) {
        await SeatingClient.updateTable(editingTable!.id, payload as UpdateTableInput)
      } else {
        await SeatingClient.createTable(payload as CreateTableInput)
      }
      
      setOpenTableDialog(false)
      await fetchData()
    } catch (error: any) {
      setErrors({ submit: error?.message || `Failed to ${isEdit ? 'update' : 'create'} table` })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTable = async (table: TableResponse) => {
    if (!confirm(`Delete "${table.name}"? This will remove all seat assignments.`)) return
    
    try {
      await SeatingClient.deleteTable(table.id)
      await fetchData()
    } catch (error: any) {
      alert(error?.message || 'Failed to delete table')
    }
  }

  // Seat assignment
  const openGuestAssignment = (tableId: string, seatId: string, seatNumber: number) => {
    setSelectedSeat({ tableId, seatId, seatNumber })
    setOpenGuestDialog(true)
  }

  const handleAssignGuest = async (guestId: string | null) => {
    if (!selectedSeat) return
    
    try {
      await SeatingClient.assignGuestToSeat(selectedSeat.seatId, { guestId })
      setOpenGuestDialog(false)
      setSelectedSeat(null)
      await fetchData()
    } catch (error: any) {
      alert(error?.message || 'Failed to assign guest')
    }
  }

  // Drag and drop
  const handleTableMouseDown = (tableId: string, event: React.MouseEvent) => {
    const table = seatingChart?.tables.find(t => t.id === tableId)
    if (!table) return
    
    setDraggedTable(tableId)
    setDragOffset({
      x: event.clientX - table.positionX,
      y: event.clientY - table.positionY
    })
  }

  const handleCanvasMouseMove = useCallback((event: React.MouseEvent) => {
    if (!draggedTable) return
    
    const newX = event.clientX - dragOffset.x
    const newY = event.clientY - dragOffset.y
    
    // Update table position optimistically
    setSeatingChart(prev => {
      if (!prev) return prev
      return {
        ...prev,
        tables: prev.tables.map(table => 
          table.id === draggedTable 
            ? { ...table, positionX: newX, positionY: newY }
            : table
        )
      }
    })
  }, [draggedTable, dragOffset])

  const handleCanvasMouseUp = useCallback(async () => {
    if (!draggedTable || !seatingChart) return
    
    const table = seatingChart.tables.find(t => t.id === draggedTable)
    if (!table) return
    
    try {
      await SeatingClient.updateTable(draggedTable, {
        positionX: table.positionX,
        positionY: table.positionY
      })
    } catch (error) {
      console.error('Failed to update table position:', error)
      // Revert position on error
      await fetchData()
    }
    
    setDraggedTable(null)
  }, [draggedTable, seatingChart])

  // Render table shape
  const renderTable = (table: TableResponse) => {
    const { shape, width, height, diameter, color, positionX, positionY, rotation } = table
    const tableColor = color || '#3B82F6'
    
    const transform = `translate(${positionX}, ${positionY}) rotate(${rotation})`
    
    let shapeElement
    switch (shape) {
      case 'round':
        shapeElement = (
          <circle
            cx={0}
            cy={0}
            r={(diameter || 60) / 2}
            fill={tableColor}
            stroke="#1F2937"
            strokeWidth={2}
            opacity={0.8}
          />
        )
        break
      case 'rectangle':
        shapeElement = (
          <rect
            x={-(width || 96) / 2}
            y={-(height || 36) / 2}
            width={width || 96}
            height={height || 36}
            fill={tableColor}
            stroke="#1F2937"
            strokeWidth={2}
            opacity={0.8}
            rx={4}
          />
        )
        break
      case 'square':
        shapeElement = (
          <rect
            x={-(width || 48) / 2}
            y={-(height || 48) / 2}
            width={width || 48}
            height={height || 48}
            fill={tableColor}
            stroke="#1F2937"
            strokeWidth={2}
            opacity={0.8}
            rx={4}
          />
        )
        break
      case 'oval':
        shapeElement = (
          <ellipse
            cx={0}
            cy={0}
            rx={(width || 84) / 2}
            ry={(height || 48) / 2}
            fill={tableColor}
            stroke="#1F2937"
            strokeWidth={2}
            opacity={0.8}
          />
        )
        break
    }
    
    // Calculate seat positions
    const seatPositions = SeatingClient.calculateSeatPositions(shape, table.capacity, {
      width: width || undefined,
      height: height || undefined,
      diameter: diameter || undefined
    })
    
    return (
      <g key={table.id} transform={transform}>
        {/* Table shape */}
        <g
          onMouseDown={(e) => handleTableMouseDown(table.id, e)}
          style={{ cursor: 'move' }}
        >
          {shapeElement}
          {/* Table label */}
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize={12}
            fontWeight="bold"
            pointerEvents="none"
          >
            {table.name}
          </text>
        </g>
        
        {/* Seats */}
        {table.seats.map((seat, index) => {
          const position = seatPositions[index] || { x: 0, y: 0 }
          const isOccupied = Boolean(seat.guestId)
          
          return (
            <g key={seat.id}>
              <circle
                cx={position.x}
                cy={position.y}
                r={8}
                fill={isOccupied ? '#10B981' : '#E5E7EB'}
                stroke={seat.isHost ? '#F59E0B' : '#6B7280'}
                strokeWidth={seat.isHost ? 3 : 1}
                style={{ cursor: 'pointer' }}
                onClick={() => openGuestAssignment(table.id, seat.id, seat.seatNumber)}
              />
              <text
                x={position.x}
                y={position.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={isOccupied ? 'white' : '#374151'}
                fontSize={8}
                fontWeight="bold"
                pointerEvents="none"
              >
                {seat.seatNumber}
              </text>
            </g>
          )
        })}
      </g>
    )
  }

  if (isLoading || !user) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Seating Chart</h1>
          <p className="text-muted-foreground">Design your wedding seating arrangement</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => fetchData()}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={openAddTable}>
            <Plus className="h-4 w-4 mr-2" />
            Add Table
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {seatingChart && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tables</CardTitle>
              <Circle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{seatingChart.stats.totalTables}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Seats</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{seatingChart.stats.totalSeats}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assigned Seats</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{seatingChart.stats.assignedSeats}</div>
              {seatingChart.stats.totalSeats > 0 && (
                <Progress 
                  value={(seatingChart.stats.assignedSeats / seatingChart.stats.totalSeats) * 100} 
                  className="mt-2" 
                />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unseated Guests</CardTitle>
              <UserMinus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{seatingChart.stats.unseatedGuests}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Seating Chart Canvas */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Floor Plan</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-96">
                  <div className="text-muted-foreground">Loading seating chart...</div>
                </div>
              ) : !seatingChart || seatingChart.tables.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-96 text-center">
                  <Circle className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No tables yet</h3>
                  <p className="text-gray-600 mb-6 max-w-md">
                    Create your first table to start designing your wedding seating arrangement.
                  </p>
                  <Button onClick={openAddTable}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Table
                  </Button>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <svg
                    width={canvasSize.width}
                    height={canvasSize.height}
                    className="bg-gray-50"
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                  >
                    {/* Grid pattern */}
                    <defs>
                      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E5E7EB" strokeWidth="1" opacity="0.5" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                    
                    {/* Tables */}
                    {seatingChart.tables.map(renderTable)}
                  </svg>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Available Guests */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Available Guests ({availableGuests.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {availableGuests.length === 0 ? (
                <p className="text-sm text-muted-foreground">All guests are seated</p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {availableGuests.map(guest => (
                     <div key={guest.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                       <span>{guest.name || `${guest.firstName || ''} ${guest.lastName || ''}`.trim()}</span>
                       <Badge variant="outline" className="text-xs">
                         {guest.side || 'N/A'}
                       </Badge>
                     </div>
                   ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Table List */}
          {seatingChart && seatingChart.tables.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tables ({seatingChart.tables.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {seatingChart.tables.map(table => (
                    <div key={table.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded" 
                          style={{ backgroundColor: table.color || '#3B82F6' }}
                        />
                        <div>
                          <div className="font-medium text-sm">{table.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {table.seats.filter(s => s.guestId).length}/{table.capacity} seated
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEditTable(table)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteTable(table)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <span>Empty Seat</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Occupied Seat</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-300 border-2 border-yellow-500"></div>
                <span>Host Seat</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Table Dialog */}
      <Dialog open={openTableDialog} onOpenChange={setOpenTableDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTable ? 'Edit Table' : 'Create Table'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium">Table Name *</label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={errors.name ? 'border-red-500' : ''}
                placeholder="e.g., Head Table, Table 1"
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="shape" className="text-sm font-medium">Shape</label>
                <Select value={formData.shape} onValueChange={(value) => setFormData({ ...formData, shape: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="round">Round</SelectItem>
                    <SelectItem value="rectangle">Rectangle</SelectItem>
                    <SelectItem value="square">Square</SelectItem>
                    <SelectItem value="oval">Oval</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="capacity" className="text-sm font-medium">Capacity</label>
                <Input
                  id="capacity"
                  type="number"
                  min={1}
                  max={20}
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                  className={errors.capacity ? 'border-red-500' : ''}
                />
                {errors.capacity && <p className="text-sm text-red-500">{errors.capacity}</p>}
              </div>
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="color" className="text-sm font-medium">Color</label>
              <div className="flex gap-2">
                {SeatingClient.getTableColors().map(color => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "w-8 h-8 rounded border-2",
                      formData.color === color ? "border-gray-900" : "border-gray-300"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="notes" className="text-sm font-medium">Notes</label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Special notes about this table..."
              />
            </div>
            
            {errors.submit && (
              <Alert>
                <AlertDescription>{errors.submit}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenTableDialog(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveTable} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Guest Assignment Dialog */}
      <Dialog open={openGuestDialog} onOpenChange={setOpenGuestDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Assign Guest to Seat {selectedSeat?.seatNumber}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleAssignGuest(null)}
              >
                <UserMinus className="h-4 w-4 mr-2" />
                Remove Guest
              </Button>
              
              {availableGuests.map(guest => (
                <Button
                  key={guest.id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleAssignGuest(guest.id)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                   {guest.name || `${guest.firstName || ''} ${guest.lastName || ''}`.trim()}
                   {guest.side && (
                    <Badge variant="outline" className="ml-auto">
                      {guest.side}
                    </Badge>
                  )}
                </Button>
              ))}
              
              {availableGuests.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No available guests to assign
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenGuestDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}