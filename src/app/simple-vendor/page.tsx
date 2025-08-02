'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function SimpleVendorPage() {
  const { user, couple } = useAuth()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const addMinimalVendor = async () => {
    setLoading(true)
    setMessage('Adding vendor...')
    
    try {
      if (!couple?.id) {
        setMessage('❌ No couple profile found')
        return
      }

      // Minimal vendor data with only required fields
      const vendorData = {
        couple_id: couple.id,
        name: 'Test Vendor ' + Date.now(),
        category: 'venue',
        status: 'researching',
        country: 'US',
        service_radius_miles: 50,
        booking_lead_time_days: 30,
        requires_deposit: true,
        deposit_percentage: 25,
        deposit_paid: false,
        contract_signed: false,
        insurance_verified: false,
        availability_confirmed: false,
        total_bookings: 0,
        total_reviews: 0,
        average_rating: 0,
        response_rate: 100,
        response_time_hours: 24,
      }

      console.log('Creating vendor with data:', vendorData)

      const { data, error } = await supabase
        .from('couple_vendors')
        .insert(vendorData)
        .select()
        .single()

      if (error) {
        console.error('Vendor creation error:', error)
        setMessage(`❌ Error: ${error.message}\nCode: ${error.code}\nDetails: ${error.details}`)
        return
      }

      setMessage(`✅ Success! Vendor created with ID: ${data.id}`)
      console.log('Vendor created:', data)

    } catch (error: any) {
      console.error('Unexpected error:', error)
      setMessage(`❌ Unexpected error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const addVendorWithForm = async () => {
    setLoading(true)
    setMessage('Adding vendor with form data...')
    
    try {
      if (!couple?.id) {
        setMessage('❌ No couple profile found')
        return
      }

      // This simulates what the form does
      const formData = {
        name: 'Beautiful Gardens Venue',
        business_name: 'Gardens LLC',
        category: 'venue',
        status: 'researching',
        email: 'info@gardens.com',
        phone: '(555) 123-4567',
        website: 'https://gardens.com',
        contact_person: 'Jane Smith',
        address: '123 Wedding Ave',
        city: 'New York',
        state: 'NY',
        zip_code: '10001',
        estimated_cost: 15000,
        notes: 'Beautiful outdoor ceremony space',
        referral_source: 'Google search'
      }

      const vendorDataWithDefaults = {
        ...formData,
        couple_id: couple.id,
        country: 'US',
        service_radius_miles: 50,
        booking_lead_time_days: 30,
        requires_deposit: true,
        deposit_percentage: 25,
        deposit_paid: false,
        contract_signed: false,
        insurance_verified: false,
        availability_confirmed: false,
        total_bookings: 0,
        total_reviews: 0,
        average_rating: 0,
        response_rate: 100,
        response_time_hours: 24,
      }

      console.log('Creating vendor with form data:', vendorDataWithDefaults)

      const { data, error } = await supabase
        .from('couple_vendors')
        .insert(vendorDataWithDefaults)
        .select()
        .single()

      if (error) {
        console.error('Form vendor creation error:', error)
        setMessage(`❌ Form Error: ${error.message}\nCode: ${error.code}\nDetails: ${error.details}`)
        return
      }

      setMessage(`✅ Form Success! Vendor created with ID: ${data.id}`)
      console.log('Form vendor created:', data)

    } catch (error: any) {
      console.error('Form unexpected error:', error)
      setMessage(`❌ Form Unexpected error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🏪 Simple Vendor Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p><strong>User:</strong> {user?.email || 'Not logged in'}</p>
            <p><strong>Couple ID:</strong> {couple?.id || 'No couple'}</p>
            <p><strong>Couple:</strong> {couple?.partner1_name} {couple?.partner2_name ? `& ${couple.partner2_name}` : ''}</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Button 
              onClick={addMinimalVendor} 
              disabled={loading || !couple?.id}
              className="w-full"
            >
              {loading ? 'Adding...' : '🧪 Add Minimal Vendor'}
            </Button>
            
            <Button 
              onClick={addVendorWithForm} 
              disabled={loading || !couple?.id}
              variant="secondary"
              className="w-full"
            >
              {loading ? 'Adding...' : '📝 Add Vendor with Form Data'}
            </Button>
          </div>

          {message && (
            <div className="mt-4 p-4 bg-gray-100 rounded text-sm whitespace-pre-wrap">
              {message}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}