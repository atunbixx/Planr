'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import AdminToolbar from '@/components/admin/AdminToolbar'
import { useAuth } from '@/hooks/useAuth'
import AuthClient from '@/lib/auth/client'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form-field'

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
  const [warnTarget, setWarnTarget] = useState<User | null>(null)
  const [warnTitle, setWarnTitle] = useState('')
  const [warnBody, setWarnBody] = useState('')
  const [sending, setSending] = useState(false)

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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>{r.email}</TableCell>
                    <TableCell>{r.role}</TableCell>
                    <TableCell>{r.onboardingCompleted ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{new Date(r.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={()=>{ setWarnTarget(r); setWarnTitle(''); setWarnBody('') }}>Warn</Button>
                      <Button size="sm" variant="outline" onClick={()=>router.push(`/admin/users/${r.id}`)}>View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Dialog open={Boolean(warnTarget)} onOpenChange={(open)=>{ if (!open) { setWarnTarget(null) } }}>
            <DialogContent className="content-defaults form-elegant">
              <DialogHeader>
                <DialogTitle>Send Warning {warnTarget ? `to ${warnTarget.email}` : ''}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-3">
                <FormField label="Title" required>
                  <Input value={warnTitle} onChange={e=>setWarnTitle(e.target.value)} placeholder="Subject" />
                </FormField>
                <FormField label="Message" required>
                  <Textarea rows={4} value={warnBody} onChange={e=>setWarnBody(e.target.value)} placeholder="Policy warning or announcement…" />
                </FormField>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={()=>setWarnTarget(null)}>Cancel</Button>
                <Button onClick={async ()=>{
                  if (!warnTarget) return
                  try {
                    setSending(true)
                    const token = AuthClient.getToken()
                    const headers: any = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
                    const res = await fetch(`/api/admin/users/${warnTarget.id}/warn`, { method: 'POST', headers, body: JSON.stringify({ title: warnTitle, body: warnBody }) })
                    const j = await res.json().catch(()=>null)
                    if (!res.ok || !j?.success) throw new Error(j?.error?.message || 'Failed')
                    setWarnTarget(null)
                  } catch (e) {
                    console.error(e)
                  } finally { setSending(false) }
                }} disabled={!warnTitle.trim() || !warnBody.trim()} isLoading={sending}>Send</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
