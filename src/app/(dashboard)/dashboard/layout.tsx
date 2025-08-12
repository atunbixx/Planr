import type { Metadata } from 'next';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

// Keep this layout strictly server-only and free of any client imports or auth.
// Auth gating is handled by the parent route group layout at src/app/(dashboard)/layout.tsx.
export const metadata: Metadata = {
  title: 'Dashboard • Wedding Planner'
};

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
