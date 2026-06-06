import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { RegisterSW } from "../components/register-sw";

const display = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const body = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Planr — plan life's gatherings",
  description: "One place to plan every gathering — weddings, showers, parties, memorials.",
  appleWebApp: { capable: true, title: "Planr", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#c25435",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <div className="brandbar">
          <a className="wordmark" href="/">
            Planr
          </a>
        </div>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
