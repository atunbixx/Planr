'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import { useUnreadMessages } from '@/hooks/useUnreadMessages'
import { UnreadBadge } from '@/components/messages/UnreadBadge'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: 'fas fa-home' },
  { name: 'Vendors', href: '/dashboard/vendors', icon: 'fas fa-store' },
  { name: 'Messages', href: '/dashboard/messages', icon: 'fas fa-comments' },
  { name: 'Guests', href: '/dashboard/guests', icon: 'fas fa-users' },
  { name: 'RSVP', href: '/dashboard/rsvp', icon: 'fas fa-envelope-open-text' },
  { name: 'Budget', href: '/dashboard/budget', icon: 'fas fa-dollar-sign' },
  { name: 'Tasks', href: '/dashboard/tasks', icon: 'fas fa-tasks' },
  { name: 'Timeline', href: '/dashboard/timeline', icon: 'fas fa-calendar' },
  { name: 'Calendar', href: '/dashboard/calendar', icon: 'fas fa-calendar-check' },
  { name: 'Photos', href: '/dashboard/photos', icon: 'fas fa-camera' },
  { name: 'Seating', href: '/dashboard/seating', icon: 'fas fa-chair' },
  { name: 'Settings', href: '/dashboard/settings', icon: 'fas fa-cog' },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { unreadCount } = useUnreadMessages()
  
  // Check for demo mode
  const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('demo-mode') === 'true'
  
  // Use demo data for demo mode, otherwise use real auth
  const { user, couple, loading, signOut } = isDemoMode ? {
    user: { id: 'demo-user', email: 'demo@wedding-planner.com' },
    couple: {
      id: 'demo-couple',
      partner1_name: 'Sarah',
      partner2_name: 'John',
      wedding_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      wedding_style: 'romantic',
      guest_count_estimate: 150,
      budget_total: 50000,
      venue_name: 'The Grand Ballroom',
      venue_location: 'New York, NY'
    },
    loading: false,
    signOut: async () => {
      localStorage.removeItem('demo-mode')
      router.push('/')
    }
  } : useAuth()
  
  // Debug logging for dashboard layout
  console.log('🏠 Dashboard Layout State:', { 
    loading, 
    user: !!user, 
    couple: !!couple,
    isDemoMode,
    pathname 
  })

  // Helper function to safely access couple properties with fallbacks
  const getCoupleProperty = (property: string, fallback: any = null) => {
    if (!couple) return fallback
    
    // Handle property name mappings between database and app expectations
    const propertyMappings: Record<string, string> = {
      'venue_name': 'venue_name',
      'venue_location': 'venue_location', 
      'guest_count_estimate': 'guest_count_estimate',
      'budget_total': 'budget_total'
    }
    
    const mappedProperty = propertyMappings[property] || property
    return (couple as any)[mappedProperty] || (couple as any)[property] || fallback
  }

  // More robust authentication check with delayed redirect
  useEffect(() => {
    console.log('🔍 Dashboard auth check:', { 
      loading, 
      user: !!user, 
      userId: user?.id,
      couple: !!couple, 
      pathname,
      timestamp: new Date().toISOString()
    })
    
    // Don't redirect if we're still loading or already on auth pages
    if (loading || pathname === '/auth/signin' || pathname === '/onboarding') {
      console.log('⏳ Still loading or on auth pages, skipping redirect check')
      return
    }
    
    // Give auth context time to initialize after page reload
    const redirectTimeout = setTimeout(() => {
      console.log('🔄 Checking auth status after delay:', { 
        user: !!user, 
        loading,
        userId: user?.id 
      })
      
      if (!user && !loading) {
        console.log('❌ No user found after loading complete, redirecting to sign-in')
        router.push('/auth/signin')
      } else if (user) {
        console.log('✅ User authenticated, staying on dashboard:', user.id)
      }
    }, 2000) // Increased to 2 seconds to ensure auth state is fully loaded
    
    return () => clearTimeout(redirectTimeout)
  }, [user, loading, router, pathname])

  // Redirect to onboarding if no couple profile (with delay)
  useEffect(() => {
    console.log('🔍 Dashboard couple check:', { loading, user: !!user, couple: !!couple, pathname })
    
    // Don't redirect if we're still loading, already on onboarding, or no user
    if (loading || pathname === '/onboarding' || !user) {
      console.log('⏳ Still loading, on onboarding, or no user - skipping couple check')
      return
    }
    
    // Add delay to allow couple data to load
    const coupleTimeout = setTimeout(() => {
      // Only redirect if we have a user but no couple data and we're done loading
      if (!couple) {
        console.log('❌ User exists but no couple data, redirecting to onboarding')
        router.push('/onboarding')
      } else {
        console.log('✅ Couple data found, staying on dashboard')
      }
    }, 2000) // Increased to 2 seconds to allow couple data to load
    
    return () => clearTimeout(coupleTimeout)
  }, [user, couple, loading, router, pathname])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your wedding dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  if (!couple) {
    return null // Will redirect to onboarding
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-paper border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Couple Info */}
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center">
                <h1 className="text-2xl font-serif font-bold text-ink">Wedding Planner</h1>
              </Link>
              <div className="ml-6 pl-6 border-l border-gray-200 hidden sm:block">
                <p className="text-sm font-medium text-gray-700">{couple?.partner1_name}</p>
                {couple?.partner2_name && (
                  <p className="text-sm text-gray-500">& {couple.partner2_name}</p>
                )}
                {couple?.wedding_date && (
                  <p className="text-xs text-gray-400">
                    {new Date(couple.wedding_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Enhanced Sidebar with Wedding Studio Theme */}
        <aside style={{
          width: '280px',
          backgroundColor: '#000000',
          color: '#ffffff',
          minHeight: '100vh',
          position: 'sticky' as const,
          top: '64px',
          fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
        }}>
          <div style={{ padding: '32px 24px 24px 24px' }}>
            <h1 style={{
              fontFamily: '"Times New Roman", Times, serif',
              fontSize: '22px',
              fontWeight: '400',
              color: '#ffffff',
              letterSpacing: '-0.01em'
            }}>
              Wedding Studio
            </h1>
          </div>
          
          <div style={{ padding: '0 24px 32px 24px' }}>
            <p style={{
              fontSize: '10px',
              color: '#999999',
              textTransform: 'uppercase' as const,
              letterSpacing: '1px',
              marginBottom: '12px',
              fontWeight: '500'
            }}>
              Current Project
            </p>
            <p style={{
              color: '#ffffff',
              fontWeight: '500',
              fontSize: '14px',
              lineHeight: '1.4'
            }}>
              {couple?.partner1_name}{couple?.partner2_name ? ` & ${couple.partner2_name}` : ''}
            </p>
          </div>
          
          <nav style={{ padding: '0 16px' }}>
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '16px 16px',
                    fontSize: '12px',
                    fontWeight: '500',
                    textDecoration: 'none',
                    marginBottom: '4px',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    color: isActive ? '#ffffff' : '#cccccc',
                    borderLeft: isActive ? '2px solid #ffffff' : '2px solid transparent',
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.5px'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'
                      e.currentTarget.style.color = '#ffffff'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.color = '#cccccc'
                    }
                  }}
                >
                  <i className={`${item.icon}`} style={{ 
                    width: '16px', 
                    marginRight: '16px',
                    fontSize: '14px',
                    opacity: 0.8
                  }}></i>
                  <span style={{ flex: 1 }}>{item.name}</span>
                  {item.name === 'Messages' && unreadCount > 0 && (
                    <UnreadBadge count={unreadCount} size="sm" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Wedding Project Overview Card */}
          <div style={{
            padding: '32px 24px 24px 24px',
            borderTop: '1px solid #333333',
            marginTop: '32px'
          }}>
            <div style={{
              backgroundColor: '#111111',
              padding: '20px',
              marginBottom: '24px',
              border: '1px solid #222222'
            }}>
              <p style={{
                fontSize: '10px',
                color: '#999999',
                textTransform: 'uppercase' as const,
                letterSpacing: '1px',
                marginBottom: '12px',
                fontWeight: '500'
              }}>
                Project Overview
              </p>
              <h3 style={{
                color: '#ffffff',
                fontWeight: '500',
                marginBottom: '16px',
                fontSize: '14px',
                fontFamily: '"Times New Roman", Times, serif'
              }}>
                Your Perfect Day
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {couple?.wedding_date ? (
                  <div style={{ fontSize: '11px', color: '#cccccc', display: 'flex', alignItems: 'center' }}>
                    <i className="fas fa-calendar" style={{ marginRight: '8px', width: '12px', opacity: 0.7 }}></i>
                    {new Date(couple.wedding_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                ) : (
                  <div style={{ fontSize: '11px', color: '#666666', display: 'flex', alignItems: 'center' }}>
                    <i className="fas fa-calendar" style={{ marginRight: '8px', width: '12px', opacity: 0.7 }}></i>
                    Date not set
                  </div>
                )}
                
                {getCoupleProperty('venue_name') && (
                  <div style={{ fontSize: '11px', color: '#cccccc', display: 'flex', alignItems: 'center' }}>
                    <i className="fas fa-map-marker-alt" style={{ marginRight: '8px', width: '12px', opacity: 0.7 }}></i>
                    {getCoupleProperty('venue_name')}
                  </div>
                )}
                
                <div style={{ fontSize: '11px', color: '#cccccc', display: 'flex', alignItems: 'center' }}>
                  <i className="fas fa-users" style={{ marginRight: '8px', width: '12px', opacity: 0.7 }}></i>
                  {getCoupleProperty('guest_count_estimate', 0)} guests
                </div>
                
                <div style={{ fontSize: '11px', color: '#cccccc', display: 'flex', alignItems: 'center' }}>
                  <i className="fas fa-dollar-sign" style={{ marginRight: '8px', width: '12px', opacity: 0.7 }}></i>
                  ${getCoupleProperty('budget_total', 0)?.toLocaleString()} budget
                </div>
              </div>
            </div>
            
            <Link 
              href="/dashboard/settings" 
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                fontSize: '11px',
                fontWeight: '500',
                textDecoration: 'none',
                marginBottom: '8px',
                color: pathname === '/dashboard/settings' ? '#ffffff' : '#cccccc',
                backgroundColor: pathname === '/dashboard/settings' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.5px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (pathname !== '/dashboard/settings') {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'
                  e.currentTarget.style.color = '#ffffff'
                }
              }}
              onMouseLeave={(e) => {
                if (pathname !== '/dashboard/settings') {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#cccccc'
                }
              }}
            >
              <i className="fas fa-cog" style={{ width: '16px', marginRight: '12px', opacity: 0.7 }}></i>
              Settings
            </Link>
            <button 
              onClick={handleSignOut}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                fontSize: '11px',
                fontWeight: '500',
                width: '100%',
                textAlign: 'left' as const,
                backgroundColor: 'transparent',
                border: 'none',
                color: '#cccccc',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.5px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.color = '#ffffff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = '#cccccc'
              }}
            >
              <i className="fas fa-sign-out-alt" style={{ width: '16px', marginRight: '12px', opacity: 0.7 }}></i>
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}