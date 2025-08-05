// Dashboard group layout - authentication will be handled by Clerk middleware
export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
