'use client';

import { useState, useEffect } from 'react';

interface MobileDetection {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isTouchDevice: boolean;
}

export function useMobileDetect(): MobileDetection {
  const [detection, setDetection] = useState<MobileDetection>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isIOS: false,
    isAndroid: false,
    isTouchDevice: false,
  });

  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      
      // Check for mobile devices
      const isMobile = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent.toLowerCase()
      );
      
      // Check for tablets
      const isTablet = /ipad|tablet|playbook|silk/i.test(userAgent.toLowerCase()) ||
        (isMobile && window.innerWidth >= 768 && window.innerWidth < 1024);
      
      // Check for specific platforms
      const isIOS = /iphone|ipad|ipod/i.test(userAgent.toLowerCase());
      const isAndroid = /android/i.test(userAgent.toLowerCase());
      
      // Check for touch support
      const isTouchDevice = 'ontouchstart' in window || 
        navigator.maxTouchPoints > 0 ||
        (navigator as any).msMaxTouchPoints > 0;
      
      // Desktop is when it's not mobile or tablet
      const isDesktop = !isMobile && !isTablet;
      
      setDetection({
        isMobile,
        isTablet,
        isDesktop,
        isIOS,
        isAndroid,
        isTouchDevice,
      });
    };

    // Initial check
    checkDevice();

    // Re-check on resize (in case of device rotation or responsive testing)
    const handleResize = () => {
      checkDevice();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return detection;
}