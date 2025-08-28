import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/components/ui/toast-provider'

// NOTE: Avoid next/font Google fetch in restricted environments.
// Using system fonts fallback for builds/smoke tests.

export const metadata: Metadata = {
  title: "Wedding Planner - Plan Your Perfect Day",
  description: "Comprehensive wedding planning platform with enterprise-grade features",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
