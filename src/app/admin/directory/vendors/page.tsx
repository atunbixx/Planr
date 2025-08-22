'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import AdminToolbar from '@/components/admin/AdminToolbar'
import { useAuth } from '@/hooks/useAuth'
import AuthClient from '@/lib/auth/client'

type DirVendor = { id: string; name: string; category: string; region?: string|null; website?: string|null; email?: string|null; phone?: string|null; isSuspended?: boolean; fraudFlags?: string[]; updatedAt: string }

export default function AdminDirectoryVendorsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [rows, setRows] = useState<DirVendor[]>([])
  const [q, setQ] = useState('')
  const [flag, setFlag] = useState('')
  const [isSuspended, setIsSuspended] = useState('')
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
      if (flag) p.set('flag', flag)
      if (isSuspended) p.set('isSuspended', isSuspended)
      const res = await fetch(`/api/admin/directory/vendors?${p.toString()}`, { headers })
      if (!res.ok) throw new Error('Unauthorized')
      const j = await res.json()
      setRows(j?.data?.vendors || [])
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

  useEffect(() => { if (!isLoading && user) load() }, [user, isLoading, page, flag, isSuspended, load])

  async function updateRow(id: string, patch: Record<string, unknown>) {
    try {
      const token = AuthClient.getToken()
      const headers: any = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      const res = await fetch(`/api/admin/directory/vendors/${id}`, { method: 'PATCH', headers, body: JSON.stringify(patch) })
      if (!res.ok) throw new Error('Update failed')
      await load()
    } catch {
        // handle error
    }
  }

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-2">
        <h1 className="text-2xl font-bold">Directory Vendors</h1>
        <div className="flex-1" />
        <Button onClick={()=>router.push('/admin')}>Overview</Button>
      </div>
      <AdminToolbar />
      <div className="flex gap-1 mb-2 flex-wrap">
        <Input placeholder="Search name, website, email, phone" value={q} onChange={(e)=>setQ(e.target.value)} onKeyDown={(e)=>{ if (e.key==='Enter'){ setPage(1); load() } }} />
        <Select value={flag} onValueChange={setFlag}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Flag" /></SelectTrigger>
            <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="similar_name">similar_name</SelectItem>
            </SelectContent>
        </Select>
        <Select value={isSuspended} onValueChange={setIsSuspended}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Suspended" /></SelectTrigger>
            <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
            </SelectContent>
        </Select>
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
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Flags</TableHead>
                  <TableHead>Suspended</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(r => (
                  <TableRow key={r.id} onClick={()=>router.push(`/admin/directory/vendors/${r.id}`)} className="cursor-pointer">
                    <TableCell>{r.name}</TableCell>
                    <TableCell>{r.category}</TableCell>
                    <TableCell>{r.region || ''}</TableCell>
                    <TableCell>{r.website || ''}</TableCell>
                    <TableCell>{r.email || ''}</TableCell>
                    <TableCell>{r.phone || ''}</TableCell>
                    <TableCell>{(r.fraudFlags||[]).map((f,i)=>(<Badge key={i} variant="secondary" className="mr-1">{f}</Badge>))}</TableCell>
                    <TableCell><Badge variant={r.isSuspended ? "destructive" : "default"}>{r.isSuspended ? 'Yes' : 'No'}</Badge></TableCell>
                    <TableCell>{new Date(r.updatedAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={(e) => { e.stopPropagation(); updateRow(r.id, { isSuspended: !r.isSuspended })}}>{r.isSuspended ? 'Unsuspend' : 'Suspend'}</Button>
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