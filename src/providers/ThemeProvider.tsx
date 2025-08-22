'use client';

import React from 'react';
import ImpersonationBanner from '@/components/admin/ImpersonationBanner';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ImpersonationBanner />
      {children}
    </>
  );
}
