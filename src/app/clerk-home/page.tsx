import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import Link from 'next/link'

export default function ClerkHome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <h1 className="text-2xl font-bold text-purple-600">
            💍 Wedding Planner
          </h1>
          <div>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>

        <div className="text-center py-20">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Plan Your Perfect Wedding Day
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Organize vendors, manage guests, track your budget, and create the timeline for your dream wedding.
          </p>

          <SignedOut>
            <div className="space-x-4">
              <Link 
                href="/sign-up"
                className="bg-purple-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-purple-700 inline-block"
              >
                Get Started Free
              </Link>
              <Link 
                href="/sign-in"
                className="bg-white text-purple-600 px-8 py-3 rounded-lg text-lg font-semibold border-2 border-purple-600 hover:bg-purple-50 inline-block"
              >
                Sign In
              </Link>
            </div>
          </SignedOut>

          <SignedIn>
            <div className="space-x-4">
              <Link 
                href="/clerk-dashboard"
                className="bg-purple-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-purple-700 inline-block"
              >
                Go to Dashboard
              </Link>
              <Link 
                href="/onboarding"
                className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-700 inline-block"
              >
                Start Planning
              </Link>
            </div>
          </SignedIn>
        </div>

        <div className="grid md:grid-cols-3 gap-8 py-16">
          <div className="text-center">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-semibold mb-2">Guest Management</h3>
            <p className="text-gray-600">Track RSVPs, dietary restrictions, and seating arrangements</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-semibold mb-2">Budget Tracking</h3>
            <p className="text-gray-600">Monitor expenses and stay within your wedding budget</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-xl font-semibold mb-2">Timeline Planning</h3>
            <p className="text-gray-600">Create and manage your wedding day timeline</p>
          </div>
        </div>
      </div>
    </div>
  )
}