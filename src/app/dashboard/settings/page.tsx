"use client"

import PremiumDashboardLayout from '@/components/layout/PremiumDashboardLayout';
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast-provider'
import { formatApiError } from '@/lib/errors/format'
import { useEffect } from 'react'
import { usePreferences, useUpdatePreferences, useWeddingDetails, useUpdateWeddingDetails } from '@/lib/api/queries/useSettings'

const WeddingDetailsSchema = z.object({
  venue: z.string().optional().default(''),
  weddingDate: z.string().optional().default(''),
  budget: z.preprocess((v) => (v === '' || v === null || typeof v === 'undefined' ? undefined : Number(v)), z.number().min(0).optional()),
  guestCount: z.preprocess((v) => (v === '' || v === null || typeof v === 'undefined' ? undefined : Number(v)), z.number().int().min(0).optional()),
})
type WeddingDetailsForm = z.infer<typeof WeddingDetailsSchema>

const PreferencesSchema = z.object({
  currency: z.string().optional().default(''),
  language: z.string().optional().default(''),
  region: z.string().optional().default(''),
  timeZone: z.string().optional().default(''),
  dateFormat: z.string().optional().default(''),
  timeFormat: z.string().optional().default(''),
})
type PreferencesForm = z.infer<typeof PreferencesSchema>

export default function SettingsPage() {
  const { notify } = useToast()
  // Queries
  const wdQuery = useWeddingDetails()
  const prefQuery = usePreferences()
  // Mutations
  const wdUpdate = useUpdateWeddingDetails()
  const prefUpdate = useUpdatePreferences()

  // Forms
  const wdForm = useForm<WeddingDetailsForm>({ resolver: zodResolver(WeddingDetailsSchema), defaultValues: { venue: '', weddingDate: '', budget: undefined, guestCount: undefined } })
  const prefForm = useForm<PreferencesForm>({ resolver: zodResolver(PreferencesSchema), defaultValues: { currency: '', language: '', region: '', timeZone: '', dateFormat: '', timeFormat: '' } })

  // Hydrate forms when queries load
  useEffect(() => {
    const d = wdQuery.data
    if (d) wdForm.reset({
      venue: d.venue || '',
      weddingDate: d.weddingDate ? String(d.weddingDate).slice(0,10) : '',
      budget: d.budget as any,
      guestCount: d.guestCount as any,
    })
  }, [wdQuery.data])
  useEffect(() => {
    const p = prefQuery.data
    if (p) prefForm.reset({
      currency: p.currency || '',
      language: p.language || '',
      region: p.region || '',
      timeZone: p.timeZone || '',
      dateFormat: p.dateFormat || '',
      timeFormat: p.timeFormat || '',
    })
  }, [prefQuery.data])

  async function onSubmitWeddingDetails(values: WeddingDetailsForm) {
    try {
      const prev = wdQuery.data
      await wdUpdate.mutateAsync(values)
      notify('Wedding details updated', { variant: 'success', action: prev ? { label: 'Undo', onClick: () => wdUpdate.mutate(prev).catch(()=>{}) } : undefined })
    } catch (e) {
      notify(formatApiError(e, 'Failed to update wedding details'), { variant: 'error' })
    }
  }

  async function onSubmitPreferences(values: PreferencesForm) {
    try {
      const prev = prefQuery.data
      await prefUpdate.mutateAsync(values)
      notify('Preferences updated', { variant: 'success', action: prev ? { label: 'Undo', onClick: () => prefUpdate.mutate(prev).catch(()=>{}) } : undefined })
    } catch (e) {
      notify(formatApiError(e, 'Failed to update preferences'), { variant: 'error' })
    }
  }

  const loading = wdQuery.isLoading || prefQuery.isLoading

  return (
    <PremiumDashboardLayout>
      <div className="p-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-slate-600 dark:text-neutral-300 mt-2">Manage your wedding details and app preferences.</p>
        </div>

        {/* Wedding Details */}
        <section className="rounded-xl border border-[#E5E7EB] bg-white p-6 dark:bg-dark-2 dark:border-dark-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Wedding Details</h2>
          <form onSubmit={wdForm.handleSubmit(onSubmitWeddingDetails)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="venue">Venue</Label>
              <Input id="venue" placeholder="e.g. Grand Ballroom" {...wdForm.register('venue')} />
              {wdForm.formState.errors.venue && <p className="text-xs text-rose-600 mt-1">{wdForm.formState.errors.venue.message}</p>}
            </div>
            <div>
              <Label htmlFor="weddingDate">Wedding Date</Label>
              <Input id="weddingDate" type="date" {...wdForm.register('weddingDate')} />
              {wdForm.formState.errors.weddingDate && <p className="text-xs text-rose-600 mt-1">{wdForm.formState.errors.weddingDate.message}</p>}
            </div>
            <div>
              <Label htmlFor="budget">Budget</Label>
              <Input id="budget" type="number" step="0.01" min="0" placeholder="e.g. 25000" {...wdForm.register('budget')} />
              {wdForm.formState.errors.budget && <p className="text-xs text-rose-600 mt-1">{wdForm.formState.errors.budget.message}</p>}
            </div>
            <div>
              <Label htmlFor="guestCount">Guest Count</Label>
              <Input id="guestCount" type="number" min="0" placeholder="e.g. 150" {...wdForm.register('guestCount')} />
              {wdForm.formState.errors.guestCount && <p className="text-xs text-rose-600 mt-1">{wdForm.formState.errors.guestCount.message}</p>}
            </div>
            <div className="sm:col-span-2 flex gap-2 justify-end mt-2">
              <Button type="submit" variant="primary" isLoading={wdUpdate.isPending || loading} data-testid="save-wedding-details">Save Wedding Details</Button>
            </div>
          </form>
        </section>

        {/* Preferences */}
        <section className="rounded-xl border border-[#E5E7EB] bg-white p-6 dark:bg-dark-2 dark:border-dark-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preferences</h2>
          <form onSubmit={prefForm.handleSubmit(onSubmitPreferences)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="currency">Currency</Label>
              <select id="currency" className="w-full border rounded-md px-3 py-2 bg-white text-black dark:bg-dark-2 dark:text-white" {...prefForm.register('currency')}>
                <option value="">Select currency</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="NGN">NGN</option>
              </select>
            </div>
            <div>
              <Label htmlFor="language">Language</Label>
              <select id="language" className="w-full border rounded-md px-3 py-2 bg-white text-black dark:bg-dark-2 dark:text-white" {...prefForm.register('language')}>
                <option value="">Select language</option>
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
            </div>
            <div>
              <Label htmlFor="region">Region</Label>
              <Input id="region" placeholder="e.g. US" {...prefForm.register('region')} />
            </div>
            <div>
              <Label htmlFor="timeZone">Time Zone</Label>
              <select id="timeZone" className="w-full border rounded-md px-3 py-2 bg-white text-black dark:bg-dark-2 dark:text-white" {...prefForm.register('timeZone')}>
                <option value="">Select time zone</option>
                <option value="UTC">UTC</option>
                <option value="America/Los_Angeles">America/Los_Angeles</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Europe/London">Europe/London</option>
                <option value="Africa/Lagos">Africa/Lagos</option>
              </select>
            </div>
            <div>
              <Label htmlFor="dateFormat">Date Format</Label>
              <Input id="dateFormat" placeholder="e.g. YYYY-MM-DD" {...prefForm.register('dateFormat')} />
            </div>
            <div>
              <Label htmlFor="timeFormat">Time Format</Label>
              <Input id="timeFormat" placeholder="e.g. HH:mm" {...prefForm.register('timeFormat')} />
            </div>
            <div className="sm:col-span-2 flex gap-2 justify-end mt-2">
              <Button type="submit" variant="primary" isLoading={prefUpdate.isPending || loading} data-testid="save-preferences">Save Preferences</Button>
            </div>
          </form>
        </section>
      </div>
    </PremiumDashboardLayout>
  );
}
