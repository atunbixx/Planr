"use client"

import React from 'react'
import { Box, Button, ButtonGroup } from '@mui/material'
import { useRouter } from 'next/navigation'

export default function AdminToolbar() {
  const router = useRouter()
  return (
    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
      <ButtonGroup size="small" variant="outlined">
        <Button onClick={()=>router.push('/admin')}>Overview</Button>
        <Button onClick={()=>router.push('/admin/users')}>Users</Button>
        <Button onClick={()=>router.push('/admin/directory/vendors')}>Directory</Button>
        <Button onClick={()=>router.push('/admin/vendor-panel')}>Vendor Panel</Button>
        <Button onClick={()=>router.push('/admin/sessions')}>Sessions</Button>
        <Button onClick={()=>router.push('/admin/logs')}>Logs</Button>
      </ButtonGroup>
    </Box>
  )
}
