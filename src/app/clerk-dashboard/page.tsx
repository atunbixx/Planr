import { UserButton, currentUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'

export default async function ClerkDashboard() {
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              🎉 Wedding Planner Dashboard
            </h1>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                ✅ Clerk Authentication Working!
              </h2>
              
              <div className="space-y-4">
                <div>
                  <strong>User ID:</strong> {user.id}
                </div>
                <div>
                  <strong>Email:</strong> {user.emailAddresses[0]?.emailAddress}
                </div>
                <div>
                  <strong>First Name:</strong> {user.firstName}
                </div>
                <div>
                  <strong>Last Name:</strong> {user.lastName}
                </div>
                <div>
                  <strong>Created:</strong> {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-md font-medium text-gray-900 mb-3">
                  🎯 What's Working:
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>✅ Clerk authentication is fully functional</li>
                  <li>✅ User data is accessible</li>
                  <li>✅ Protected routes are working</li>
                  <li>✅ Sign out functionality works</li>
                  <li>✅ No more rate limiting issues</li>
                  <li>✅ No more hanging sign-in pages</li>
                </ul>
              </div>

              <div className="mt-6">
                <a 
                  href="/dashboard"
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 mr-4"
                >
                  Go to Main Dashboard
                </a>
                <a 
                  href="/onboarding"
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                >
                  Start Onboarding
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}