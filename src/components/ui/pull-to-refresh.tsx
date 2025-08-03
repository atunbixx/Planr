'use client';

import { useCallback, useRef, useState, useEffect, ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPull?: number;
  disabled?: boolean;
  className?: string;
  refreshIndicator?: ReactNode;
  loadingIndicator?: ReactNode;
  successIndicator?: ReactNode;
  pullText?: string;
  releaseText?: string;
  loadingText?: string;
  successText?: string;
  showLastRefreshTime?: boolean;
}

type RefreshState = 'idle' | 'pulling' | 'ready' | 'refreshing' | 'success';

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  maxPull = 150,
  disabled = false,
  className,
  refreshIndicator,
  loadingIndicator,
  successIndicator,
  pullText = 'Pull to refresh',
  releaseText = 'Release to refresh',
  loadingText = 'Refreshing...',
  successText = 'Updated!',
  showLastRefreshTime = true,
}: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<RefreshState>('idle');
  const [pullDistance, setPullDistance] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [isScrollable, setIsScrollable] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);
  const { vibrate } = useHapticFeedback();

  // Check if content is scrollable
  useEffect(() => {
    const checkScrollable = () => {
      if (contentRef.current && containerRef.current) {
        setIsScrollable(contentRef.current.scrollHeight > containerRef.current.clientHeight);
      }
    };

    checkScrollable();
    window.addEventListener('resize', checkScrollable);
    
    // Create a ResizeObserver to watch for content changes
    const resizeObserver = new ResizeObserver(checkScrollable);
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    return () => {
      window.removeEventListener('resize', checkScrollable);
      resizeObserver.disconnect();
    };
  }, [children]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || state === 'refreshing') return;

    const touch = e.touches[0];
    startY.current = touch.clientY;
    currentY.current = touch.clientY;
    
    // Only start pull if at the top of scrollable content
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      isDragging.current = true;
    }
  }, [disabled, state]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || disabled || state === 'refreshing') return;

    const touch = e.touches[0];
    currentY.current = touch.clientY;
    const diff = currentY.current - startY.current;

    // Only pull down, not up
    if (diff > 0 && containerRef.current && containerRef.current.scrollTop === 0) {
      e.preventDefault();
      
      // Apply resistance to pull
      const resistance = 0.5;
      const adjustedDiff = Math.min(diff * resistance, maxPull);
      
      setPullDistance(adjustedDiff);

      if (adjustedDiff >= threshold && state !== 'ready') {
        setState('ready');
        vibrate('selection');
      } else if (adjustedDiff < threshold && state === 'ready') {
        setState('pulling');
      } else if (state === 'idle' && adjustedDiff > 0) {
        setState('pulling');
      }
    }
  }, [disabled, state, threshold, maxPull, vibrate]);

  const handleTouchEnd = useCallback(async () => {
    if (!isDragging.current || disabled) return;

    isDragging.current = false;

    if (state === 'ready') {
      setState('refreshing');
      vibrate('impact');
      
      try {
        await onRefresh();
        setState('success');
        setLastRefreshTime(new Date());
        vibrate('success');
        
        // Show success state briefly
        setTimeout(() => {
          setState('idle');
          setPullDistance(0);
        }, 1500);
      } catch (error) {
        console.error('Refresh failed:', error);
        vibrate('error');
        setState('idle');
        setPullDistance(0);
      }
    } else {
      setState('idle');
      setPullDistance(0);
    }
  }, [disabled, state, onRefresh, vibrate]);

  // Handle mouse events for desktop testing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled || state === 'refreshing') return;

    startY.current = e.clientY;
    currentY.current = e.clientY;
    
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      isDragging.current = true;
    }
  }, [disabled, state]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || disabled || state === 'refreshing') return;

    currentY.current = e.clientY;
    const diff = currentY.current - startY.current;

    if (diff > 0 && containerRef.current && containerRef.current.scrollTop === 0) {
      e.preventDefault();
      
      const resistance = 0.5;
      const adjustedDiff = Math.min(diff * resistance, maxPull);
      
      setPullDistance(adjustedDiff);

      if (adjustedDiff >= threshold && state !== 'ready') {
        setState('ready');
      } else if (adjustedDiff < threshold && state === 'ready') {
        setState('pulling');
      } else if (state === 'idle' && adjustedDiff > 0) {
        setState('pulling');
      }
    }
  }, [disabled, state, threshold, maxPull]);

  const handleMouseUp = useCallback(() => {
    handleTouchEnd();
  }, [handleTouchEnd]);

  const handleMouseLeave = useCallback(() => {
    if (isDragging.current && state !== 'refreshing') {
      setState('idle');
      setPullDistance(0);
      isDragging.current = false;
    }
  }, [state]);

  // Format last refresh time
  const formatLastRefreshTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    
    return date.toLocaleDateString();
  };

  // Default indicators
  const defaultRefreshIndicator = (
    <div className="text-2xl">💐</div>
  );

  const defaultLoadingIndicator = (
    <div className="animate-spin rounded-full h-6 w-6 border-2 border-accent border-t-transparent" />
  );

  const defaultSuccessIndicator = (
    <div className="text-2xl">✨</div>
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden h-full',
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* Pull indicator */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 flex flex-col items-center justify-end transition-opacity duration-300',
          state === 'idle' ? 'opacity-0' : 'opacity-100'
        )}
        style={{
          height: `${pullDistance}px`,
          transform: `translateY(-${pullDistance}px)`,
        }}
      >
        <div className="pb-4">
          {state === 'pulling' && (
            <>
              {refreshIndicator || defaultRefreshIndicator}
              <p className="text-sm text-gray-600 mt-2">{pullText}</p>
            </>
          )}
          {state === 'ready' && (
            <>
              {refreshIndicator || defaultRefreshIndicator}
              <p className="text-sm text-gray-600 mt-2">{releaseText}</p>
            </>
          )}
          {state === 'refreshing' && (
            <>
              {loadingIndicator || defaultLoadingIndicator}
              <p className="text-sm text-gray-600 mt-2">{loadingText}</p>
            </>
          )}
          {state === 'success' && (
            <>
              {successIndicator || defaultSuccessIndicator}
              <p className="text-sm text-gray-600 mt-2">{successText}</p>
            </>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div
        ref={contentRef}
        className="h-full overflow-auto"
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isDragging.current ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {/* Last refresh time */}
        {showLastRefreshTime && lastRefreshTime && state === 'idle' && (
          <div className="text-center text-xs text-gray-500 py-2">
            Last updated {formatLastRefreshTime(lastRefreshTime)}
          </div>
        )}
        
        {children}
      </div>
    </div>
  );
}