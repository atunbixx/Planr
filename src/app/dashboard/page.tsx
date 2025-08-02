'use client'

import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

// New York Magazine-inspired components with sophisticated styling
const Card = ({ children, className = '', ...props }: any) => (
  <div 
    style={{
      backgroundColor: '#ffffff',
      borderRadius: '2px',
      border: '1px solid #e8e8e8',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.08)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative' as const,
      overflow: 'hidden' as const
    }}
    {...props}
  >
    <div style={{
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      height: '2px',
      background: 'linear-gradient(90deg, #000000 0%, #333333 100%)'
    }} />
    {children}
  </div>
)

const CardHeader = ({ children, ...props }: any) => (
  <div 
    style={{ 
      padding: '32px 32px 16px 32px',
      borderBottom: '1px solid #f5f5f5'
    }}
    {...props}
  >
    {children}
  </div>
)

const CardTitle = ({ children, className = '', ...props }: any) => (
  <h3 
    style={{
      fontSize: '16px',
      fontWeight: '600',
      color: '#000000',
      margin: '0',
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      letterSpacing: '-0.01em',
      textTransform: 'uppercase' as const,
      lineHeight: '1.2'
    }}
    {...props}
  >
    {children}
  </h3>
)

const CardContent = ({ children, className = '', ...props }: any) => (
  <div 
    style={{ padding: '24px 32px 32px 32px' }}
    {...props}
  >
    {children}
  </div>
)

const Button = ({ children, variant = 'primary', size = 'md', asChild, ...props }: any) => {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '0px',
    fontWeight: '500',
    textDecoration: 'none',
    cursor: 'pointer',
    border: '2px solid transparent',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    position: 'relative' as const,
    overflow: 'hidden' as const
  }
  
  const sizeStyles = {
    sm: { padding: '10px 20px', fontSize: '11px' },
    md: { padding: '12px 24px', fontSize: '12px' },
    lg: { padding: '16px 32px', fontSize: '13px' }
  }
  
  const variantStyles = {
    primary: {
      backgroundColor: '#000000',
      color: '#ffffff',
      borderColor: '#000000'
    },
    secondary: {
      backgroundColor: 'transparent',
      color: '#000000',
      borderColor: '#000000'
    }
  }
  
  const style = {
    ...baseStyle,
    ...sizeStyles[size],
    ...variantStyles[variant]
  }
  
  if (asChild) {
    return <div style={style} {...props}>{children}</div>
  }
  
  return <button style={style} {...props}>{children}</button>
}

export default function DashboardPage() {
  const { user, couple, loading, error } = useAuth()

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Authentication Error</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  if (!user || !couple) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    )
  }

  // Calculate days until wedding
  const daysUntilWedding = couple.wedding_date 
    ? Math.ceil((new Date(couple.wedding_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const quickActions = [
    { title: 'Add Vendor', description: 'Find and add wedding vendors', href: '/dashboard/vendors', icon: '🏪' },
    { title: 'Invite Guests', description: 'Manage your guest list', href: '/dashboard/guests', icon: '👥' },
    { title: 'Track Budget', description: 'Monitor your expenses', href: '/dashboard/budget', icon: '💰' },
    { title: 'Budget Analytics', description: 'Detailed budget tracking', href: '/dashboard/budget/analytics', icon: '📊' },
    { title: 'Create Task', description: 'Add planning tasks', href: '/dashboard/tasks', icon: '✅' },
  ]

  return (
    <div style={{ 
      backgroundColor: '#fafafa', 
      minHeight: '100vh',
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
    }}>
      {/* Hero Section - New York Magazine Style */}
      <div style={{
        background: 'linear-gradient(180deg, #ffffff 0%, #f8f8f8 100%)',
        borderBottom: '1px solid #e8e8e8',
        padding: '48px 32px 64px 32px'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '2fr 1fr', 
            gap: '64px', 
            alignItems: 'center',
            '@media (max-width: 768px)': {
              gridTemplateColumns: '1fr',
              gap: '32px'
            }
          }}>
            <div>
              <div style={{
                fontSize: '11px',
                fontWeight: '500',
                color: '#666666',
                textTransform: 'uppercase' as const,
                letterSpacing: '1px',
                marginBottom: '16px',
                fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
              }}>
                Wedding Planning Dashboard
              </div>
              <h1 style={{
                fontSize: '48px',
                fontWeight: '300',
                color: '#000000',
                marginBottom: '24px',
                fontFamily: '"Times New Roman", Times, serif',
                lineHeight: '1.1',
                letterSpacing: '-0.02em'
              }}>
                Welcome back,<br />
                <span style={{ fontStyle: 'italic' }}>{couple.partner1_name}</span>
              </h1>
              <p style={{
                fontSize: '18px',
                color: '#333333',
                marginBottom: '32px',
                lineHeight: '1.6',
                fontWeight: '400',
                maxWidth: '500px'
              }}>
                {daysUntilWedding !== null ? (
                  daysUntilWedding > 0 ? (
                    <>Your wedding is in <strong style={{ color: '#000000' }}>{daysUntilWedding} days</strong>. Every detail matters.</>
                  ) : daysUntilWedding === 0 ? (
                    <>Today is your wedding day. Congratulations on this momentous occasion.</>
                  ) : (
                    <>We hope your wedding was everything you dreamed it would be.</>
                  )
                ) : (
                  <>Let's craft the perfect wedding day, one detail at a time.</>
                )}
              </p>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <Link href="/dashboard/vendors" style={{ textDecoration: 'none' }}>
                  <Button size="lg">Continue Planning</Button>
                </Link>
                <Link href="/dashboard/timeline" style={{ textDecoration: 'none' }}>
                  <Button variant="secondary" size="lg">View Timeline</Button>
                </Link>
              </div>
            </div>
            
            {/* Elegant Stats Panel */}
            <div style={{
              backgroundColor: '#000000',
              color: '#ffffff',
              padding: '40px',
              position: 'relative' as const
            }}>
              <div style={{
                position: 'absolute' as const,
                top: '16px',
                right: '16px',
                fontSize: '11px',
                color: '#999999',
                textTransform: 'uppercase' as const,
                letterSpacing: '1px'
              }}>
                At a Glance
              </div>
              <div style={{ marginTop: '24px' }}>
                <div style={{ marginBottom: '32px' }}>
                  <div style={{
                    fontSize: '36px',
                    fontWeight: '300',
                    fontFamily: '"Times New Roman", Times, serif',
                    marginBottom: '4px'
                  }}>
                    {daysUntilWedding || '—'}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#cccccc',
                    textTransform: 'uppercase' as const,
                    letterSpacing: '1px'
                  }}>
                    Days Until Wedding
                  </div>
                </div>
                
                <div style={{ marginBottom: '32px' }}>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: '300',
                    fontFamily: '"Times New Roman", Times, serif',
                    marginBottom: '4px'
                  }}>
                    ${((couple as any).budget_total || (couple as any).total_budget || 50000).toLocaleString()}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#cccccc',
                    textTransform: 'uppercase' as const,
                    letterSpacing: '1px'
                  }}>
                    Total Budget
                  </div>
                </div>
                
                <div>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: '300',
                    fontFamily: '"Times New Roman", Times, serif',
                    marginBottom: '4px'
                  }}>
                    {(couple as any).guest_count_estimate || couple.estimated_guests || 0}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#cccccc',
                    textTransform: 'uppercase' as const,
                    letterSpacing: '1px'
                  }}>
                    Expected Guests
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '48px 32px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>

          {/* Section Header */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '300',
              color: '#000000',
              marginBottom: '8px',
              fontFamily: '"Times New Roman", Times, serif',
              letterSpacing: '-0.01em'
            }}>
              Wedding Overview
            </h2>
            <div style={{
              width: '60px',
              height: '1px',
              backgroundColor: '#000000',
              marginBottom: '16px'
            }} />
            <p style={{
              fontSize: '14px',
              color: '#666666',
              lineHeight: '1.5',
              maxWidth: '600px'
            }}>
              A comprehensive view of your wedding details, budget allocation, and planning progress.
            </p>
          </div>

          {/* Wedding Overview Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '32px'
          }}>
            <Card>
              <CardHeader>
                <CardTitle>
                  Wedding Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                    <span style={{ fontSize: '12px', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</span>
                    <span style={{ fontSize: '14px', color: '#000000', fontWeight: '500' }}>
                      {couple.wedding_date ? new Date(couple.wedding_date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) : 'Not set'}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                    <span style={{ fontSize: '12px', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Venue</span>
                    <span style={{ fontSize: '14px', color: '#000000', fontWeight: '500', textAlign: 'right' }}>
                      {(couple as any).venue_name || 'Not selected'}
                    </span>
                  </div>
                  
                  {(couple as any).venue_location && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                      <span style={{ fontSize: '12px', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Location</span>
                      <span style={{ fontSize: '14px', color: '#000000', fontWeight: '500' }}>
                        {(couple as any).venue_location}
                      </span>
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                    <span style={{ fontSize: '12px', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Style</span>
                    <span style={{ fontSize: '14px', color: '#000000', fontWeight: '500', fontStyle: 'italic' }}>
                      {(couple as any).wedding_style || 'Classic'}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Guests</span>
                    <span style={{ fontSize: '14px', color: '#000000', fontWeight: '500' }}>
                      {(couple as any).guest_count_estimate || couple.estimated_guests || 0} expected
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  Budget Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <div style={{ 
                    fontSize: '42px', 
                    fontWeight: '300', 
                    color: '#000000', 
                    margin: '0 0 8px 0',
                    fontFamily: '"Times New Roman", Times, serif',
                    letterSpacing: '-0.02em'
                  }}>
                    ${((couple as any).budget_total || (couple as any).total_budget || 50000).toLocaleString()}
                  </div>
                  <div style={{ 
                    fontSize: '11px', 
                    color: '#666666', 
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    Total Allocated Budget
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: '1px solid #f0f0f0'
                  }}>
                    <span style={{ fontSize: '12px', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Spent</span>
                    <span style={{ fontSize: '16px', fontWeight: '500', color: '#000000' }}>$0</span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '12px 0'
                  }}>
                    <span style={{ fontSize: '12px', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Available</span>
                    <span style={{ fontSize: '16px', fontWeight: '500', color: '#000000' }}>
                      ${((couple as any).budget_total || (couple as any).total_budget || 50000).toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <div style={{
                  width: '100%',
                  backgroundColor: '#f0f0f0',
                  height: '2px',
                  marginTop: '24px',
                  position: 'relative' as const
                }}>
                  <div style={{
                    backgroundColor: '#000000',
                    height: '2px',
                    width: '0%',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
                <div style={{
                  fontSize: '10px',
                  color: '#999999',
                  textAlign: 'center',
                  marginTop: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  0% Utilized
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  Planning Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <div style={{ 
                    fontSize: '48px', 
                    fontWeight: '300', 
                    color: '#000000', 
                    margin: '0 0 8px 0',
                    fontFamily: '"Times New Roman", Times, serif'
                  }}>
                    15<span style={{ fontSize: '24px', color: '#666666' }}>%</span>
                  </div>
                  <div style={{ 
                    fontSize: '11px', 
                    color: '#666666', 
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    Overall Completion
                  </div>
                </div>
                
                <div style={{
                  width: '100%',
                  backgroundColor: '#f0f0f0',
                  height: '2px',
                  marginBottom: '32px',
                  position: 'relative' as const
                }}>
                  <div style={{
                    backgroundColor: '#000000',
                    height: '2px',
                    width: '15%',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: '1px solid #f8f8f8'
                  }}>
                    <span style={{ fontSize: '12px', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vendors</span>
                    <span style={{ fontSize: '14px', color: '#999999', fontStyle: 'italic' }}>0 secured</span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: '1px solid #f8f8f8'
                  }}>
                    <span style={{ fontSize: '12px', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tasks</span>
                    <span style={{ fontSize: '14px', color: '#999999', fontStyle: 'italic' }}>0 completed</span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '8px 0'
                  }}>
                    <span style={{ fontSize: '12px', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Invitations</span>
                    <span style={{ fontSize: '14px', color: '#999999', fontStyle: 'italic' }}>0 sent</span>
                  </div>
                </div>
              </CardContent>
            </Card>
        </div>

          {/* Quick Actions Section */}
          <div>
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{
                fontSize: '28px',
                fontWeight: '300',
                color: '#000000',
                marginBottom: '8px',
                fontFamily: '"Times New Roman", Times, serif',
                letterSpacing: '-0.01em'
              }}>
                Essential Actions
              </h2>
              <div style={{
                width: '60px',
                height: '1px',
                backgroundColor: '#000000',
                marginBottom: '16px'
              }} />
              <p style={{
                fontSize: '14px',
                color: '#666666',
                lineHeight: '1.5',
                maxWidth: '600px'
              }}>
                Begin your wedding planning journey with these carefully curated next steps.
              </p>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px'
            }}>
              {quickActions.map((action, index) => (
                <Link key={action.title} href={action.href} style={{ textDecoration: 'none' }}>
                  <div style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e8e8e8',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    position: 'relative' as const,
                    overflow: 'hidden' as const,
                    height: '200px',
                    display: 'flex',
                    flexDirection: 'column' as const,
                    justifyContent: 'space-between'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)'
                  }}>
                    
                    {/* Number indicator */}
                    <div style={{
                      position: 'absolute' as const,
                      top: '20px',
                      right: '20px',
                      width: '24px',
                      height: '24px',
                      backgroundColor: '#000000',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}>
                      {index + 1}
                    </div>
                    
                    <div style={{ padding: '32px 24px 0 24px' }}>
                      <div style={{
                        fontSize: '32px',
                        marginBottom: '16px',
                        opacity: 0.8
                      }}>
                        {action.icon}
                      </div>
                      <h3 style={{
                        fontSize: '18px',
                        fontWeight: '500',
                        color: '#000000',
                        marginBottom: '8px',
                        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                        letterSpacing: '-0.01em'
                      }}>
                        {action.title}
                      </h3>
                      <p style={{
                        fontSize: '13px',
                        color: '#666666',
                        lineHeight: '1.4',
                        marginBottom: '0'
                      }}>
                        {action.description}
                      </p>
                    </div>
                    
                    <div style={{
                      padding: '0 24px 24px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <span style={{
                        fontSize: '10px',
                        color: '#999999',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        fontWeight: '500'
                      }}>
                        Begin Setup
                      </span>
                      <div style={{
                        width: '20px',
                        height: '1px',
                        backgroundColor: '#000000'
                      }} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity Section */}
          <div>
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{
                fontSize: '28px',
                fontWeight: '300',
                color: '#000000',
                marginBottom: '8px',
                fontFamily: '"Times New Roman", Times, serif',
                letterSpacing: '-0.01em'
              }}>
                Recent Activity
              </h2>
              <div style={{
                width: '60px',
                height: '1px',
                backgroundColor: '#000000',
                marginBottom: '16px'
              }} />
              <p style={{
                fontSize: '14px',
                color: '#666666',
                lineHeight: '1.5',
                maxWidth: '600px'
              }}>
                Track your planning progress and stay updated on all wedding-related activities.
              </p>
            </div>
            
            <Card>
              <CardContent style={{ padding: '64px 48px', textAlign: 'center' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  backgroundColor: '#f8f8f8',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px auto',
                  border: '1px solid #e8e8e8'
                }}>
                  <span style={{ fontSize: '32px', opacity: 0.6 }}>📝</span>
                </div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '300',
                  color: '#000000',
                  marginBottom: '12px',
                  fontFamily: '"Times New Roman", Times, serif'
                }}>
                  Your Planning Journey Begins
                </h3>
                <p style={{
                  color: '#666666',
                  marginBottom: '32px',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  maxWidth: '400px',
                  margin: '0 auto 32px auto'
                }}>
                  Once you begin adding vendors, creating tasks, and managing your guest list, 
                  all activity will appear here for easy tracking.
                </p>
                <Link href="/dashboard/vendors" style={{ textDecoration: 'none' }}>
                  <Button size="lg">Begin Planning</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}