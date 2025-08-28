"use client"

import { useEffect, useState } from 'react'
import PremiumDashboardLayout from '@/components/layout/PremiumDashboardLayout'
import { CheckCircle, Circle, Calendar, MapPin, Users, DollarSign, Camera } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import AuthClient from '@/lib/auth/client'

type ChecklistItem = {
  key: string
  title: string
  hint?: string
  completed: boolean
}

type ChecklistData = {
  items: ChecklistItem[]
  completed: number
  total: number
}

const getIconForKey = (key: string) => {
  switch (key) {
    case 'set_date': return <Calendar className="h-5 w-5" />
    case 'choose_venue': return <MapPin className="h-5 w-5" />
    case 'create_guest_list': return <Users className="h-5 w-5" />
    case 'set_budget': return <DollarSign className="h-5 w-5" />
    case 'book_photographer': return <Camera className="h-5 w-5" />
    default: return <Circle className="h-5 w-5" />
  }
}

export default function ChecklistPage() {
  const { user } = useAuth()
  const [checklistData, setChecklistData] = useState<ChecklistData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const loadChecklist = async () => {
      try {
        const token = AuthClient.getToken()
        const headers: Record<string, string> = {}
        if (token) headers['Authorization'] = `Bearer ${token}`
        
        const response = await fetch('/api/dashboard/checklist', { headers })
        const result = await response.json()
        
        if (result.success) {
          setChecklistData(result.data)
        } else {
          console.error('Checklist API error:', result)
          setError(result.error?.message || 'Failed to load checklist')
        }
      } catch (err) {
        console.error('Checklist fetch error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load checklist')
      } finally {
        setLoading(false)
      }
    }

    loadChecklist()
  }, [user])

  if (loading) {
    return (
      <PremiumDashboardLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-dark dark:text-white">Wedding Checklist</h1>
          <div className="mt-4 text-dark-6">Loading checklist...</div>
        </div>
      </PremiumDashboardLayout>
    )
  }

  if (error) {
    return (
      <PremiumDashboardLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-dark dark:text-white">Wedding Checklist</h1>
          <div className="mt-4 text-red-600">{error}</div>
        </div>
      </PremiumDashboardLayout>
    )
  }

  const completionPercentage = checklistData ? Math.round((checklistData.completed / checklistData.total) * 100) : 0

  return (
    <PremiumDashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">Wedding Checklist</h1>
          <p className="text-dark-6 dark:text-dark-4 mt-2">
            Track your wedding planning progress with our essential checklist.
          </p>
        </div>

        {checklistData && (
          <>
            {/* Progress Summary */}
            <div className="bg-white dark:bg-dark-2 rounded-lg p-6 border border-stroke dark:border-dark-3">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-dark dark:text-white">Progress Overview</h2>
                <span className="text-2xl font-bold text-primary">
                  {completionPercentage}%
                </span>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-dark-3 rounded-full h-3 mb-2">
                <div 
                  className="bg-primary h-3 rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              
              <p className="text-sm text-dark-6 dark:text-dark-4">
                {checklistData.completed} of {checklistData.total} tasks completed
              </p>
            </div>

            {/* Checklist Items */}
            <div className="bg-white dark:bg-dark-2 rounded-lg border border-stroke dark:border-dark-3">
              <div className="p-6 border-b border-stroke dark:border-dark-3">
                <h2 className="text-lg font-semibold text-dark dark:text-white">Essential Tasks</h2>
              </div>
              
              <div className="divide-y divide-stroke dark:divide-dark-3">
                {checklistData.items.map((item) => (
                  <div key={item.key} className="p-6 flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {item.completed ? (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      ) : (
                        <Circle className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="flex-shrink-0 text-primary">
                      {getIconForKey(item.key)}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className={`font-medium ${item.completed ? 'text-dark-6 line-through' : 'text-dark dark:text-white'}`}>
                        {item.title}
                      </h3>
                      {item.hint && (
                        <p className="text-sm text-dark-6 dark:text-dark-4 mt-1">
                          {item.hint}
                        </p>
                      )}
                    </div>
                    
                    {item.completed && (
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Complete
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Help Text */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Tip:</strong> This checklist automatically updates based on your wedding details, guests, budget, and vendors. 
                Complete the corresponding sections in your dashboard to mark items as done!
              </p>
            </div>
          </>
        )}
      </div>
    </PremiumDashboardLayout>
  )
}
