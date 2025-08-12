import { useRef, useEffect, useCallback } from 'react';

interface Point {
  x: number;
  y: number;
}

interface TouchGestureOptions {
  onPinch?: (scale: number, center: Point) => void;
  onPinchStart?: () => void;
  onPinchEnd?: () => void;
  onPan?: (delta: Point) => void;
  onPanStart?: (start: Point) => void;
  onPanEnd?: () => void;
  onSwipe?: (direction: 'left' | 'right' | 'up' | 'down', velocity: number) => void;
  onTap?: (point: Point) => void;
  onDoubleTap?: (point: Point) => void;
  onLongPress?: (point: Point) => void;
  minSwipeDistance?: number;
  minSwipeVelocity?: number;
  longPressDelay?: number;
  doubleTapDelay?: number;
}

export function useTouchGestures<T extends HTMLElement>(
  options: TouchGestureOptions
) {
  const {
    onPinch,
    onPinchStart,
    onPinchEnd,
    onPan,
    onPanStart,
    onPanEnd,
    onSwipe,
    onTap,
    onDoubleTap,
    onLongPress,
    minSwipeDistance = 50,
    minSwipeVelocity = 0.3,
    longPressDelay = 500,
    doubleTapDelay = 300,
  } = options;

  const ref = useRef<T>(null);
  const touchDataRef = useRef({
    startTouches: [] as Touch[],
    startTime: 0,
    lastTapTime: 0,
    isPinching: false,
    isPanning: false,
    initialPinchDistance: 0,
    longPressTimer: null as NodeJS.Timeout | null,
  });

  const getDistance = useCallback((touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const getCenter = useCallback((touch1: Touch, touch2: Touch): Point => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touches = Array.from(e.touches);
    touchDataRef.current.startTouches = touches;
    touchDataRef.current.startTime = Date.now();

    // Clear any existing long press timer
    if (touchDataRef.current.longPressTimer) {
      clearTimeout(touchDataRef.current.longPressTimer);
    }

    if (touches.length === 2 && onPinch) {
      // Pinch gesture
      touchDataRef.current.isPinching = true;
      touchDataRef.current.initialPinchDistance = getDistance(touches[0], touches[1]);
      if (onPinchStart) onPinchStart();
    } else if (touches.length === 1) {
      // Single touch - could be pan, tap, or long press
      const touch = touches[0];
      const point = { x: touch.clientX, y: touch.clientY };
      
      if (onPanStart) {
        touchDataRef.current.isPanning = true;
        onPanStart(point);
      }

      // Set up long press detection
      if (onLongPress) {
        touchDataRef.current.longPressTimer = setTimeout(() => {
          onLongPress(point);
          touchDataRef.current.longPressTimer = null;
        }, longPressDelay);
      }
    }
  }, [onPinch, onPinchStart, onPanStart, onLongPress, getDistance, longPressDelay]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const touches = Array.from(e.touches);

    // Cancel long press on move
    if (touchDataRef.current.longPressTimer) {
      clearTimeout(touchDataRef.current.longPressTimer);
      touchDataRef.current.longPressTimer = null;
    }

    if (touchDataRef.current.isPinching && touches.length === 2 && onPinch) {
      const currentDistance = getDistance(touches[0], touches[1]);
      const scale = currentDistance / touchDataRef.current.initialPinchDistance;
      const center = getCenter(touches[0], touches[1]);
      onPinch(scale, center);
    } else if (touchDataRef.current.isPanning && touches.length === 1 && onPan) {
      const touch = touches[0];
      const startTouch = touchDataRef.current.startTouches[0];
      const delta = {
        x: touch.clientX - startTouch.clientX,
        y: touch.clientY - startTouch.clientY,
      };
      onPan(delta);
    }
  }, [onPinch, onPan, getDistance, getCenter]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    const touches = Array.from(e.touches);
    const changedTouches = Array.from(e.changedTouches);
    const endTime = Date.now();
    const duration = endTime - touchDataRef.current.startTime;

    // Clear long press timer
    if (touchDataRef.current.longPressTimer) {
      clearTimeout(touchDataRef.current.longPressTimer);
      touchDataRef.current.longPressTimer = null;
    }

    // End pinch
    if (touchDataRef.current.isPinching && touches.length < 2) {
      touchDataRef.current.isPinching = false;
      if (onPinchEnd) onPinchEnd();
    }

    // End pan
    if (touchDataRef.current.isPanning && touches.length === 0) {
      touchDataRef.current.isPanning = false;
      if (onPanEnd) onPanEnd();
    }

    // Check for tap/swipe only if it was a single touch
    if (touchDataRef.current.startTouches.length === 1 && changedTouches.length === 1) {
      const startTouch = touchDataRef.current.startTouches[0];
      const endTouch = changedTouches[0];
      const deltaX = endTouch.clientX - startTouch.clientX;
      const deltaY = endTouch.clientY - startTouch.clientY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const velocity = distance / duration;

      // Check for swipe
      if (distance >= minSwipeDistance && velocity >= minSwipeVelocity && onSwipe) {
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        
        if (absX > absY) {
          onSwipe(deltaX > 0 ? 'right' : 'left', velocity);
        } else {
          onSwipe(deltaY > 0 ? 'down' : 'up', velocity);
        }
      } else if (distance < 10 && duration < 200) {
        // It's a tap
        const point = { x: endTouch.clientX, y: endTouch.clientY };
        
        // Check for double tap
        if (endTime - touchDataRef.current.lastTapTime < doubleTapDelay && onDoubleTap) {
          onDoubleTap(point);
          touchDataRef.current.lastTapTime = 0; // Reset to prevent triple tap
        } else if (onTap) {
          onTap(point);
          touchDataRef.current.lastTapTime = endTime;
        }
      }
    }
  }, [
    onPinchEnd,
    onPanEnd,
    onSwipe,
    onTap,
    onDoubleTap,
    minSwipeDistance,
    minSwipeVelocity,
    doubleTapDelay,
  ]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const preventDefaultTouch = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault(); // Prevent default pinch-to-zoom
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });
    element.addEventListener('touchmove', preventDefaultTouch, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchmove', preventDefaultTouch);
      
      if (touchDataRef.current.longPressTimer) {
        clearTimeout(touchDataRef.current.longPressTimer);
      }
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return ref;
}