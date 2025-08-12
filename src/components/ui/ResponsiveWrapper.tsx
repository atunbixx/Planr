'use client';

import { useEffect, useState } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface ResponsiveWrapperProps {
  children: React.ReactNode;
  mobileComponent?: React.ReactNode;
  breakpoint?: number;
}

export function ResponsiveWrapper({
  children,
  mobileComponent,
  breakpoint = 768,
}: ResponsiveWrapperProps) {
  const [mounted, setMounted] = useState(false);
  const isMobile = useMediaQuery(`(max-width: ${breakpoint}px)`);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return <>{isMobile && mobileComponent ? mobileComponent : children}</>;
}