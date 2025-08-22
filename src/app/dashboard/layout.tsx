'use client'

import PremiumDashboardLayout from '@/components/layout/PremiumDashboardLayout'

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PremiumDashboardLayout>
      {children}
    </PremiumDashboardLayout>
  )
}