"use client"

import PremiumDashboardLayout from '@/components/layout/PremiumDashboardLayout';
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormField } from '@/components/ui/form-field'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast-provider'
import { formatApiError } from '@/lib/errors/format'
import { useEffect } from 'react'
import { usePreferences, useUpdatePreferences, useWeddingDetails, useUpdateWeddingDetails } from '@/lib/api/queries/useSettings'
import { PageHeader } from '@/components/ui/page-header'
import { SectionCard, SectionCardBody, SectionCardHeader, SectionCardTitle } from '@/components/ui/section-card'

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
      <div className={`p-6 space-y-8 content-defaults form-elegant`}>
        <PageHeader title="Settings" subtitle="Manage your wedding details and app preferences." />

        {/* Wedding Details */}
        <SectionCard>
          <SectionCardTitle kicker="SETTINGS" title={<span>Wedding Details</span>} />
          <SectionCardBody>
            <form onSubmit={wdForm.handleSubmit(onSubmitWeddingDetails)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Venue" htmlFor="venue" error={wdForm.formState.errors.venue?.message}>
              <Input id="venue" placeholder="e.g. Grand Ballroom" {...wdForm.register('venue')} />
            </FormField>
            <FormField label="Wedding Date" htmlFor="weddingDate" error={wdForm.formState.errors.weddingDate?.message}>
              <Input id="weddingDate" type="date" {...wdForm.register('weddingDate')} />
            </FormField>
            <FormField label="Budget" htmlFor="budget" error={wdForm.formState.errors.budget?.message}>
              <Input id="budget" type="number" step="0.01" min="0" placeholder="e.g. 25000" {...wdForm.register('budget')} />
            </FormField>
            <FormField label="Guest Count" htmlFor="guestCount" error={wdForm.formState.errors.guestCount?.message}>
              <Input id="guestCount" type="number" min="0" placeholder="e.g. 150" {...wdForm.register('guestCount')} />
            </FormField>
            <div className="sm:col-span-2 flex gap-2 justify-end mt-2">
              <Button type="submit" variant="primary" isLoading={wdUpdate.isPending || loading} data-testid="save-wedding-details">Save Wedding Details</Button>
            </div>
            </form>
          </SectionCardBody>
        </SectionCard>

        {/* Preferences */}
        <SectionCard>
          <SectionCardTitle kicker="SETTINGS" title={<span>Preferences</span>} />
          <SectionCardBody>
            <form onSubmit={prefForm.handleSubmit(onSubmitPreferences)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Currency" htmlFor="currency">
              <select id="currency" className="w-full border rounded-md px-3 py-2 bg-white text-black dark:bg-dark-2 dark:text-white" {...prefForm.register('currency')}>
                <option value="">Select currency</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="NGN">NGN</option>
              </select>
            </FormField>
            <FormField label="Language" htmlFor="language">
              <select id="language" className="w-full border rounded-md px-3 py-2 bg-white text-black dark:bg-dark-2 dark:text-white" {...prefForm.register('language')}>
                <option value="">Select language</option>
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
            </FormField>
            <FormField label="Region" htmlFor="region">
              <Input id="region" placeholder="e.g. US" {...prefForm.register('region')} />
            </FormField>
            <FormField label="Time Zone" htmlFor="timeZone">
              <select id="timeZone" className="w-full border rounded-md px-3 py-2 bg-white text-black dark:bg-dark-2 dark:text-white" {...prefForm.register('timeZone')}>
                <option value="">Select time zone</option>
                <option value="UTC">UTC</option>
                <option value="America/Los_Angeles">America/Los_Angeles</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Europe/London">Europe/London</option>
                <option value="Africa/Lagos">Africa/Lagos</option>
              </select>
            </FormField>
            <FormField label="Date Format" htmlFor="dateFormat">
              <Input id="dateFormat" placeholder="e.g. YYYY-MM-DD" {...prefForm.register('dateFormat')} />
            </FormField>
            <FormField label="Time Format" htmlFor="timeFormat">
              <Input id="timeFormat" placeholder="e.g. HH:mm" {...prefForm.register('timeFormat')} />
            </FormField>
            <div className="sm:col-span-2 flex gap-2 justify-end mt-2">
              <Button type="submit" variant="primary" isLoading={prefUpdate.isPending || loading} data-testid="save-preferences">Save Preferences</Button>
            </div>
            </form>
          </SectionCardBody>
        </SectionCard>
      </div>
    </PremiumDashboardLayout>
  );
}
