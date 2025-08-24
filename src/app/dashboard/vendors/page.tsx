"use client"

import { useEffect, useState } from 'react'
import PremiumDashboardLayout from '@/components/layout/PremiumDashboardLayout'
import { VendorsClient, type Vendor } from '@/lib/api/vendors.client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const { vendors } = await VendorsClient.listVendors({ pageSize: 50 })
        setVendors(vendors)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load vendors')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <PremiumDashboardLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-dark dark:text-white">My Vendors</h1>

        {loading ? (
          <div className="text-sm text-dark-6">Loading vendors…</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.map(v => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.name}</TableCell>
                  <TableCell className="capitalize">{v.category}</TableCell>
                  <TableCell>
                    <Badge variant={v.status === 'booked' || v.status === 'contracted' || v.status === 'paid' ? 'success' : v.status === 'quoted' || v.status === 'inquiry' ? 'primary' : 'outline'}>
                      {v.status || '—'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[#475569]">{v.contact || v.email || v.phone || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </PremiumDashboardLayout>
  )
}
