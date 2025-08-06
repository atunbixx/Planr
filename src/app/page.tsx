'use client'

import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  const { userId, isLoaded } = useAuth()

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-[#6b140e] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">W</span>
                </div>
                <span className="text-xl font-semibold text-gray-900">WeddingPlanner</span>
              </Link>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-[#6b140e] transition-colors text-sm font-medium">
                Features
              </Link>
              <Link href="#how-it-works" className="text-gray-600 hover:text-[#6b140e] transition-colors text-sm font-medium">
                How it Works
              </Link>
              <Link href="#testimonials" className="text-gray-600 hover:text-[#6b140e] transition-colors text-sm font-medium">
                Testimonials
              </Link>
              <Link href="#pricing" className="text-gray-600 hover:text-[#6b140e] transition-colors text-sm font-medium">
                Pricing
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              {isLoaded && userId ? (
                <Link href="/dashboard">
                  <button className="bg-[#6b140e] text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-[#5a0f09] transition-colors">
                    Go to Dashboard
                  </button>
                </Link>
              ) : (
                <>
                  <Link href="/sign-in" className="hidden sm:block">
                    <button className="text-gray-700 hover:text-[#6b140e] text-sm font-medium transition-colors">
                      Sign In
                    </button>
                  </Link>
                  <Link href="/sign-up">
                    <button className="bg-[#6b140e] text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-[#5a0f09] transition-colors">
                      Get Started Free
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
                Plan your
                <span className="block text-[#6b140e]">perfect day</span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 leading-relaxed">
                The all-in-one wedding planning platform that brings your dream wedding to life. 
                Manage guests, vendors, budgets, and more in one beautiful place.
              </p>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link href="/sign-up">
                  <button className="bg-[#6b140e] text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-[#5a0f09] transition-colors shadow-lg hover:shadow-xl">
                    Start Planning Free
                  </button>
                </Link>
                <Link href="#demo">
                  <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-full text-lg font-medium hover:border-[#6b140e] hover:text-[#6b140e] transition-colors">
                    Watch Demo
                  </button>
                </Link>
              </div>

              <div className="mt-8 flex items-center space-x-8">
                <div>
                  <div className="text-3xl font-bold text-gray-900">10k+</div>
                  <div className="text-sm text-gray-600">Happy Couples</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">4.9</div>
                  <div className="text-sm text-gray-600">Star Rating</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">50k+</div>
                  <div className="text-sm text-gray-600">Events Planned</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#6b140e]/10 to-transparent rounded-3xl transform rotate-3"></div>
              <div className="relative bg-white rounded-3xl shadow-2xl p-8">
                <div className="space-y-6">
                  {/* Dashboard Preview */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Your Wedding Overview</h3>
                      <span className="text-sm text-gray-500">May 2025</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-4">
                        <div className="text-2xl font-bold text-[#6b140e]">150</div>
                        <div className="text-sm text-gray-600">Guests Invited</div>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <div className="text-2xl font-bold text-[#6b140e]">$25k</div>
                        <div className="text-sm text-gray-600">Budget Tracked</div>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <div className="text-2xl font-bold text-[#6b140e]">12</div>
                        <div className="text-sm text-gray-600">Vendors Booked</div>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <div className="text-2xl font-bold text-[#6b140e]">89%</div>
                        <div className="text-sm text-gray-600">Tasks Complete</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="h-2 bg-[#6b140e] rounded-full flex-1"></div>
                    <div className="h-2 bg-gray-200 rounded-full w-12"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need in one place
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive suite of tools makes wedding planning effortless and enjoyable
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Guest Management */}
            <div className="bg-white rounded-2xl p-8 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-[#6b140e]/10 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-[#6b140e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Guest Management</h3>
              <p className="text-gray-600 mb-4">
                Effortlessly manage your guest list, track RSVPs, and send digital invitations
              </p>
              <Link href="/dashboard/guests" className="text-[#6b140e] font-medium hover:underline">
                Learn more →
              </Link>
            </div>

            {/* Budget Tracking */}
            <div className="bg-white rounded-2xl p-8 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-[#6b140e]/10 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-[#6b140e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Smart Budget Tracking</h3>
              <p className="text-gray-600 mb-4">
                Stay on budget with real-time expense tracking and intelligent spending insights
              </p>
              <Link href="/dashboard/budget" className="text-[#6b140e] font-medium hover:underline">
                Learn more →
              </Link>
            </div>

            {/* Vendor Directory */}
            <div className="bg-white rounded-2xl p-8 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-[#6b140e]/10 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-[#6b140e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Vendor Directory</h3>
              <p className="text-gray-600 mb-4">
                Find and manage all your wedding vendors in one organized, accessible place
              </p>
              <Link href="/dashboard/vendors" className="text-[#6b140e] font-medium hover:underline">
                Learn more →
              </Link>
            </div>

            {/* Timeline & Checklist */}
            <div className="bg-white rounded-2xl p-8 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-[#6b140e]/10 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-[#6b140e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Timeline & Checklist</h3>
              <p className="text-gray-600 mb-4">
                Never miss a deadline with our comprehensive wedding planning timeline
              </p>
              <Link href="/dashboard/checklist" className="text-[#6b140e] font-medium hover:underline">
                Learn more →
              </Link>
            </div>

            {/* Photo Gallery */}
            <div className="bg-white rounded-2xl p-8 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-[#6b140e]/10 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-[#6b140e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Photo Gallery</h3>
              <p className="text-gray-600 mb-4">
                Create beautiful albums and share precious moments with loved ones
              </p>
              <Link href="/dashboard/photos" className="text-[#6b140e] font-medium hover:underline">
                Learn more →
              </Link>
            </div>

            {/* Messaging */}
            <div className="bg-white rounded-2xl p-8 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-[#6b140e]/10 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-[#6b140e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Smart Messaging</h3>
              <p className="text-gray-600 mb-4">
                Communicate seamlessly with guests and vendors through integrated messaging
              </p>
              <Link href="/dashboard/messages" className="text-[#6b140e] font-medium hover:underline">
                Learn more →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How it works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get started in minutes and plan your perfect wedding stress-free
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="relative inline-block mb-8">
                <div className="w-20 h-20 bg-[#6b140e] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  1
                </div>
                <div className="absolute -right-full top-1/2 transform -translate-y-1/2 hidden lg:block">
                  <svg className="w-40 h-2" fill="none">
                    <path d="M0 1H160" stroke="#e5e7eb" strokeWidth="2" strokeDasharray="5 5"/>
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Sign up for free</h3>
              <p className="text-gray-600">
                Create your account in seconds and tell us about your special day
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="relative inline-block mb-8">
                <div className="w-20 h-20 bg-[#6b140e] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  2
                </div>
                <div className="absolute -right-full top-1/2 transform -translate-y-1/2 hidden lg:block">
                  <svg className="w-40 h-2" fill="none">
                    <path d="M0 1H160" stroke="#e5e7eb" strokeWidth="2" strokeDasharray="5 5"/>
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Set up your wedding</h3>
              <p className="text-gray-600">
                Add your wedding details, budget, and start building your guest list
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="relative inline-block mb-8">
                <div className="w-20 h-20 bg-[#6b140e] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  3
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Plan with confidence</h3>
              <p className="text-gray-600">
                Use our tools to manage every detail and enjoy your planning journey
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Loved by couples everywhere
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of happy couples who planned their perfect day with us
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 mb-6">
                "This app made planning our wedding so much easier! The budget tracker alone saved us thousands. 
                Highly recommend to any couple!"
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                <div>
                  <div className="font-semibold text-gray-900">Sarah & James</div>
                  <div className="text-sm text-gray-600">Married June 2024</div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 mb-6">
                "The vendor management feature is incredible. Having all our contracts and contacts in one place 
                was a game-changer."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                <div>
                  <div className="font-semibold text-gray-900">Emma & Michael</div>
                  <div className="text-sm text-gray-600">Married September 2024</div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 mb-6">
                "From guest management to timeline tracking, everything is perfectly organized. 
                It turned a stressful process into an enjoyable journey!"
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                <div>
                  <div className="font-semibold text-gray-900">Lisa & David</div>
                  <div className="text-sm text-gray-600">Married December 2024</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#6b140e]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to start planning your dream wedding?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of happy couples and make your special day perfect
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up">
              <button className="bg-white text-[#6b140e] px-8 py-4 rounded-full text-lg font-medium hover:bg-gray-100 transition-colors shadow-lg">
                Get Started Free
              </button>
            </Link>
            <Link href="#demo">
              <button className="border-2 border-white text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-white/10 transition-colors">
                Schedule a Demo
              </button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-white/70">
            No credit card required • Free forever plan • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <span className="text-[#6b140e] font-bold text-xl">W</span>
                </div>
                <span className="text-xl font-semibold">WeddingPlanner</span>
              </div>
              <p className="text-gray-400 text-sm">
                Making dream weddings come true, one couple at a time.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#features" className="hover:text-white">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="#demo" className="hover:text-white">Demo</Link></li>
                <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#about" className="hover:text-white">About</Link></li>
                <li><Link href="#testimonials" className="hover:text-white">Testimonials</Link></li>
                <li><Link href="#contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="#careers" className="hover:text-white">Careers</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="#privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="#terms" className="hover:text-white">Terms of Service</Link></li>
                <li><Link href="#blog" className="hover:text-white">Blog</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-sm text-gray-400">
              © 2025 WeddingPlanner. All rights reserved. Made with ❤️ for couples everywhere.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}