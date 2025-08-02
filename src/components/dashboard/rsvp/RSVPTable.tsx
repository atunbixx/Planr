'use client'

import { useState } from 'react'
import { Guest, RSVPStatus } from '@/types/database'
import { useToastContext } from '@/contexts/ToastContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/input'
import { RSVP_STATUSES } from '@/hooks/useGuests'
import { format } from 'date-fns'
import { 
  ChevronUp, 
  ChevronDown, 
  Mail, 
  Phone, 
  Calendar,
  User,
  Users,
  Utensils,
  MessageSquare,
  Edit,
  Save,
  X
} from 'lucide-react'

interface RSVPTableProps {
  guests: Guest[]
  selectedGuests: string[]
  setSelectedGuests: (ids: string[]) => void
  onUpdateRSVP: (guestId: string, status: RSVPStatus, notes?: string) => Promise<any>
  onRefresh: () => void
}

type SortField = 'name' | 'category' | 'rsvp_status' | 'rsvp_date' | 'meal_choice'
type SortDirection = 'asc' | 'desc'

export function RSVPTable({ 
  guests, 
  selectedGuests, 
  setSelectedGuests,
  onUpdateRSVP,
  onRefresh
}: RSVPTableProps) {
  const { addToast } = useToastContext()
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [editingGuest, setEditingGuest] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{
    rsvp_status: RSVPStatus
    rsvp_notes: string
  }>({ rsvp_status: 'pending', rsvp_notes: '' })

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Sort guests
  const sortedGuests = [...guests].sort((a, b) => {
    let aValue: any = ''
    let bValue: any = ''

    switch (sortField) {
      case 'name':
        aValue = `${a.last_name} ${a.first_name}`.toLowerCase()
        bValue = `${b.last_name} ${b.first_name}`.toLowerCase()
        break
      case 'category':
        aValue = a.category
        bValue = b.category
        break
      case 'rsvp_status':
        aValue = a.rsvp_status
        bValue = b.rsvp_status
        break
      case 'rsvp_date':
        aValue = a.rsvp_date || ''
        bValue = b.rsvp_date || ''
        break
      case 'meal_choice':
        aValue = a.meal_choice || ''
        bValue = b.meal_choice || ''
        break
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  // Handle checkbox
  const handleSelectAll = () => {
    if (selectedGuests.length === sortedGuests.length) {
      setSelectedGuests([])
    } else {
      setSelectedGuests(sortedGuests.map(g => g.id))
    }
  }

  const handleSelectGuest = (guestId: string) => {
    if (selectedGuests.includes(guestId)) {
      setSelectedGuests(selectedGuests.filter(id => id !== guestId))
    } else {
      setSelectedGuests([...selectedGuests, guestId])
    }
  }

  // Handle edit
  const handleEdit = (guest: Guest) => {
    setEditingGuest(guest.id)
    setEditForm({
      rsvp_status: guest.rsvp_status,
      rsvp_notes: guest.rsvp_notes || ''
    })
  }

  const handleSave = async (guestId: string) => {
    try {
      await onUpdateRSVP(guestId, editForm.rsvp_status, editForm.rsvp_notes)
      setEditingGuest(null)
      addToast({
        type: 'success',
        message: 'RSVP updated successfully'
      })
      onRefresh()
    } catch (error) {
      console.error('Error updating RSVP:', error)
      addToast({
        type: 'error',
        message: 'Failed to update RSVP'
      })
    }
  }

  const handleCancel = () => {
    setEditingGuest(null)
    setEditForm({ rsvp_status: 'pending', rsvp_notes: '' })
  }

  // Get status color
  const getStatusColor = (status: RSVPStatus) => {
    switch (status) {
      case 'attending':
        return 'bg-green-100 text-green-800'
      case 'not_attending':
        return 'bg-red-100 text-red-800'
      case 'maybe':
        return 'bg-amber-100 text-amber-800'
      case 'pending':
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ChevronUp className="h-4 w-4 text-gray-400" />
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-4 w-4" />
      : <ChevronDown className="h-4 w-4" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Guest Responses</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="pb-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedGuests.length === sortedGuests.length && sortedGuests.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="pb-3 text-left">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 font-semibold text-gray-900 hover:text-gray-700"
                  >
                    Guest Name
                    <SortIcon field="name" />
                  </button>
                </th>
                <th className="pb-3 text-left">
                  <button
                    onClick={() => handleSort('category')}
                    className="flex items-center gap-1 font-semibold text-gray-900 hover:text-gray-700"
                  >
                    Category
                    <SortIcon field="category" />
                  </button>
                </th>
                <th className="pb-3 text-left">
                  <button
                    onClick={() => handleSort('rsvp_status')}
                    className="flex items-center gap-1 font-semibold text-gray-900 hover:text-gray-700"
                  >
                    RSVP Status
                    <SortIcon field="rsvp_status" />
                  </button>
                </th>
                <th className="pb-3 text-left">
                  <button
                    onClick={() => handleSort('rsvp_date')}
                    className="flex items-center gap-1 font-semibold text-gray-900 hover:text-gray-700"
                  >
                    Response Date
                    <SortIcon field="rsvp_date" />
                  </button>
                </th>
                <th className="pb-3 text-left">
                  <button
                    onClick={() => handleSort('meal_choice')}
                    className="flex items-center gap-1 font-semibold text-gray-900 hover:text-gray-700"
                  >
                    Meal Choice
                    <SortIcon field="meal_choice" />
                  </button>
                </th>
                <th className="pb-3 text-left">Details</th>
                <th className="pb-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedGuests.map((guest) => {
                const isEditing = editingGuest === guest.id
                
                return (
                  <tr key={guest.id} className="border-b hover:bg-gray-50">
                    <td className="py-4">
                      <input
                        type="checkbox"
                        checked={selectedGuests.includes(guest.id)}
                        onChange={() => handleSelectGuest(guest.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {guest.first_name} {guest.last_name}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-3 mt-1">
                          {guest.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {guest.email}
                            </span>
                          )}
                          {guest.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {guest.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <Badge variant="outline">
                        {guest.category.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-4">
                      {isEditing ? (
                        <Select
                          value={editForm.rsvp_status}
                          onChange={(e) => setEditForm({ ...editForm, rsvp_status: e.target.value as RSVPStatus })}
                          className="w-32"
                        >
                          {RSVP_STATUSES.map(status => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <Badge className={getStatusColor(guest.rsvp_status)}>
                          {RSVP_STATUSES.find(s => s.value === guest.rsvp_status)?.label}
                        </Badge>
                      )}
                    </td>
                    <td className="py-4">
                      {guest.rsvp_date && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(guest.rsvp_date), 'MMM d, yyyy')}
                        </div>
                      )}
                    </td>
                    <td className="py-4">
                      {guest.meal_choice && (
                        <div className="flex items-center gap-1 text-sm">
                          <Utensils className="h-3 w-3 text-gray-500" />
                          {guest.meal_choice}
                        </div>
                      )}
                      {guest.dietary_restrictions && (
                        <div className="text-xs text-gray-500 mt-1">
                          {guest.dietary_restrictions}
                        </div>
                      )}
                    </td>
                    <td className="py-4">
                      <div className="space-y-1">
                        {guest.plus_one_allowed && (
                          <div className="flex items-center gap-1 text-sm">
                            <Users className="h-3 w-3 text-gray-500" />
                            {guest.plus_one_attending ? (
                              <span className="text-green-600">
                                +1 attending {guest.plus_one_name && `(${guest.plus_one_name})`}
                              </span>
                            ) : (
                              <span className="text-gray-500">+1 allowed</span>
                            )}
                          </div>
                        )}
                        {(guest.rsvp_notes || isEditing) && (
                          <div className="flex items-start gap-1 text-sm">
                            <MessageSquare className="h-3 w-3 text-gray-500 mt-0.5" />
                            {isEditing ? (
                              <Input
                                value={editForm.rsvp_notes}
                                onChange={(e) => setEditForm({ ...editForm, rsvp_notes: e.target.value })}
                                placeholder="Add notes..."
                                className="text-xs"
                              />
                            ) : (
                              <span className="text-gray-600">{guest.rsvp_notes}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSave(guest.id)}
                            className="h-8"
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancel}
                            className="h-8"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(guest)}
                          className="h-8"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          
          {sortedGuests.length === 0 && (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No guests match your filters</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}