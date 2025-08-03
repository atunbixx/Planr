import { currentUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome to Your Wedding Dashboard
        </h1>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-900 mb-2">👤 Your Account</h3>
            <p className="text-sm text-purple-700">
              <strong>Name:</strong> {user.firstName} {user.lastName}
            </p>
            <p className="text-sm text-purple-700">
              <strong>Email:</strong> {user.emailAddresses[0]?.emailAddress}
            </p>
          </div>

          <div className="bg-pink-50 p-4 rounded-lg">
            <h3 className="font-semibold text-pink-900 mb-2">💍 Wedding Planning</h3>
            <p className="text-sm text-pink-700">
              Your wedding planning tools are ready! Start by setting up your couple profile.
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">✅ Next Steps</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Complete your couple profile</li>
              <li>• Set your wedding date</li>
              <li>• Add your partner</li>
              <li>• Start planning!</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">🎉 Clerk Authentication Working!</h3>
          <p className="text-sm text-blue-700">
            Your authentication is now powered by Clerk - no more rate limiting, hanging pages, or white screens!
          </p>
          <div className="mt-4 space-x-4">
            <a 
              href="/clerk-dashboard"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              View Clerk Dashboard
            </a>
            <a 
              href="/onboarding"
              className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Start Onboarding
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}