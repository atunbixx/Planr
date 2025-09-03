"use client"

import PremiumDashboardLayout from '@/components/layout/PremiumDashboardLayout'
import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { SectionCard, SectionCardBody, SectionCardTitle } from '@/components/ui/section-card'
import { FormField } from '@/components/ui/form-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import AdminToolbar from '@/components/admin/AdminToolbar'
import AuthClient from '@/lib/auth/client'

export default function AdminMessagingPage() {
  const [target, setTarget] = useState<'all'|'email'|'userId'>('all')
  const [emails, setEmails] = useState('')
  const [userIds, setUserIds] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<string>('')

  const send = async () => {
    try {
      setSending(true)
      setResult('')
      const token = AuthClient.getToken()
      const headers: any = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      const payload: any = { target, title, body }
      if (target === 'email') payload.emails = emails.split(',').map(s => s.trim()).filter(Boolean)
      if (target === 'userId') payload.userIds = userIds.split(',').map(s => s.trim()).filter(Boolean)
      const res = await fetch('/api/admin/notifications/send', { method: 'POST', headers, body: JSON.stringify(payload) })
      const j = await res.json()
      if (!res.ok || !j?.success) throw new Error(j?.error?.message || 'Failed')
      setResult(`Sent to ${j?.data?.recipients ?? 0} recipient(s)`) 
      setTitle(''); setBody('');
    } catch (e: any) {
      setResult(e?.message || 'Failed to send')
    } finally { setSending(false) }
  }

  return (
    <PremiumDashboardLayout>
      <div className="p-6 space-y-6 content-defaults form-elegant">
        <PageHeader title="Admin Messaging" subtitle="Send system notifications to all users or a targeted set." />
        <AdminToolbar />
        <SectionCard>
          <SectionCardTitle kicker="ADMIN" title={<span>Broadcast / Targeted Send</span>} />
          <SectionCardBody className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <FormField label="Target">
                <Select value={target} onValueChange={(v:any)=>setTarget(v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="email">By Email</SelectItem>
                    <SelectItem value="userId">By User ID</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              {target === 'email' && (
                <FormField label="Emails (comma separated)" htmlFor="emails">
                  <Input id="emails" value={emails} onChange={e=>setEmails(e.target.value)} placeholder="user1@example.com, user2@example.com" />
                </FormField>
              )}
              {target === 'userId' && (
                <FormField label="User IDs (comma separated)" htmlFor="userIds">
                  <Input id="userIds" value={userIds} onChange={e=>setUserIds(e.target.value)} placeholder="uuid-1, uuid-2" />
                </FormField>
              )}
            </div>
            <div className="space-y-4">
              <FormField label="Title" htmlFor="title" required>
                <Input id="title" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Subject line" />
              </FormField>
              <FormField label="Message" htmlFor="body" required>
                <Textarea id="body" rows={6} value={body} onChange={e=>setBody(e.target.value)} placeholder="Write your announcement…" />
              </FormField>
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={()=>{ setTitle(''); setBody(''); setEmails(''); setUserIds(''); }}>Reset</Button>
                <Button onClick={send} isLoading={sending} disabled={!title.trim() || !body.trim()}>Send</Button>
              </div>
              {result && (
                <div className="text-sm text-gray-700">{result}</div>
              )}
            </div>
          </SectionCardBody>
        </SectionCard>
      </div>
    </PremiumDashboardLayout>
  )
}

