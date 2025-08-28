"use client"

import PremiumDashboardLayout from '@/components/layout/PremiumDashboardLayout'
import { useEffect, useMemo, useState } from 'react'
import { MessagesHistoryClient, type MessageItem } from '@/lib/api/messages.history.client'
import { useApiQuery } from '@/lib/api/useApiQuery'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

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
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dark dark:text-white">Sent Messages</h1>
            <p className="text-dark-6 dark:text-dark-4 mt-1">History of messages you have sent</p>
          </div>
          <div className="flex gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Status</label>
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
              <label className="block text-xs text-gray-600 mb-1">Channel</label>
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
        </div>

        {isLoading ? (
          <div className="bg-white dark:bg-gray-50 p-4 rounded-lg border shadow-sm">
            <div className="h-6 w-56 bg-gray-200 animate-pulse rounded mb-3" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 animate-pulse rounded" />
              <div className="h-4 w-5/6 bg-gray-200 animate-pulse rounded" />
              <div className="h-4 w-4/6 bg-gray-200 animate-pulse rounded" />
            </div>
          </div>
        ) : error ? (
          <div className="text-sm text-red-600">{String(error)}</div>
        ) : items.length === 0 ? (
          <div className="bg-white dark:bg-gray-50 p-10 rounded-lg border text-center">
            <div className="text-3xl mb-2">✉️</div>
            <h3 className="text-lg font-semibold mb-1">No messages yet</h3>
            <p className="text-sm text-gray-600">Send your first message from the Messages page.</p>
          </div>
        ) : (
          <Table>
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
        )}
      </div>
    </PremiumDashboardLayout>
  )
}

