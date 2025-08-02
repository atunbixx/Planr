'use client';

import { useCallback, useRef, TouchEvent } from 'react';
import { useHapticFeedback } from './useHapticFeedback';

export interface SwipeDirection {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

export interface SwipeGestureOptions {
  threshold?: number; // Minimum distance for swipe detection
  velocity?: number; // Minimum velocity for swipe detection
  hapticFeedback?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipe?: (direction: SwipeDirection, distance: number, velocity: number) => void;
}

interface TouchPoint {
  x: number;
  y: number;
  time: number;
}

export function useSwipeGesture(options: SwipeGestureOptions = {}) {
  const {
    threshold = 50,
    velocity = 0.3,
    hapticFeedback = true,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onSwipe,
  } = options;

  const { vibrate } = useHapticFeedback();
  const touchStart = useRef<TouchPoint | null>(null);
  const touchEnd = useRef<TouchPoint | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchStart.current) return;
    
    const touch = e.touches[0];
    touchEnd.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart.current || !touchEnd.current) return;

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
      touchStart.current = null;
      touchEnd.current = null;
      return;
    }

    // Determine swipe direction
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    const direction: SwipeDirection = {
      left: absDeltaX > absDeltaY && deltaX < 0,
      right: absDeltaX > absDeltaY && deltaX > 0,
      up: absDeltaY > absDeltaX && deltaY < 0,
      down: absDeltaY > absDeltaX && deltaY > 0,
    };

    // Provide haptic feedback
    if (hapticFeedback) {
      vibrate('selection');
    }

    // Call specific direction handlers
    if (direction.left && onSwipeLeft) onSwipeLeft();
    if (direction.right && onSwipeRight) onSwipeRight();
    if (direction.up && onSwipeUp) onSwipeUp();
    if (direction.down && onSwipeDown) onSwipeDown();

    // Call general swipe handler
    if (onSwipe) {
      onSwipe(direction, distance, swipeVelocity);
    }

    // Clean up
    touchStart.current = null;
    touchEnd.current = null;
  }, [threshold, velocity, hapticFeedback, vibrate, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onSwipe]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
}

// Navigation-specific swipe hook
export function useSwipeNavigation(options: {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  hapticFeedback?: boolean;
}) {
  return useSwipeGesture({
    threshold: options.threshold || 80,
    velocity: 0.4,
    hapticFeedback: options.hapticFeedback ?? true,
    onSwipeLeft: options.onSwipeLeft,
    onSwipeRight: options.onSwipeRight,
  });
}

// Page swipe detection for router navigation
export function usePageSwipe(routes: {
  previous?: () => void;
  next?: () => void;
}) {
  return useSwipeNavigation({
    onSwipeRight: routes.previous,
    onSwipeLeft: routes.next,
    threshold: 100,
  });
}