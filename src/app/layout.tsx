import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { PWAProvider } from "@/components/pwa/PWAProvider";
import { InstallPrompt, UpdatePrompt, OfflineIndicator } from "@/components/pwa";

export const metadata: Metadata = {
  title: "Wedding Planner - Plan Your Perfect Day",
  description: "A comprehensive wedding planning application with vendor management, guest lists, budget tracking, and timeline planning.",
  keywords: ["wedding", "planning", "vendors", "guests", "budget", "timeline"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Wedding Planner",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    title: "Wedding Planner - Plan Your Perfect Day",
    description: "A comprehensive wedding planning application",
    siteName: "Wedding Planner",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wedding Planner - Plan Your Perfect Day",
    description: "A comprehensive wedding planning application",
  },
};

export const viewport: Viewport = {
  themeColor: "#8B5CF6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" 
          rel="stylesheet" 
        />
        {/* PWA Meta Tags */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.svg" />
        <link rel="icon" type="image/svg+xml" sizes="32x32" href="/icons/favicon-32x32.svg" />
        <link rel="icon" type="image/svg+xml" sizes="16x16" href="/icons/favicon-16x16.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Wedding Planner" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#8B5CF6" />
      </head>
      <body className="font-sans antialiased bg-paper text-ink">
        <PWAProvider>
          <AuthProvider>
            <ToastProvider>
              <main className="min-h-screen">
                {children}
              </main>
              {/* PWA Components */}
              <InstallPrompt />
              <UpdatePrompt />
              <OfflineIndicator />
            </ToastProvider>
          </AuthProvider>
        </PWAProvider>
      </body>
    </html>
  );
}
