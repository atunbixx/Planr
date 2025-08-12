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
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  permissions?: Permission[];
  category?: string;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <Home className="h-5 w-5" />,
    permissions: ['view'],
    category: "Overview"
  },
  {
    label: "Guests",
    href: "/dashboard/guests",
    icon: <Users className="h-5 w-5" />,
    permissions: ['view'],
    category: "Management"
  },
  {
    label: "Seating Chart",
    href: "/dashboard/seating",
    icon: <BarChart3 className="h-5 w-5" />,
    permissions: ['manage_guests'],
    category: "Management"
  },
  {
    label: "Budget",
    href: "/dashboard/budget",
    icon: <DollarSign className="h-5 w-5" />,
    permissions: ['view_budget'],
    category: "Planning"
  },
  {
    label: "Vendors",
    href: "/dashboard/vendors",
    icon: <Store className="h-5 w-5" />,
    permissions: ['view'],
    category: "Planning"
  },
  {
    label: "Photos",
    href: "/dashboard/photos",
    icon: <Camera className="h-5 w-5" />,
    permissions: ['view_photos'],
    category: "Media"
  },
  {
    label: "Messages",
    href: "/dashboard/messages",
    icon: <MessageSquare className="h-5 w-5" />,
    permissions: ['view'],
    category: "Communication"
  },
  {
    label: "Checklist",
    href: "/dashboard/checklist",
    icon: <CheckSquare className="h-5 w-5" />,
    permissions: ['view'],
    category: "Planning"
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: <Settings className="h-5 w-5" />,
    permissions: ['view'],
    category: "Account"
  },
  {
    label: "Account",
    href: "/dashboard/account",
    icon: <UserCircle className="h-5 w-5" />,
    permissions: ['view'],
    category: "Account"
  },
];

export default function LuxurySidebar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<string[]>([]);
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
      return true;
    }
    return item.permissions.some(permission => hasPermission(permission));
  });

  // Group items by category
  const groupedItems = visibleNavItems.reduce((acc, item) => {
    const category = item.category || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const isCategoryCollapsed = (category: string) => collapsedCategories.includes(category);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-80 lg:overflow-y-auto lg:bg-card lg:border-r lg:pb-4 luxury-card">
        {/* Header */}
        <div className="flex h-20 shrink-0 items-center px-8 border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold luxury-heading text-foreground">Wedding Planner</h1>
              <p className="text-xs text-muted-foreground font-medium">Luxury Edition</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-6 space-y-6">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="space-y-2">
              <button
                onClick={() => toggleCategory(category)}
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
              >
                <span>{category}</span>
                <ChevronRight 
                  className={cn(
                    "h-4 w-4 transition-transform",
                    !isCategoryCollapsed(category) && "rotate-90"
                  )} 
                />
              </button>
              
              {!isCategoryCollapsed(category) && (
                <div className="space-y-1">
                  {items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-x-4 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 relative overflow-hidden",
                        isActive(item.href)
                          ? "bg-primary/10 text-primary shadow-sm border border-primary/20"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground hover:shadow-sm"
                      )}
                    >
                      {/* Active indicator */}
                      {isActive(item.href) && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                      )}
                      
                      <div className={cn(
                        "p-2 rounded-lg transition-colors",
                        isActive(item.href)
                          ? "bg-primary/20"
                          : "bg-muted/50 group-hover:bg-accent"
                      )}>
                        {item.icon}
                      </div>
                      
                      <div className="flex-1">
                        <span className="luxury-body">{item.label}</span>
                      </div>
                      
                      {item.badge && (
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary ring-1 ring-primary/20">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Quick Stats Card */}
        <div className="mt-8 mx-6 p-6 luxury-card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-sm font-semibold luxury-heading text-foreground">
              Wedding Countdown
            </h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground luxury-body">Days to go</span>
              <span className="text-sm font-bold text-foreground" id="nav-days-remaining">--</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground luxury-body">Guests confirmed</span>
              <span className="text-sm font-bold text-foreground" id="nav-guests-confirmed">--</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground luxury-body">Budget used</span>
              <span className="text-sm font-bold text-foreground" id="nav-budget-used">--</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-background/95 backdrop-blur-sm px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:hidden">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-foreground lg:hidden"
          onClick={() => setMobileMenuOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
        <div className="flex flex-1 items-center gap-x-3">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <span className="text-lg font-bold luxury-heading">Wedding Planner</span>
            <span className="text-xs text-muted-foreground ml-2">Luxury</span>
          </div>
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
            <div className="relative mr-16 flex w-full max-w-sm flex-1">
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

              <div className="flex grow flex-col gap-y-5 overflow-y-auto luxury-card px-6 pb-4">
                {/* Mobile Header */}
                <div className="flex h-16 shrink-0 items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold luxury-heading">Wedding Planner</h1>
                    <p className="text-xs text-muted-foreground">Luxury Edition</p>
                  </div>
                </div>
                
                {/* Mobile Navigation */}
                <nav className="flex flex-1 flex-col space-y-4">
                  {Object.entries(groupedItems).map(([category, items]) => (
                    <div key={category} className="space-y-2">
                      <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {category}
                      </h3>
                      <div className="space-y-1">
                        {items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={cn(
                              "group flex items-center gap-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                              isActive(item.href)
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                          >
                            <div className={cn(
                              "p-1.5 rounded-md",
                              isActive(item.href)
                                ? "bg-primary/20"
                                : "bg-muted/50"
                            )}>
                              {item.icon}
                            </div>
                            <span className="luxury-body">{item.label}</span>
                            {item.badge && (
                              <span className="ml-auto inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}