import { UserButton } from '@clerk/nextjs'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-xl md:text-2xl font-bold text-gray-900">
                Wedding Planner
              </Link>
              <nav className="hidden md:flex space-x-6">
                <Link 
                  href="/dashboard" 
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/dashboard/budget" 
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Budget
                </Link>
                <Link 
                  href="/dashboard/guests" 
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Guests
                </Link>
                <Link 
                  href="/dashboard/vendors" 
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Vendors
                </Link>
                <Link 
                  href="/dashboard/settings" 
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Settings
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block">
                <span className="text-sm text-gray-600">
                  Welcome, {user.firstName || 'there'}!
                </span>
              </div>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-8">
        {children}
      </main>
    </div>
  )
}