import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'

export default async function VendorDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  
  // Check if user is authenticated
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/auth/signin?redirect=/vendor-dashboard')
  }
  
  // TODO: Check if user has vendor access
  // For MVP, we'll assume authenticated users can access vendor dashboard
  
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold">Vendor Dashboard</h2>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
                Back to Main Dashboard
              </a>
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  )
}