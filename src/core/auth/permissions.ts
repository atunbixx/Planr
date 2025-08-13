/**
 * Permission System - Enterprise-grade authorization
 */

import { AuthContext } from './context'

export const Permissions = {
  // Couple management
  COUPLE_READ: 'couple:read',
  COUPLE_WRITE: 'couple:write',
  
  // Guest management
  GUEST_READ: 'guest:read',
  GUEST_WRITE: 'guest:write',
  GUEST_INVITE: 'guest:invite',
  
  // Vendor management
  VENDOR_READ: 'vendor:read',
  VENDOR_WRITE: 'vendor:write',
  VENDOR_CONTRACT: 'vendor:contract',
  
  // Budget management
  BUDGET_READ: 'budget:read',
  BUDGET_WRITE: 'budget:write',
  
  // Timeline management
  TIMELINE_READ: 'timeline:read',
  TIMELINE_WRITE: 'timeline:write',
  
  // Settings
  SETTINGS_READ: 'settings:read',
  SETTINGS_WRITE: 'settings:write',
  
  // Admin
  ADMIN_READ: 'admin:read',
  ADMIN_WRITE: 'admin:write'
} as const

export type Permission = typeof Permissions[keyof typeof Permissions]

/**
 * Check if user has specific permission
 */
export function hasPermission(
  authContext: AuthContext,
  permission: Permission
): boolean {
  if (!authContext.permissions) {
    return false
  }
  
  return authContext.permissions.includes(permission)
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(
  authContext: AuthContext,
  permissions: Permission[]
): boolean {
  return permissions.some(permission => hasPermission(authContext, permission))
}

/**
 * Check if user has all specified permissions
 */
export function hasAllPermissions(
  authContext: AuthContext,
  permissions: Permission[]
): boolean {
  return permissions.every(permission => hasPermission(authContext, permission))
}

/**
 * Require specific permission - throws if not authorized
 */
export function requirePermission(
  authContext: AuthContext,
  permission: Permission
): void {
  if (!hasPermission(authContext, permission)) {
    throw new ForbiddenError(`Permission required: ${permission}`)
  }
}

/**
 * Get default permissions for couple roles
 */
export function getDefaultPermissions(role: string): Permission[] {
  switch (role) {
    case 'primary':
      return [
        Permissions.COUPLE_READ,
        Permissions.COUPLE_WRITE,
        Permissions.GUEST_READ,
        Permissions.GUEST_WRITE,
        Permissions.GUEST_INVITE,
        Permissions.VENDOR_READ,
        Permissions.VENDOR_WRITE,
        Permissions.VENDOR_CONTRACT,
        Permissions.BUDGET_READ,
        Permissions.BUDGET_WRITE,
        Permissions.TIMELINE_READ,
        Permissions.TIMELINE_WRITE,
        Permissions.SETTINGS_READ,
        Permissions.SETTINGS_WRITE
      ]
      
    case 'partner':
      return [
        Permissions.COUPLE_READ,
        Permissions.GUEST_READ,
        Permissions.GUEST_WRITE,
        Permissions.VENDOR_READ,
        Permissions.VENDOR_WRITE,
        Permissions.BUDGET_READ,
        Permissions.BUDGET_WRITE,
        Permissions.TIMELINE_READ,
        Permissions.TIMELINE_WRITE,
        Permissions.SETTINGS_READ
      ]
      
    case 'collaborator':
      return [
        Permissions.COUPLE_READ,
        Permissions.GUEST_READ,
        Permissions.VENDOR_READ,
        Permissions.BUDGET_READ,
        Permissions.TIMELINE_READ
      ]
      
    default:
      return []
  }
}

class ForbiddenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ForbiddenError'
  }
}