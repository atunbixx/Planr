'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { cn } from '@/utils/cn';

interface NavItem {
  name: string;
  href: string;
  icon: string;
}

const mainNavItems: NavItem[] = [
  { name: 'Home', href: '/dashboard', icon: 'fas fa-home' },
  { name: 'Vendors', href: '/dashboard/vendors', icon: 'fas fa-store' },
  { name: 'Guests', href: '/dashboard/guests', icon: 'fas fa-users' },
  { name: 'Budget', href: '/dashboard/budget', icon: 'fas fa-dollar-sign' },
  { name: 'More', href: '#', icon: 'fas fa-ellipsis-h' },
];

const moreMenuItems: NavItem[] = [
  { name: 'Messages', href: '/dashboard/messages', icon: 'fas fa-comments' },
  { name: 'RSVP', href: '/dashboard/rsvp', icon: 'fas fa-envelope-open-text' },
  { name: 'Tasks', href: '/dashboard/tasks', icon: 'fas fa-tasks' },
  { name: 'Timeline', href: '/dashboard/timeline', icon: 'fas fa-calendar' },
  { name: 'Calendar', href: '/dashboard/calendar', icon: 'fas fa-calendar-check' },
  { name: 'Photos', href: '/dashboard/photos', icon: 'fas fa-camera' },
  { name: 'Seating', href: '/dashboard/seating', icon: 'fas fa-chair' },
  { name: 'Checklist', href: '/dashboard/checklist', icon: 'fas fa-check-square' },
  { name: 'Settings', href: '/dashboard/settings', icon: 'fas fa-cog' },
];

export function MobileNavigation() {
  const pathname = usePathname();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Hide/show navigation on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < lastScrollY) {
        setIsVisible(true); // Scrolling up
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false); // Scrolling down
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Add haptic feedback for touch
  const handleTouchFeedback = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 transition-transform duration-300 md:hidden",
          isVisible ? "translate-y-0" : "translate-y-full"
        )}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div className="grid grid-cols-5 h-16">
          {mainNavItems.map((item) => {
            const isActive = item.href === '#' ? false : pathname === item.href;
            const isMore = item.name === 'More';

            if (isMore) {
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    handleTouchFeedback();
                    setShowMoreMenu(!showMoreMenu);
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center py-2 px-1 text-xs transition-all duration-200",
                    showMoreMenu ? "text-accent" : "text-gray-600"
                  )}
                >
                  <i className={cn(item.icon, "text-xl mb-1")} />
                  <span className="font-medium">{item.name}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleTouchFeedback}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-1 text-xs transition-all duration-200",
                  isActive
                    ? "text-accent"
                    : "text-gray-600 active:bg-gray-50"
                )}
              >
                <i className={cn(item.icon, "text-xl mb-1")} />
                <span className="font-medium">{item.name}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-accent rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* More Menu Overlay */}
      {showMoreMenu && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setShowMoreMenu(false)}
          />
          <div
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 md:hidden"
            style={{
              paddingBottom: `calc(env(safe-area-inset-bottom) + 80px)`,
              maxHeight: '70vh',
              boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div className="sticky top-0 bg-white rounded-t-2xl">
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-4" />
              <h3 className="text-lg font-semibold text-center mb-4">More Options</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-4 px-4 pb-4 overflow-y-auto">
              {moreMenuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => {
                      handleTouchFeedback();
                      setShowMoreMenu(false);
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-accent/10 text-accent"
                        : "bg-gray-50 text-gray-700 active:bg-gray-100"
                    )}
                  >
                    <i className={cn(item.icon, "text-2xl mb-2")} />
                    <span className="text-xs font-medium text-center">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}