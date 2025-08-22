'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  Menu,
  Search,
  Bell,
  User,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import PremiumSidebar from './PremiumSidebar';
import ThemeSwitcher from '@/components/ui/ThemeSwitcher';

interface MenuItem {
  text: string;
  path: string;
}

const menuItems: MenuItem[] = [
  { text: 'Dashboard', path: '/dashboard' },
  { text: 'Guest Management', path: '/dashboard/guests' },
  { text: 'Budget Tracker', path: '/dashboard/budget' },
  { text: 'Checklist', path: '/dashboard/checklist' },
  { text: 'Table Seating', path: '/dashboard/seating' },
  { text: 'My Vendors', path: '/dashboard/vendors' },
  { text: 'Find Vendors', path: '/vendors' },
  { text: 'Photos', path: '/dashboard/photos' },
  { text: 'Messages', path: '/dashboard/messages' },
  { text: 'Timeline', path: '/dashboard/timeline' },
];

export default function PremiumDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, signout } = useAuth();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Set sidebar state after hydration to avoid SSR mismatch
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSignOut = async () => {
    await signout();
  };

  const getCurrentPageTitle = () => {
    const currentItem = menuItems.find(item => item.path === pathname);
    if (currentItem) return currentItem.text;
    
    if (pathname?.startsWith('/dashboard/settings')) return 'Settings';
    if (pathname?.startsWith('/dashboard/vendors/')) return 'Vendor Details';
    
    return 'Dashboard';
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <PremiumSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6 xl:px-10 py-4 shadow-sm">
          {/* Mobile menu button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSidebarToggle}
            className="lg:hidden border-gray-200 hover:bg-gray-50"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Page Title Section */}
          <div className="hidden xl:block">
            <h1 className="text-2xl font-bold text-[#722F37] mb-1">
              {getCurrentPageTitle()}
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Wedding Planning Dashboard
            </p>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-end">
            {/* Search Bar */}
            <div className="relative w-full max-w-sm hidden sm:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                type="search"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full bg-gray-50 text-sm outline-none transition-all focus:border-[#722F37] focus:bg-white placeholder:text-slate-400"
              />
            </div>

            {/* Theme Switcher */}
            <ThemeSwitcher />

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative text-slate-600 hover:bg-gray-50">
              <div className="relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs bg-red-500 text-white border-0">
                  4
                </Badge>
              </div>
            </Button>

            {/* Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-[#722F37] text-white text-xs font-semibold">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48" align="end">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 bg-[#FAFBFF] overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}