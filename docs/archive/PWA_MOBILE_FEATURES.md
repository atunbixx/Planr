# PWA Mobile-Specific Features

## Mobile UI/UX Enhancements

### 1. Bottom Navigation Bar
Create a mobile-friendly bottom navigation for easy thumb access:

```tsx
// src/components/MobileNavigation.tsx
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Home, 
  Users, 
  Calendar, 
  MessageSquare, 
  Camera 
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/dashboard/guests', icon: Users, label: 'Guests' },
  { href: '/dashboard/timeline', icon: Calendar, label: 'Timeline' },
  { href: '/dashboard/messages', icon: MessageSquare, label: 'Messages' },
  { href: '/dashboard/photos', icon: Camera, label: 'Photos' },
];

export default function MobileNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 pb-safe z-50 md:hidden">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full px-2 ${
                isActive ? 'text-pink-500' : 'text-gray-500'
              }`}
            >
              <Icon size={24} />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

### 2. Pull-to-Refresh Implementation

```tsx
// src/hooks/usePullToRefresh.ts
import { useEffect, useRef, useState } from 'react';

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchEndY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = async () => {
      const pullDistance = touchEndY.current - touchStartY.current;
      
      if (pullDistance > 100 && window.scrollY === 0 && !isRefreshing) {
        setIsRefreshing(true);
        
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onRefresh, isRefreshing]);

  return { isRefreshing };
}
```

### 3. Swipe Gestures for Navigation

```tsx
// src/hooks/useSwipeGesture.ts
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export function useSwipeGesture(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void
) {
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const router = useRouter();

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
      const swipeDistance = touchEndX.current - touchStartX.current;
      const threshold = 75;

      if (Math.abs(swipeDistance) > threshold) {
        if (swipeDistance > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (swipeDistance < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight]);
}
```

### 4. Mobile-Optimized Forms

```tsx
// src/components/MobileInput.tsx
interface MobileInputProps {
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
}

export default function MobileInput({
  type = 'text',
  placeholder,
  value,
  onChange,
  icon
}: MobileInputProps) {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </div>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`
          w-full px-4 py-4 text-base
          bg-white border border-gray-200 rounded-xl
          focus:outline-none focus:ring-2 focus:ring-pink-500
          placeholder-gray-400
          ${icon ? 'pl-12' : ''}
          touch-manipulation
        `}
        // Mobile-specific attributes
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
      />
    </div>
  );
}
```

### 5. Touch-Friendly Action Sheets

```tsx
// src/components/ActionSheet.tsx
import { motion, AnimatePresence } from 'framer-motion';

interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  actions: Array<{
    label: string;
    onClick: () => void;
    destructive?: boolean;
  }>;
}

export default function ActionSheet({ 
  isOpen, 
  onClose, 
  title, 
  actions 
}: ActionSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 pb-safe"
          >
            <div className="p-4">
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-center mb-4">{title}</h3>
              <div className="space-y-2">
                {actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      action.onClick();
                      onClose();
                    }}
                    className={`
                      w-full py-4 px-6 rounded-xl text-center font-medium
                      transition-colors touch-manipulation
                      ${action.destructive 
                        ? 'bg-red-50 text-red-600 active:bg-red-100' 
                        : 'bg-gray-50 text-gray-900 active:bg-gray-100'
                      }
                    `}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
              <button
                onClick={onClose}
                className="w-full py-4 px-6 mt-2 text-center font-medium text-gray-600"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

### 6. Haptic Feedback Integration

```tsx
// src/utils/haptics.ts
export const haptics = {
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },
  
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },
  
  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 10, 30]);
    }
  },
  
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 20, 10]);
    }
  },
  
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 10, 50, 10, 50]);
    }
  }
};

// Usage in components
import { haptics } from '@/utils/haptics';

function handleButtonClick() {
  haptics.light();
  // ... rest of the logic
}
```

### 7. Mobile Camera Integration

```tsx
// src/components/CameraCapture.tsx
import { useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
}

export default function CameraCapture({ onCapture }: CameraCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onCapture(file);
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCapture}
        className="hidden"
      />
      
      {preview ? (
        <div className="relative">
          <img 
            src={preview} 
            alt="Captured" 
            className="w-full rounded-xl"
          />
          <button
            onClick={() => setPreview(null)}
            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-lg"
          >
            <X size={20} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full p-8 border-2 border-dashed border-gray-300 rounded-xl
                     flex flex-col items-center justify-center space-y-2
                     active:bg-gray-50 transition-colors touch-manipulation"
        >
          <Camera size={32} className="text-gray-400" />
          <span className="text-gray-600">Take Photo</span>
        </button>
      )}
    </div>
  );
}
```

### 8. Mobile Share Integration

```tsx
// src/utils/share.ts
interface ShareData {
  title: string;
  text?: string;
  url?: string;
  files?: File[];
}

export async function shareContent(data: ShareData): Promise<boolean> {
  // Check if Web Share API is available
  if (!navigator.share) {
    // Fallback to clipboard
    if (data.url) {
      await navigator.clipboard.writeText(data.url);
      return true;
    }
    return false;
  }

  try {
    // Check if sharing files is supported
    if (data.files && navigator.canShare && !navigator.canShare({ files: data.files })) {
      delete data.files;
    }

    await navigator.share(data);
    return true;
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      console.error('Share failed:', error);
    }
    return false;
  }
}

// Usage example
async function shareVendor(vendor: Vendor) {
  const success = await shareContent({
    title: `Wedding Vendor: ${vendor.name}`,
    text: `Check out ${vendor.name} - ${vendor.category}`,
    url: `${window.location.origin}/dashboard/vendors/${vendor.id}`
  });
  
  if (success) {
    haptics.success();
  }
}
```

### 9. Safe Area Handling (iOS)

```css
/* globals.css additions for safe areas */
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}

.pt-safe {
  padding-top: env(safe-area-inset-top);
}

.px-safe {
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

/* Viewport meta tag in layout.tsx */
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

### 10. Mobile Performance Optimizations

```tsx
// src/components/LazyImage.tsx
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  width: number;
  height: number;
}

export default function LazyImage({ 
  src, 
  alt, 
  className, 
  width, 
  height 
}: LazyImageProps) {
  const [isInView, setIsInView] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imageRef.current) {
      observer.observe(imageRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imageRef} className={className}>
      {isInView ? (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      ) : (
        <div 
          className="w-full h-full bg-gray-200 animate-pulse"
          style={{ aspectRatio: `${width}/${height}` }}
        />
      )}
    </div>
  );
}
```

## Mobile Testing Guidelines

### Device Testing Matrix
- **iOS**: iPhone SE, iPhone 12/13/14/15, iPad
- **Android**: Pixel 5/6/7, Samsung Galaxy S21/S22/S23
- **Browsers**: Safari (iOS), Chrome (Android), Samsung Internet

### Key Testing Points
1. Touch targets minimum 44x44px
2. Form inputs auto-zoom prevention
3. Gesture navigation compatibility
4. Safe area compliance
5. Performance on 3G/4G networks
6. Offline functionality
7. Background sync reliability
8. Push notification delivery
9. Install flow on both platforms
10. Share functionality

### Performance Targets
- First Input Delay: < 100ms
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1
- Time to Interactive: < 3.5s
- Bundle size: < 200KB (initial)