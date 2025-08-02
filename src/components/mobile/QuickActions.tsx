'use client';

import { useState } from 'react';
import { cn } from '@/utils/cn';
import { useRouter } from 'next/navigation';

interface QuickAction {
  label: string;
  icon: string;
  href?: string;
  onClick?: () => void;
  color?: string;
}

interface QuickActionsProps {
  actions?: QuickAction[];
  className?: string;
}

const defaultActions: QuickAction[] = [
  { label: 'Add Vendor', icon: 'fas fa-store', href: '/dashboard/vendors/new', color: 'bg-purple-500' },
  { label: 'Add Guest', icon: 'fas fa-user-plus', href: '/dashboard/guests/new', color: 'bg-blue-500' },
  { label: 'Add Task', icon: 'fas fa-plus-square', href: '/dashboard/tasks/new', color: 'bg-green-500' },
  { label: 'Quick Note', icon: 'fas fa-sticky-note', href: '/dashboard/notes/new', color: 'bg-yellow-500' },
];

export function QuickActions({ actions = defaultActions, className }: QuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleActionClick = (action: QuickAction) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    setIsOpen(false);
    
    if (action.onClick) {
      action.onClick();
    } else if (action.href) {
      router.push(action.href);
    }
  };

  const toggleMenu = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* FAB Container */}
      <div
        className={cn(
          "fixed bottom-20 right-4 z-50 md:hidden",
          className
        )}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Action Buttons */}
        <div
          className={cn(
            "absolute bottom-16 right-0 space-y-3 transition-all duration-300",
            isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
          )}
        >
          {actions.map((action, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center justify-end gap-3 transition-all duration-300",
                isOpen ? "translate-x-0" : "translate-x-full"
              )}
              style={{
                transitionDelay: isOpen ? `${index * 50}ms` : '0ms',
              }}
            >
              <span className="bg-gray-900 text-white text-sm px-3 py-1 rounded-full whitespace-nowrap">
                {action.label}
              </span>
              <button
                onClick={() => handleActionClick(action)}
                className={cn(
                  "w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white transition-transform active:scale-95",
                  action.color || 'bg-accent'
                )}
              >
                <i className={action.icon} />
              </button>
            </div>
          ))}
        </div>

        {/* Main FAB */}
        <button
          onClick={toggleMenu}
          className={cn(
            "w-14 h-14 rounded-full bg-accent text-white shadow-lg flex items-center justify-center transition-all duration-300 active:scale-95",
            isOpen && "rotate-45"
          )}
          style={{
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
          }}
        >
          <i className="fas fa-plus text-xl" />
        </button>
      </div>
    </>
  );
}