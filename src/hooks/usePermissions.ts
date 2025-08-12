import { useState, useEffect } from 'react'
import { useSupabaseAuth } from '@/lib/auth/client'
import { Permission } from '@/lib/permissions'

interface UsePermissionsReturn {
  hasPermission: (permission: Permission) => boolean
  isLoading: boolean
  userRole: string | null
  permissions: Permission[]
}

export function usePermissions(): UsePermissionsReturn {
  const { user, isSignedIn, isLoading: authLoading } = useSupabaseAuth()
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && isSignedIn && user) {
      loadPermissions()
    } else if (!authLoading && !isSignedIn) {
      setIsLoading(false)
    }
  }, [authLoading, isSignedIn, user])

  const loadPermissions = async () => {
    try {
      const response = await fetch('/api/user/permissions')
      if (response.ok) {
        const data = await response.json()
        setPermissions(data.permissions || [])
        setUserRole(data.role || null)
      }
    } catch (error) {
      console.error('Error loading permissions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission) || permissions.includes('edit')
  }

  return {
    hasPermission,
    isLoading,
    userRole,
    permissions
  }
}