"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/advanced";

/**
 * Global error boundary for the App Router.
 * Next.js will render this when an error is thrown in a route segment.
 * It is a client component so it can reset the error boundary via reset().
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Optional: log error to an error reporting service
    // console.error(error);
  }, [error]);

  const [isResetting, setIsResetting] = React.useState(false);

  const handleRetry = async () => {
    try {
      setIsResetting(true);
      // Allow a small delay for visual feedback
      setTimeout(() => {
        reset();
      }, 300);
    } finally {
      // no-op; reset() will cause rerender
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="max-w-lg text-center space-y-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(var(--primary))/0.08]">
          <span className="text-2xl font-bold text-[hsl(var(--primary))]">500</span>
        </div>
        <h1 className="text-3xl font-semibold">Something went wrong</h1>
        <p className="text-muted-foreground">
          An unexpected error occurred. Please try again. If the problem persists, you can return to the homepage.
        </p>

        {error?.digest && (
          <p className="text-xs text-muted-foreground/80">
            Error reference: <span className="font-mono">{error.digest}</span>
          </p>
        )}

        <div className="flex items-center justify-center gap-3">
          <Button onClick={handleRetry} disabled={isResetting}>
            {isResetting ? (
              <span className="inline-flex items-center gap-2">
                <Spinner size={16} /> Retrying…
              </span>
            ) : (
              "Try again"
            )}
          </Button>
          <Link href="/">
            <Button variant="secondary">Go Home</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
