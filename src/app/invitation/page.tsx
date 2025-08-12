'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Heart, Users, Calendar, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { useSupabaseAuth } from '@/lib/auth/client'

interface InvitationDetails {
  id: string
  couple_names: string
  weddingDate?: string
  role: string
  permissions: string[]
}

const ROLE_DESCRIPTIONS = {
  planner: 'Wedding Planner - Full access to manage wedding details',
  family: 'Family Member - View and limited editing access',
  vendor: 'Vendor - Access to vendor-specific information',
  guest: 'Guest - View-only access to public information'
}

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

function InvitationContent() {
  const { isSignedIn, user, isLoading } = useSupabaseAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (token) {
      fetchInvitationDetails()
    } else {
      setError('Invalid invitation link')
      setLoading(false)
    }
  }, [token])

  const fetchInvitationDetails = async () => {
    try {
      const response = await fetch(`/api/invitation?token=${token}`)
      const data = await response.json()
      
      if (response.ok && data.invitation) {
        setInvitation(data.invitation)
      } else {
        setError(data.error || 'Invalid or expired invitation')
      }
    } catch (error) {
      setError('Failed to load invitation details')
    } finally {
      setLoading(false)
    }
  }

  const acceptInvitation = async () => {
    if (!isSignedIn) {
      // Store the token and redirect to sign up
      localStorage.setItem('pendingInvitationToken', token || '')
      router.push('/sign-up')
      return
    }

    setAccepting(true)
    try {
      const response = await fetch('/api/invitation/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success('Invitation accepted successfully!')
        router.push('/dashboard')
      } else {
        toast.error(data.error || 'Failed to accept invitation')
      }
    } catch (error) {
      toast.error('Error accepting invitation')
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-purple-50">
        <div className="text-lg">Loading invitation...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-purple-50">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/')} variant="outline">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-purple-50 p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Heart className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">You're Invited to Collaborate!</CardTitle>
          <CardDescription className="text-lg mt-2">
            {invitation?.couple_names} has invited you to help plan their wedding
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Role Information */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Your Role</h3>
            </div>
            <Badge className="mb-2">{invitation?.role}</Badge>
            <p className="text-sm text-muted-foreground">
              {ROLE_DESCRIPTIONS[invitation?.role as keyof typeof ROLE_DESCRIPTIONS]}
            </p>
          </div>

          {/* Wedding Details */}
          {invitation?.weddingDate && (
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span>Wedding Date: {new Date(invitation.weddingDate).toLocaleDateString()}</span>
            </div>
          )}

          {/* Permissions */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Your Permissions</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {invitation?.permissions.map((permission) => (
                <div key={permission} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>{PERMISSION_LABELS[permission] || permission}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {!isLoading && !isSignedIn ? (
              <>
                <Button 
                  onClick={acceptInvitation}
                  className="flex-1"
                  size="lg"
                >
                  Sign Up & Accept Invitation
                </Button>
                <Button 
                  onClick={() => {
                    localStorage.setItem('pendingInvitationToken', token || '')
                    router.push('/sign-in')
                  }}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  Sign In to Accept
                </Button>
              </>
            ) : (
              <Button 
                onClick={acceptInvitation}
                disabled={accepting}
                className="flex-1"
                size="lg"
              >
                {accepting ? 'Accepting...' : 'Accept Invitation'}
              </Button>
            )}
          </div>

          <p className="text-xs text-center text-muted-foreground">
            By accepting this invitation, you'll gain access to the wedding planning dashboard
            with the permissions listed above.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function InvitationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InvitationContent />
    </Suspense>
  )
}