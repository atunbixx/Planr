'use client';

import { useState, useCallback, useRef, TouchEvent, MouseEvent } from 'react';

export interface RippleEffect {
  id: number;
  x: number;
  y: number;
  size: number;
  timestamp: number;
}

export interface TouchRippleOptions {
  duration?: number;
  color?: string;
  disabled?: boolean;
  center?: boolean;
  maxRipples?: number;
}

export function useTouchRipple(options: TouchRippleOptions = {}) {
  const {
    duration = 600,
    color = 'rgba(0, 0, 0, 0.1)',
    disabled = false,
    center = false,
    maxRipples = 3,
  } = options;

  const [ripples, setRipples] = useState<RippleEffect[]>([]);
  const nextRippleId = useRef(0);
  const containerRef = useRef<HTMLElement | null>(null);

  const createRipple = useCallback((event: TouchEvent | MouseEvent, element?: HTMLElement) => {
    if (disabled) return;

    const target = element || containerRef.current;
    if (!target) return;

    const rect = target.getBoundingClientRect();
    let x: number, y: number;

    if (center) {
      x = rect.width / 2;
      y = rect.height / 2;
    } else {
      // Determine touch/click position
      if ('touches' in event) {
        const touch = event.touches[0] || event.changedTouches[0];
        x = touch.clientX - rect.left;
        y = touch.clientY - rect.top;
      } else {
        x = event.clientX - rect.left;
        y = event.clientY - rect.top;
      }
    }

    // Calculate ripple size based on container dimensions
    const size = Math.max(rect.width, rect.height) * 2;

    const ripple: RippleEffect = {
      id: nextRippleId.current++,
      x,
      y,
      size,
      timestamp: Date.now(),
    };

    setRipples(prev => {
      // Limit the number of concurrent ripples
      const newRipples = [...prev, ripple];
      return newRipples.slice(-maxRipples);
    });

    // Remove ripple after animation completes
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== ripple.id));
    }, duration);
  }, [disabled, center, maxRipples, duration]);

  const handleTouchStart = useCallback((event: TouchEvent) => {
    createRipple(event);
  }, [createRipple]);

  const handleMouseDown = useCallback((event: MouseEvent) => {
    createRipple(event);
  }, [createRipple]);

  const clearRipples = useCallback(() => {
    setRipples([]);
  }, []);

  const getRippleStyles = useCallback((ripple: RippleEffect) => ({
    position: 'absolute' as const,
    left: ripple.x - ripple.size / 2,
    top: ripple.y - ripple.size / 2,
    width: ripple.size,
    height: ripple.size,
    backgroundColor: color,
    borderRadius: '50%',
    pointerEvents: 'none' as const,
    animation: `ripple ${duration}ms ease-out`,
    transform: 'scale(0)',
    opacity: 1,
  }), [color, duration]);

  return {
    ripples,
    createRipple,
    clearRipples,
    getRippleStyles,
    containerRef,
    handlers: {
      onTouchStart: handleTouchStart,
      onMouseDown: handleMouseDown,
    },
  };
}

// Convenience hook for button ripples
export function useButtonRipple(options?: TouchRippleOptions) {
  return useTouchRipple({
    duration: 400,
    color: 'rgba(255, 255, 255, 0.3)',
    ...options,
  });
}

// Hook for card/surface ripples
export function useSurfaceRipple(options?: TouchRippleOptions) {
  return useTouchRipple({
    duration: 600,
    color: 'rgba(0, 0, 0, 0.05)',
    ...options,
  });
}

// Hook for FAB ripples
export function useFABRipple(options?: TouchRippleOptions) {
  return useTouchRipple({
    duration: 500,
    color: 'rgba(255, 255, 255, 0.4)',
    center: true,
    ...options,
  });
}