'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import AdminToolbar from '@/components/admin/AdminToolbar'
import AuthClient from '@/lib/auth/client'

type Session = { id: string; userId: string; userEmail?: string|null; region?: string|null; country?: string|null; city?: string|null; ipHash?: string|null; uaHash?: string|null; createdAt: string; lastActiveAt: string; revokedAt?: string|null }

export default function AdminSessionsPage() {
  const router = useRouter()
  const [rows, setRows] = useState<Session[]>([])
  const [userId, setUserId] = useState('')
  const [activeOnly, setActiveOnly] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const token = AuthClient.getToken()
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
      const p = new URLSearchParams()
      p.set('page', String(page))
      p.set('pageSize', String(pageSize))
      if (userId.trim()) p.set('userId', userId.trim())
      if (activeOnly) p.set('activeOnly', 'true')
      const res = await fetch(`/api/admin/sessions?${p.toString()}`, { headers })
      if (!res.ok) throw new Error('Unauthorized')
      const j = await res.json()
      setRows(j?.data?.sessions || [])
      setTotal(j?.data?.total || 0)
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

  useEffect(() => { load() }, [page, activeOnly, load])

  async function revoke(id: string) {
    try {
      const token = AuthClient.getToken()
      const headers: any = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      const res = await fetch(`/api/admin/sessions/${id}`, { method: 'PATCH', headers, body: JSON.stringify({ revoke: true }) })
      if (!res.ok) throw new Error('Failed')
      await load()
    } catch {
        // handle error
    }
  }

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-2">
        <h1 className="text-2xl font-bold">Sessions</h1>
        <div className="flex-1" />
        <Button onClick={()=>router.push('/admin')}>Overview</Button>
      </div>
      <AdminToolbar />
      <div className="flex gap-1 mb-2 flex-wrap">
        <Input placeholder="Filter by userId" value={userId} onChange={(e)=>{ setUserId(e.target.value) }} />
        <Button variant={activeOnly ? 'default' : 'outline'} onClick={()=>{ setActiveOnly(!activeOnly); setPage(1); }}>{activeOnly ? 'Active Only' : 'All'}</Button>
        <Button variant="outline" onClick={()=>{ setPage(1); load() }}>Search</Button>
      </div>
      {loading ? (
        <div className="flex justify-center py-6"><p>Loading...</p></div>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Geo</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>{r.userId.slice(0,8)}…</TableCell>
                    <TableCell>{r.userEmail || ''}</TableCell>
                    <TableCell>{r.region || ''}</TableCell>
                    <TableCell>{[r.city, r.country].filter(Boolean).join(', ')}</TableCell>
                    <TableCell>{new Date(r.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{new Date(r.lastActiveAt).toLocaleString()}</TableCell>
                    <TableCell><Badge variant={r.revokedAt ? "destructive" : "default"}>{r.revokedAt ? 'Revoked' : 'Active'}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" disabled={Boolean(r.revokedAt)} onClick={()=>revoke(r.id)}>Revoke</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {total > pageSize && (
            <div className="flex justify-center py-2">
                <Button variant="outline" onClick={() => setPage(p => p - 1)} disabled={page === 1}>Previous</Button>
                <span className="mx-4">Page {page} of {Math.ceil(total/pageSize)}</span>
                <Button variant="outline" onClick={() => setPage(p => p + 1)} disabled={page === Math.ceil(total/pageSize)}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}