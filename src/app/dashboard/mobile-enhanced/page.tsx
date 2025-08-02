'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import {
  SwipeNavigation,
  LongPress,
  LongPressContextMenu,
  TouchRipple,
  RippleButton,
  RippleFAB,
  HapticFeedback,
} from '@/components/mobile/gestures';
import { useSwipeNavigation, usePageSwipe } from '@/hooks/useSwipeGesture';
import { useMobileDetect } from '@/hooks/useMobileDetect';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';
import { PullToRefresh } from '@/components/mobile/PullToRefresh';
import { Plus, Settings, Bell, ChevronRight } from 'lucide-react';

const pages = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Budget', path: '/dashboard/budget' },
  { name: 'Guests', path: '/dashboard/guests' },
  { name: 'Tasks', path: '/dashboard/tasks' },
  { name: 'Vendors', path: '/dashboard/vendors' },
];

export default function MobileEnhancedDashboard() {
  const { user, couple, loading, error } = useAuth();
  const router = useRouter();
  const { isMobile, isTablet } = useMobileDetect();
  const { orientation, isPortrait } = useDeviceOrientation();
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Swipe navigation between pages
  const pageSwipeHandlers = usePageSwipe({
    previous: () => {
      if (currentPageIndex > 0) {
        const newIndex = currentPageIndex - 1;
        setCurrentPageIndex(newIndex);
        router.push(pages[newIndex].path);
      }
    },
    next: () => {
      if (currentPageIndex < pages.length - 1) {
        const newIndex = currentPageIndex + 1;
        setCurrentPageIndex(newIndex);
        router.push(pages[newIndex].path);
      }
    },
  });

  // Pull to refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  // Context menu items for quick actions
  const quickContextMenuItems = [
    {
      label: 'Add Vendor',
      icon: '🏪',
      action: () => router.push('/dashboard/vendors'),
    },
    {
      label: 'Create Task',
      icon: '✅',
      action: () => router.push('/dashboard/tasks'),
    },
    {
      label: 'Invite Guest',
      icon: '👥',
      action: () => router.push('/dashboard/guests'),
    },
    {
      label: 'Settings',
      icon: '⚙️',
      action: () => router.push('/dashboard/settings'),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !user || !couple) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Authentication Error</p>
          <p className="text-sm text-gray-500">{error || 'Please sign in again'}</p>
        </div>
      </div>
    );
  }

  const daysUntilWedding = couple.wedding_date 
    ? Math.ceil((new Date(couple.wedding_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <SwipeNavigation
      className="min-h-screen bg-gray-50"
      {...pageSwipeHandlers}
    >
      <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing}>
        <div className={`min-h-screen ${isPortrait ? 'portrait' : 'landscape'}`}>
          {/* Mobile Header with Swipe Indicator */}
          <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
                  <p className="text-xs text-gray-500">
                    Swipe left/right to navigate • Page {currentPageIndex + 1} of {pages.length}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <HapticFeedback pattern="light">
                    <TouchRipple className="p-2 rounded-lg">
                      <Bell className="h-5 w-5 text-gray-600" />
                    </TouchRipple>
                  </HapticFeedback>
                  <HapticFeedback pattern="light">
                    <TouchRipple className="p-2 rounded-lg">
                      <Settings className="h-5 w-5 text-gray-600" />
                    </TouchRipple>
                  </HapticFeedback>
                </div>
              </div>
              
              {/* Page Indicators */}
              <div className="flex justify-center mt-2 space-x-1">
                {pages.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 w-6 rounded-full transition-colors ${
                      index === currentPageIndex ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Hero Section with Long Press Context Menu */}
          <LongPressContextMenu
            items={quickContextMenuItems}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
          >
            <div className="px-4 py-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">
                  Welcome back, {couple.partner1_name}
                </h2>
                <p className="text-blue-100 mb-4">
                  {daysUntilWedding !== null ? (
                    daysUntilWedding > 0 ? (
                      <>Your wedding is in <span className="font-bold">{daysUntilWedding} days</span></>
                    ) : daysUntilWedding === 0 ? (
                      <>Today is your wedding day! 🎉</>
                    ) : (
                      <>Hope your wedding was amazing! 💕</>
                    )
                  ) : (
                    <>Let's plan your perfect day!</>
                  )}
                </p>
                <p className="text-xs text-blue-200 italic">
                  Long press anywhere for quick actions
                </p>
              </div>
            </div>
          </LongPressContextMenu>

          {/* Stats Cards with Touch Ripples */}
          <div className="px-4 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <TouchRipple className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {daysUntilWedding || '—'}
                  </div>
                  <div className="text-sm text-gray-500">Days Until Wedding</div>
                </div>
              </TouchRipple>

              <TouchRipple className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    ${((couple as any).budget_total || 50000).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">Total Budget</div>
                </div>
              </TouchRipple>

              <TouchRipple className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {couple.estimated_guests || 0}
                  </div>
                  <div className="text-sm text-gray-500">Expected Guests</div>
                </div>
              </TouchRipple>
            </div>
          </div>

          {/* Quick Actions with Haptic Feedback */}
          <div className="px-4 py-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { title: 'Vendors', icon: '🏪', href: '/dashboard/vendors', color: 'bg-blue-500' },
                { title: 'Budget', icon: '💰', href: '/dashboard/budget', color: 'bg-green-500' },
                { title: 'Guests', icon: '👥', href: '/dashboard/guests', color: 'bg-purple-500' },
                { title: 'Tasks', icon: '✅', href: '/dashboard/tasks', color: 'bg-orange-500' },
              ].map((action) => (
                <HapticFeedback key={action.title} pattern="selection">
                  <Link href={action.href}>
                    <TouchRipple className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-24 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl mb-1">{action.icon}</div>
                        <div className="text-sm font-medium text-gray-900">{action.title}</div>
                      </div>
                    </TouchRipple>
                  </Link>
                </HapticFeedback>
              ))}
            </div>
          </div>

          {/* Recent Activity with Long Press Actions */}
          <div className="px-4 py-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <div className="text-4xl mb-4">📝</div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Your Planning Journey Begins
              </h4>
              <p className="text-gray-600 mb-4">
                Start adding vendors and tasks to see your activity here.
              </p>
              <RippleButton
                variant="primary"
                onClick={() => router.push('/dashboard/vendors')}
              >
                Begin Planning
              </RippleButton>
            </div>
          </div>

          {/* Navigation Helper */}
          {isMobile && (
            <div className="px-4 py-6 text-center">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  💡 <strong>Tip:</strong> Swipe left or right to navigate between pages, 
                  long press for quick actions, and pull down to refresh!
                </p>
              </div>
            </div>
          )}

          {/* Floating Action Button */}
          <RippleFAB
            icon={<Plus className="h-6 w-6" />}
            onClick={() => {
              // Show quick add menu or navigate to most common action
              router.push('/dashboard/vendors');
            }}
            className="fixed bottom-20 right-4 z-20"
          />
        </div>
      </PullToRefresh>
    </SwipeNavigation>
  );
}