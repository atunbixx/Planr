'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, Calendar, DollarSign, Users, CheckSquare } from 'lucide-react'
import { monitoring } from '@/lib/monitoring'

export default function Home() {
  // Track page view
  useEffect(() => {
    monitoring.trackPageView('/')
  }, [])
  
  // Track user interactions
  const trackCTAClick = (location: string) => {
    monitoring.trackUserAction('cta_click', { location, page: 'home' })
  }
  const [currentSlide, setCurrentSlide] = useState(0)
  
  const heroImages = [
    'Modern couples deserve modern tools',
    'Plan every detail with precision',
    'Your wedding, perfectly orchestrated'
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [heroImages.length])

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#FFFFFF',
      fontFamily: '"Inter", -apple-system, sans-serif'
    }}>
      {/* Navigation Bar */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #E5E5E5',
        zIndex: 50,
        padding: '1.5rem 0'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: '1.75rem',
              fontWeight: '700',
              color: '#000000',
              margin: 0
            }}>
              Wedding Studio
            </h1>
            <div style={{
              width: '30px',
              height: '2px',
              backgroundColor: '#FF3366',
              marginTop: '0.25rem'
            }} />
          </div>
          
          <div style={{
            display: 'flex',
            gap: '2rem',
            alignItems: 'center'
          }}>
            <Link href="/auth/login" style={{
              fontSize: '0.875rem',
              color: '#000000',
              textDecoration: 'none',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Sign In
            </Link>
            <Link href="/auth/signup" style={{
              padding: '0.75rem 2rem',
              backgroundColor: '#000000',
              color: '#FFFFFF',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              transition: 'all 0.2s ease'
            }}>
              Start Planning
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        paddingTop: '120px',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#000000',
          opacity: 0.05,
          zIndex: -1
        }} />
        
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 2rem',
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4rem',
          alignItems: 'center'
        }}>
          <div>
            <p style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#FF3366',
              marginBottom: '1rem',
              fontWeight: '600'
            }}>
              The New Standard in Wedding Planning
            </p>
            
            <h2 style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: '4.5rem',
              fontWeight: '700',
              lineHeight: '1.1',
              color: '#000000',
              marginBottom: '2rem'
            }}>
              {heroImages[currentSlide]}
            </h2>
            
            <p style={{
              fontSize: '1.25rem',
              lineHeight: '1.75',
              color: '#404040',
              marginBottom: '3rem',
              maxWidth: '500px'
            }}>
              Sophisticated tools for the discerning couple. Plan your wedding with the elegance it deserves.
            </p>
            
            <div style={{
              display: 'flex',
              gap: '1.5rem',
              alignItems: 'center'
            }}>
              <Link href="/auth/signup" 
                onClick={() => trackCTAClick('hero')}
                style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem 2.5rem',
                backgroundColor: '#000000',
                color: '#FFFFFF',
                textDecoration: 'none',
                fontSize: '1rem',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}>
                Begin Your Journey
                <ArrowRight size={18} />
              </Link>
              
              <Link href="#features" style={{
                fontSize: '1rem',
                color: '#000000',
                textDecoration: 'underline',
                textUnderlineOffset: '4px',
                fontWeight: '500'
              }}>
                Explore Features
              </Link>
            </div>
            
            {/* Hero Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '2rem',
              marginTop: '4rem',
              paddingTop: '4rem',
              borderTop: '1px solid #E5E5E5'
            }}>
              <div>
                <p style={{
                  fontSize: '2.5rem',
                  fontWeight: '700',
                  color: '#000000',
                  marginBottom: '0.25rem'
                }}>
                  10K+
                </p>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#737373',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Weddings Planned
                </p>
              </div>
              <div>
                <p style={{
                  fontSize: '2.5rem',
                  fontWeight: '700',
                  color: '#000000',
                  marginBottom: '0.25rem'
                }}>
                  98%
                </p>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#737373',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Satisfaction Rate
                </p>
              </div>
              <div>
                <p style={{
                  fontSize: '2.5rem',
                  fontWeight: '700',
                  color: '#000000',
                  marginBottom: '0.25rem'
                }}>
                  $2M+
                </p>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#737373',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Budget Managed
                </p>
              </div>
            </div>
          </div>
          
          {/* Hero Visual */}
          <div style={{
            position: 'relative',
            height: '600px',
            backgroundColor: '#FAFAFA',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              inset: '2rem',
              backgroundColor: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                textAlign: 'center',
                color: '#FFFFFF'
              }}>
                <Calendar size={60} style={{ marginBottom: '1rem', opacity: 0.9 }} />
                <p style={{
                  fontSize: '1.125rem',
                  fontWeight: '300',
                  letterSpacing: '0.05em'
                }}>
                  WEDDING STUDIO
                </p>
              </div>
            </div>
            
            {/* Slide Indicators */}
            <div style={{
              position: 'absolute',
              bottom: '2rem',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '0.5rem'
            }}>
              {heroImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  style={{
                    width: currentSlide === index ? '24px' : '8px',
                    height: '8px',
                    backgroundColor: currentSlide === index ? '#000000' : '#D4D4D4',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{
        padding: '6rem 0',
        backgroundColor: '#FAFAFA'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 2rem'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '4rem'
          }}>
            <p style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#FF3366',
              marginBottom: '1rem',
              fontWeight: '600'
            }}>
              Comprehensive Planning Tools
            </p>
            <h3 style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: '3rem',
              fontWeight: '700',
              color: '#000000',
              marginBottom: '1rem'
            }}>
              Everything You Need, Nothing You Don't
            </h3>
            <p style={{
              fontSize: '1.125rem',
              color: '#737373',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: '1.75'
            }}>
              Curated features designed for the modern couple who values both sophistication and simplicity.
            </p>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '3rem'
          }}>
            {[
              {
                icon: DollarSign,
                title: 'Budget Intelligence',
                description: 'Advanced analytics and real-time tracking ensure every dollar is purposefully allocated.',
                stats: 'Average savings: 23%'
              },
              {
                icon: Users,
                title: 'Guest Management',
                description: 'Elegant RSVP tracking, dietary preferences, and seating arrangements in one place.',
                stats: 'Up to 500 guests'
              },
              {
                icon: CheckSquare,
                title: 'Task Orchestration',
                description: 'Intelligent task prioritization keeps your planning on schedule and stress-free.',
                stats: '200+ task templates'
              },
              {
                icon: Calendar,
                title: 'Timeline Design',
                description: 'Craft the perfect wedding day schedule with minute-by-minute precision.',
                stats: 'Unlimited revisions'
              }
            ].map((feature, index) => (
              <div 
                key={index}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E5E5',
                  padding: '3rem',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#000000'
                  e.currentTarget.style.transform = 'translateY(-4px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E5E5'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '2rem'
                }}>
                  <div style={{
                    padding: '1rem',
                    backgroundColor: '#FAFAFA',
                    display: 'inline-flex'
                  }}>
                    <feature.icon size={24} color="#000000" />
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <h4 style={{
                      fontSize: '1.5rem',
                      fontWeight: '600',
                      color: '#000000',
                      marginBottom: '0.75rem'
                    }}>
                      {feature.title}
                    </h4>
                    
                    <p style={{
                      fontSize: '1rem',
                      color: '#737373',
                      lineHeight: '1.75',
                      marginBottom: '1.5rem'
                    }}>
                      {feature.description}
                    </p>
                    
                    <p style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#000000',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {feature.stats}
                    </p>
                  </div>
                </div>
                
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  fontSize: '3rem',
                  fontWeight: '700',
                  color: '#FAFAFA',
                  fontFamily: '"Playfair Display", serif'
                }}>
                  {String(index + 1).padStart(2, '0')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Editorial Quote Section */}
      <section style={{
        padding: '6rem 0',
        backgroundColor: '#000000',
        color: '#FFFFFF'
      }}>
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto',
          padding: '0 2rem',
          textAlign: 'center'
        }}>
          <blockquote style={{
            fontSize: '2.5rem',
            fontFamily: '"Playfair Display", serif',
            fontWeight: '300',
            lineHeight: '1.4',
            marginBottom: '2rem',
            fontStyle: 'italic'
          }}>
            "The most sophisticated wedding planning platform we've encountered. 
            A masterclass in both design and functionality."
          </blockquote>
          <cite style={{
            fontSize: '0.875rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontStyle: 'normal',
            color: '#A3A3A3'
          }}>
            — Modern Wedding Magazine
          </cite>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '6rem 0',
        backgroundColor: '#FFFFFF'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '0 2rem',
          textAlign: 'center'
        }}>
          <h3 style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: '3rem',
            fontWeight: '700',
            color: '#000000',
            marginBottom: '1.5rem'
          }}>
            Ready to Begin?
          </h3>
          <p style={{
            fontSize: '1.25rem',
            color: '#737373',
            marginBottom: '3rem',
            lineHeight: '1.75'
          }}>
            Join thousands of couples who've discovered a better way to plan their perfect day.
          </p>
          <Link href="/auth/signup" 
            onClick={() => trackCTAClick('bottom')}
            style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1.25rem 3rem',
            backgroundColor: '#FF3366',
            color: '#FFFFFF',
            textDecoration: 'none',
            fontSize: '1rem',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            transition: 'all 0.2s ease'
          }}>
            Start Your Free Trial
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '3rem 0',
        backgroundColor: '#FAFAFA',
        borderTop: '1px solid #E5E5E5'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <p style={{
              fontSize: '0.875rem',
              color: '#737373'
            }}>
              © 2024 Wedding Studio. All rights reserved.
            </p>
          </div>
          <div style={{
            display: 'flex',
            gap: '2rem'
          }}>
            <Link href="/privacy" style={{
              fontSize: '0.875rem',
              color: '#737373',
              textDecoration: 'none'
            }}>
              Privacy
            </Link>
            <Link href="/terms" style={{
              fontSize: '0.875rem',
              color: '#737373',
              textDecoration: 'none'
            }}>
              Terms
            </Link>
            <Link href="/contact" style={{
              fontSize: '0.875rem',
              color: '#737373',
              textDecoration: 'none'
            }}>
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}