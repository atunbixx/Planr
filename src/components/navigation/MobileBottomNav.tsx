'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUnreadMessages } from '@/hooks/useUnreadMessages'

interface NavItem {
  name: string
  href: string
  icon: string
  badge?: boolean
}

export function MobileBottomNav() {
  const pathname = usePathname()
  const { unreadCount } = useUnreadMessages()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [showMenu, setShowMenu] = useState(false)

  // Primary navigation items for mobile
  const navItems: NavItem[] = [
    { name: 'Home', href: '/dashboard', icon: 'fas fa-home' },
    { name: 'Vendors', href: '/dashboard/vendors', icon: 'fas fa-store' },
    { name: 'Marketplace', href: '/dashboard/marketplace', icon: 'fas fa-shopping-bag' },
    { name: 'Messages', href: '/dashboard/messages', icon: 'fas fa-comments', badge: true },
    { name: 'Menu', href: '#', icon: 'fas fa-bars' },
  ]

  // Additional menu items
  const menuItems = [
    { name: 'Guests', href: '/dashboard/guests', icon: 'fas fa-users' },
    { name: 'RSVP', href: '/dashboard/rsvp', icon: 'fas fa-envelope-open-text' },
    { name: 'Tasks', href: '/dashboard/tasks', icon: 'fas fa-tasks' },
    { name: 'Timeline', href: '/dashboard/timeline', icon: 'fas fa-calendar' },
    { name: 'Calendar', href: '/dashboard/calendar', icon: 'fas fa-calendar-check' },
    { name: 'Photos', href: '/dashboard/photos', icon: 'fas fa-camera' },
    { name: 'Seating', href: '/dashboard/seating', icon: 'fas fa-chair' },
    { name: 'Settings', href: '/dashboard/settings', icon: 'fas fa-cog' },
  ]

  // Hide/show nav on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY < 50) {
        setIsVisible(true)
      } else if (currentScrollY > lastScrollY) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Close menu when route changes
  useEffect(() => {
    setShowMenu(false)
  }, [pathname])

  const handleNavClick = (item: NavItem, e: React.MouseEvent) => {
    if (item.name === 'Menu') {
      e.preventDefault()
      setShowMenu(!showMenu)
    }
  }

  // Add ripple effect on touch
  const handleTouchStart = (e: React.TouchEvent<HTMLAnchorElement>) => {
    const button = e.currentTarget
    const rect = button.getBoundingClientRect()
    const ripple = document.createElement('span')
    const size = Math.max(rect.width, rect.height)
    const x = e.touches[0].clientX - rect.left - size / 2
    const y = e.touches[0].clientY - rect.top - size / 2
    
    ripple.style.width = ripple.style.height = size + 'px'
    ripple.style.left = x + 'px'
    ripple.style.top = y + 'px'
    ripple.classList.add('ripple')
    
    button.appendChild(ripple)
    
    setTimeout(() => {
      ripple.remove()
    }, 600)
  }

  return (
    <>
      {/* Mobile Bottom Navigation - Only visible on mobile */}
      <nav
        className={`
          md:hidden fixed bottom-0 left-0 right-0 z-50
          transition-transform duration-300 ease-in-out
          ${isVisible ? 'translate-y-0' : 'translate-y-full'}
        `}
        style={{
          backgroundColor: '#ffffff',
          borderTop: '1px solid #e5e7eb',
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}
      >
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.name === 'Menu' && showMenu)
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={(e) => handleNavClick(item, e)}
                onTouchStart={handleTouchStart}
                className="relative flex flex-col items-center justify-center min-touch-target touch-manipulation select-none"
                style={{
                  color: isActive ? '#000000' : '#6b7280',
                  transition: 'all 0.2s ease',
                }}
              >
                <div className="relative">
                  <i 
                    className={item.icon} 
                    style={{ 
                      fontSize: '20px',
                      transition: 'transform 0.2s ease',
                      transform: isActive ? 'scale(1.1)' : 'scale(1)',
                    }}
                  />
                  {item.badge && unreadCount > 0 && (
                    <span 
                      className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium"
                      style={{ fontSize: '10px' }}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <span 
                  className="text-xs mt-1 font-medium"
                  style={{
                    opacity: isActive ? 1 : 0.8,
                    transform: isActive ? 'scale(1)' : 'scale(0.95)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {item.name}
                </span>
                {isActive && (
                  <span 
                    className="absolute top-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-black transition-all duration-300"
                    style={{ width: '32px' }}
                  />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Slide-up Menu Overlay */}
      <div
        className={`
          md:hidden fixed inset-0 z-40 transition-all duration-300
          ${showMenu ? 'pointer-events-auto' : 'pointer-events-none'}
        `}
        onClick={() => setShowMenu(false)}
      >
        <div 
          className={`
            absolute inset-0 bg-black transition-opacity duration-300
            ${showMenu ? 'opacity-50' : 'opacity-0'}
          `}
        />
        <div
          className={`
            absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl
            transition-transform duration-300 ease-out transform
            ${showMenu ? 'translate-y-0' : 'translate-y-full'}
          `}
          style={{
            paddingBottom: 'calc(env(safe-area-inset-bottom) + 64px)',
            maxHeight: '70vh',
            boxShadow: '0 -10px 25px -5px rgba(0, 0, 0, 0.1), 0 -10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle */}
          <div className="flex justify-center py-3">
            <div className="w-12 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* Menu Header */}
          <div className="px-6 pb-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">More Options</h3>
          </div>

          {/* Menu Items */}
          <div className="px-4 py-4 overflow-y-auto momentum-scrolling" style={{ maxHeight: '50vh' }}>
            <div className="grid grid-cols-3 gap-4">
              {menuItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex flex-col items-center justify-center p-4 rounded-xl touch-manipulation select-none"
                    style={{
                      backgroundColor: isActive ? '#f3f4f6' : 'transparent',
                      transition: 'all 0.2s ease',
                    }}
                    onTouchStart={(e) => {
                      e.currentTarget.style.backgroundColor = '#e5e7eb'
                    }}
                    onTouchEnd={(e) => {
                      setTimeout(() => {
                        e.currentTarget.style.backgroundColor = isActive ? '#f3f4f6' : 'transparent'
                      }, 150)
                    }}
                  >
                    <i 
                      className={item.icon} 
                      style={{ 
                        fontSize: '24px',
                        color: isActive ? '#000000' : '#6b7280',
                        marginBottom: '8px'
                      }}
                    />
                    <span 
                      className="text-xs font-medium text-center"
                      style={{ color: isActive ? '#000000' : '#6b7280' }}
                    >
                      {item.name}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Styles for ripple effect */}
      <style jsx global>{`
        .ripple {
          position: absolute;
          border-radius: 50%;
          background-color: rgba(0, 0, 0, 0.1);
          transform: translate(-50%, -50%) scale(0);
          animation: ripple 600ms ease-out;
          pointer-events: none;
        }

        @keyframes ripple {
          to {
            transform: translate(-50%, -50%) scale(4);
            opacity: 0;
          }
        }

        /* Prevent body scroll when menu is open */
        ${showMenu ? `
          body {
            overflow: hidden;
          }
        ` : ''}
      `}</style>
    </>
  )
}