"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { cn } from "@/lib/utils";

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}

type Item = {
  label: string;
  href: string;
  icon?: React.ReactNode;
  section?: string;
};

const NAV: Array<{ heading?: string; items: Item[] }> = [
  {
    heading: "Dashboards",
    items: [
      { label: "Overview", href: "/dashboard" },
      { label: "Analytics", href: "/dashboard/analytics" },
    ],
  },
  {
    items: [
      { label: "Guests", href: "/dashboard/guests" },
      { label: "Seating Chart", href: "/dashboard/seating" },
      { label: "Budget", href: "/dashboard/budget" },
      { label: "Vendors", href: "/dashboard/vendors" },
      { label: "Photos", href: "/dashboard/photos" },
      { label: "Messages", href: "/dashboard/messages" },
    ],
  },
  {
    heading: "General",
    items: [
      { label: "Settings", href: "/dashboard/settings" },
    ],
  },
];

export default function BridalSidebar({
  collapsed = false,
  onToggle,
}: {
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cx(
        "fixed inset-y-0 left-0 z-40 hidden md:flex flex-col transition-all",
        collapsed ? "w-16" : "w-60"
      )}
      style={{ background: "hsl(var(--primary))" }}
      aria-label="Bridal navigation"
    >
      {/* Header */}
      <div className="h-14 flex items-center px-4 border-b border-white/10">
        <div className="flex items-center gap-2 text-white">
          <div className="h-8 w-8 rounded-md bg-white/15 flex items-center justify-center font-semibold">
            WP
          </div>
          {!collapsed && <span className="text-sm font-medium">Wedding Planner</span>}
        </div>
        <button
          onClick={onToggle}
          className="ml-auto text-white/80 hover:text-white text-xs"
          aria-label="Toggle sidebar"
        >
          {collapsed ? "›" : "‹"}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {NAV.map((group, gi) => (
          <div key={gi} className="mb-3">
            {group.heading && !collapsed && (
              <div className="px-2 text-[10px] uppercase tracking-wide text-white/60 mb-2">
                {group.heading}
              </div>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cx(
                        "group flex items-center gap-2 rounded-md px-2 py-2 text-sm transition",
                        active
                          ? "bg-white/15 text-white"
                          : "text-white/85 hover:bg-white/10 hover:text-white"
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <span
                        className={cx(
                          "inline-block h-2 w-2 rounded-full",
                          active ? "bg-white" : "bg-white/50"
                        )}
                      />
                      {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-white/10">
        {!collapsed && (
          <div className="text-[11px] text-white/70">
            Bridal theme
            <div className="text-white/60">v1</div>
          </div>
        )}
      </div>
    </aside>
  );
}
