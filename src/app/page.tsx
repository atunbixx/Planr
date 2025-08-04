import { SignInButton, SignUpButton } from '@clerk/nextjs'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function Home() {
  const user = await currentUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-teal-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">Wedding Planner</h1>
          <p className="text-xl text-gray-600 mb-8">Plan your perfect wedding with ease</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>New to Wedding Planner?</CardTitle>
              <CardDescription>
                Create an account to start planning your dream wedding
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SignUpButton mode="modal">
                <Button className="w-full" size="lg">
                  Get Started
                </Button>
              </SignUpButton>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Already have an account?</CardTitle>
              <CardDescription>
                Sign in to continue planning your wedding
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SignInButton mode="modal">
                <Button variant="outline" className="w-full" size="lg">
                  Sign In
                </Button>
              </SignInButton>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-16">
          <div className="text-center">
            <div className="bg-rose-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📋</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Plan Everything</h3>
            <p className="text-gray-600">Keep track of all your wedding details in one place</p>
          </div>
          
          <div className="text-center">
            <div className="bg-teal-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💰</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Manage Budget</h3>
            <p className="text-gray-600">Stay on top of your wedding expenses and budget</p>
          </div>
          
          <div className="text-center">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Guest List</h3>
            <p className="text-gray-600">Manage your guest list and RSVPs effortlessly</p>
          </div>
        </div>
      </div>
    </div>
  )
}