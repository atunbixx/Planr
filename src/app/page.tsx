'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Heart, Gift, Users } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === 'couple' && !user.onboardingCompleted) {
        router.push('/onboarding');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is not logged in, show the landing page
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="p-4 flex justify-between items-center border-b">
        <div className="flex items-center space-x-2">
            <Heart className="w-8 h-8 text-pink-500" />
            <h1 className="text-2xl font-bold text-gray-800">Wedding Planner</h1>
        </div>
        <div>
          <Button variant="ghost" onClick={() => router.push('/signin')}>Sign In</Button>
          <Button className="ml-2" onClick={() => router.push('/signup')}>Sign Up</Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="text-center px-4 py-20 bg-gradient-to-b from-pink-50 to-white">
        <h2 className="text-5xl font-bold text-gray-800 mb-4">Plan Your Perfect Day</h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">The ultimate platform to manage your guests, vendors, budget, and more. All in one place.</p>
        <Button size="lg" onClick={() => router.push('/signup')}>Get Started for Free</Button>
      </main>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">Everything you need to tie the knot</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<Users className="w-8 h-8 text-pink-500"/>}
              title="Guest Management"
              description="Easily manage your guest list, invitations, and RSVPs."
            />
            <FeatureCard 
              icon={<Gift className="w-8 h-8 text-pink-500"/>}
              title="Vendor Coordination"
              description="Find and book the best vendors for your special day."
            />
            <FeatureCard 
              icon={<Check className="w-8 h-8 text-pink-500"/>}
              title="Budget Tracking"
              description="Keep your wedding expenses under control and on budget."
            />
            <FeatureCard 
              icon={<Heart className="w-8 h-8 text-pink-500"/>}
              title="Checklist & Timeline"
              description="Stay organized with a detailed to-do list and timeline."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-10 border-t">
        <p className="text-gray-500">&copy; {new Date().getFullYear()} Wedding Planner. All rights reserved.</p>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
    return (
        <Card className="text-center p-6 border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex justify-center items-center mb-4">
                {icon}
            </CardHeader>
            <CardContent>
                <h4 className="text-xl font-semibold mb-2">{title}</h4>
                <p className="text-gray-600">{description}</p>
            </CardContent>
        </Card>
    );
}