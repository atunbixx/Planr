"use client"

import PremiumDashboardLayout from '@/components/layout/PremiumDashboardLayout'
import { useEffect, useMemo, useState } from 'react'
import { MessagesHistoryClient, type MessageItem } from '@/lib/api/messages.history.client'
import { useApiQuery } from '@/lib/api/useApiQuery'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader } from '@/components/ui/page-header'
import { SectionCard, SectionCardBody } from '@/components/ui/section-card'
import { EmptyState } from '@/components/ui/empty-state'
import { TableSectionSkeleton } from '@/components/ui/section-skeletons'

export default function MessagesHistoryPage() {
  const [status, setStatus] = useState('')
  const [channel, setChannel] = useState('')
  const key = useMemo(() => `messages:history:${status}:${channel}`, [status, channel])
  const { data, isLoading, error, refetch } = useApiQuery(key, async () => {
    const res = await MessagesHistoryClient.list({ limit: 50, offset: 0, status: status || undefined, channel: channel || undefined })
    return res
  })

  const items = (data?.items || []) as MessageItem[]

  useEffect(() => { refetch() }, [status, channel])

  return (
    <PremiumDashboardLayout>
      <div className="p-6 space-y-6">
        <PageHeader kicker="MESSAGES" title="Sent Messages" subtitle="History of messages you have sent" actions={
          <div className="flex gap-3">
            <div>
              <Label className="mb-1 block">Status</Label>
              <Select value={status || 'all'} onValueChange={(v:any)=>setStatus(v==='all'?'':v)}>
                <SelectTrigger className="w-40"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="queued">Queued</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block">Channel</Label>
              <Select value={channel || 'all'} onValueChange={(v:any)=>setChannel(v==='all'?'':v)}>
                <SelectTrigger className="w-40"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        } />

        {isLoading ? (
          <TableSectionSkeleton columns={7} rows={8} />
        ) : error ? (
          <div className="text-sm text-red-600">{String(error)}</div>
        ) : items.length === 0 ? (
          <EmptyState icon={<span>✉️</span>} title="No messages yet" description="Send your first message from the Messages page." />
        ) : (
          <SectionCard>
            <SectionCardBody>
          <Table variant="bare">
            <TableHeader>
              <TableRow>
                <TableHead>To</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Sent At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.recipient}</TableCell>
                  <TableCell className="capitalize">{m.channel}</TableCell>
                  <TableCell className="truncate max-w-[280px]">{m.subject || '—'}</TableCell>
                  <TableCell className="capitalize">{m.status}</TableCell>
                  <TableCell className="text-sm text-gray-600">{m.provider || '—'}</TableCell>
                  <TableCell>{m.cost} {m.currency}</TableCell>
                  <TableCell>{new Date(m.createdAt as any).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
            </SectionCardBody>
          </SectionCard>
        )}
      </div>
    </PremiumDashboardLayout>
  )
}
