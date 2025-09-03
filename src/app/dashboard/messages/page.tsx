"use client"

import PremiumDashboardLayout from '@/components/layout/PremiumDashboardLayout'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { FormField } from '@/components/ui/form-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { MessagingClient } from '@/lib/api/messaging.client'
import { formatApiError } from '@/lib/errors/format'
import { useToast } from '@/components/ui/toast-provider'
import { PageHeader } from '@/components/ui/page-header'
import { SectionCard, SectionCardBody, SectionCardHeader, SectionCardTitle } from '@/components/ui/section-card'

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
      notify(formatApiError(e, 'Failed to get pricing'), { variant: 'error' })
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
      notify(formatApiError(e, 'Failed to send message'), { variant: 'error' })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <PremiumDashboardLayout>
      <div className="p-6 space-y-6">
        <PageHeader kicker="MESSAGING" title="Messages" actions={<Button variant="outline" onClick={checkPricing}>Check Pricing</Button>} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SectionCard>
            <SectionCardTitle kicker="MESSAGES" title={<span>Compose</span>} />
            <SectionCardBody className="space-y-4 form-elegant">
            <FormField label="Channel">
              <Select value={form.channel} onValueChange={(v: any) => update('channel', v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Country (pricing)">
              <Input value={form.country} onChange={e=>update('country', e.target.value.toUpperCase())} placeholder="e.g. NG, US" />
            </FormField>
            <FormField label="To">
              <Input value={form.to} onChange={e=>update('to', e.target.value)} placeholder="email or phone" />
            </FormField>
            {form.channel === 'email' && (
              <FormField label="Subject">
                <Input value={form.subject} onChange={e=>update('subject', e.target.value)} placeholder="Subject" />
              </FormField>
            )}
            <FormField label="Message">
              <Textarea value={form.body} onChange={e=>update('body', e.target.value)} placeholder="Write your message..." className="min-h-32" />
            </FormField>
            <div className="flex items-center justify-between">
              {pricing && (
                <div className="text-sm text-gray-600">Est. Cost: {pricing.cost} {pricing.currency}</div>
              )}
              <Button onClick={send} isLoading={isSending}>Send</Button>
            </div>
            </SectionCardBody>
          </SectionCard>

          <SectionCard>
            <SectionCardTitle kicker="MESSAGES" title={<span>Tips</span>} />
            <SectionCardBody>
            <ul className="list-disc ml-5 text-sm text-gray-600 space-y-2">
              <li>Use email for rich invitations; SMS for quick reminders.</li>
              <li>Country affects SMS/WhatsApp pricing; email is flat.</li>
              <li>Keep messages concise for higher engagement.</li>
            </ul>
            </SectionCardBody>
          </SectionCard>
        </div>
      </div>
    </PremiumDashboardLayout>
  )
}
