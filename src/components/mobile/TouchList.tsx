'use client';

import { useState, useRef, ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface SwipeAction {
  label: string;
  icon?: string;
  onClick: () => void;
  className?: string;
  color?: 'danger' | 'primary' | 'success';
}

interface TouchListItemProps {
  children: ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  onLongPress?: () => void;
  className?: string;
}

export function TouchListItem({
  children,
  leftActions = [],
  rightActions = [],
  onLongPress,
  className
}: TouchListItemProps) {
  const [offset, setOffset] = useState(0);
  const [isOpen, setIsOpen] = useState<'left' | 'right' | null>(null);
  const itemRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startTime = useRef(0);
  const longPressTimer = useRef<NodeJS.Timeout>();

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startTime.current = Date.now();
    
    // Start long press timer
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
        onLongPress();
      }, 500);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Cancel long press if moving
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    
    // Only allow swipe if we have actions
    if ((diff > 0 && leftActions.length > 0) || (diff < 0 && rightActions.length > 0)) {
      setOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    // Cancel long press
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    const threshold = 75; // pixels to trigger action reveal
    const velocity = Math.abs(offset) / (Date.now() - startTime.current);
    
    if (Math.abs(offset) > threshold || velocity > 0.5) {
      if (offset > 0 && leftActions.length > 0) {
        setIsOpen('left');
        setOffset(100); // Width of action area
        if ('vibrate' in navigator) {
          navigator.vibrate(10);
        }
      } else if (offset < 0 && rightActions.length > 0) {
        setIsOpen('right');
        setOffset(-100); // Width of action area
        if ('vibrate' in navigator) {
          navigator.vibrate(10);
        }
      } else {
        setOffset(0);
        setIsOpen(null);
      }
    } else {
      setOffset(0);
      setIsOpen(null);
    }
  };

  const close = () => {
    setOffset(0);
    setIsOpen(null);
  };

  const getActionColor = (color?: string) => {
    switch (color) {
      case 'danger':
        return 'bg-red-500 text-white';
      case 'success':
        return 'bg-green-500 text-white';
      case 'primary':
      default:
        return 'bg-accent text-white';
    }
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Left Actions */}
      {leftActions.length > 0 && (
        <div className="absolute left-0 top-0 bottom-0 flex">
          {leftActions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.onClick();
                close();
              }}
              className={cn(
                "flex items-center justify-center px-6 transition-opacity",
                getActionColor(action.color),
                action.className,
                isOpen === 'left' ? 'opacity-100' : 'opacity-0'
              )}
            >
              {action.icon && <i className={cn(action.icon, "mr-2")} />}
              <span className="text-sm font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Right Actions */}
      {rightActions.length > 0 && (
        <div className="absolute right-0 top-0 bottom-0 flex">
          {rightActions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.onClick();
                close();
              }}
              className={cn(
                "flex items-center justify-center px-6 transition-opacity",
                getActionColor(action.color),
                action.className,
                isOpen === 'right' ? 'opacity-100' : 'opacity-0'
              )}
            >
              {action.icon && <i className={cn(action.icon, "mr-2")} />}
              <span className="text-sm font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div
        ref={itemRef}
        className="relative bg-white transition-transform duration-200 ease-out"
        style={{
          transform: `translateX(${offset}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

interface TouchListProps {
  children: ReactNode;
  className?: string;
}

export function TouchList({ children, className }: TouchListProps) {
  return (
    <div className={cn("divide-y divide-gray-200", className)}>
      {children}
    </div>
  );
}