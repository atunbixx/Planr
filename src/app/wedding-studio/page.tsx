'use client';

import dynamic from 'next/dynamic';

// Dynamically import the WeddingStudioApp component with SSR disabled
const WeddingStudioApp = dynamic(
  () => import('@/components/wedding-studio/WeddingStudioApp'),
  { ssr: false }
);

export default function WeddingStudioPage() {
  return <WeddingStudioApp />;
}