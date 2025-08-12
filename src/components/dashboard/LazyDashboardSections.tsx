'use client'

import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Skeleton components for loading states
const StatCardSkeleton = () => (
  <Card className="animate-pulse">
    <CardHeader className="pb-2">
      <CardDescription>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-full"></div>
    </CardContent>
  </Card>
)

const SectionSkeleton = () => (
  <Card className="animate-pulse">
    <CardHeader>
      <CardTitle>
        <div className="h-5 bg-gray-200 rounded w-1/3"></div>
      </CardTitle>
      <CardDescription>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 bg-gray-200 rounded"></div>
        ))}
      </div>
    </CardContent>
  </Card>
)

// Dynamic imports with loading states
export const LazyWeddingCountdown = dynamic(
  () => import('./WeddingCountdown').catch(() => ({ default: () => <StatCardSkeleton /> })),
  { 
    loading: () => <StatCardSkeleton />,
    ssr: false 
  }
)

export const LazyBudgetOverview = dynamic(
  () => import('./BudgetOverview').catch(() => ({ default: () => <SectionSkeleton /> })),
  { 
    loading: () => <SectionSkeleton />,
    ssr: false 
  }
)

export const LazyGuestStats = dynamic(
  () => import('./GuestStats').catch(() => ({ default: () => <SectionSkeleton /> })),
  { 
    loading: () => <SectionSkeleton />,
    ssr: false 
  }
)

export const LazyRecentActivity = dynamic(
  () => import('./RecentActivity').catch(() => ({ default: () => <SectionSkeleton /> })),
  { 
    loading: () => <SectionSkeleton />,
    ssr: false 
  }
)

export const LazyQuickActions = dynamic(
  () => import('./QuickActions').catch(() => ({ default: () => <SectionSkeleton /> })),
  { 
    loading: () => <SectionSkeleton />,
    ssr: false 
  }
)

export const LazyVendorStatus = dynamic(
  () => import('./VendorStatus').catch(() => ({ default: () => <StatCardSkeleton /> })),
  { 
    loading: () => <StatCardSkeleton />,
    ssr: false 
  }
)

export const LazyTaskProgress = dynamic(
  () => import('./TaskProgress').catch(() => ({ default: () => <StatCardSkeleton /> })),
  { 
    loading: () => <StatCardSkeleton />,
    ssr: false 
  }
)

export const LazyUpcomingPayments = dynamic(
  () => import('./UpcomingPayments').catch(() => ({ default: () => <SectionSkeleton /> })),
  { 
    loading: () => <SectionSkeleton />,
    ssr: false 
  }
)