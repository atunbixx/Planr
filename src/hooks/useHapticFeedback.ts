'use client';

import { useCallback } from 'react';

type HapticPattern = number | number[];

interface HapticOptions {
  enabled?: boolean;
  pattern?: HapticPattern;
}

const hapticPatterns = {
  light: 10,
  medium: 20,
  heavy: 50,
  success: [10, 50, 10],
  warning: [20, 20, 20],
  error: [50, 50, 50],
  selection: 5,
  impact: 30,
} as const;

export function useHapticFeedback(defaultOptions?: HapticOptions) {
  const vibrate = useCallback(
    (patternOrOptions?: HapticPattern | keyof typeof hapticPatterns | HapticOptions) => {
      // Check if haptic feedback is enabled (default: true)
      const enabled = defaultOptions?.enabled ?? true;
      if (!enabled) return;

      // Check if the Vibration API is available
      if (!('vibrate' in navigator)) return;

      let pattern: HapticPattern;

      if (typeof patternOrOptions === 'string') {
        // Use predefined pattern
        pattern = hapticPatterns[patternOrOptions];
      } else if (typeof patternOrOptions === 'number' || Array.isArray(patternOrOptions)) {
        // Use custom pattern
        pattern = patternOrOptions;
      } else if (patternOrOptions && 'pattern' in patternOrOptions) {
        // Extract pattern from options
        pattern = patternOrOptions.pattern || defaultOptions?.pattern || hapticPatterns.light;
      } else {
        // Use default pattern
        pattern = defaultOptions?.pattern || hapticPatterns.light;
      }

      try {
        navigator.vibrate(pattern);
      } catch (error) {
        console.warn('Haptic feedback failed:', error);
      }
    },
    [defaultOptions]
  );

  return {
    vibrate,
    // Convenience methods for common patterns
    light: () => vibrate('light'),
    medium: () => vibrate('medium'),
    heavy: () => vibrate('heavy'),
    success: () => vibrate('success'),
    warning: () => vibrate('warning'),
    error: () => vibrate('error'),
    selection: () => vibrate('selection'),
    impact: () => vibrate('impact'),
  };
}