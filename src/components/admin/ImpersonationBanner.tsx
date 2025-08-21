"use client"

import React, { useState } from 'react'
import { Alert, Box, Button } from '@mui/material'
import { useAuth } from '@/hooks/useAuth'
import AuthClient from '@/lib/auth/client'

export default function ImpersonationBanner() {
  const { user } = useAuth()
  const isImp = (user as any)?.impersonating
  if (!isImp) return null
  const [ending, setEnding] = useState(false)
  async function end() {
    try {
      setEnding(true)
      // Best-effort audit on server
      await fetch('/api/admin/impersonation/end', { method: 'POST' }).catch(()=>{})
    } finally {
      AuthClient.endImpersonation()
    }
  }
  return (
    <Box sx={{ position: 'sticky', top: 0, zIndex: (t)=>t.zIndex.appBar }}>
      <Alert severity="warning" sx={{ borderRadius: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>
          Impersonating as {user?.email}. Some actions will be performed as them.
        </span>
        <Button size="small" variant="outlined" disabled={ending} onClick={end}>{ending ? 'Ending…' : 'End Impersonation'}</Button>
      </Alert>
    </Box>
  )
}
