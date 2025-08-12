'use client'

import { useSupabaseAuth } from '@/lib/auth/client'
import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  const { user, isSignedIn, isLoading } = useSupabaseAuth()

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 luxury-body">Loading...</p>
        </div>
      </div>
    )
  }

  // Authenticated users will be redirected by middleware
  // This page is only shown to unauthenticated users

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">W</span>
                </div>
                <span className="text-xl font-semibold text-slate-800 luxury-heading">WeddingPlanner</span>
              </Link>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-slate-600 hover:text-blue-600 transition-all duration-200 text-sm font-medium luxury-body">
                Features
              </Link>
              <Link href="#how-it-works" className="text-slate-600 hover:text-blue-600 transition-all duration-200 text-sm font-medium luxury-body">
                How it Works
              </Link>
              <Link href="#testimonials" className="text-slate-600 hover:text-blue-600 transition-all duration-200 text-sm font-medium luxury-body">
                Testimonials
              </Link>
              <Link href="#pricing" className="text-slate-600 hover:text-blue-600 transition-all duration-200 text-sm font-medium luxury-body">
                Pricing
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              {!isLoading && isSignedIn && user ? (
                <Link href="/dashboard">
                  <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl luxury-button-primary">
                    Go to Dashboard
                  </button>
                </Link>
              ) : (
                <>
                  <Link href="/sign-in" className="hidden sm:block">
                    <button className="text-slate-700 hover:text-blue-600 text-sm font-medium transition-all duration-200 luxury-body">
                      Sign In
                    </button>
                  </Link>
                  <Link href="/sign-up">
                    <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl luxury-button-primary">
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
      <section className="pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6 luxury-heading">
                Plan your
                <span className="block bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">perfect day</span>
              </h1>
              <h2 className="text-xl sm:text-2xl text-slate-600 leading-relaxed mb-8 font-light luxury-body">
                The all-in-one wedding planning platform that brings your dream wedding to life. 
                Manage guests, vendors, budgets, and more in one beautiful place.
              </h2>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link href="/sign-up">
                  <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl text-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-xl hover:shadow-2xl luxury-button-primary">
                    Start Planning Free
                  </button>
                </Link>
                <Link href="#demo">
                  <button className="border-2 border-slate-300 text-slate-700 px-8 py-4 rounded-xl text-lg font-medium hover:border-blue-600 hover:text-blue-600 transition-all duration-200 luxury-input">
                    Watch Demo
                  </button>
                </Link>
              </div>

              <div className="mt-12 flex items-center space-x-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-900 luxury-heading">10k+</div>
                  <div className="text-sm text-slate-600 luxury-body">Happy Couples</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-900 luxury-heading">4.9</div>
                  <div className="text-sm text-slate-600 luxury-body">Star Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-900 luxury-heading">50k+</div>
                  <div className="text-sm text-slate-600 luxury-body">Events Planned</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-blue-700/5 rounded-3xl transform rotate-2 shadow-2xl"></div>
              <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 luxury-card border border-slate-200/50">
                <div className="space-y-6">
                  {/* Dashboard Preview */}
                  <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl p-6 luxury-card">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-900 luxury-heading">Your Wedding Overview</h3>
                      <span className="text-sm text-slate-500 luxury-body">May 2025</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-slate-200/50">
                        <div className="text-2xl font-bold text-blue-600 luxury-heading">150</div>
                        <div className="text-sm text-slate-600 luxury-body">Guests Invited</div>
                      </div>
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-slate-200/50">
                        <div className="text-2xl font-bold text-blue-600 luxury-heading">$25k</div>
                        <div className="text-sm text-slate-600 luxury-body">Budget Tracked</div>
                      </div>
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-slate-200/50">
                        <div className="text-2xl font-bold text-blue-600 luxury-heading">12</div>
                        <div className="text-sm text-slate-600 luxury-body">Vendors Booked</div>
                      </div>
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-slate-200/50">
                        <div className="text-2xl font-bold text-blue-600 luxury-heading">89%</div>
                        <div className="text-sm text-slate-600 luxury-body">Tasks Complete</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="h-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex-1"></div>
                    <div className="h-2 bg-slate-200 rounded-full w-12"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-gradient-to-br from-slate-50 to-blue-50/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-slate-900 mb-6 luxury-heading">
              Everything you need in one place
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto luxury-body">
              Our comprehensive suite of tools makes wedding planning effortless and enjoyable
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Guest Management */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 hover:shadow-xl transition-all duration-300 luxury-card border border-slate-200/50 group">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600/10 to-blue-700/10 rounded-xl flex items-center justify-center mb-6 group-hover:from-blue-600/20 group-hover:to-blue-700/20 transition-all duration-300">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3 luxury-heading">Guest Management</h3>
              <p className="text-slate-600 mb-4 luxury-body">
                Effortlessly manage your guest list, track RSVPs, and send digital invitations
              </p>
              <Link href="/dashboard/guests" className="text-blue-600 font-medium hover:text-blue-700 transition-colors luxury-body">
                Learn more →
              </Link>
            </div>

            {/* Budget Tracking */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 hover:shadow-xl transition-all duration-300 luxury-card border border-slate-200/50 group">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600/10 to-blue-700/10 rounded-xl flex items-center justify-center mb-6 group-hover:from-blue-600/20 group-hover:to-blue-700/20 transition-all duration-300">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3 luxury-heading">Smart Budget Tracking</h3>
              <p className="text-slate-600 mb-4 luxury-body">
                Stay on budget with real-time expense tracking and intelligent spending insights
              </p>
              <Link href="/dashboard/budget" className="text-blue-600 font-medium hover:text-blue-700 transition-colors luxury-body">
                Learn more →
              </Link>
            </div>

            {/* Vendor Directory */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 hover:shadow-xl transition-all duration-300 luxury-card border border-slate-200/50 group">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600/10 to-blue-700/10 rounded-xl flex items-center justify-center mb-6 group-hover:from-blue-600/20 group-hover:to-blue-700/20 transition-all duration-300">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3 luxury-heading">Vendor Directory</h3>
              <p className="text-slate-600 mb-4 luxury-body">
                Find and manage all your wedding vendors in one organized, accessible place
              </p>
              <Link href="/dashboard/vendors" className="text-blue-600 font-medium hover:text-blue-700 transition-colors luxury-body">
                Learn more →
              </Link>
            </div>

            {/* Timeline & Checklist */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 hover:shadow-xl transition-all duration-300 luxury-card border border-slate-200/50 group">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600/10 to-blue-700/10 rounded-xl flex items-center justify-center mb-6 group-hover:from-blue-600/20 group-hover:to-blue-700/20 transition-all duration-300">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3 luxury-heading">Timeline & Checklist</h3>
              <p className="text-slate-600 mb-4 luxury-body">
                Never miss a deadline with our comprehensive wedding planning timeline
              </p>
              <Link href="/dashboard/checklist" className="text-blue-600 font-medium hover:text-blue-700 transition-colors luxury-body">
                Learn more →
              </Link>
            </div>

            {/* Photo Gallery */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 hover:shadow-xl transition-all duration-300 luxury-card border border-slate-200/50 group">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600/10 to-blue-700/10 rounded-xl flex items-center justify-center mb-6 group-hover:from-blue-600/20 group-hover:to-blue-700/20 transition-all duration-300">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3 luxury-heading">Photo Gallery</h3>
              <p className="text-slate-600 mb-4 luxury-body">
                Create beautiful albums and share precious moments with loved ones
              </p>
              <Link href="/dashboard/photos" className="text-blue-600 font-medium hover:text-blue-700 transition-colors luxury-body">
                Learn more →
              </Link>
            </div>

            {/* Messaging */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 hover:shadow-xl transition-all duration-300 luxury-card border border-slate-200/50 group">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600/10 to-blue-700/10 rounded-xl flex items-center justify-center mb-6 group-hover:from-blue-600/20 group-hover:to-blue-700/20 transition-all duration-300">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3 luxury-heading">Smart Messaging</h3>
              <p className="text-slate-600 mb-4 luxury-body">
                Communicate seamlessly with guests and vendors through integrated messaging
              </p>
              <Link href="/dashboard/messages" className="text-blue-600 font-medium hover:text-blue-700 transition-colors luxury-body">
                Learn more →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-slate-900 mb-6 luxury-heading">
              How it works
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto luxury-body">
              Get started in minutes and plan your perfect wedding stress-free
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="text-center">
              <div className="relative inline-block mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-xl luxury-heading">
                  1
                </div>
                <div className="absolute -right-full top-1/2 transform -translate-y-1/2 hidden lg:block">
                  <svg className="w-40 h-2" fill="none">
                    <path d="M0 1H160" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="5 5"/>
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3 luxury-heading">Sign up for free</h3>
              <p className="text-slate-600 luxury-body">
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