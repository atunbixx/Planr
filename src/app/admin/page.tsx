'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import AdminToolbar from '@/components/admin/AdminToolbar'
import { useAuth } from '@/hooks/useAuth'
import AuthClient from '@/lib/auth/client'

export default function AdminOverviewPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<{ users: number; vendors: number; directoryVendors: number; regions: Array<{ region: string|null; _count: { _all: number } }> } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string| null>(null)

  useEffect(() => {
    async function load() {
      try {
        const token = AuthClient.getToken()
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
        const res = await fetch('/api/admin/overview', { headers })
        if (!res.ok) {
          const j = await res.json().catch(()=>({}))
          throw new Error(j?.error?.message || 'Unauthorized')
        }
        const j = await res.json()
        setData(j?.data)
      } catch (e: unknown) {
        if (e instanceof Error) {
          setError(e.message)
        } else {
          setError('Failed to load')
        }
      } finally {
        setLoading(false)
      }
    }
    if (!isLoading && user) load()
  }, [user, isLoading])

  if (isLoading || loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold mb-2">Admin</h1>
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <h1 className="text-2xl font-bold">Super Admin</h1>
        <Badge>Preview</Badge>
        <div className="flex-1" />
        <Button onClick={()=>router.push('/dashboard')}>Back to Dashboard</Button>
      </div>
      <AdminToolbar />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
            <CardHeader>
                <CardTitle>Users</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold">{data?.users ?? 0}</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Private Vendors</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold">{data?.vendors ?? 0}</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Directory Vendors</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold">{data?.directoryVendors ?? 0}</p>
            </CardContent>
        </Card>
        <Card className="col-span-1 sm:col-span-2 lg:col-span-3">
            <CardHeader>
                <CardTitle>Regions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
                {(data?.regions || []).map((r, i) => (
                    <Badge key={i} variant="secondary">{r.region || 'N/A'} • {r._count?._all ?? 0}</Badge>
                ))}
            </CardContent>
        </Card>
      </div>
    </div>
  )
}