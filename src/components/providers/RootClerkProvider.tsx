'use client';

// Deprecated: Global ClerkProvider is applied in src/app/providers.tsx (used by app/layout.tsx).
// This wrapper is now a no-op to avoid duplicate provider trees.
export default function RootClerkProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
