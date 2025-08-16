'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function VendorsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
              <p className="text-sm text-gray-600">
                Manage your wedding vendors and service providers
              </p>
            </div>
            <div className="flex space-x-4">
              <Button onClick={() => router.push('/dashboard')} variant="outline">
                Back to Dashboard
              </Button>
              <Button>Add Vendor</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Your Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No vendors yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding your first wedding vendor.
              </p>
              <div className="mt-6">
                <Button>Add Vendor</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}