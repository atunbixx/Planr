'use client';

import { ReactNode, useRef, useCallback, TouchEvent, useState } from 'react';
import { cn } from '@/utils/cn';

interface SwipeGestureProps {
  children: ReactNode;
  className?: string;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // Minimum distance for swipe detection
  velocity?: number; // Minimum velocity for swipe detection
  disabled?: boolean;
  hapticFeedback?: boolean;
}

interface TouchPoint {
  x: number;
  y: number;
  time: number;
}

export function SwipeGesture({
  children,
  className,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  velocity = 0.3,
  disabled = false,
  hapticFeedback = true,
}: SwipeGestureProps) {
  const touchStart = useRef<TouchPoint | null>(null);
  const touchEnd = useRef<TouchPoint | null>(null);
  const [isActive, setIsActive] = useState(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled) return;
    
    const touch = e.touches[0];
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    setIsActive(true);
  }, [disabled]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (disabled || !touchStart.current) return;
    
    const touch = e.touches[0];
    touchEnd.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  }, [disabled]);

  const handleTouchEnd = useCallback(() => {
    if (disabled || !touchStart.current || !touchEnd.current) {
      setIsActive(false);
      return;
    }

    const startX = touchStart.current.x;
    const startY = touchStart.current.y;
    const endX = touchEnd.current.x;
    const endY = touchEnd.current.y;
    const startTime = touchStart.current.time;
    const endTime = touchEnd.current.time;

    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = endTime - startTime;
    const swipeVelocity = distance / duration;

    // Check if minimum threshold and velocity are met
    if (distance < threshold || swipeVelocity < velocity) {
      setIsActive(false);
      return;
    }

    // Determine swipe direction
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Add haptic feedback if enabled
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10); // Light vibration
    }

    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    } else {
      // Vertical swipe
      if (deltaY > 0 && onSwipeDown) {
        onSwipeDown();
      } else if (deltaY < 0 && onSwipeUp) {
        onSwipeUp();
      }
    }

    // Clean up
    touchStart.current = null;
    touchEnd.current = null;
    setIsActive(false);
  }, [disabled, threshold, velocity, hapticFeedback, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  return (
    <div
      className={cn(
        'touch-manipulation select-none',
        isActive && 'transition-transform duration-75',
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {children}
    </div>
  );
}

// Navigation wrapper for swipe navigation between pages
interface SwipeNavigationProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
}

export function SwipeNavigation({
  children,
  onSwipeLeft,
  onSwipeRight,
  className,
}: SwipeNavigationProps) {
  return (
    <SwipeGesture
      className={cn('min-h-screen', className)}
      onSwipeLeft={onSwipeLeft}
      onSwipeRight={onSwipeRight}
      threshold={80}
      velocity={0.4}
    >
      {children}
    </SwipeGesture>
  );
}