"use client"

import PremiumDashboardLayout from '@/components/layout/PremiumDashboardLayout'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast-provider'
import { FormField } from '@/components/ui/form-field'

export default function AdminCreditsPage() {
  const { notify } = useToast()
  const [email, setEmail] = useState('')
  const [amount, setAmount] = useState('10')
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const qs = new URLSearchParams()
      if (email) qs.set('email', email)
      const res = await fetch(`/api/admin/credits/balance?${qs.toString()}`, { cache: 'no-store' })
      const json = await res.json()
      if (!json.success) throw new Error(json?.error?.message || 'Failed to fetch balance')
      setBalance(json.data?.credits ?? 0)
    } catch (e: any) {
      notify(e?.message || 'Failed to load balance', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const topup = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/credits/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, amount: Number(amount) })
      })
      const json = await res.json()
      if (!json.success) throw new Error(json?.error?.message || 'Failed to top up')
      notify('Credits added', { variant: 'success' })
      setBalance(json.data?.credits ?? null)
    } catch (e: any) {
      notify(e?.message || 'Failed to top up', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <PremiumDashboardLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-dark dark:text-white">Admin: Credits</h1>
        <div className="bg-white dark:bg-gray-50 border rounded-lg p-6 space-y-4 max-w-md">
          <FormField label="User Email" htmlFor="admin-email" size="sm">
            <Input id="admin-email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="user@example.com" />
          </FormField>
          <FormField label="Amount" htmlFor="admin-amount" size="sm">
            <Input id="admin-amount" type="number" value={amount} onChange={e=>setAmount(e.target.value)} />
            <div className="mt-2 flex gap-2">
              {[10,50,100].map(v => (
                <Button key={v} variant="outline" size="sm" onClick={()=>setAmount(String(v))}>+{v}</Button>
              ))}
            </div>
          </FormField>
          <div className="flex gap-2">
            <Button variant="outline" onClick={load} isLoading={loading}>Check Balance</Button>
            <Button onClick={topup} isLoading={loading}>Top Up</Button>
          </div>
          {balance !== null && (
            <div className="text-sm text-gray-700">Current Balance: <span className="font-semibold">{balance}</span> credits</div>
          )}
        </div>
        <p className="text-xs text-gray-500">Note: Admin features require ADMIN_ENABLED and ADMIN_EMAILS configured.</p>
      </div>
    </PremiumDashboardLayout>
  )
}
