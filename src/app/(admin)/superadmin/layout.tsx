import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserRole } from '@/lib/admin/roles'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  HeadphonesIcon,
  Activity,
  Settings,
  BarChart3,
  Calendar,
  Shield,
  AlertCircle
} from 'lucide-react'

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  console.log('SuperAdmin Layout - Auth check:', { 
    user: user?.id, 
    email: user?.email, 
    error: error?.message 
  })
  
  if (error || !user) {
    console.log('SuperAdmin Layout - Redirecting to sign-in (no user)')
    redirect('/sign-in')
  }
  
  const role = await getUserRole(user.id)
  
  console.log('SuperAdmin Layout - Role check:', { 
    authUserId: user.id, 
    role: role 
  })
  
  if (role !== 'superAdmin') {
    console.log('SuperAdmin Layout - Redirecting to dashboard (not superAdmin)')
    redirect('/dashboard')
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/superadmin" className="flex items-center">
                <Shield className="h-8 w-8 text-indigo-600 mr-3" />
                <span className="text-xl font-semibold text-gray-900">SuperAdmin</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">SaaS Control Center</span>
              <Link 
                href="/dashboard" 
                className="text-sm text-indigo-600 hover:text-indigo-900"
              >
                Back to App →
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200">
          <nav className="flex-1 px-4 py-6 space-y-1">
            <SidebarLink href="/superadmin" icon={LayoutDashboard}>
              Overview
            </SidebarLink>
            <SidebarLink href="/superadmin/users" icon={Users}>
              Users
            </SidebarLink>
            <SidebarLink href="/superadmin/revenue" icon={DollarSign}>
              Revenue
            </SidebarLink>
            <SidebarLink href="/superadmin/usage" icon={BarChart3}>
              Usage
            </SidebarLink>
            <SidebarLink href="/superadmin/support" icon={HeadphonesIcon}>
              Support
            </SidebarLink>
            <SidebarLink href="/superadmin/events" icon={Activity}>
              Audit Events
            </SidebarLink>
            <SidebarLink href="/superadmin/weddings" icon={Calendar}>
              Weddings
            </SidebarLink>
            <SidebarLink href="/superadmin/alerts" icon={AlertCircle}>
              System Alerts
            </SidebarLink>
            <SidebarLink href="/superadmin/settings" icon={Settings}>
              Settings
            </SidebarLink>
          </nav>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <main className="p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

function SidebarLink({ 
  href, 
  icon: Icon, 
  children 
}: { 
  href: string
  icon: any
  children: React.ReactNode 
}) {
  return (
    <Link
      href={href}
      className="group flex items-center px-3 py-2 text-sm font-medium rounded-md hover:text-indigo-700 hover:bg-indigo-50 text-gray-700"
    >
      <Icon className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-indigo-600" />
      {children}
    </Link>
  )
}