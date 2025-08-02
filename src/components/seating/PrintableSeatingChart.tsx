'use client'

import { Table, Guest } from './SeatingTable'

interface PrintableSeatingChartProps {
  tables: Table[]
  guests: Guest[]
  assignments: Array<{
    id: string
    guest_id: string
    table_id: string
    seat_number?: number
  }>
  coupleName?: string
  weddingDate?: string
}

export function PrintableSeatingChart({ 
  tables, 
  guests, 
  assignments,
  coupleName,
  weddingDate
}: PrintableSeatingChartProps) {
  // Get guests assigned to a specific table
  const getTableGuests = (tableId: string): Guest[] => {
    const tableAssignments = assignments.filter(a => a.table_id === tableId)
    return tableAssignments.map(a => {
      const guest = guests.find(g => g.id === a.guest_id)
      return guest ? { ...guest, table_id: tableId } : null
    }).filter(Boolean) as Guest[]
  }

  return (
    <div className="bg-white p-8" style={{ width: '1200px' }}>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">
          Seating Chart
        </h1>
        {coupleName && (
          <p className="text-xl text-gray-700">{coupleName}</p>
        )}
        {weddingDate && (
          <p className="text-lg text-gray-600">
            {new Date(weddingDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        )}
      </div>

      {/* Visual Layout */}
      <div className="relative mb-8" style={{ height: '800px', border: '2px solid #e5e7eb' }}>
        {tables.map(table => {
          const tableGuests = getTableGuests(table.id)
          
          return (
            <div
              key={table.id}
              className="absolute bg-white border-2 border-gray-300 rounded-lg p-4"
              style={{
                left: `${table.x_position}px`,
                top: `${table.y_position}px`,
                width: `${table.width}px`,
                height: `${table.height}px`,
                transform: `rotate(${table.rotation || 0}deg)`
              }}
            >
              <h3 className="font-bold text-center mb-2">{table.name}</h3>
              <p className="text-xs text-center text-gray-500 mb-2">
                {tableGuests.length}/{table.capacity} seats
              </p>
              <div className="text-xs space-y-1">
                {tableGuests.map((guest, idx) => (
                  <div key={guest.id} className="truncate">
                    {idx + 1}. {guest.name}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Table List */}
      <div className="grid grid-cols-3 gap-6">
        {tables.map(table => {
          const tableGuests = getTableGuests(table.id)
          
          return (
            <div key={table.id} className="border border-gray-300 rounded-lg p-4">
              <h3 className="font-bold text-lg mb-2">{table.name}</h3>
              <p className="text-sm text-gray-600 mb-3">
                {table.table_type} table • {tableGuests.length}/{table.capacity} seats
              </p>
              <div className="space-y-1">
                {tableGuests.length > 0 ? (
                  tableGuests.map((guest, idx) => (
                    <div key={guest.id} className="text-sm flex items-center">
                      <span className="font-medium mr-2">{idx + 1}.</span>
                      <span>{guest.name}</span>
                      {guest.dietary_restrictions && (
                        <span className="ml-2 text-xs text-gray-500">
                          ({guest.dietary_restrictions})
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 italic">No guests assigned</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
        <p>Total Tables: {tables.length} • Total Guests: {assignments.length} • Total Capacity: {tables.reduce((sum, t) => sum + t.capacity, 0)}</p>
      </div>
    </div>
  )
}