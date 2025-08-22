"use client"

import React, { useState } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
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
    <div className="sticky top-0 z-50">
      <Alert className="rounded-none flex items-center justify-between">
        <span>
          Impersonating as {user?.email}. Some actions will be performed as them.
        </span>
        <Button size="sm" variant="outline" disabled={ending} onClick={end}>{ending ? 'Ending…' : 'End Impersonation'}</Button>
      </Alert>
    </div>
  )
}
