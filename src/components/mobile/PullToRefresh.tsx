'use client';

import { useState, useRef, ReactNode, useEffect } from 'react';
import { cn } from '@/utils/cn';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
  threshold?: number;
}

export function PullToRefresh({ 
  onRefresh, 
  children, 
  className,
  threshold = 80 
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  // Haptic feedback when threshold is reached
  useEffect(() => {
    if (pullDistance > threshold && !isRefreshing && isPulling) {
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    }
  }, [pullDistance, threshold, isRefreshing, isPulling]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0 && !isRefreshing) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;

    currentY.current = e.touches[0].clientY;
    const distance = currentY.current - startY.current;

    if (distance > 0) {
      // Apply resistance for natural feel
      const resistance = 2.5;
      const adjustedDistance = Math.min(distance / resistance, 150);
      setPullDistance(adjustedDistance);
      
      // Prevent default scrolling
      if (distance > 10) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;

    setIsPulling(false);

    if (pullDistance > threshold && !isRefreshing) {
      setIsRefreshing(true);
      
      // Haptic feedback on refresh start
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 50, 50]);
      }

      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  const getSpinnerRotation = () => {
    if (isRefreshing) return 'animate-spin';
    const rotation = (pullDistance / threshold) * 180;
    return '';
  };

  const getSpinnerStyle = () => {
    if (isRefreshing) return {};
    const rotation = Math.min((pullDistance / threshold) * 180, 180);
    return {
      transform: `rotate(${rotation}deg)`,
      transition: isPulling ? 'none' : 'transform 0.2s ease-out',
    };
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull Indicator */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 flex justify-center items-center transition-opacity duration-200",
          (pullDistance > 0 || isRefreshing) ? "opacity-100" : "opacity-0"
        )}
        style={{
          height: `${pullDistance}px`,
          transform: `translateY(-100%)`,
          marginTop: `${pullDistance}px`,
        }}
      >
        <div className="flex flex-col items-center justify-center">
          <div
            className={cn(
              "w-8 h-8 rounded-full border-2 border-gray-300",
              isRefreshing && "animate-spin"
            )}
          >
            <div
              className="w-full h-full rounded-full border-2 border-accent border-t-transparent"
              style={getSpinnerStyle()}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {isRefreshing 
              ? "Refreshing..." 
              : pullDistance > threshold 
                ? "Release to refresh" 
                : "Pull to refresh"
            }
          </p>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}