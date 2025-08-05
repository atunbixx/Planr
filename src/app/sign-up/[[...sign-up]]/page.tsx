'use client'

import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Join us to start planning your perfect wedding</p>
        </div>
        <SignUp 
          routing="hash"
          signInUrl="/sign-in"
          redirectUrl="/onboarding"
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-white rounded-lg shadow-xl border border-gray-200"
            }
          }}
        />
      </div>
    </main>
  );
}
