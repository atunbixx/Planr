'use client'

import { usePermissions } from '@/hooks/usePermissions'
import { Permission } from '@/lib/permissions'

interface PermissionGateProps {
  permissions: Permission | Permission[]
  children: React.ReactNode
  fallback?: React.ReactNode
  requireAll?: boolean
}

export function PermissionGate({ 
  permissions, 
  children, 
  fallback = null,
  requireAll = false 
}: PermissionGateProps) {
  const { hasPermission, isLoading, permissions: userPermissions } = usePermissions()
  
  if (isLoading) {
    return null // Or a loading spinner
  }
  
  const permissionArray = Array.isArray(permissions) ? permissions : [permissions]
  
  // Debug logging
  if (typeof window !== 'undefined' && permissionArray.includes('manage_guests')) {
    console.log('PermissionGate check:', {
      requiredPermissions: permissionArray,
      userPermissions,
      isLoading,
      hasManageGuests: hasPermission('manage_guests')
    })
  }
  
  const hasRequiredPermissions = requireAll
    ? permissionArray.every(p => hasPermission(p))
    : permissionArray.some(p => hasPermission(p))
  
  return hasRequiredPermissions ? <>{children}</> : <>{fallback}</>
}