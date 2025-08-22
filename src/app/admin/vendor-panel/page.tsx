'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import AdminToolbar from '@/components/admin/AdminToolbar'
import AuthClient from '@/lib/auth/client'

type Data = { newVendors7: number; newVendors30: number; flagged: number; suspended: number; inquiries7: number; inquiries30: number }

export default function AdminVendorPanelPage() {
  const router = useRouter()
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const token = AuthClient.getToken()
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
        const res = await fetch('/api/admin/vendor-panel/overview', { headers })
        if (!res.ok) throw new Error('Unauthorized')
        const j = await res.json()
        setData(j?.data)
      } catch (e: unknown) {
        if (e instanceof Error) {
          setError(e.message)
        } else {
          setError('Failed to load')
        }
      } finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) return <div className="p-4 flex justify-center"><p>Loading...</p></div>
  if (error) return <div className="p-4"><p className="text-red-500">{error}</p></div>

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-2">
        <h1 className="text-2xl font-bold">Vendor Panel</h1>
        <Badge>Beta</Badge>
        <div className="flex-1" />
        <Button onClick={()=>router.push('/admin')}>Overview</Button>
      </div>
      <AdminToolbar />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
            <CardHeader>
                <CardTitle>New Vendors (7d)</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold">{data?.newVendors7 ?? 0}</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>New Vendors (30d)</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold">{data?.newVendors30 ?? 0}</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Flagged Vendors</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold">{data?.flagged ?? 0}</p>
                <Button size="sm" className="mt-2" onClick={()=>router.push('/admin/directory/vendors')}>Review</Button>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Suspended Vendors</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold">{data?.suspended ?? 0}</p>
                <Button size="sm" className="mt-2" onClick={()=>router.push('/admin/directory/vendors?isSuspended=true')}>Manage</Button>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Inquiries (7d)</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold">{data?.inquiries7 ?? 0}</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Inquiries (30d)</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold">{data?.inquiries30 ?? 0}</p>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}