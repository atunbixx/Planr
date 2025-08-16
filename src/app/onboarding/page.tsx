'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/lib/auth/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Heart, ArrowRight } from 'lucide-react';

export default function OnboardingIndexPage() {
  const router = useRouter();
  const { user, isLoading } = useSupabaseAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/sign-in');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-pink-100 rounded-full">
              <Heart className="h-8 w-8 text-pink-600" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            Welcome to Your Wedding Journey! 💒
          </CardTitle>
          <CardDescription className="text-lg text-gray-600 mt-2">
            Let's create something magical together. We'll help you plan every detail of your perfect day.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-3">What we'll set up together:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                <span>Your wedding details & venue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Budget planning & tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Guest list management</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Vendor recommendations</span>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <p className="text-center text-gray-600 mb-6">
              This will only take a few minutes, and you can always change these details later.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => router.push('/onboarding/welcome')}
                size="lg"
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              >
                Start Planning
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => router.push('/dashboard')}
              >
                Skip for Now
              </Button>
            </div>
          </div>

          <div className="text-center text-xs text-gray-500">
            ✨ Join thousands of couples who've planned their perfect wedding with us
          </div>
        </CardContent>
      </Card>
    </div>
  );
}