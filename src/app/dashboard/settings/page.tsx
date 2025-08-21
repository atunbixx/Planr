"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import PremiumDashboardLayout from '@/components/layout/PremiumDashboardLayout'
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/hooks/useAuth'
import {
  Box, Grid, Card, CardContent, Typography, TextField, MenuItem, Button, Snackbar, Alert,
} from '@mui/material'
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
  const { themeMode } = useCustomTheme()
  const [wd, setWd] = useState<WeddingDetails>({})
  const [pf, setPf] = useState<Preferences>({})
  const [saving, setSaving] = useState(false)
  const [snack, setSnack] = useState<{open: boolean; msg: string; severity: 'success'|'error'}>({ open: false, msg: '', severity: 'success' })

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
        setSnack({ open: true, msg: 'Failed to load settings', severity: 'error' })
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
      setSnack({ open: true, msg: 'Settings saved', severity: 'success' })
    } catch (e) {
      setSnack({ open: true, msg: 'Failed to save settings', severity: 'error' })
    } finally { setSaving(false) }
  }

  if (isLoading) {
    const LoadingLayout = themeMode === 'premium' ? PremiumDashboardLayout : DashboardLayout
    return (
      <LoadingLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Typography>Loading...</Typography>
        </Box>
      </LoadingLayout>
    )
  }

  if (!user) {
    router.push('/signin')
    return null
  }

  const Layout = themeMode === 'premium' ? PremiumDashboardLayout : DashboardLayout

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>Settings</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Wedding Details</Typography>
                <TextField fullWidth label="Venue / Location" value={wd.venue || ''} onChange={e => setWd({ ...wd, venue: e.target.value })} sx={{ mb: 2 }} />
                <TextField fullWidth label="Wedding Date" type="date" value={wd.weddingDate || ''} onChange={e => setWd({ ...wd, weddingDate: e.target.value })} InputLabelProps={{ shrink: true }} sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <TextField fullWidth label="Budget" type="number" value={wd.budget ?? ''} onChange={e => setWd({ ...wd, budget: e.target.value ? Number(e.target.value) : undefined })} />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <TextField fullWidth label="Guest Count" type="number" value={wd.guestCount ?? ''} onChange={e => setWd({ ...wd, guestCount: e.target.value ? Number(e.target.value) : undefined })} />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Preferences</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <TextField select fullWidth label="Currency" value={pf.currency || ''} onChange={e => setPf({ ...pf, currency: e.target.value })}>
                      {currencies.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <TextField select fullWidth label="Language" value={pf.language || ''} onChange={e => setPf({ ...pf, language: e.target.value })}>
                      {languages.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <TextField select fullWidth label="Region" value={pf.region || ''} onChange={e => setPf({ ...pf, region: e.target.value })}>
                      {regions.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <TextField select fullWidth label="Time Zone" value={pf.timeZone || ''} onChange={e => setPf({ ...pf, timeZone: e.target.value })}>
                      {timeZones.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <TextField select fullWidth label="Date Format" value={pf.dateFormat || ''} onChange={e => setPf({ ...pf, dateFormat: e.target.value })}>
                      {dateFormats.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <TextField select fullWidth label="Time Format" value={pf.timeFormat || ''} onChange={e => setPf({ ...pf, timeFormat: e.target.value })}>
                      {timeFormats.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                    </TextField>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Button variant="contained" onClick={save} disabled={saving}>Save Settings</Button>
        </Box>

        <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}>
          <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>{snack.msg}</Alert>
        </Snackbar>
      </Box>
    </Layout>
  )
}
