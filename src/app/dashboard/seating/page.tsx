"use client"

import { useEffect, useState } from 'react'
import PremiumDashboardLayout from '@/components/layout/PremiumDashboardLayout'
import { SeatingClient } from '@/lib/api/seating.client'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type TableItem = { id: string; name: string; capacity: number; seats?: Array<{ id: string; guestId?: string | null }> }

export default function SeatingPage() {
  const [tables, setTables] = useState<TableItem[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      const data = await SeatingClient.getSeatingChart()
      setTables((data as any).tables || [])
      setStats((data as any).stats)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load seating')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <PremiumDashboardLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-dark dark:text-white">Table Seating</h1>

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
              </TableRow>
            </TableHeader>
            <TableBody>
              {tables.map(t => {
                const assigned = (t.seats || []).filter(s => s.guestId).length
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>{t.capacity}</TableCell>
                    <TableCell>{assigned}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </PremiumDashboardLayout>
  )
}
