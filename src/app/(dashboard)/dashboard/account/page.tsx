'use client'

import { useSupabaseAuth } from '@/lib/auth/client'
import { usePermissions } from '@/hooks/usePermissions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, User, Shield } from 'lucide-react'

const PERMISSION_LABELS: Record<string, string> = {
  view: 'View Dashboard',
  edit: 'Edit Wedding Details',
  manage_guests: 'Manage Guest List',
  edit_guests: 'Edit Guest Information',
  manage_budget: 'Manage Budget',
  view_budget: 'View Budget',
  manage_vendors: 'Manage Vendors',
  view_schedule: 'View Schedule',
  manage_tasks: 'Manage Tasks',
  manage_photos: 'Manage Photos',
  view_photos: 'View Photos',
  manage_own_vendor: 'Manage Your Vendor Information'
}

const ROLE_DESCRIPTIONS = {
  owner: 'Wedding Couple - Full access to all features',
  planner: 'Wedding Planner - Full access to manage wedding details',
  family: 'Family Member - View and limited editing access',
  vendor: 'Vendor - Access to vendor-specific information',
  guest: 'Guest - View-only access to public information'
}

export default function AccountPage() {
  const { user, isSignedIn, isLoading } = useSupabaseAuth()
  const { permissions, userRole, isLoading: permissionsLoading } = usePermissions()

  if (isLoading || permissionsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading account information...</div>
      </div>
    )
  }

  if (!isSignedIn || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Please sign in to view account information</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My Account</h1>
        <p className="text-gray-600 mt-2">View your account details and permissions</p>
      </div>

      {/* User Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your profile details from Supabase</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{user.user_metadata?.full_name || user.user_metadata?.first_name || 'No name set'}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Your Role</CardTitle>
          <CardDescription>Your access level in this wedding planning account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-5 w-5 text-primary" />
            <Badge className="text-base" variant={userRole === 'owner' ? 'default' : 'secondary'}>
              {userRole || 'No role assigned'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {userRole && ROLE_DESCRIPTIONS[userRole as keyof typeof ROLE_DESCRIPTIONS]}
          </p>
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Your Permissions</CardTitle>
          <CardDescription>Features you have access to</CardDescription>
        </CardHeader>
        <CardContent>
          {permissions.length === 0 ? (
            <p className="text-muted-foreground">No permissions assigned</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {permissions.map((permission) => (
                <div key={permission} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">{PERMISSION_LABELS[permission] || permission}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}