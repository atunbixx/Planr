'use client';

import { ReactNode } from 'react';
import { MobileNavigation } from './MobileNavigation';
import { cn } from '@/utils/cn';

interface MobileLayoutProps {
  children: ReactNode;
  className?: string;
  showNav?: boolean;
}

export function MobileLayout({ 
  children, 
  className,
  showNav = true 
}: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main 
        className={cn(
          "w-full",
          showNav && "pb-20", // Add padding for bottom navigation
          className
        )}
      >
        {children}
      </main>

      {/* Mobile Navigation */}
      {showNav && <MobileNavigation />}
    </div>
  );
}