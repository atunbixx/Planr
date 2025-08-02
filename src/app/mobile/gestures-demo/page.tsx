'use client';

import { useState } from 'react';
import {
  SwipeGesture,
  SwipeNavigation,
  LongPress,
  LongPressContextMenu,
  TouchRipple,
  RippleButton,
  RippleFAB,
  PinchZoom,
  ZoomableImage,
  ZoomableGallery,
  HapticFeedback,
} from '@/components/mobile/gestures';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useTouchRipple } from '@/hooks/useTouchRipple';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';
import { useMobileDetect } from '@/hooks/useMobileDetect';
import { 
  Heart, 
  Star, 
  Share, 
  Download, 
  Delete, 
  Edit, 
  Plus, 
  Camera,
  Palette,
  Music
} from 'lucide-react';

export default function GesturesDemoPage() {
  const [swipeCount, setSwipeCount] = useState(0);
  const [longPressCount, setLongPressCount] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const [currentDemo, setCurrentDemo] = useState(0);
  const { isMobile, isTablet } = useMobileDetect();
  const { orientation, isPortrait } = useDeviceOrientation();

  const demoSections = [
    'Swipe Gestures',
    'Long Press & Context',
    'Touch Ripples',
    'Pinch & Zoom',
    'Combined Features'
  ];

  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: () => {
      setCurrentDemo(prev => Math.min(prev + 1, demoSections.length - 1));
      setSwipeCount(prev => prev + 1);
    },
    onSwipeRight: () => {
      setCurrentDemo(prev => Math.max(prev - 1, 0));
      setSwipeCount(prev => prev + 1);
    },
    onSwipeUp: () => setSwipeCount(prev => prev + 1),
    onSwipeDown: () => setSwipeCount(prev => prev + 1),
  });

  const contextMenuItems = [
    { label: 'Like', icon: <Heart className="h-4 w-4" />, action: () => alert('Liked!') },
    { label: 'Share', icon: <Share className="h-4 w-4" />, action: () => alert('Shared!') },
    { label: 'Download', icon: <Download className="h-4 w-4" />, action: () => alert('Downloaded!') },
    { label: 'Delete', icon: <Delete className="h-4 w-4" />, action: () => alert('Deleted!'), destructive: true },
  ];

  const sampleImages = [
    {
      src: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop',
      alt: 'Wedding bouquet',
      caption: 'Beautiful bridal bouquet with white roses'
    },
    {
      src: 'https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?w=800&h=600&fit=crop',
      alt: 'Wedding rings',
      caption: 'Golden wedding rings on lace'
    },
    {
      src: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&h=600&fit=crop',
      alt: 'Wedding venue',
      caption: 'Elegant outdoor wedding ceremony'
    },
  ];

  const renderSwipeDemo = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Swipe Navigation</h3>
        <div 
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-8 text-center"
          {...swipeHandlers}
        >
          <div className="text-2xl mb-2">👆</div>
          <p className="font-medium">Swipe in any direction!</p>
          <p className="text-sm opacity-80 mt-2">
            Swipes detected: {swipeCount}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Swipe Between Cards</h3>
        <SwipeGesture
          className="relative h-48 overflow-hidden rounded-lg"
          onSwipeLeft={() => setCurrentDemo(1)}
          onSwipeRight={() => setCurrentDemo(4)}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 text-white flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl mb-2">💫</div>
              <p className="font-medium">Card {currentDemo + 1}</p>
              <p className="text-sm opacity-80">Swipe left/right to change</p>
            </div>
          </div>
        </SwipeGesture>
      </div>
    </div>
  );

  const renderLongPressDemo = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Long Press Actions</h3>
        <LongPress
          className="bg-orange-500 text-white rounded-lg p-8 text-center cursor-pointer"
          onLongPress={() => {
            setLongPressCount(prev => prev + 1);
            alert('Long press detected!');
          }}
          onPress={() => {
            setTapCount(prev => prev + 1);
          }}
        >
          <div className="text-2xl mb-2">⏱️</div>
          <p className="font-medium">Press and hold me!</p>
          <p className="text-sm opacity-80 mt-2">
            Long presses: {longPressCount} | Taps: {tapCount}
          </p>
        </LongPress>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Context Menu</h3>
        <LongPressContextMenu
          items={contextMenuItems}
          className="bg-purple-500 text-white rounded-lg p-8 text-center cursor-pointer"
        >
          <div className="text-2xl mb-2">📱</div>
          <p className="font-medium">Long press for menu</p>
          <p className="text-sm opacity-80 mt-2">
            Try long pressing this card
          </p>
        </LongPressContextMenu>
      </div>
    </div>
  );

  const renderRippleDemo = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Touch Ripples</h3>
        <div className="grid grid-cols-2 gap-4">
          <TouchRipple className="bg-blue-500 text-white rounded-lg p-6 text-center cursor-pointer">
            <div className="text-xl mb-1">💧</div>
            <p className="text-sm">Tap for ripple</p>
          </TouchRipple>
          
          <TouchRipple 
            className="bg-green-500 text-white rounded-lg p-6 text-center cursor-pointer"
            rippleColor="rgba(255, 255, 255, 0.5)"
            center
          >
            <div className="text-xl mb-1">🎯</div>
            <p className="text-sm">Centered ripple</p>
          </TouchRipple>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Ripple Buttons</h3>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <RippleButton variant="primary" size="sm">
              Small Button
            </RippleButton>
            <RippleButton variant="secondary" size="md">
              Medium Button
            </RippleButton>
            <RippleButton variant="ghost" size="lg">
              Large Button
            </RippleButton>
          </div>
          
          <div className="flex justify-center">
            <RippleFAB
              icon={<Plus className="h-6 w-6" />}
              onClick={() => alert('FAB clicked!')}
              className="relative"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderPinchDemo = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Pinch to Zoom</h3>
        <div className="h-64 rounded-lg overflow-hidden border border-gray-300">
          <ZoomableImage
            src="https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop"
            alt="Wedding bouquet"
            className="w-full h-full"
          />
        </div>
        <p className="text-sm text-gray-600 mt-2 text-center">
          Use two fingers to pinch and zoom, double tap to reset
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Zoomable Gallery</h3>
        <div className="h-64 rounded-lg overflow-hidden border border-gray-300">
          <ZoomableGallery images={sampleImages} />
        </div>
        <p className="text-sm text-gray-600 mt-2 text-center">
          Navigate with arrows, zoom with pinch gestures
        </p>
      </div>
    </div>
  );

  const renderCombinedDemo = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Combined Features Card</h3>
        <SwipeGesture
          onSwipeLeft={() => alert('Swiped left!')}
          onSwipeRight={() => alert('Swiped right!')}
        >
          <LongPressContextMenu
            items={[
              { label: 'Edit', icon: <Edit className="h-4 w-4" />, action: () => alert('Edit!') },
              { label: 'Star', icon: <Star className="h-4 w-4" />, action: () => alert('Starred!') },
              { label: 'Delete', icon: <Delete className="h-4 w-4" />, action: () => alert('Deleted!'), destructive: true },
            ]}
          >
            <TouchRipple className="bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg p-8 cursor-pointer">
              <div className="text-center">
                <div className="text-3xl mb-3">🎉</div>
                <h4 className="font-bold text-lg mb-2">Multi-Gesture Card</h4>
                <p className="text-sm opacity-90 mb-4">
                  This card supports multiple gestures:
                </p>
                <div className="text-xs space-y-1 opacity-80">
                  <p>• Tap for ripple effect</p>
                  <p>• Swipe left/right for navigation</p>
                  <p>• Long press for context menu</p>
                </div>
              </div>
            </TouchRipple>
          </LongPressContextMenu>
        </SwipeGesture>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Haptic Feedback Examples</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { pattern: 'light' as const, icon: <Camera className="h-5 w-5" />, label: 'Light', color: 'bg-blue-500' },
            { pattern: 'medium' as const, icon: <Palette className="h-5 w-5" />, label: 'Medium', color: 'bg-green-500' },
            { pattern: 'heavy' as const, icon: <Music className="h-5 w-5" />, label: 'Heavy', color: 'bg-orange-500' },
            { pattern: 'success' as const, icon: <Star className="h-5 w-5" />, label: 'Success', color: 'bg-purple-500' },
          ].map((item) => (
            <HapticFeedback key={item.pattern} pattern={item.pattern}>
              <TouchRipple className={`${item.color} text-white rounded-lg p-4 text-center cursor-pointer`}>
                <div className="flex flex-col items-center space-y-1">
                  {item.icon}
                  <span className="text-xs">{item.label}</span>
                </div>
              </TouchRipple>
            </HapticFeedback>
          ))}
        </div>
      </div>
    </div>
  );

  const sections = [
    renderSwipeDemo,
    renderLongPressDemo,
    renderRippleDemo,
    renderPinchDemo,
    renderCombinedDemo,
  ];

  return (
    <div className={`min-h-screen bg-gray-50 ${isPortrait ? 'portrait' : 'landscape'}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Gesture Playground</h1>
              <p className="text-sm text-gray-600">
                Try all the mobile gestures and interactions
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {demoSections[currentDemo]}
              </p>
              <p className="text-xs text-gray-500">
                {currentDemo + 1} of {demoSections.length}
              </p>
            </div>
          </div>
          
          {/* Section Indicators */}
          <div className="flex justify-center mt-3 space-x-1">
            {demoSections.map((_, index) => (
              <TouchRipple
                key={index}
                className={`h-2 w-8 rounded-full transition-colors cursor-pointer ${
                  index === currentDemo ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                onClick={() => setCurrentDemo(index)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Device Info */}
      <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-blue-700">
            📱 {isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'} • {orientation}
          </span>
          <span className="text-blue-600">
            Swipe to navigate sections
          </span>
        </div>
      </div>

      {/* Main Content */}
      <SwipeNavigation
        className="px-4 py-6"
        onSwipeLeft={() => setCurrentDemo(prev => Math.min(prev + 1, demoSections.length - 1))}
        onSwipeRight={() => setCurrentDemo(prev => Math.max(prev - 1, 0))}
      >
        {sections[currentDemo]()}
      </SwipeNavigation>

      {/* Navigation */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <RippleButton
            variant="secondary"
            size="sm"
            onClick={() => setCurrentDemo(prev => Math.max(prev - 1, 0))}
            disabled={currentDemo === 0}
          >
            Previous
          </RippleButton>
          
          <div className="text-center">
            <p className="text-xs text-gray-500">
              {currentDemo + 1} / {demoSections.length}
            </p>
          </div>
          
          <RippleButton
            variant="primary"
            size="sm"
            onClick={() => setCurrentDemo(prev => Math.min(prev + 1, demoSections.length - 1))}
            disabled={currentDemo === demoSections.length - 1}
          >
            Next
          </RippleButton>
        </div>
      </div>
    </div>
  );
}