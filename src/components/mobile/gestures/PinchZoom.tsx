'use client';

import { ReactNode, useRef, useCallback, TouchEvent, useState, useEffect } from 'react';
import { cn } from '@/utils/cn';

interface PinchZoomProps {
  children: ReactNode;
  className?: string;
  minZoom?: number;
  maxZoom?: number;
  initialZoom?: number;
  zoomSensitivity?: number;
  disabled?: boolean;
  onZoomChange?: (zoom: number) => void;
  doubleTapZoom?: number; // Zoom level for double tap
}

interface TouchPoint {
  x: number;
  y: number;
}

export function PinchZoom({
  children,
  className,
  minZoom = 0.5,
  maxZoom = 3,
  initialZoom = 1,
  zoomSensitivity = 0.01,
  disabled = false,
  onZoomChange,
  doubleTapZoom = 2,
}: PinchZoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(initialZoom);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isActive, setIsActive] = useState(false);
  
  // Touch tracking
  const lastTouchesRef = useRef<TouchPoint[]>([]);
  const lastZoomRef = useRef(initialZoom);
  const lastPanRef = useRef({ x: 0, y: 0 });
  
  // Double tap detection
  const lastTapTimeRef = useRef(0);
  const tapCountRef = useRef(0);

  const constrainZoom = useCallback((value: number) => {
    return Math.min(Math.max(value, minZoom), maxZoom);
  }, [minZoom, maxZoom]);

  const getDistance = useCallback((touches: TouchPoint[]) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].x - touches[1].x;
    const dy = touches[0].y - touches[1].y;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const getCenter = useCallback((touches: TouchPoint[]) => {
    if (touches.length === 0) return { x: 0, y: 0 };
    if (touches.length === 1) return touches[0];
    
    return {
      x: (touches[0].x + touches[1].x) / 2,
      y: (touches[0].y + touches[1].y) / 2,
    };
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled) return;

    e.preventDefault();
    
    const touches = Array.from(e.touches).map(touch => ({
      x: touch.clientX,
      y: touch.clientY,
    }));

    lastTouchesRef.current = touches;
    lastZoomRef.current = zoom;
    lastPanRef.current = { x: panX, y: panY };
    setIsActive(true);

    // Double tap detection
    if (touches.length === 1) {
      const now = Date.now();
      const timeDiff = now - lastTapTimeRef.current;
      
      if (timeDiff < 300 && tapCountRef.current === 1) {
        // Double tap detected
        const newZoom = zoom === initialZoom ? doubleTapZoom : initialZoom;
        setZoom(constrainZoom(newZoom));
        onZoomChange?.(constrainZoom(newZoom));
        
        // Reset pan on double tap
        setPanX(0);
        setPanY(0);
        
        tapCountRef.current = 0;
        lastTapTimeRef.current = 0;
      } else {
        tapCountRef.current = 1;
        lastTapTimeRef.current = now;
      }
    }
  }, [disabled, zoom, panX, panY, initialZoom, doubleTapZoom, constrainZoom, onZoomChange]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (disabled || !isActive) return;

    e.preventDefault();

    const touches = Array.from(e.touches).map(touch => ({
      x: touch.clientX,
      y: touch.clientY,
    }));

    if (touches.length === 2 && lastTouchesRef.current.length === 2) {
      // Pinch zoom
      const currentDistance = getDistance(touches);
      const lastDistance = getDistance(lastTouchesRef.current);
      
      if (lastDistance > 0) {
        const scaleFactor = currentDistance / lastDistance;
        const newZoom = constrainZoom(lastZoomRef.current * scaleFactor);
        setZoom(newZoom);
        onZoomChange?.(newZoom);
      }
    } else if (touches.length === 1 && lastTouchesRef.current.length === 1) {
      // Pan (only if zoomed in)
      if (zoom > 1) {
        const deltaX = touches[0].x - lastTouchesRef.current[0].x;
        const deltaY = touches[0].y - lastTouchesRef.current[0].y;
        
        setPanX(lastPanRef.current.x + deltaX);
        setPanY(lastPanRef.current.y + deltaY);
      }
    }

    lastTouchesRef.current = touches;
  }, [disabled, isActive, getDistance, constrainZoom, zoom, onZoomChange]);

  const handleTouchEnd = useCallback(() => {
    setIsActive(false);
    lastTouchesRef.current = [];
  }, []);

  // Reset function
  const reset = useCallback(() => {
    setZoom(initialZoom);
    setPanX(0);
    setPanY(0);
    onZoomChange?.(initialZoom);
  }, [initialZoom, onZoomChange]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      
      if (e.key === 'Escape') {
        reset();
      } else if (e.key === '+' || e.key === '=') {
        const newZoom = constrainZoom(zoom * 1.2);
        setZoom(newZoom);
        onZoomChange?.(newZoom);
      } else if (e.key === '-') {
        const newZoom = constrainZoom(zoom / 1.2);
        setZoom(newZoom);
        onZoomChange?.(newZoom);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, zoom, reset, constrainZoom, onZoomChange]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden touch-none select-none',
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div
        className="origin-center transition-transform"
        style={{
          transform: `scale(${zoom}) translate(${panX / zoom}px, ${panY / zoom}px)`,
          transformOrigin: 'center center',
        }}
      >
        {children}
      </div>
      
      {/* Zoom indicator */}
      {zoom !== initialZoom && (
        <div className="absolute top-4 left-4 bg-black/70 text-white px-2 py-1 rounded text-sm">
          {Math.round(zoom * 100)}%
        </div>
      )}
      
      {/* Reset button */}
      {(zoom !== initialZoom || panX !== 0 || panY !== 0) && (
        <button
          onClick={reset}
          className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded text-sm hover:bg-black/80"
        >
          Reset
        </button>
      )}
    </div>
  );
}

// Image zoom component
interface ZoomableImageProps {
  src: string;
  alt: string;
  className?: string;
  minZoom?: number;
  maxZoom?: number;
}

export function ZoomableImage({
  src,
  alt,
  className,
  minZoom = 0.5,
  maxZoom = 4,
}: ZoomableImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <PinchZoom
      className={cn('w-full h-full bg-gray-100', className)}
      minZoom={minZoom}
      maxZoom={maxZoom}
    >
      <img
        src={src}
        alt={alt}
        className={cn(
          'w-full h-full object-contain transition-opacity',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
        onLoad={() => setIsLoaded(true)}
        draggable={false}
      />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )}
    </PinchZoom>
  );
}

// Gallery component with pinch zoom
interface ZoomableGalleryProps {
  images: Array<{ src: string; alt: string; caption?: string }>;
  className?: string;
}

export function ZoomableGallery({ images, className }: ZoomableGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentImage = images[currentIndex];

  if (!currentImage) return null;

  return (
    <div className={cn('relative w-full h-full', className)}>
      <ZoomableImage
        src={currentImage.src}
        alt={currentImage.alt}
        className="w-full h-full"
      />
      
      {/* Navigation */}
      {images.length > 1 && (
        <>
          <button
            onClick={() => setCurrentIndex(prev => (prev - 1 + images.length) % images.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 text-white p-2 rounded-full"
          >
            ←
          </button>
          <button
            onClick={() => setCurrentIndex(prev => (prev + 1) % images.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 text-white p-2 rounded-full"
          >
            →
          </button>
        </>
      )}
      
      {/* Caption */}
      {currentImage.caption && (
        <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white p-3 rounded">
          {currentImage.caption}
        </div>
      )}
      
      {/* Indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                'w-2 h-2 rounded-full',
                index === currentIndex ? 'bg-white' : 'bg-white/50'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}