"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Users, 
  DollarSign, 
  Store, 
  Camera, 
  Calendar,
  MessageSquare,
  Settings,
  CheckCircle
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { theme } = useTheme();
  const pathname = usePathname();
  const [stats, setStats] = useState<any>(null);

  // Fetch stats for the header
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/dashboard/stats");
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

  const navItems = [
    { href: "/dashboard", label: "Overview", icon: Home },
    { href: "/dashboard/guests", label: "Guests", icon: Users },
    { href: "/dashboard/budget", label: "Budget", icon: DollarSign },
    { href: "/dashboard/vendors", label: "Vendors", icon: Store },
    { href: "/dashboard/photos", label: "Photos", icon: Camera },
    { href: "/dashboard/checklist", label: "Checklist", icon: CheckCircle },
    { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-[1600px] mx-auto px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center">
              <h1 className="text-2xl font-light tracking-wider uppercase">Wedding Planner</h1>
            </Link>

            {/* Quick Stats */}
            {stats && (
              <div className="hidden md:flex items-center gap-12">
                {stats.daysUntilWedding && (
                  <div className="text-center">
                    <p className="text-2xl font-light text-gray-900">{stats.daysUntilWedding}</p>
                    <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase">Days to go</p>
                  </div>
                )}
                <div className="text-center">
                  <p className="text-2xl font-light text-gray-900">
                    {stats.guestStats?.confirmed || 0}/{stats.guestStats?.total || 0}
                  </p>
                  <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase">Guests</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-light text-gray-900">{stats.budgetUsedPercentage || 0}%</p>
                  <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase">Budget Used</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-8">
          <div className="flex items-center gap-8 h-16 overflow-x-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 py-4 border-b-2 transition-all whitespace-nowrap",
                    isActive
                      ? "border-[#7a9b7f] text-gray-900"
                      : "border-transparent text-gray-500 hover:text-gray-900"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-light tracking-wide uppercase">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto">
        {children}
      </main>
    </div>
  );
}