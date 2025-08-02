'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent } from '@/components/ui/card'
import { VendorCalendar } from '@/components/vendors/VendorCalendar'
import { Calendar } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

export default function CalendarPage() {
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()
  const { addToast } = useToast()

  // Get current couple ID
  useEffect(() => {
    getCurrentCouple()
  }, [])

  const getCurrentCouple = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: couple, error } = await supabase
        .from('couples')
        .select('id')
        .or(`partner1_user_id.eq.${user.id},partner2_user_id.eq.${user.id}`)
        .single()

      if (error) throw error
      setCoupleId(couple.id)
    } catch (error) {
      console.error('Error getting couple:', error)
      addToast({
        title: 'Error',
        description: 'Failed to load your profile',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-serif font-bold text-ink">Calendar</h1>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    )
  }

  if (!coupleId) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-serif font-bold text-ink">Calendar</h1>
        </div>
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-ink mb-2">No profile found</h3>
            <p className="text-gray-500">Please complete your profile setup first.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-ink">Vendor Calendar</h1>
        <p className="text-gray-600 mt-1">View and manage all your vendor appointments</p>
      </div>

      {/* Calendar */}
      <VendorCalendar coupleId={coupleId} />
    </div>
  )
}