"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function AdminToolbar() {
  const router = useRouter()
  return (
    <div className="mb-2 flex justify-end">
      <div className="inline-flex gap-2">
        <Button variant="outline" size="sm" onClick={()=>router.push('/admin')}>Overview</Button>
        <Button variant="outline" size="sm" onClick={()=>router.push('/admin/users')}>Users</Button>
        <Button variant="outline" size="sm" onClick={()=>router.push('/admin/directory/vendors')}>Directory</Button>
        <Button variant="outline" size="sm" onClick={()=>router.push('/admin/messaging')}>Messaging</Button>
        <Button variant="outline" size="sm" onClick={()=>router.push('/admin/vendor-panel')}>Vendor Panel</Button>
        <Button variant="outline" size="sm" onClick={()=>router.push('/admin/sessions')}>Sessions</Button>
        <Button variant="outline" size="sm" onClick={()=>router.push('/admin/logs')}>Logs</Button>
      </div>
    </div>
  )
}
