'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import AdminToolbar from '@/components/admin/AdminToolbar'
import AuthClient from '@/lib/auth/client'

type Log = { id: string; adminUserId: string; adminEmail?: string|null; action: string; targetType: string; targetId: string; details?: any; ip?: string; ua?: string; createdAt: string }

export default function AdminAuditLogsPage() {
  const router = useRouter()
  const [rows, setRows] = useState<Log[]>([])
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<Log | null>(null)

  async function load() {
    setLoading(true)
    try {
      const token = AuthClient.getToken()
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
      const p = new URLSearchParams()
      p.set('page', String(page))
      p.set('pageSize', String(pageSize))
      if (q.trim()) p.set('q', q.trim())
      const res = await fetch(`/api/admin/audit-logs?${p.toString()}`, { headers })
      if (!res.ok) throw new Error('Unauthorized')
      const j = await res.json()
      setRows(j?.data?.logs || [])
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

  useEffect(() => { load() }, [page, load])

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-2">
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <div className="flex-1" />
        <Button onClick={()=>router.push('/admin')}>Overview</Button>
      </div>
      <AdminToolbar />
      <div className="flex gap-1 mb-2">
        <Input placeholder="Search action/target" value={q} onChange={(e)=>setQ(e.target.value)} onKeyDown={(e)=>{ if (e.key==='Enter'){ setPage(1); load() } }} />
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
                  <TableHead>Time</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>User-Agent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(r => (
                  <TableRow key={r.id} onClick={()=>{ setActive(r); setOpen(true) }} className="cursor-pointer">
                    <TableCell>{new Date(r.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{r.action}</TableCell>
                    <TableCell>{r.targetType}:{r.targetId}</TableCell>
                    <TableCell>{r.adminEmail || r.adminUserId}</TableCell>
                    <TableCell>{r.ip || ''}</TableCell>
                    <TableCell className="max-w-xs truncate">{r.ua || ''}</TableCell>
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
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Details</DialogTitle>
          </DialogHeader>
          {active && (
            <pre className="whitespace-pre-wrap font-mono text-xs">
              {JSON.stringify({
                id: active.id,
                createdAt: active.createdAt,
                action: active.action,
                target: `${active.targetType}:${active.targetId}`,
                admin: active.adminEmail || active.adminUserId,
                ip: active.ip,
                ua: active.ua,
                details: active.details,
              }, null, 2)}
            </pre>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}