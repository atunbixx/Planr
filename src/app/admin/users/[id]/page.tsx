"use client"

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import AdminToolbar from '@/components/admin/AdminToolbar'
import AuthClient from '@/lib/auth/client'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form-field'

export default function AdminUserDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [data, setData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity?: 'success'|'error' }>({ open: false, message: '', severity: 'success' })
  const [role, setRole] = useState('')
  const [warnOpen, setWarnOpen] = useState(false)
  const [warnTitle, setWarnTitle] = useState('')
  const [warnBody, setWarnBody] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const token = AuthClient.getToken()
        const headers: any = token ? { Authorization: `Bearer ${token}` } : {}
        const res = await fetch(`/api/admin/users/${params.id}`, { headers })
        if (!res.ok) throw new Error('Unauthorized')
        const j = await res.json()
        setData(j?.data)
      } catch (e: any) {
        setError(e?.message || 'Failed to load')
      } finally { setLoading(false) }
    }
    if (params?.id) load()
  }, [params?.id])

  useEffect(() => {
    if (snack.open) {
      const t = setTimeout(() => setSnack(s => ({ ...s, open: false })), 2500)
      return () => clearTimeout(t)
    }
  }, [snack.open])

  if (loading) {
    return <div className="p-4 flex items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" /></div>
  }
  if (error || !data) {
    return <div className="p-4 text-destructive">{error || 'Not found'}</div>
  }

  const u = data.user
  const currentRole = (u?.role || '')
  const s = data.stats || {}

  return (
    <div className="p-3 md:p-6">
      <div className="flex items-center gap-2 mb-2">
        <h1 className="text-2xl font-serif">User Detail</h1>
        <Badge variant="outline">{u.role}</Badge>
        {u.onboardingCompleted ? (
          <Badge className="bg-green-100 text-green-700 border-green-200">Onboarded</Badge>
        ) : (
          <Badge variant="outline">Not Onboarded</Badge>
        )}
        <div className="flex-1" />
        <Button onClick={()=>router.push('/admin/users')}>Back to Users</Button>
      </div>
      <AdminToolbar />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Card>
            <CardContent className="space-y-2">
              <span className="text-xs uppercase text-muted-foreground">Email</span>
              <div className="text-lg font-medium">{u.email}</div>
              <span className="text-xs uppercase text-muted-foreground block mt-2">Created</span>
              <div>{new Date(u.createdAt).toLocaleString()}</div>
              <span className="text-xs uppercase text-muted-foreground block mt-2">Updated</span>
              <div>{new Date(u.updatedAt).toLocaleString()}</div>
              <span className="text-xs uppercase text-muted-foreground block mt-2">Role</span>
              <div className="flex items-center gap-2">
                <Select value={role || currentRole} onValueChange={(v)=>setRole(v)}>
                  <SelectTrigger className="min-w-40">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {['couple','planner','vendor'].map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" disabled={!role || role === currentRole} onClick={async ()=>{
                  try {
                    const token = AuthClient.getToken()
                    const headers: any = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
                    const res = await fetch(`/api/admin/users/${u.id}`, { method: 'PATCH', headers, body: JSON.stringify({ role }) })
                    if (!res.ok) throw new Error('Update failed')
                    setSnack({ open: true, message: 'Role updated', severity: 'success' })
                    // Reload details
                    const j = await fetch(`/api/admin/users/${u.id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }).then(r=>r.json())
                    setData(j?.data)
                    setRole('')
                  } catch {
                    setSnack({ open: true, message: 'Update failed', severity: 'error' })
                  }
                }}>Save</Button>
              </div>
              <span className="text-xs uppercase text-muted-foreground block mt-2">Status</span>
              <div className="flex items-center gap-2">
                <Badge className={(u as any).isActive === false ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'bg-green-100 text-green-700 border-green-200'}>
                  {(u as any).isActive === false ? 'Deactivated' : 'Active'}
                </Badge>
                <Button size="sm" variant="outline" onClick={async ()=>{
                  try {
                    const token = AuthClient.getToken()
                    const headers: any = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
                    const res = await fetch(`/api/admin/users/${u.id}`, { method: 'PATCH', headers, body: JSON.stringify({ isActive: !((u as any).isActive !== false) }) })
                    if (!res.ok) throw new Error('Update failed')
                    setSnack({ open: true, message: 'Status updated', severity: 'success' })
                    // Reload details
                    const j = await fetch(`/api/admin/users/${u.id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }).then(r=>r.json())
                    setData(j?.data)
                  } catch {
                    setSnack({ open: true, message: 'Update failed', severity: 'error' })
                  }
                }}>{(u as any).isActive === false ? 'Reactivate' : 'Deactivate'}</Button>
                <Button size="sm" onClick={async ()=>{
                  try {
                    const token = AuthClient.getToken()
                    const headers: any = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
                    const res = await fetch(`/api/admin/users/${u.id}/impersonate`, { method: 'POST', headers })
                    const j = await res.json()
                    if (!res.ok || !j?.success) throw new Error(j?.error?.message || 'Failed')
                    // Warning: this will replace current token.
                    AuthClient.backupCurrentSession()
                    AuthClient.setToken(j.data.token)
                    AuthClient.setUser(j.data.user)
                    setSnack({ open: true, message: 'Impersonating… redirecting', severity: 'success' })
                    setTimeout(()=>{ window.location.href = '/dashboard' }, 600)
                  } catch (e:any) {
                    setSnack({ open: true, message: e?.message || 'Impersonation failed', severity: 'error' })
                  }
                }}>Impersonate</Button>
                <Dialog open={warnOpen} onOpenChange={setWarnOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">Warn</Button>
                  </DialogTrigger>
                  <DialogContent className="content-defaults form-elegant">
                    <DialogHeader>
                      <DialogTitle>Send Warning</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 gap-3">
                      <FormField label="Title" required>
                        <Input value={warnTitle} onChange={e=>setWarnTitle(e.target.value)} placeholder="Subject" />
                      </FormField>
                      <FormField label="Message" required>
                        <Textarea rows={4} value={warnBody} onChange={e=>setWarnBody(e.target.value)} placeholder="Describe the policy violation or warning details…" />
                      </FormField>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={()=>setWarnOpen(false)}>Cancel</Button>
                      <Button onClick={async ()=>{
                        try {
                          const token = AuthClient.getToken()
                          const headers: any = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
                          const res = await fetch(`/api/admin/users/${u.id}/warn`, { method: 'POST', headers, body: JSON.stringify({ title: warnTitle, body: warnBody }) })
                          const j = await res.json().catch(()=>null)
                          if (!res.ok || !j?.success) throw new Error(j?.error?.message || 'Failed')
                          setSnack({ open: true, message: 'Warning sent', severity: 'success' })
                          setWarnTitle(''); setWarnBody(''); setWarnOpen(false)
                        } catch (e:any) {
                          setSnack({ open: true, message: e?.message || 'Failed to send warning', severity: 'error' })
                        }
                      }} disabled={!warnTitle.trim() || !warnBody.trim()}>Send</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardContent>
              <span className="text-xs uppercase text-muted-foreground">Stats</span>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <div className="text-sm text-muted-foreground">Private Vendors</div>
                  <div className="text-lg font-medium">{s.vendors ?? 0}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Directory Vendors</div>
                  <div className="text-lg font-medium">{s.directoryVendors ?? 0}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Guests</div>
                  <div className="text-lg font-medium">{s.guests ?? 0}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Budgets</div>
                  <div className="text-lg font-medium">{s.budgets ?? 0}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {snack.open && (
        <div className="fixed bottom-4 right-4 max-w-sm">
          <Alert className={snack.severity === 'error' ? 'border-destructive text-destructive' : ''}>
            {snack.message}
          </Alert>
        </div>
      )}
    </div>
  )
}
