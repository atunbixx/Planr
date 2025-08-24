"use client"

import { useEffect, useState } from 'react'
import PremiumDashboardLayout from '@/components/layout/PremiumDashboardLayout'
import { GuestsClient, type LegacyGuest } from '@/lib/api/guests.client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default function GuestsPage() {
  const [guests, setGuests] = useState<LegacyGuest[]>([])
  const [stats, setStats] = useState<{ total: number; totalAttending: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const [{ guests }, gstats] = await Promise.all([
          GuestsClient.listGuests({ limit: 100 }),
          GuestsClient.getStats(),
        ])
        setGuests(guests)
        setStats({ total: gstats.total, totalAttending: gstats.totalAttending })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load guests')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <PremiumDashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dark dark:text-white">Guests</h1>
            <p className="text-dark-6 dark:text-dark-4 mt-1">Manage your guest list and RSVPs</p>
          </div>
          {stats && (
            <div className="flex gap-3">
              <Badge variant="outline">Total: {stats.total}</Badge>
              <Badge variant="success">Attending: {stats.totalAttending}</Badge>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-sm text-dark-6">Loading guests…</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Side</TableHead>
                <TableHead>RSVP</TableHead>
                <TableHead>Invited</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guests.map(g => (
                <TableRow key={g.id}>
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
