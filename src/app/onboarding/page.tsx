import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import OnboardingFlow from '@/components/onboarding/OnboardingFlow'

export default async function OnboardingPage() {
  const user = await currentUser()
  
  if (!user) {
    redirect('/sign-in')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to Your Wedding Journey! 💕
            </h1>
            <p className="text-gray-600">
              Let's set up your profile to personalize your planning experience
            </p>
          </div>
          
          <OnboardingFlow userId={user.id} userEmail={user.emailAddresses[0]?.emailAddress} />
        </div>
      </div>
    </div>
  )
}