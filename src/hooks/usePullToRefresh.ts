'use client';

import { useState, useCallback, useRef } from 'react';
import { useHapticFeedback } from './useHapticFeedback';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  enabled?: boolean;
  hapticFeedback?: boolean;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  enabled = true,
  hapticFeedback = true,
}: UsePullToRefreshOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const { vibrate } = useHapticFeedback();
  const refreshCount = useRef(0);

  const handleRefresh = useCallback(async () => {
    if (!enabled || isRefreshing) return;

    setIsRefreshing(true);
    refreshCount.current += 1;

    if (hapticFeedback) {
      vibrate('impact');
    }

    try {
      await onRefresh();
      setLastRefreshTime(new Date());
      
      if (hapticFeedback) {
        vibrate('success');
      }
    } catch (error) {
      console.error('Pull to refresh failed:', error);
      
      if (hapticFeedback) {
        vibrate('error');
      }
      
      throw error;
    } finally {
      setIsRefreshing(false);
      setPullProgress(0);
    }
  }, [enabled, isRefreshing, onRefresh, hapticFeedback, vibrate]);

  const updatePullProgress = useCallback((progress: number) => {
    setPullProgress(Math.min(Math.max(0, progress), 100));
  }, []);

  const resetPullProgress = useCallback(() => {
    setPullProgress(0);
  }, []);

  const getTimeSinceLastRefresh = useCallback(() => {
    if (!lastRefreshTime) return null;

    const now = new Date();
    const diffMs = now.getTime() - lastRefreshTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffMins > 0) {
      return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    } else {
      return 'Just now';
    }
  }, [lastRefreshTime]);

  return {
    isRefreshing,
    pullProgress,
    lastRefreshTime,
    refreshCount: refreshCount.current,
    handleRefresh,
    updatePullProgress,
    resetPullProgress,
    getTimeSinceLastRefresh,
    isReady: pullProgress >= threshold,
  };
}