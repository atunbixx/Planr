'use client'

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Users, Gift, Check } from 'lucide-react';

export default function TestStylesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-red-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-red-800 font-wedding">
            Wedding Planner Style Test
          </h1>
          <p className="text-lg text-gray-600">
            Testing all CSS styles and components
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="wedding-card animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <Heart className="w-5 h-5" />
                Wedding Theme
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Custom wedding-themed components with beautiful gradients and colors.
              </p>
              <Badge className="mt-2 bg-red-100 text-red-800">Premium</Badge>
            </CardContent>
          </Card>

          <Card className="premium-card animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Users className="w-5 h-5" />
                Guest Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Manage your guest list with style and elegance.
              </p>
              <div className="mt-4">
                <div className="progress-wedding w-full bg-gray-200 rounded-full h-2">
                  <div className="h-2 rounded-full" style={{width: '75%'}}></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <Gift className="w-5 h-5" />
                Vendor Portal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Connect with the best wedding vendors in your area.
              </p>
              <Button className="mt-4 bg-gradient-to-r from-red-600 to-green-600 text-white hover:from-red-700 hover:to-green-700">
                Browse Vendors
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Button Showcase */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800 font-wedding">Button Styles</h2>
          <div className="flex flex-wrap gap-4">
            <Button className="bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800">
              Primary Wedding
            </Button>
            <Button className="bg-gradient-to-r from-red-600 to-green-600 text-white hover:from-red-700 hover:to-green-700">
              Wedding Gradient
            </Button>
            <Button variant="outline">
              Outline
            </Button>
            <Button variant="secondary">
              Secondary
            </Button>
            <Button variant="ghost">
              Ghost
            </Button>
          </div>
        </div>

        {/* Color Palette */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800 font-wedding">Wedding Color Palette</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center space-y-2">
              <div className="w-20 h-20 mx-auto rounded-full bg-red-600"></div>
              <p className="text-sm font-medium">Burgundy</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-20 h-20 mx-auto rounded-full bg-green-600"></div>
              <p className="text-sm font-medium">Sage</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-20 h-20 mx-auto rounded-full bg-pink-400"></div>
              <p className="text-sm font-medium">Rose</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-20 h-20 mx-auto rounded-full bg-yellow-200"></div>
              <p className="text-sm font-medium">Cream</p>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800 font-wedding">Typography</h2>
          <div className="space-y-2">
            <h1 className="text-4xl font-wedding text-red-800">
              Playfair Display Heading
            </h1>
            <h2 className="text-3xl font-wedding text-green-700">
              Elegant Serif Typography
            </h2>
            <p className="text-lg text-gray-700">
              Inter font for body text provides excellent readability and modern feel.
            </p>
            <p className="text-base text-gray-600">
              This combination creates a perfect balance between elegance and functionality.
            </p>
          </div>
        </div>

        {/* Test Features */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800 font-wedding">Interactive Features</h2>
          <div className="flex flex-wrap gap-4">
            <div className="custom-scrollbar h-32 w-64 border rounded p-4 overflow-auto">
              <p>This is a scrollable area with custom scrollbar styling.</p>
              <p>Scroll down to see the custom scrollbar in action.</p>
              <p>More content here...</p>
              <p>And even more content...</p>
              <p>Keep scrolling...</p>
              <p>Custom scrollbar looks great!</p>
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-600" />
            <p className="text-green-800 font-medium">
              ✅ CSS is loading correctly! All styles are working as expected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}