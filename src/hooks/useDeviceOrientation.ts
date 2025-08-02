'use client';

import { useState, useEffect, useCallback } from 'react';

export type OrientationType = 'portrait' | 'landscape';

export interface DeviceOrientation {
  orientation: OrientationType;
  angle: number;
  isPortrait: boolean;
  isLandscape: boolean;
  width: number;
  height: number;
}

export interface OrientationOptions {
  onOrientationChange?: (orientation: DeviceOrientation) => void;
  debounceMs?: number;
}

export function useDeviceOrientation(options: OrientationOptions = {}) {
  const { onOrientationChange, debounceMs = 100 } = options;
  
  const [orientation, setOrientation] = useState<DeviceOrientation>(() => {
    if (typeof window === 'undefined') {
      return {
        orientation: 'portrait',
        angle: 0,
        isPortrait: true,
        isLandscape: false,
        width: 0,
        height: 0,
      };
    }

    const { innerWidth, innerHeight } = window;
    const isPortrait = innerHeight > innerWidth;
    
    return {
      orientation: isPortrait ? 'portrait' : 'landscape',
      angle: screen.orientation?.angle || 0,
      isPortrait,
      isLandscape: !isPortrait,
      width: innerWidth,
      height: innerHeight,
    };
  });

  const updateOrientation = useCallback(() => {
    const { innerWidth, innerHeight } = window;
    const isPortrait = innerHeight > innerWidth;
    const angle = screen.orientation?.angle || 0;
    
    const newOrientation: DeviceOrientation = {
      orientation: isPortrait ? 'portrait' : 'landscape',
      angle,
      isPortrait,
      isLandscape: !isPortrait,
      width: innerWidth,
      height: innerHeight,
    };

    setOrientation(prev => {
      // Only update if orientation actually changed
      if (prev.orientation !== newOrientation.orientation) {
        onOrientationChange?.(newOrientation);
      }
      return newOrientation;
    });
  }, [onOrientationChange]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleOrientationChange = () => {
      // Debounce orientation changes
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateOrientation, debounceMs);
    };

    const handleResize = () => {
      handleOrientationChange();
    };

    // Listen for orientation change events
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleResize);

    // Support for Screen Orientation API
    if (screen.orientation) {
      screen.orientation.addEventListener('change', handleOrientationChange);
    }

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleResize);
      
      if (screen.orientation) {
        screen.orientation.removeEventListener('change', handleOrientationChange);
      }
    };
  }, [updateOrientation, debounceMs]);

  const lockOrientation = useCallback(async (orientation: OrientationLockType) => {
    if (!screen.orientation?.lock) {
      console.warn('Screen orientation lock not supported');
      return false;
    }

    try {
      await screen.orientation.lock(orientation);
      return true;
    } catch (error) {
      console.warn('Failed to lock orientation:', error);
      return false;
    }
  }, []);

  const unlockOrientation = useCallback(() => {
    if (!screen.orientation?.unlock) {
      console.warn('Screen orientation unlock not supported');
      return false;
    }

    try {
      screen.orientation.unlock();
      return true;
    } catch (error) {
      console.warn('Failed to unlock orientation:', error);
      return false;
    }
  }, []);

  return {
    ...orientation,
    lockOrientation,
    unlockOrientation,
  };
}

// Hook for handling orientation-specific layouts
export function useOrientationLayout() {
  const orientation = useDeviceOrientation();

  const getLayoutClasses = useCallback((config: {
    portrait?: string;
    landscape?: string;
    base?: string;
  }) => {
    const { portrait = '', landscape = '', base = '' } = config;
    
    return [
      base,
      orientation.isPortrait ? portrait : landscape,
    ].filter(Boolean).join(' ');
  }, [orientation.isPortrait]);

  const isBreakpoint = useCallback((breakpoint: 'sm' | 'md' | 'lg' | 'xl') => {
    const breakpoints = {
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
    };
    
    return orientation.width >= breakpoints[breakpoint];
  }, [orientation.width]);

  return {
    ...orientation,
    getLayoutClasses,
    isBreakpoint,
  };
}

// Hook for responsive design based on orientation
export function useResponsiveOrientation() {
  const orientation = useDeviceOrientation();

  const isMobilePortrait = orientation.isPortrait && orientation.width < 768;
  const isMobileLandscape = orientation.isLandscape && orientation.height < 768;
  const isTabletPortrait = orientation.isPortrait && orientation.width >= 768 && orientation.width < 1024;
  const isTabletLandscape = orientation.isLandscape && orientation.height >= 768 && orientation.height < 1024;
  const isDesktop = orientation.width >= 1024;

  return {
    ...orientation,
    isMobilePortrait,
    isMobileLandscape,
    isTabletPortrait,
    isTabletLandscape,
    isDesktop,
    isMobile: isMobilePortrait || isMobileLandscape,
    isTablet: isTabletPortrait || isTabletLandscape,
  };
}