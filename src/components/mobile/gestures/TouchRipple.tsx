'use client';

import { ReactNode, useState, useCallback, TouchEvent, MouseEvent, useRef } from 'react';
import { cn } from '@/utils/cn';

interface RippleEffect {
  id: number;
  x: number;
  y: number;
  size: number;
}

interface TouchRippleProps {
  children: ReactNode;
  className?: string;
  rippleColor?: string;
  rippleDuration?: number;
  disabled?: boolean;
  center?: boolean; // Center the ripple regardless of touch position
}

export function TouchRipple({
  children,
  className,
  rippleColor = 'rgba(0, 0, 0, 0.1)',
  rippleDuration = 600,
  disabled = false,
  center = false,
}: TouchRippleProps) {
  const [ripples, setRipples] = useState<RippleEffect[]>([]);
  const nextRippleId = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const createRipple = useCallback((event: TouchEvent | MouseEvent) => {
    if (disabled || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
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
    };

    setRipples(prev => [...prev, ripple]);

    // Remove ripple after animation completes
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== ripple.id));
    }, rippleDuration);
  }, [disabled, center, rippleDuration]);

  const handleStart = useCallback((event: TouchEvent | MouseEvent) => {
    createRipple(event);
  }, [createRipple]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden touch-manipulation',
        className
      )}
      onTouchStart={handleStart}
      onMouseDown={handleStart}
    >
      {children}
      
      {/* Ripple Effects */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute pointer-events-none rounded-full animate-ping"
          style={{
            left: ripple.x - ripple.size / 2,
            top: ripple.y - ripple.size / 2,
            width: ripple.size,
            height: ripple.size,
            backgroundColor: rippleColor,
            animationDuration: `${rippleDuration}ms`,
            animationFillMode: 'forwards',
          }}
        />
      ))}
    </div>
  );
}

// Pre-styled button with ripple effect
interface RippleButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  rippleColor?: string;
}

export function RippleButton({
  children,
  className,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  rippleColor,
}: RippleButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const defaultRippleColor = variant === 'primary' 
    ? 'rgba(255, 255, 255, 0.3)' 
    : 'rgba(0, 0, 0, 0.1)';

  return (
    <TouchRipple
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      rippleColor={rippleColor || defaultRippleColor}
      disabled={disabled}
    >
      <button
        onClick={onClick}
        disabled={disabled}
        className="w-full h-full flex items-center justify-center"
      >
        {children}
      </button>
    </TouchRipple>
  );
}

// Floating Action Button with ripple
interface RippleFABProps {
  onClick?: () => void;
  icon: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function RippleFAB({
  onClick,
  icon,
  className,
  disabled = false,
}: RippleFABProps) {
  return (
    <TouchRipple
      className={cn(
        'fixed bottom-20 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg',
        'flex items-center justify-center cursor-pointer',
        'hover:bg-blue-700 transition-colors',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      rippleColor="rgba(255, 255, 255, 0.3)"
      disabled={disabled}
      center
    >
      <button onClick={onClick} disabled={disabled} className="w-full h-full flex items-center justify-center">
        {icon}
      </button>
    </TouchRipple>
  );
}