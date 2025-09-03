"use client"

import PremiumDashboardLayout from '@/components/layout/PremiumDashboardLayout'
import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { SectionCard, SectionCardBody } from '@/components/ui/section-card'
import { SectionBlockSkeleton } from '@/components/ui/section-skeletons'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api/fetcher'
import { formatApiError } from '@/lib/errors/format'

type UINotification = { id: string; title: string; body?: string | null; type: string; createdAt: string }

export default function NotificationsPage() {
  const [items, setItems] = useState<UINotification[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      setLoading(true)
      const j = await api.get<{ success: boolean; data: { notifications: UINotification[]; unread: number } }>(
        '/api/notifications?limit=50'
      )
      setItems(j.data.notifications)
      setUnread(j.data.unread)
    } catch (e: any) {
      setError(formatApiError(e, 'Failed to load notifications'))
    } finally {
      setLoading(false)
    }
  }

  async function markAllRead() {
    try {
      await api.post('/api/notifications/mark-all-read')
      await load()
    } catch {}
  }

  useEffect(() => { load() }, [])

  return (
    <PremiumDashboardLayout>
      <div className="p-6 space-y-6 content-defaults">
        <PageHeader kicker="NOTIFICATIONS" title="Notifications" actions={
          unread > 0 ? (
            <Button variant="outline" size="sm" onClick={markAllRead}>Mark all as read</Button>
          ) : null
        } />

        <SectionCard>
          <SectionCardBody>
            {loading ? (
              <SectionBlockSkeleton lines={6} />
            ) : error ? (
              <div className="text-rose-600">{error}</div>
            ) : items.length === 0 ? (
              <div className="text-slate-600">No notifications yet.</div>
            ) : (
              <ul className="divide-y">
                {items.map(n => (
                  <li key={n.id} className="py-3">
                    <div className="text-sm text-slate-500">{new Date(n.createdAt).toLocaleString()}</div>
                    <div className="font-medium">{n.title}</div>
                    {n.body && <div className="text-slate-700">{n.body}</div>}
                    <div className="text-xs text-slate-500 mt-1">{n.type}</div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCardBody>
        </SectionCard>
      </div>
    </PremiumDashboardLayout>
  )
}
