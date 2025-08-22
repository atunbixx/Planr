'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import AdminToolbar from '@/components/admin/AdminToolbar'
import { useAuth } from '@/hooks/useAuth'
import AuthClient from '@/lib/auth/client'

type User = { id: string; email: string; role: string; onboardingCompleted: boolean; createdAt: string }

export default function AdminUsersPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [rows, setRows] = useState<User[]>([])
  const [q, setQ] = useState('')
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
      if (q.trim()) p.set('q', q.trim())
      const res = await fetch(`/api/admin/users?${p.toString()}`, { headers })
      if (!res.ok) throw new Error('Unauthorized')
      const j = await res.json()
      setRows(j?.data?.users || [])
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

  useEffect(() => { if (!isLoading && user) load() }, [user, isLoading, page, load])

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-2">
        <h1 className="text-2xl font-bold">Users</h1>
        <div className="flex-1" />
        <Button onClick={()=>router.push('/admin')}>Overview</Button>
      </div>
      <AdminToolbar />
      <div className="flex gap-1 mb-2">
        <Input placeholder="Search email" value={q} onChange={(e)=>setQ(e.target.value)} onKeyDown={(e)=>{ if (e.key==='Enter'){ setPage(1); load() } }} />
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
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Onboarded</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>{r.email}</TableCell>
                    <TableCell>{r.role}</TableCell>
                    <TableCell>{r.onboardingCompleted ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{new Date(r.createdAt).toLocaleString()}</TableCell>
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