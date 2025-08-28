"use client"

import PremiumDashboardLayout from '@/components/layout/PremiumDashboardLayout'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { MessagingClient } from '@/lib/api/messaging.client'
import { useToast } from '@/components/ui/toast-provider'

export default function MessagesPage() {
  const { notify } = useToast()
  const [form, setForm] = useState({ channel: 'email', to: '', subject: '', body: '', country: 'NG' })
  const [isSending, setIsSending] = useState(false)
  const [pricing, setPricing] = useState<{ cost: number; currency: string } | null>(null)

  const update = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const checkPricing = async () => {
    try {
      const p = await MessagingClient.getPricing(form.channel as any, form.country)
      setPricing({ cost: p.cost, currency: p.currency })
      notify(`Current cost: ${p.cost} ${p.currency}`, { variant: 'default' })
    } catch (e: any) {
      notify(e?.message || 'Failed to get pricing', { variant: 'error' })
    }
  }

  const send = async () => {
    try {
      if (!form.to.trim() || !form.body.trim()) {
        notify('Recipient and content are required', { variant: 'warning' })
        return
      }
      setIsSending(true)
      await MessagingClient.send({ channel: form.channel as any, to: form.to.trim(), subject: form.subject || undefined, body: form.body, country: form.country })
      notify('Message sent', { variant: 'success' })
      setForm(prev => ({ ...prev, subject: '', body: '' }))
    } catch (e: any) {
      notify(e?.message || 'Failed to send message', { variant: 'error' })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <PremiumDashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-dark dark:text-white">Messages</h1>
          <Button variant="outline" onClick={checkPricing}>Check Pricing</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-50 border rounded-lg p-6 space-y-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Channel</label>
              <Select value={form.channel} onValueChange={(v: any) => update('channel', v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Country (pricing)</label>
              <Input value={form.country} onChange={e=>update('country', e.target.value.toUpperCase())} placeholder="e.g. NG, US" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">To</label>
              <Input value={form.to} onChange={e=>update('to', e.target.value)} placeholder="email or phone" />
            </div>
            {form.channel === 'email' && (
              <div>
                <label className="block text-xs text-gray-600 mb-1">Subject</label>
                <Input value={form.subject} onChange={e=>update('subject', e.target.value)} placeholder="Subject" />
              </div>
            )}
            <div>
              <label className="block text-xs text-gray-600 mb-1">Message</label>
              <textarea className="w-full border rounded p-2 h-32" value={form.body} onChange={e=>update('body', e.target.value)} placeholder="Write your message..." />
            </div>
            <div className="flex items-center justify-between">
              {pricing && (
                <div className="text-sm text-gray-600">Est. Cost: {pricing.cost} {pricing.currency}</div>
              )}
              <Button onClick={send} isLoading={isSending}>Send</Button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-50 border rounded-lg p-6">
            <h2 className="font-semibold mb-2">Tips</h2>
            <ul className="list-disc ml-5 text-sm text-gray-600 space-y-2">
              <li>Use email for rich invitations; SMS for quick reminders.</li>
              <li>Country affects SMS/WhatsApp pricing; email is flat.</li>
              <li>Keep messages concise for higher engagement.</li>
            </ul>
          </div>
        </div>
      </div>
    </PremiumDashboardLayout>
  )
}

