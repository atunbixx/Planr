'use client';

import { useState } from 'react';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PullToRefreshDemo() {
  const [items, setItems] = useState([
    { id: 1, title: 'Wedding Venue', status: 'Booked', icon: '🏛️' },
    { id: 2, title: 'Photographer', status: 'Researching', icon: '📸' },
    { id: 3, title: 'Catering', status: 'Contacted', icon: '🍽️' },
    { id: 4, title: 'Flowers', status: 'Pending', icon: '💐' },
    { id: 5, title: 'Music/DJ', status: 'Booked', icon: '🎵' },
  ]);

  const [refreshCount, setRefreshCount] = useState(0);
  const [customTheme, setCustomTheme] = useState(false);

  const handleRefresh = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update data
    setRefreshCount(prev => prev + 1);
    
    // Randomly update some statuses
    setItems(prevItems => 
      prevItems.map(item => ({
        ...item,
        status: Math.random() > 0.5 ? 'Updated!' : item.status
      }))
    );
  };

  const defaultExample = (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Default Theme</h3>
      {items.map(item => (
        <Card key={item.id} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <h4 className="font-medium">{item.title}</h4>
                <p className="text-sm text-gray-600">{item.status}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm">View</Button>
          </div>
        </Card>
      ))}
      <div className="text-center py-4 text-sm text-gray-500">
        Refresh count: {refreshCount}
      </div>
    </div>
  );

  const customExample = (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Custom Theme</h3>
      <div className="grid gap-4">
        {['💒', '💍', '👰', '🤵', '🎂', '🥂'].map((emoji, index) => (
          <div key={index} className="bg-pink-50 p-6 rounded-lg text-center">
            <div className="text-4xl mb-2">{emoji}</div>
            <p className="text-sm text-pink-700">Item {index + 1}</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-2">Pull-to-Refresh Demo</h1>
        <p className="text-gray-600 mb-6">
          Pull down on the content below to see the refresh in action
        </p>

        <div className="flex gap-4 mb-6">
          <Button 
            onClick={() => setCustomTheme(false)}
            variant={!customTheme ? 'default' : 'secondary'}
          >
            Default Theme
          </Button>
          <Button 
            onClick={() => setCustomTheme(true)}
            variant={customTheme ? 'default' : 'secondary'}
          >
            Custom Theme
          </Button>
        </div>

        <Card className="h-[600px] overflow-hidden">
          {!customTheme ? (
            <PullToRefresh
              onRefresh={handleRefresh}
              className="h-full"
              pullText="Pull to refresh your wedding plans"
              releaseText="Release to update"
              loadingText="Updating your wedding details..."
              successText="Wedding plans refreshed!"
            >
              <div className="p-6">
                {defaultExample}
              </div>
            </PullToRefresh>
          ) : (
            <PullToRefresh
              onRefresh={handleRefresh}
              className="h-full bg-pink-50"
              pullText="💕 Pull for love"
              releaseText="💖 Release to refresh"
              loadingText="💝 Loading romance..."
              successText="💐 Love refreshed!"
              refreshIndicator={<div className="text-4xl animate-bounce">💕</div>}
              loadingIndicator={<div className="text-4xl animate-spin">💖</div>}
              successIndicator={<div className="text-4xl animate-pulse">💐</div>}
              showLastRefreshTime={false}
            >
              <div className="p-6">
                {customExample}
              </div>
            </PullToRefresh>
          )}
        </Card>

        <div className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Implementation Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-gray-600">
                • Works with both touch (mobile) and mouse (desktop) events
              </p>
              <p className="text-sm text-gray-600">
                • Includes haptic feedback on supported devices
              </p>
              <p className="text-sm text-gray-600">
                • Smooth elastic animations at 60fps
              </p>
              <p className="text-sm text-gray-600">
                • Prevents multiple simultaneous refreshes
              </p>
              <p className="text-sm text-gray-600">
                • Shows last refresh time by default
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}