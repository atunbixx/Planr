'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarItem {
  icon: string
  label: string
  href: string
  active?: boolean
}

const sidebarItems: SidebarItem[] = [
  { icon: 'fas fa-home', label: 'DASHBOARD', href: '/dashboard' },
  { icon: 'fas fa-users', label: 'GUESTS', href: '/dashboard/guests' },
  { icon: 'fas fa-list-check', label: 'CHECKLIST', href: '/dashboard/checklist' },
  { icon: 'fas fa-tasks', label: 'TASKS', href: '/dashboard/tasks' },
  { icon: 'fas fa-store', label: 'VENDORS', href: '/dashboard/vendors' },
  { icon: 'fas fa-chart-bar', label: 'ANALYTICS', href: '/dashboard/analytics' },
  { icon: 'fas fa-dollar-sign', label: 'BUDGET', href: '/dashboard/budget' },
  { icon: 'fas fa-calendar', label: 'TIMELINE', href: '/dashboard/timeline' },
]

export default function EnhancedSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-black text-white flex flex-col">
      <div className="p-6">
        <h1 className="font-playfair text-xl font-semibold">Wedding Studio</h1>
      </div>
      
      <div className="px-6 mb-6">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">CURRENT PROJECT</p>
        <p className="text-white font-medium">Your Perfect Day</p>
      </div>
      
      <nav className="flex-1 px-3">
        {sidebarItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`sidebar-item flex items-center px-3 py-3 text-sm font-medium rounded-lg mb-1 ${
              pathname === item.href ? 'active' : ''
            }`}
          >
            <i className={`${item.icon} w-5 mr-3`}></i>
            {item.label}
          </Link>
        ))}
      </nav>
      
      <div className="p-6 border-t border-gray-700">
        <Link href="/dashboard/settings" className="sidebar-item flex items-center px-3 py-3 text-sm font-medium rounded-lg mb-1">
          <i className="fas fa-cog w-5 mr-3"></i>
          SETTINGS
        </Link>
        <Link href="/" className="sidebar-item flex items-center px-3 py-3 text-sm font-medium rounded-lg">
          <i className="fas fa-sign-out-alt w-5 mr-3"></i>
          SIGN OUT
        </Link>
      </div>
    </div>
  )
}