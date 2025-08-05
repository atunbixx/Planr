import type { Metadata } from 'next';

// Keep this layout strictly server-only and free of any client imports or auth.
// Auth gating is handled by the parent route group layout at src/app/(dashboard)/layout.tsx.
export const metadata: Metadata = {
  title: 'Dashboard • Wedding Planner'
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
