'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from '@/hooks/useAuth'
import { SettingsClient, type WeddingDetails as Wd, type Preferences as Pf } from '@/lib/api/settings.client'

type WeddingDetails = Wd
type Preferences = Pf

const currencies = ['USD','EUR','GBP','CAD','AUD','NGN','ZAR']
const languages = ['en','fr','es','de','it','pt','zh','ja']
const regions = ['US','GB','CA','AU','NG','ZA','EU']
const timeZones = ['UTC','America/New_York','Europe/London','Europe/Lagos','Africa/Lagos','Africa/Johannesburg','Asia/Tokyo']
const dateFormats = ['YYYY-MM-DD','DD/MM/YYYY','MM/DD/YYYY']
const timeFormats = ['HH:mm','hh:mm A']

export default function SettingsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [wd, setWd] = useState<WeddingDetails>({})
  const [pf, setPf] = useState<Preferences>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (!isLoading && !user) router.push('/signin') }, [isLoading, user, router])

  useEffect(() => {
    async function load() {
      try {
        const [w, p] = await Promise.all([
          SettingsClient.getWeddingDetails(),
          SettingsClient.getPreferences(),
        ])
        setWd({
          venue: w?.venue || '',
          weddingDate: w?.weddingDate ? String(w.weddingDate).slice(0,10) : '',
          budget: typeof w?.budget === 'number' ? w.budget : undefined,
          guestCount: typeof w?.guestCount === 'number' ? w.guestCount : undefined,
        })
        setPf({
          currency: p?.currency || 'USD',
          language: p?.language || 'en',
          region: p?.region || 'US',
          timeZone: p?.timeZone || 'UTC',
          dateFormat: p?.dateFormat || 'YYYY-MM-DD',
          timeFormat: p?.timeFormat || 'HH:mm',
        })
      } catch (e) {
        console.error('Failed to load settings', e)
      }
    }
    if (!isLoading && user) load()
  }, [isLoading, user])

  async function save() {
    setSaving(true)
    try {
      await SettingsClient.updateWeddingDetails({
        venue: wd.venue || undefined,
        weddingDate: wd.weddingDate || undefined,
        budget: typeof wd.budget === 'number' ? wd.budget : undefined,
        guestCount: typeof wd.guestCount === 'number' ? wd.guestCount : undefined,
      })
      await SettingsClient.updatePreferences(pf)
    } catch (e) {
        console.error('Failed to save settings', e)
    } finally { setSaving(false) }
  }

  if (isLoading || !user) {
    return <div>Loading...</div>
  }

  return (
    <div className="p-4 md:p-8">
        <h1 className="text-2xl font-bold mb-4">Settings</h1>
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Wedding Details</CardTitle>
                    <CardDescription>Basic information about your wedding.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Input placeholder="Venue / Location" value={wd.venue || ''} onChange={e => setWd({ ...wd, venue: e.target.value })} />
                    <Input type="date" placeholder="Wedding Date" value={wd.weddingDate || ''} onChange={e => setWd({ ...wd, weddingDate: e.target.value })} />
                    <div className="grid grid-cols-2 gap-4">
                        <Input type="number" placeholder="Budget" value={wd.budget ?? ''} onChange={e => setWd({ ...wd, budget: e.target.value ? Number(e.target.value) : undefined })} />
                        <Input type="number" placeholder="Guest Count" value={wd.guestCount ?? ''} onChange={e => setWd({ ...wd, guestCount: e.target.value ? Number(e.target.value) : undefined })} />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Preferences</CardTitle>
                    <CardDescription>Customize your experience.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <Select value={pf.currency} onValueChange={(value) => setPf({ ...pf, currency: value})}>
                        <SelectTrigger><SelectValue placeholder="Currency" /></SelectTrigger>
                        <SelectContent>
                            {currencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={pf.language} onValueChange={(value) => setPf({ ...pf, language: value})}>
                        <SelectTrigger><SelectValue placeholder="Language" /></SelectTrigger>
                        <SelectContent>
                            {languages.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={pf.region} onValueChange={(value) => setPf({ ...pf, region: value})}>
                        <SelectTrigger><SelectValue placeholder="Region" /></SelectTrigger>
                        <SelectContent>
                            {regions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={pf.timeZone} onValueChange={(value) => setPf({ ...pf, timeZone: value})}>
                        <SelectTrigger><SelectValue placeholder="Time Zone" /></SelectTrigger>
                        <SelectContent>
                            {timeZones.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={pf.dateFormat} onValueChange={(value) => setPf({ ...pf, dateFormat: value})}>
                        <SelectTrigger><SelectValue placeholder="Date Format" /></SelectTrigger>
                        <SelectContent>
                            {dateFormats.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={pf.timeFormat} onValueChange={(value) => setPf({ ...pf, timeFormat: value})}>
                        <SelectTrigger><SelectValue placeholder="Time Format" /></SelectTrigger>
                        <SelectContent>
                            {timeFormats.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>
        </div>
        <div className="mt-4">
            <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</Button>
        </div>
    </div>
  )
}