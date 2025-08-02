'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/utils/cn';
import { useState, useEffect } from 'react';

interface MobileHeaderProps {
  title?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  className?: string;
}

export function MobileHeader({ 
  title = 'Wedding Planner', 
  showBack = true,
  rightAction,
  className 
}: MobileHeaderProps) {
  const router = useRouter();
  const { couple } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Collapse header on scroll down, expand on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsCollapsed(true); // Scrolling down
      } else {
        setIsCollapsed(false); // Scrolling up or at top
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleBack = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    router.back();
  };

  const getDaysUntilWedding = () => {
    if (!couple?.wedding_date) return null;
    const weddingDate = new Date(couple.wedding_date);
    const today = new Date();
    const diffTime = weddingDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : null;
  };

  const daysUntil = getDaysUntilWedding();

  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-white border-b border-gray-200 transition-all duration-300 md:hidden",
        isCollapsed ? "h-14" : "h-auto",
        className
      )}
      style={{
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      {/* Main Header Bar */}
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center flex-1">
          {showBack && (
            <button
              onClick={handleBack}
              className="p-2 -ml-2 rounded-lg active:bg-gray-100 transition-colors"
              aria-label="Go back"
            >
              <i className="fas fa-arrow-left text-gray-700" />
            </button>
          )}
          <h1 className={cn(
            "font-semibold text-gray-900 transition-all duration-300",
            showBack ? "ml-3 text-lg" : "text-xl"
          )}>
            {title}
          </h1>
        </div>
        
        {rightAction && (
          <div className="flex items-center">
            {rightAction}
          </div>
        )}
      </div>

      {/* Collapsible Info Section */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          isCollapsed ? "max-h-0 opacity-0" : "max-h-32 opacity-100"
        )}
      >
        {couple && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {couple.partner1_name}
                  {couple.partner2_name && ` & ${couple.partner2_name}`}
                </p>
                {couple.wedding_date && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(couple.wedding_date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                )}
              </div>
              
              {daysUntil && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-accent">{daysUntil}</p>
                  <p className="text-xs text-gray-500">days to go</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Collapsed Indicator */}
      {isCollapsed && daysUntil && (
        <div className="absolute top-0 right-4 h-14 flex items-center">
          <div className="bg-accent/10 text-accent px-2 py-1 rounded-full">
            <span className="text-xs font-semibold">{daysUntil}d</span>
          </div>
        </div>
      )}
    </header>
  );
}