'use client';

import { ReactNode, useRef, useCallback, TouchEvent, MouseEvent, useState } from 'react';
import { cn } from '@/utils/cn';

interface LongPressProps {
  children: ReactNode;
  className?: string;
  onLongPress: () => void;
  onPress?: () => void;
  duration?: number; // Duration in ms for long press detection
  hapticFeedback?: boolean;
  disabled?: boolean;
  visualFeedback?: boolean;
}

export function LongPress({
  children,
  className,
  onLongPress,
  onPress,
  duration = 500,
  hapticFeedback = true,
  disabled = false,
  visualFeedback = true,
}: LongPressProps) {
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);
  const [isPressing, setIsPressing] = useState(false);

  const startLongPress = useCallback(() => {
    if (disabled) return;

    setIsPressing(true);
    isLongPressRef.current = false;

    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      
      // Provide haptic feedback
      if (hapticFeedback && 'vibrate' in navigator) {
        navigator.vibrate([20, 10, 20]); // Pattern for long press
      }

      onLongPress();
      setIsPressing(false);
    }, duration);
  }, [disabled, duration, hapticFeedback, onLongPress]);

  const cancelLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (!isLongPressRef.current && onPress && !disabled) {
      // Light haptic for regular press
      if (hapticFeedback && 'vibrate' in navigator) {
        navigator.vibrate(5);
      }
      onPress();
    }

    setIsPressing(false);
    isLongPressRef.current = false;
  }, [onPress, disabled, hapticFeedback]);

  // Touch event handlers
  const handleTouchStart = useCallback((e: TouchEvent) => {
    e.preventDefault();
    startLongPress();
  }, [startLongPress]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    e.preventDefault();
    cancelLongPress();
  }, [cancelLongPress]);

  // Mouse event handlers for desktop compatibility
  const handleMouseDown = useCallback((e: MouseEvent) => {
    e.preventDefault();
    startLongPress();
  }, [startLongPress]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    e.preventDefault();
    cancelLongPress();
  }, [cancelLongPress]);

  const handleMouseLeave = useCallback(() => {
    cancelLongPress();
  }, [cancelLongPress]);

  return (
    <div
      className={cn(
        'touch-manipulation select-none cursor-pointer',
        visualFeedback && isPressing && 'transform scale-95 opacity-80',
        visualFeedback && 'transition-all duration-150 ease-out',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onContextMenu={(e) => e.preventDefault()} // Prevent context menu
    >
      {children}
    </div>
  );
}

// Context menu component that works with long press
interface ContextMenuItem {
  label: string;
  icon?: ReactNode;
  action: () => void;
  destructive?: boolean;
}

interface LongPressContextMenuProps {
  children: ReactNode;
  items: ContextMenuItem[];
  className?: string;
  disabled?: boolean;
}

export function LongPressContextMenu({
  children,
  items,
  className,
  disabled = false,
}: LongPressContextMenuProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const handleLongPress = useCallback((e?: TouchEvent | MouseEvent) => {
    if (disabled || items.length === 0) return;

    // Get position for menu placement
    const rect = (e?.currentTarget as HTMLElement)?.getBoundingClientRect();
    if (rect) {
      setMenuPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    }

    setShowMenu(true);
  }, [disabled, items.length]);

  const handleItemClick = useCallback((action: () => void) => {
    action();
    setShowMenu(false);
  }, []);

  const handleBackdropClick = useCallback(() => {
    setShowMenu(false);
  }, []);

  return (
    <>
      <LongPress
        className={className}
        onLongPress={handleLongPress}
        disabled={disabled}
      >
        {children}
      </LongPress>

      {/* Context Menu Overlay */}
      {showMenu && (
        <div
          className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <div
            className="absolute bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-48"
            style={{
              left: `${menuPosition.x}px`,
              top: `${menuPosition.y}px`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {items.map((item, index) => (
              <button
                key={index}
                className={cn(
                  'w-full px-4 py-3 text-left text-sm hover:bg-gray-100 flex items-center gap-3',
                  item.destructive && 'text-red-600 hover:bg-red-50'
                )}
                onClick={() => handleItemClick(item.action)}
              >
                {item.icon && <span className="text-lg">{item.icon}</span>}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}