'use client';

export default function ClerkProviderWrapper({ children }: { children: React.ReactNode }) {
  // Deprecated: The app is now wrapped globally by ClerkProvider in src/app/layout.tsx.
  // This wrapper is kept as a no-op to avoid import errors.
  return <>{children}</>;
}
