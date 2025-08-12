"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/lib/permissions";
import {
  Home,
  Users,
  DollarSign,
  Store,
  Camera,
  MessageSquare,
  CheckSquare,
  Settings,
  Menu,
  X,
  Heart,
  Calendar,
  BarChart3,
  UserCircle,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  permissions?: Permission[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <Home className="h-4 w-4" />,
    permissions: ['view'],
  },
  {
    label: "Guests",
    href: "/dashboard/guests",
    icon: <Users className="h-4 w-4" />,
    permissions: ['view'],
  },
  {
    label: "Seating Chart",
    href: "/dashboard/seating",
    icon: <BarChart3 className="h-4 w-4" />,
    permissions: ['manage_guests'],
  },
  {
    label: "Budget",
    href: "/dashboard/budget",
    icon: <DollarSign className="h-4 w-4" />,
    permissions: ['view_budget'],
  },
  {
    label: "Vendors",
    href: "/dashboard/vendors",
    icon: <Store className="h-4 w-4" />,
    permissions: ['view'],
  },
  {
    label: "Photos",
    href: "/dashboard/photos",
    icon: <Camera className="h-4 w-4" />,
    permissions: ['view_photos'],
  },
  {
    label: "Messages",
    href: "/dashboard/messages",
    icon: <MessageSquare className="h-4 w-4" />,
    permissions: ['view'],
  },
  {
    label: "Checklist",
    href: "/dashboard/checklist",
    icon: <CheckSquare className="h-4 w-4" />,
    permissions: ['view'],
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: <Settings className="h-4 w-4" />,
    permissions: ['view'],
  },
  {
    label: "Account",
    href: "/dashboard/account",
    icon: <UserCircle className="h-4 w-4" />,
    permissions: ['view'],
  },
];

export default function DashboardNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { hasPermission, isLoading } = usePermissions();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  // Filter nav items based on permissions
  const visibleNavItems = navItems.filter(item => {
    if (!item.permissions || item.permissions.length === 0) {
      return true; // No permissions required
    }
    return item.permissions.some(permission => hasPermission(permission));
  });

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-72 lg:overflow-y-auto lg:bg-card lg:border-r lg:pb-4">
        <div className="flex h-16 shrink-0 items-center px-6 border-b">
          <Heart className="h-6 w-6 text-primary mr-2" />
          <span className="text-lg font-semibold">Wedding Planner</span>
        </div>
        <nav className="mt-8 px-4 space-y-1">
          {visibleNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Quick Stats */}
        <div className="mt-8 mx-4 p-4 bg-muted/50 rounded-lg">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Wedding Countdown
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Days to go</span>
              <span className="font-medium" id="nav-days-remaining">--</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Guests confirmed</span>
              <span className="font-medium" id="nav-guests-confirmed">--</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Budget used</span>
              <span className="font-medium" id="nav-budget-used">--</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:hidden">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-foreground lg:hidden"
          onClick={() => setMobileMenuOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
        <div className="flex flex-1 items-center gap-x-4">
          <Heart className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">Wedding Planner</span>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="relative z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-0 flex">
            <div className="relative mr-16 flex w-full max-w-xs flex-1">
              <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                <button
                  type="button"
                  className="-m-2.5 p-2.5"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="sr-only">Close sidebar</span>
                  <X className="h-6 w-6 text-foreground" aria-hidden="true" />
                </button>
              </div>

              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-card px-6 pb-4">
                <div className="flex h-16 shrink-0 items-center">
                  <Heart className="h-6 w-6 text-primary mr-2" />
                  <span className="text-lg font-semibold">Wedding Planner</span>
                </div>
                <nav className="flex flex-1 flex-col">
                  <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                      <ul role="list" className="-mx-2 space-y-1">
                        {visibleNavItems.map((item) => (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className={cn(
                                "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold",
                                isActive(item.href)
                                  ? "bg-primary/10 text-primary"
                                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                              )}
                            >
                              {item.icon}
                              {item.label}
                              {item.badge && (
                                <span className="ml-auto inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                  {item.badge}
                                </span>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}