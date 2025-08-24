"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  CheckCircle,
  Store,
  Image,
  MessageSquare,
  Calendar,
  Users2,
  Settings,
  ChevronUp,
  ChevronDown,
  X,
  Heart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface NavigationItem {
  title: string;
  icon: React.ReactElement;
  path?: string;
  items?: { title: string; path: string }[];
}

interface NavigationSection {
  label: string;
  items: NavigationItem[];
}

const WEDDING_NAV_DATA: NavigationSection[] = [
  {
    label: "WEDDING PLANNING",
    items: [
      {
        title: "Dashboard",
        icon: <LayoutDashboard className="h-5 w-5" />,
        path: "/dashboard",
      },
      {
        title: "Guest Management",
        icon: <Users className="h-5 w-5" />,
        path: "/dashboard/guests",
      },
      {
        title: "Budget Tracker",
        icon: <DollarSign className="h-5 w-5" />,
        path: "/dashboard/budget",
      },
      {
        title: "Checklist",
        icon: <CheckCircle className="h-5 w-5" />,
        path: "/dashboard/checklist",
      },
      {
        title: "Tasks",
        icon: <CheckCircle className="h-5 w-5" />,
        path: "/dashboard/tasks",
      },
      {
        title: "Timeline",
        icon: <Calendar className="h-5 w-5" />,
        path: "/dashboard/timeline",
      },
    ],
  },
  {
    label: "VENDORS & SERVICES",
    items: [
      {
        title: "My Vendors",
        icon: <Store className="h-5 w-5" />,
        path: "/dashboard/vendors",
      },
      {
        title: "Find Vendors",
        icon: <Heart className="h-5 w-5" />,
        path: "/vendors",
      },
    ],
  },
  {
    label: "ORGANIZATION",
    items: [
      {
        title: "Table Seating",
        icon: <Users2 className="h-5 w-5" />,
        path: "/dashboard/seating",
      },
      {
        title: "Photos",
        icon: <Image className="h-5 w-5" />,
        path: "/dashboard/photos",
      },
      {
        title: "Messages",
        icon: <MessageSquare className="h-5 w-5" />,
        path: "/dashboard/messages",
      },
    ],
  },
];

interface PremiumSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const PremiumSidebar: React.FC<PremiumSidebarProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    if (isMobile) {
      onClose();
    }
  };

  const sidebarContent = (
    <div className="w-[280px] h-full bg-white border-r border-stroke flex flex-col dark:bg-dark-2 dark:border-dark-3">
      {/* Header with Logo */}
      <div className="p-6 border-b border-stroke flex items-center justify-between dark:border-dark-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#722F37] to-[#6B7C32] flex items-center justify-center text-white font-bold text-xl">
            W
          </div>
          <h2 className="text-lg font-bold text-[#722F37] dark:text-white">
            Wedding Planner
          </h2>
        </div>
        
        {isMobile && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-auto py-4">
        {WEDDING_NAV_DATA.map((section) => (
          <div key={section.label} className="mb-6">
            <h3 className="px-6 mb-2 text-xs font-semibold text-dark-5 dark:text-dark-6 uppercase tracking-wider">
              {section.label}
            </h3>
            
            <nav className="px-4 space-y-1">
              {section.items.map((item) => (
                <div key={item.title}>
                  {item.items ? (
                    // Expandable item
                    <>
                      <button
                        onClick={() => toggleExpanded(item.title)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-dark-5 rounded-lg hover:bg-[#722F37]/5 transition-colors dark:text-dark-6"
                      >
                        <span className="text-dark-5 dark:text-dark-6">{item.icon}</span>
                        <span className="flex-1 text-left">{item.title}</span>
                        {expandedItems.includes(item.title) ? (
                          <ChevronUp className="h-4 w-4 text-dark-5 dark:text-dark-6" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-dark-5 dark:text-dark-6" />
                        )}
                      </button>
                      
                      {expandedItems.includes(item.title) && (
                        <div className="ml-6 mt-1 space-y-1">
                          {item.items.map((subItem) => (
                            <button
                              key={subItem.title}
                              onClick={() => handleNavigation(subItem.path)}
                              className={cn(
                                "w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors text-left",
                                pathname === subItem.path
                                  ? "bg-[#722F37]/10 text-[#722F37] font-semibold"
                                  : "text-dark-5 hover:bg-[#722F37]/5 dark:text-dark-6"
                              )}
                            >
                              {subItem.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    // Simple navigation item
                    <button
                      onClick={() => item.path && handleNavigation(item.path)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left",
                        pathname === item.path
                          ? "bg-[#722F37]/10 text-[#722F37] font-semibold"
                          : "text-dark-5 hover:bg-[#722F37]/5 dark:text-dark-6"
                      )}
                    >
                      <span className={cn(
                        "transition-colors",
                        pathname === item.path ? "text-[#722F37]" : "text-dark-5 dark:text-dark-6"
                      )}>
                        {item.icon}
                      </span>
                      <span>{item.title}</span>
                    </button>
                  )}
                </div>
              ))}
            </nav>
          </div>
        ))}
      </div>

      {/* Settings at bottom */}
      <div className="border-t border-stroke p-4 dark:border-dark-3">
        <button
          onClick={() => handleNavigation('/dashboard/settings')}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left",
            pathname === '/dashboard/settings'
              ? "bg-[#722F37]/10 text-[#722F37] font-semibold"
              : "text-dark-5 hover:bg-[#722F37]/5 dark:text-dark-6"
          )}
        >
          <span className={cn(
            "transition-colors",
            pathname === '/dashboard/settings' ? "text-[#722F37]" : "text-dark-5 dark:text-dark-6"
          )}>
            <Settings className="h-5 w-5" />
          </span>
          <span>Settings</span>
        </button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {/* Mobile Overlay */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden" 
            onClick={onClose}
          />
        )}
        
        {/* Mobile Drawer */}
        <div className={cn(
          "fixed left-0 top-0 h-full w-[280px] bg-white z-50 transform transition-transform duration-300 ease-in-out md:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          {sidebarContent}
        </div>
      </>
    );
  }

  return (
    <div className={cn(
      "transition-all duration-300 ease-in-out overflow-hidden h-screen sticky top-0",
      isOpen ? "w-[280px]" : "w-0"
    )}>
      {sidebarContent}
    </div>
  );
};

export default PremiumSidebar;