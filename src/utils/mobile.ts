// Mobile utility functions for device detection, touch calculations, and gesture recognition

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isTouchDevice: boolean;
  userAgent: string;
  platform: string;
  screenSize: 'small' | 'medium' | 'large';
  hasNotch: boolean;
}

export interface TouchPoint {
  x: number;
  y: number;
  force?: number;
  radiusX?: number;
  radiusY?: number;
  rotationAngle?: number;
  timestamp: number;
}

export interface GestureData {
  type: 'tap' | 'swipe' | 'pinch' | 'longpress' | 'doubletap';
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  velocity?: number;
  scale?: number;
  duration: number;
  startPoint: TouchPoint;
  endPoint?: TouchPoint;
}

// Device Detection
export function detectDevice(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isIOS: false,
      isAndroid: false,
      isTouchDevice: false,
      userAgent: '',
      platform: '',
      screenSize: 'large',
      hasNotch: false,
    };
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() || '';
  
  // Mobile detection
  const mobileRegex = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i;
  const isMobile = mobileRegex.test(userAgent);
  
  // Tablet detection
  const tabletRegex = /ipad|tablet|playbook|silk/i;
  const isTablet = tabletRegex.test(userAgent) || 
    (isMobile && window.innerWidth >= 768 && window.innerWidth < 1024);
  
  // Platform detection
  const isIOS = /iphone|ipad|ipod/i.test(userAgent);
  const isAndroid = /android/i.test(userAgent);
  
  // Touch support
  const isTouchDevice = 'ontouchstart' in window || 
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0;
  
  // Screen size classification
  const width = window.innerWidth;
  let screenSize: 'small' | 'medium' | 'large';
  if (width < 640) screenSize = 'small';
  else if (width < 1024) screenSize = 'medium';
  else screenSize = 'large';
  
  // Notch detection (iOS devices with notch)
  const hasNotch = isIOS && (
    // iPhone X, XS, XR, 11, 12, 13, 14 series screen heights
    window.screen.height === 812 || // iPhone X, XS, 11 Pro
    window.screen.height === 896 || // iPhone XR, 11, XS Max, 11 Pro Max
    window.screen.height === 844 || // iPhone 12, 12 Pro
    window.screen.height === 926 || // iPhone 12 Pro Max
    window.screen.height === 852 || // iPhone 14, 14 Pro
    window.screen.height === 932    // iPhone 14 Plus, 14 Pro Max
  );

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    isIOS,
    isAndroid,
    isTouchDevice,
    userAgent,
    platform,
    screenSize,
    hasNotch,
  };
}

// Touch Point Calculations
export function createTouchPoint(touch: Touch): TouchPoint {
  return {
    x: touch.clientX,
    y: touch.clientY,
    force: touch.force,
    radiusX: touch.radiusX,
    radiusY: touch.radiusY,
    rotationAngle: touch.rotationAngle,
    timestamp: Date.now(),
  };
}

export function calculateDistance(point1: TouchPoint, point2: TouchPoint): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function calculateVelocity(point1: TouchPoint, point2: TouchPoint): number {
  const distance = calculateDistance(point1, point2);
  const time = point2.timestamp - point1.timestamp;
  return time > 0 ? distance / time : 0;
}

export function calculateAngle(point1: TouchPoint, point2: TouchPoint): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.atan2(dy, dx) * (180 / Math.PI);
}

export function calculateCenter(points: TouchPoint[]): TouchPoint {
  if (points.length === 0) return { x: 0, y: 0, timestamp: Date.now() };
  
  const sum = points.reduce(
    (acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y,
    }),
    { x: 0, y: 0 }
  );
  
  return {
    x: sum.x / points.length,
    y: sum.y / points.length,
    timestamp: Date.now(),
  };
}

// Gesture Recognition
export function recognizeSwipe(
  startPoint: TouchPoint,
  endPoint: TouchPoint,
  threshold: number = 50,
  minVelocity: number = 0.3
): GestureData | null {
  const distance = calculateDistance(startPoint, endPoint);
  const velocity = calculateVelocity(startPoint, endPoint);
  const duration = endPoint.timestamp - startPoint.timestamp;
  
  if (distance < threshold || velocity < minVelocity) {
    return null;
  }
  
  const angle = calculateAngle(startPoint, endPoint);
  let direction: 'up' | 'down' | 'left' | 'right';
  
  if (angle >= -45 && angle <= 45) direction = 'right';
  else if (angle >= 45 && angle <= 135) direction = 'down';
  else if (angle >= 135 || angle <= -135) direction = 'left';
  else direction = 'up';
  
  return {
    type: 'swipe',
    direction,
    distance,
    velocity,
    duration,
    startPoint,
    endPoint,
  };
}

export function recognizeTap(
  startPoint: TouchPoint,
  endPoint: TouchPoint,
  maxDistance: number = 10,
  maxDuration: number = 200
): GestureData | null {
  const distance = calculateDistance(startPoint, endPoint);
  const duration = endPoint.timestamp - startPoint.timestamp;
  
  if (distance > maxDistance || duration > maxDuration) {
    return null;
  }
  
  return {
    type: 'tap',
    duration,
    startPoint,
    endPoint,
  };
}

export function recognizeLongPress(
  startPoint: TouchPoint,
  endPoint: TouchPoint,
  minDuration: number = 500,
  maxDistance: number = 15
): GestureData | null {
  const distance = calculateDistance(startPoint, endPoint);
  const duration = endPoint.timestamp - startPoint.timestamp;
  
  if (distance > maxDistance || duration < minDuration) {
    return null;
  }
  
  return {
    type: 'longpress',
    duration,
    startPoint,
    endPoint,
  };
}

export function recognizeDoubleTap(
  tap1: GestureData,
  tap2: GestureData,
  maxTimeBetween: number = 300,
  maxDistance: number = 50
): GestureData | null {
  if (tap1.type !== 'tap' || tap2.type !== 'tap') {
    return null;
  }
  
  const timeBetween = tap2.startPoint.timestamp - (tap1.endPoint?.timestamp || tap1.startPoint.timestamp);
  const distance = calculateDistance(tap1.startPoint, tap2.startPoint);
  
  if (timeBetween > maxTimeBetween || distance > maxDistance) {
    return null;
  }
  
  return {
    type: 'doubletap',
    duration: tap2.startPoint.timestamp - tap1.startPoint.timestamp,
    startPoint: tap1.startPoint,
    endPoint: tap2.endPoint,
  };
}

export function recognizePinch(
  startPoints: TouchPoint[],
  endPoints: TouchPoint[]
): GestureData | null {
  if (startPoints.length !== 2 || endPoints.length !== 2) {
    return null;
  }
  
  const startDistance = calculateDistance(startPoints[0], startPoints[1]);
  const endDistance = calculateDistance(endPoints[0], endPoints[1]);
  const scale = endDistance / startDistance;
  const duration = endPoints[0].timestamp - startPoints[0].timestamp;
  
  // Minimum scale change to register as pinch
  if (Math.abs(scale - 1) < 0.1) {
    return null;
  }
  
  return {
    type: 'pinch',
    scale,
    duration,
    startPoint: calculateCenter(startPoints),
    endPoint: calculateCenter(endPoints),
  };
}

// Accessibility Helpers
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  if (typeof window === 'undefined') return;
  
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

export function setFocusTrap(container: HTMLElement): () => void {
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');
  
  const focusableElements = container.querySelectorAll(focusableSelectors) as NodeListOf<HTMLElement>;
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };
  
  container.addEventListener('keydown', handleTabKey);
  firstElement?.focus();
  
  return () => {
    container.removeEventListener('keydown', handleTabKey);
  };
}

export function enhanceAccessibility(element: HTMLElement, options: {
  role?: string;
  label?: string;
  describedBy?: string;
  expanded?: boolean;
  controls?: string;
}): void {
  const { role, label, describedBy, expanded, controls } = options;
  
  if (role) element.setAttribute('role', role);
  if (label) element.setAttribute('aria-label', label);
  if (describedBy) element.setAttribute('aria-describedby', describedBy);
  if (typeof expanded === 'boolean') element.setAttribute('aria-expanded', String(expanded));
  if (controls) element.setAttribute('aria-controls', controls);
}

// Performance Utilities
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Safe area utilities for devices with notches
export function getSafeAreaInsets(): {
  top: number;
  right: number;
  bottom: number;
  left: number;
} {
  if (typeof window === 'undefined') {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }
  
  const style = getComputedStyle(document.documentElement);
  
  return {
    top: parseInt(style.getPropertyValue('--sat') || '0', 10),
    right: parseInt(style.getPropertyValue('--sar') || '0', 10),
    bottom: parseInt(style.getPropertyValue('--sab') || '0', 10),
    left: parseInt(style.getPropertyValue('--sal') || '0', 10),
  };
}

export function applySafeAreaStyles(element: HTMLElement): void {
  element.style.paddingTop = `max(${element.style.paddingTop || '0px'}, env(safe-area-inset-top))`;
  element.style.paddingRight = `max(${element.style.paddingRight || '0px'}, env(safe-area-inset-right))`;
  element.style.paddingBottom = `max(${element.style.paddingBottom || '0px'}, env(safe-area-inset-bottom))`;
  element.style.paddingLeft = `max(${element.style.paddingLeft || '0px'}, env(safe-area-inset-left))`;
}