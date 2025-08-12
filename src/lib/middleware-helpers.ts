import { checkUserPermission, getCoupleIdForUser, getUserRole, Permission } from '@/lib/permissions'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

/**
 * Check if user has completed onboarding by checking both cookie and database
 * This provides a more robust check than cookies alone
 */
export async function hasCompletedOnboarding(request: NextRequest): Promise<boolean> {
  try {
    // First check the cookie for performance (fast path)
    const cookies = request.cookies
    const onboardingCookie = cookies.get('onboardingCompleted')?.value === 'true'
    
    // If cookie says completed, trust it (performance optimization)
    if (onboardingCookie) {
      return true
    }
    
    // If no cookie or cookie says not completed, check database (accurate path)
    const supabase = await createClient()
    const { data: { user: supabaseUser } } = await supabase.auth.getUser()
    if (!supabaseUser) {
      return false
    }
    
    // Check if user exists and has a couple profile
    const user = await prisma.user.findUnique({
      where: { id: supabaseUser.id },
      include: {
        couples: true
      }
    })
    
    const hasCompleted = !!(user?.couples && user.couples.length > 0)
    
    return hasCompleted
    
  } catch (error) {
    console.error('Error checking onboarding status in middleware:', error)
    // On error, fall back to cookie-only check for safety
    const cookies = request.cookies
    return cookies.get('onboardingCompleted')?.value === 'true'
  }
}

/**
 * Lightweight cookie-only check for performance-critical paths
 */
export function hasOnboardingCookie(request: NextRequest): boolean {
  const cookies = request.cookies
  return cookies.get('onboardingCompleted')?.value === 'true'
}

// Define route permissions
export const ROUTE_PERMISSIONS: Record<string, Permission | Permission[]> = {
  // Dashboard routes
  '/dashboard': 'view',
  '/dashboard/guests': 'view',
  '/dashboard/guests/add': 'manage_guests',
  '/dashboard/budget': 'view_budget',
  '/dashboard/budget/edit': 'manage_budget',
  '/dashboard/vendors': 'view',
  '/dashboard/vendors/add': 'manage_vendors',
  '/dashboard/schedule': 'view_schedule',
  '/dashboard/schedule/edit': 'manage_tasks',
  '/dashboard/photos': 'view_photos',
  '/dashboard/photos/upload': 'manage_photos',
  '/dashboard/seating': 'manage_guests', // Seating requires guest management
  '/dashboard/settings': 'view',
  '/dashboard/settings/sharing': 'edit', // Only owners/editors can manage sharing
  
  // API routes
  '/api/guests': ['view', 'manage_guests'],
  '/api/guests/[id]': ['view', 'edit_guests', 'manage_guests'],
  '/api/budget': ['view_budget', 'manage_budget'],
  '/api/vendors': ['view', 'manage_vendors', 'manage_own_vendor'],
  '/api/photos': ['view_photos', 'manage_photos'],
  '/api/dashboard': 'view',
  '/api/seating': ['view', 'manage_guests'],
  '/api/settings/collaborators': 'edit', // Only owners/editors can manage collaborators
}

export async function checkRoutePermission(
  userId: string,
  pathname: string
): Promise<boolean> {
  // Find matching route pattern
  let requiredPermissions: Permission | Permission[] | undefined
  
  // Direct match
  requiredPermissions = ROUTE_PERMISSIONS[pathname]
  
  // If no direct match, check for pattern match (e.g., /api/guests/123)
  if (!requiredPermissions) {
    for (const [pattern, perms] of Object.entries(ROUTE_PERMISSIONS)) {
      if (pattern.includes('[id]')) {
        const regex = new RegExp(pattern.replace('[id]', '\\w+'))
        if (regex.test(pathname)) {
          requiredPermissions = perms
          break
        }
      }
    }
  }
  
  // If no permissions defined, allow access (default open)
  if (!requiredPermissions) {
    return true
  }
  
  // Check if user has any of the required permissions
  const permissions = Array.isArray(requiredPermissions) 
    ? requiredPermissions 
    : [requiredPermissions]
  
  for (const permission of permissions) {
    const hasPermission = await checkUserPermission(userId, permission)
    if (hasPermission) {
      return true
    }
  }
  
  return false
}

// Special handling for vendors - they should only see their own vendor info
export async function isVendorAccessingOwnData(
  userId: string,
  pathname: string,
  vendorId?: string
): Promise<boolean> {
  const role = await getUserRole(userId)
  if (role !== 'vendor') return false
  
  // TODO: Check if the vendor ID in the path matches the user's vendor ID
  // This would require storing vendor_id in the collaborator record
  return true
}