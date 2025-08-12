'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { UserPlus, Mail, Trash2, Shield, Calendar, Users, DollarSign, Store, Camera, CheckSquare, Settings, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useSupabaseAuth } from '@/lib/auth/client'

interface Collaborator {
  id: string
  email: string
  role: string
  permissions: string[]
  status: string
  invited_at: string
  accepted_at?: string
  userId?: string
}

const ROLES = {
  planner: {
    name: 'Wedding Planner',
    description: 'Full access to manage all wedding details',
    defaultPermissions: ['view', 'edit', 'manage_guests', 'manage_budget', 'manage_vendors', 'manage_tasks', 'manage_photos']
  },
  family: {
    name: 'Family Member',
    description: 'View access with limited editing capabilities',
    defaultPermissions: ['view', 'edit_guests', 'view_budget', 'view_photos']
  },
  vendor: {
    name: 'Vendor',
    description: 'Access to specific vendor-related information',
    defaultPermissions: ['view', 'view_schedule', 'manage_own_vendor']
  },
  guest: {
    name: 'Guest',
    description: 'View-only access to public information',
    defaultPermissions: ['view', 'view_photos']
  }
}

const PERMISSIONS = {
  view: { label: 'View Dashboard', icon: Calendar },
  edit: { label: 'Edit Wedding Details', icon: Settings },
  manage_guests: { label: 'Manage Guests', icon: Users },
  edit_guests: { label: 'Edit Guest List', icon: Users },
  manage_budget: { label: 'Manage Budget', icon: DollarSign },
  view_budget: { label: 'View Budget', icon: DollarSign },
  manage_vendors: { label: 'Manage Vendors', icon: Store },
  view_schedule: { label: 'View Schedule', icon: Calendar },
  manage_tasks: { label: 'Manage Tasks', icon: CheckSquare },
  manage_photos: { label: 'Manage Photos', icon: Camera },
  view_photos: { label: 'View Photos', icon: Camera },
  manage_own_vendor: { label: 'Manage Own Vendor Info', icon: Store }
}

export default function SharingSettingsPage() {
  const { user, isSignedIn } = useSupabaseAuth()
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  
  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('family')
  const [invitePermissions, setInvitePermissions] = useState<string[]>([])

  useEffect(() => {
    fetchCollaborators()
  }, [])

  useEffect(() => {
    // Update permissions when role changes
    setInvitePermissions(ROLES[inviteRole as keyof typeof ROLES].defaultPermissions)
  }, [inviteRole])

  const fetchCollaborators = async () => {
    try {
      const response = await fetch('/api/settings/collaborators')
      if (response.ok) {
        const data = await response.json()
        setCollaborators(data.collaborators || [])
      }
    } catch (error) {
      console.error('Failed to fetch collaborators:', error)
      toast.error('Failed to load collaborators')
    } finally {
      setLoading(false)
    }
  }

  const inviteCollaborator = async () => {
    if (!inviteEmail || !inviteRole) {
      toast.error('Please fill in all fields')
      return
    }

    setInviting(true)
    try {
      const response = await fetch('/api/settings/collaborators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          permissions: invitePermissions
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success('Invitation sent successfully!')
        setCollaborators([...collaborators, data.collaborator])
        setShowInviteDialog(false)
        setInviteEmail('')
        setInviteRole('family')
        
        // Show the invitation link
        if (data.invitationUrl) {
          setCopiedToken(data.invitationUrl)
        }
      } else {
        toast.error(data.error || 'Failed to send invitation')
      }
    } catch (error) {
      toast.error('Error sending invitation')
    } finally {
      setInviting(false)
    }
  }

  const removeCollaborator = async (collaboratorId: string) => {
    if (!confirm('Are you sure you want to remove this collaborator?')) return

    try {
      const response = await fetch(`/api/settings/collaborators/${collaboratorId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Collaborator removed')
        setCollaborators(collaborators.filter(c => c.id !== collaboratorId))
      } else {
        toast.error('Failed to remove collaborator')
      }
    } catch (error) {
      toast.error('Error removing collaborator')
    }
  }

  const updatePermissions = async (collaboratorId: string, permissions: string[]) => {
    try {
      const response = await fetch(`/api/settings/collaborators/${collaboratorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions })
      })

      if (response.ok) {
        toast.success('Permissions updated')
        setCollaborators(collaborators.map(c => 
          c.id === collaboratorId ? { ...c, permissions } : c
        ))
      } else {
        toast.error('Failed to update permissions')
      }
    } catch (error) {
      toast.error('Error updating permissions')
    }
  }

  const copyInviteLink = (link: string) => {
    navigator.clipboard.writeText(link)
    toast.success('Invitation link copied to clipboard')
    setTimeout(() => setCopiedToken(null), 3000)
  }

  const togglePermission = (permission: string) => {
    setInvitePermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading sharing settings...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Sharing & Collaboration</h1>
          <p className="text-muted-foreground">
            Invite planners, family members, or vendors to collaborate on your wedding
          </p>
        </div>

        <Tabs defaultValue="active" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">Active Collaborators</TabsTrigger>
            <TabsTrigger value="pending">Pending Invitations</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Active Collaborators</CardTitle>
                    <CardDescription>
                      People who have access to your wedding planning account
                    </CardDescription>
                  </div>
                  <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite Collaborator
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[525px]">
                      <DialogHeader>
                        <DialogTitle>Invite a Collaborator</DialogTitle>
                        <DialogDescription>
                          Send an invitation to share your wedding planning account
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div>
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="planner@example.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="role">Role</Label>
                          <Select value={inviteRole} onValueChange={setInviteRole}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(ROLES).map(([key, role]) => (
                                <SelectItem key={key} value={key}>
                                  <div>
                                    <div className="font-medium">{role.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {role.description}
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Permissions</Label>
                          <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                            {Object.entries(PERMISSIONS).map(([key, permission]) => {
                              const Icon = permission.icon
                              return (
                                <div key={key} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={key}
                                    checked={invitePermissions.includes(key)}
                                    onCheckedChange={() => togglePermission(key)}
                                  />
                                  <Label
                                    htmlFor={key}
                                    className="flex items-center gap-2 text-sm font-normal cursor-pointer"
                                  >
                                    <Icon className="h-4 w-4" />
                                    {permission.label}
                                  </Label>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={inviteCollaborator}
                          disabled={inviting || !inviteEmail}
                        >
                          {inviting ? 'Sending...' : 'Send Invitation'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {collaborators
                    .filter(c => c.status === 'accepted')
                    .map((collaborator) => (
                      <div
                        key={collaborator.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Mail className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{collaborator.email}</div>
                            <div className="text-sm text-muted-foreground">
                              {ROLES[collaborator.role as keyof typeof ROLES]?.name || collaborator.role}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="capitalize">
                            Active
                          </Badge>
                          <Button
                            onClick={() => removeCollaborator(collaborator.id)}
                            variant="ghost"
                            size="sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  {collaborators.filter(c => c.status === 'accepted').length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No active collaborators yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Invitations</CardTitle>
                <CardDescription>
                  Invitations that haven't been accepted yet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {collaborators
                    .filter(c => c.status === 'pending')
                    .map((collaborator) => (
                      <div
                        key={collaborator.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <Mail className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="font-medium">{collaborator.email}</div>
                            <div className="text-sm text-muted-foreground">
                              Invited as {ROLES[collaborator.role as keyof typeof ROLES]?.name || collaborator.role}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Pending</Badge>
                          <Button
                            onClick={() => removeCollaborator(collaborator.id)}
                            variant="ghost"
                            size="sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  {collaborators.filter(c => c.status === 'pending').length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No pending invitations
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Invitation Link Dialog */}
        {copiedToken && (
          <Card className="mt-4 border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                Invitation Sent!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-3">
                Share this link with the collaborator to accept the invitation:
              </p>
              <div className="flex gap-2">
                <Input
                  value={copiedToken}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  onClick={() => copyInviteLink(copiedToken)}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Permissions Guide */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Permission Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(PERMISSIONS).map(([key, permission]) => {
                const Icon = permission.icon
                return (
                  <div key={key} className="flex items-start gap-3">
                    <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">{permission.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {key.includes('manage') ? 'Full control' : 'View only'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}