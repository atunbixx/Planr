'use client';

// This layout is unnecessary since ClerkProvider is already provided at the root level
// Removing duplicate ClerkProvider to fix 500 errors

export default function DashboardClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
