'use client';

import { SyncStatus } from '@/components/offline/sync-status';
import { Button } from '@/components/ui/button';
import { Bell, Menu, User } from 'lucide-react';
import Link from 'next/link';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

interface DashboardHeaderProps {
  title?: string;
  onMenuClick?: () => void;
}

export function DashboardHeader({ title = 'Dashboard', onMenuClick }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <SyncStatus />
          
          <NotificationCenter />
          
          <Link href="/dashboard/profile">
            <Button variant="ghost" size="icon">
              <User className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}