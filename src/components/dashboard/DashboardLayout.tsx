"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useLocale } from "@/providers/LocaleProvider";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import UserProfileButton from "@/components/UserProfileButton";
import { 
  Home, 
  Users, 
  DollarSign, 
  Store, 
  Camera, 
  Calendar,
  MessageSquare,
  Settings,
  CheckCircle,
  Grid3x3,
  Menu,
  X
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { theme } = useTheme();
  const { formatNumber } = useLocale();
  const pathname = usePathname();
  const [stats, setStats] = useState<any>(null);

  // Fetch stats for the header
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/dashboard/stats", {
          cache: 'no-cache' // Ensure fresh data
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setStats(data.data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch nav stats:", error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Refresh stats when pathname changes (e.g., navigating from settings)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/dashboard/stats", {
          cache: 'no-cache'
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setStats(data.data);
          }
        }
      } catch (error) {
        console.error("Failed to refresh nav stats:", error);
      }
    };

    fetchStats();
  }, [pathname]);

  const navItems = [
    { href: "/dashboard", label: "Overview", icon: Home },
    { href: "/dashboard/guests", label: "Guests", icon: Users },
    { href: "/dashboard/seating", label: "Seating", icon: Grid3x3 },
    { href: "/dashboard/budget", label: "Budget", icon: DollarSign },
    { href: "/dashboard/vendors", label: "Vendors", icon: Store },
    { href: "/dashboard/timeline", label: "Timeline", icon: Calendar },
    { href: "/dashboard/photos", label: "Photos", icon: Camera },
    { href: "/dashboard/checklist", label: "Checklist", icon: CheckCircle },
    { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#faf9f7] w-full overflow-x-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-light tracking-wider uppercase">Wedding Planner</h1>
            </Link>

            {/* Quick Stats */}
            {stats && (
              <div className="hidden lg:flex items-center gap-6 xl:gap-12">
                {stats.daysUntilWedding && (
                  <div className="text-center">
                    <p className="text-xl xl:text-2xl font-light text-gray-900">{stats.daysUntilWedding}</p>
                    <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase">Days to go</p>
                  </div>
                )}
                <div className="text-center">
                  <p className="text-xl xl:text-2xl font-light text-gray-900">
                    {formatNumber(stats.guestStats?.confirmed || 0)}/{formatNumber(stats.guestStats?.total || 0)}
                  </p>
                  <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase">Guests</p>
                </div>
                <div className="text-center">
                  <p className="text-xl xl:text-2xl font-light text-gray-900">{formatNumber(stats.budgetUsedPercentage || 0)}%</p>
                  <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase">Budget Used</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Navigation Menu */}
            <div className="flex items-center gap-2 sm:gap-4 lg:gap-8 overflow-x-auto scrollbar-hide flex-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 sm:gap-3 py-3 sm:py-4 px-2 sm:px-0 border-b-2 transition-all whitespace-nowrap",
                      isActive
                        ? "border-[#7a9b7f] text-gray-900"
                        : "border-transparent text-gray-500 hover:text-gray-900"
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-light tracking-wide uppercase hidden sm:inline">{item.label}</span>
                    <span className="text-xs font-light tracking-wide uppercase sm:hidden">{item.label.substring(0, 3)}</span>
                  </Link>
                );
              })}
            </div>
            
            {/* User Profile and Couples Names */}
            <div className="flex items-center gap-3">
              {stats && stats.userInfo && (
                <div className="hidden md:block bg-[#6b140e] text-white px-2 sm:px-4 py-1 sm:py-2 rounded-sm">
                  <span className="text-xs sm:text-sm font-medium tracking-wider uppercase whitespace-nowrap">
                    {(stats.userInfo.partner1Name?.split(' ')[0] || 'PARTNER 1')} & {(stats.userInfo.partner2Name?.split(' ')[0] || 'PARTNER 2')}
                  </span>
                </div>
              )}
              <UserProfileButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}