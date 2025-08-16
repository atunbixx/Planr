import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { IntlProvider } from '@/providers/IntlProvider';
import { LocaleProvider } from '@/providers/LocaleProvider';
import { PWAProvider } from '@/components/providers/pwa-provider';
import { ErrorBoundaryWrapper } from '@/components/ErrorBoundaryWrapper';
import messages from '@/messages/en.json';
import { Toaster } from 'sonner';

// Initialize application configuration and environment validation
// Temporarily disabled for development
// import '@/lib/config/initialize';

export const metadata: Metadata = {
  title: 'Wedding Planner',
  description: 'Plan your event with ease',
  icons: {
    icon: '/favicon.svg',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Wedding Planner',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#6366f1',
};

export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6366f1" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Wedding Planner" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <ErrorBoundaryWrapper level="app">
          <ThemeProvider>
            <LocaleProvider>
              <IntlProvider locale="en" messages={messages}>
                <PWAProvider>
                  {/* Skip link for accessibility */}
                  <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    Skip to main content
                  </a>

                  <main id="main-content">{children}</main>
                  <Toaster />
                </PWAProvider>
              </IntlProvider>
            </LocaleProvider>
          </ThemeProvider>
        </ErrorBoundaryWrapper>
      </body>
    </html>
  );
}
