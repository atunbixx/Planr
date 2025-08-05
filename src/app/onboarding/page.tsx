import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default async function OnboardingPage() {
  try {
    // Check authentication
    const { userId } = await auth()
    
    if (!userId) {
      redirect('/sign-in')
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-teal-50">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Wedding Planner! 🎉
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Let's get you started on planning your perfect wedding
            </p>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Ready to start planning?</CardTitle>
                <CardDescription>
                  Your wedding planning dashboard is ready for you. You can start by setting up your budget, 
                  adding guests, or exploring all the features we've built for you.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard">
                  <Button size="lg" className="w-full">
                    Go to Dashboard
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <div className="bg-rose-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl">💰</span>
                </div>
                <h3 className="font-semibold mb-2">Budget Tracking</h3>
                <p className="text-sm text-gray-600">Keep track of all your wedding expenses</p>
              </div>
              
              <div className="text-center p-4">
                <div className="bg-teal-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl">👥</span>
                </div>
                <h3 className="font-semibold mb-2">Guest Management</h3>
                <p className="text-sm text-gray-600">Manage RSVPs and guest information</p>
              </div>
              
              <div className="text-center p-4">
                <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl">📋</span>
                </div>
                <h3 className="font-semibold mb-2">Planning Tools</h3>
                <p className="text-sm text-gray-600">Checklists, vendors, and more</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Onboarding page error:', error)
    redirect('/sign-in')
  }
}