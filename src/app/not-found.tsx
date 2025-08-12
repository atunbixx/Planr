import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="max-w-lg text-center space-y-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(var(--primary))/0.08]">
          <span className="text-2xl font-bold text-[hsl(var(--primary))]">404</span>
        </div>
        <h1 className="text-3xl font-semibold">We couldn’t find that page</h1>
        <p className="text-muted-foreground">
          The page you’re looking for may have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="secondary">Open Dashboard</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
