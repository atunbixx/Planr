import { currentUser } from '@clerk/nextjs/server'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function DashboardPage() {
  const user = await currentUser()
  
  // Fetch user's couple data
  let coupleData = null
  let daysUntilWedding = '--'
  
  if (user?.id) {
    const { data: userData } = await supabase
      .from('users')
      .select(`
        id,
        first_name,
        last_name,
        couples (*)
      `)
      .eq('clerk_user_id', user.id)
      .single()
    
    if (userData?.couples?.[0]) {
      coupleData = userData.couples[0]
      
      // Calculate days until wedding
      if (coupleData.wedding_date) {
        const weddingDate = new Date(coupleData.wedding_date)
        const today = new Date()
        const diffTime = weddingDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        daysUntilWedding = diffDays > 0 ? diffDays.toString() : 'Past'
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.firstName || 'there'}! 👋
        </h1>
        <p className="text-gray-600">
          {coupleData ? (
            <>
              Planning the wedding for {coupleData.partner1_name} & {coupleData.partner2_name || 'Partner'}
              {coupleData.wedding_date && (
                <> on {new Date(coupleData.wedding_date).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}</>
              )}
              {coupleData.venue_name && <> at {coupleData.venue_name}</>}
              {coupleData.venue_location && <> in {coupleData.venue_location}</>}
            </>
          ) : (
            'Let\'s make your dream wedding a reality. Here\'s your planning dashboard.'
          )}
        </p>
      </div>

      {/* Quick Stats/Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-sm font-medium text-gray-500 mb-2">Days Until Wedding</div>
          <div className="text-2xl font-bold text-gray-900">{daysUntilWedding}</div>
          {coupleData?.wedding_date && (
            <div className="text-xs text-gray-500 mt-1">
              {new Date(coupleData.wedding_date).toLocaleDateString()}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-sm font-medium text-gray-500 mb-2">Total Budget</div>
          <div className="text-2xl font-bold text-gray-900">
            {coupleData?.budget_total ? `$${Number(coupleData.budget_total).toLocaleString()}` : '$--'}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-sm font-medium text-gray-500 mb-2">Expected Guests</div>
          <div className="text-2xl font-bold text-gray-900">
            {coupleData?.guest_count_estimate || '--'}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-sm font-medium text-gray-500 mb-2">Wedding Style</div>
          <div className="text-xl font-bold text-gray-900">
            {coupleData?.wedding_style || 'Not Set'}
          </div>
        </div>
      </div>

      {/* Wedding Details Card - if data exists */}
      {coupleData && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Wedding Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Couple</p>
              <p className="font-medium">{coupleData.partner1_name} & {coupleData.partner2_name || 'Partner'}</p>
            </div>
            {coupleData.wedding_date && (
              <div>
                <p className="text-sm text-gray-500">Wedding Date</p>
                <p className="font-medium">
                  {new Date(coupleData.wedding_date).toLocaleDateString('en-US', { 
                    weekday: 'long',
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            )}
            {coupleData.venue_name && (
              <div>
                <p className="text-sm text-gray-500">Venue</p>
                <p className="font-medium">{coupleData.venue_name}</p>
              </div>
            )}
            {coupleData.venue_location && (
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium">{coupleData.venue_location}</p>
              </div>
            )}
            {coupleData.wedding_style && (
              <div>
                <p className="text-sm text-gray-500">Style</p>
                <p className="font-medium">{coupleData.wedding_style}</p>
              </div>
            )}
            {coupleData.guest_count_estimate && (
              <div>
                <p className="text-sm text-gray-500">Expected Guests</p>
                <p className="font-medium">{coupleData.guest_count_estimate} guests</p>
              </div>
            )}
            {coupleData.budget_total && (
              <div>
                <p className="text-sm text-gray-500">Total Budget</p>
                <p className="font-medium">${Number(coupleData.budget_total).toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/dashboard/budget"
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">💰</div>
              <h3 className="font-medium text-gray-900">Manage Budget</h3>
              <p className="text-sm text-gray-500">Track expenses and payments</p>
            </div>
          </Link>

          <Link
            href="/dashboard/guests"
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">👥</div>
              <h3 className="font-medium text-gray-900">Guest List</h3>
              <p className="text-sm text-gray-500">Manage invitations and RSVPs</p>
            </div>
          </Link>

          <Link
            href="/dashboard/vendors"
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">🏪</div>
              <h3 className="font-medium text-gray-900">Vendors</h3>
              <p className="text-sm text-gray-500">Find and manage vendors</p>
            </div>
          </Link>

          <Link
            href="/dashboard/photos"
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">📸</div>
              <h3 className="font-medium text-gray-900">Photos</h3>
              <p className="text-sm text-gray-500">Wedding photo gallery</p>
            </div>
          </Link>

          <Link
            href="/dashboard/checklist"
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">📋</div>
              <h3 className="font-medium text-gray-900">Checklist</h3>
              <p className="text-sm text-gray-500">Planning tasks</p>
            </div>
          </Link>

          <Link
            href="/dashboard/messages"
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">✉️</div>
              <h3 className="font-medium text-gray-900">Messages</h3>
              <p className="text-sm text-gray-500">Email & SMS</p>
            </div>
          </Link>

          <Link
            href="/dashboard/settings"
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">⚙️</div>
              <h3 className="font-medium text-gray-900">Settings</h3>
              <p className="text-sm text-gray-500">Account and preferences</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Getting Started - only show if no onboarding data */}
      {!coupleData?.onboarding_completed && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Getting Started</h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <span className="text-gray-700">Complete your wedding details</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gray-300 text-white rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <span className="text-gray-500">Create your guest list</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gray-300 text-white rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <span className="text-gray-500">Set up your wedding budget</span>
            </div>
          </div>
          <div className="mt-4">
            <Link
              href="/onboarding"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Complete Setup
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}