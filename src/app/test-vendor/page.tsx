'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function TestVendorPage() {
  const { user, couple } = useAuth()
  const [testResult, setTestResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testVendorCreation = async () => {
    setLoading(true)
    setTestResult('Starting vendor creation test...\n')
    
    try {
      // Test 1: Check authentication
      setTestResult(prev => prev + `✅ User authenticated: ${user?.email || 'No user'}\n`)
      setTestResult(prev => prev + `✅ Couple profile: ${couple?.id || 'No couple'}\n`)
      
      if (!user || !couple) {
        setTestResult(prev => prev + '❌ Missing authentication or couple profile\n')
        return
      }

      // Test 2: Check database connection
      setTestResult(prev => prev + '🔍 Testing database connection...\n')
      const { data: testQuery, error: testError } = await supabase
        .from('couple_vendors')
        .select('count')
        .eq('couple_id', couple.id)
        .maybeSingle()

      if (testError) {
        setTestResult(prev => prev + `❌ Database error: ${testError.message}\n`)
        return
      }
      
      setTestResult(prev => prev + '✅ Database connection successful\n')

      // Test 3: Try to create a simple vendor
      setTestResult(prev => prev + '🏪 Creating test vendor...\n')
      
      const vendorData = {
        couple_id: couple.id,
        name: 'Test Vendor ' + Date.now(),
        category: 'venue' as const,
        status: 'researching' as const,
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

      const { data: newVendor, error: createError } = await supabase
        .from('couple_vendors')
        .insert(vendorData)
        .select()
        .single()

      if (createError) {
        setTestResult(prev => prev + `❌ Vendor creation error: ${createError.message}\n`)
        setTestResult(prev => prev + `📊 Error details: ${JSON.stringify(createError, null, 2)}\n`)
        return
      }

      setTestResult(prev => prev + `✅ Vendor created successfully! ID: ${newVendor.id}\n`)
      setTestResult(prev => prev + `📊 Vendor data: ${JSON.stringify(newVendor, null, 2)}\n`)

      // Test 4: Clean up - delete the test vendor
      setTestResult(prev => prev + '🧹 Cleaning up test vendor...\n')
      
      const { error: deleteError } = await supabase
        .from('couple_vendors')
        .delete()
        .eq('id', newVendor.id)

      if (deleteError) {
        setTestResult(prev => prev + `⚠️ Cleanup error: ${deleteError.message}\n`)
      } else {
        setTestResult(prev => prev + '✅ Test vendor cleaned up\n')
      }

      setTestResult(prev => prev + '\n🎉 All tests passed! Vendor creation should work.\n')

    } catch (error: any) {
      setTestResult(prev => prev + `❌ Unexpected error: ${error.message}\n`)
      console.error('Test error:', error)
    } finally {
      setLoading(false)
    }
  }

  const testDatabaseSchema = async () => {
    setLoading(true)
    setTestResult('Checking database schema...\n')
    
    try {
      // Check if the table exists and what columns it has
      const { data, error } = await supabase
        .from('couple_vendors')
        .select('*')
        .limit(1)

      if (error) {
        if (error.code === 'PGRST116') {
          setTestResult(prev => prev + '❌ Table "couple_vendors" does not exist\n')
        } else {
          setTestResult(prev => prev + `❌ Schema error: ${error.message}\n`)
        }
        return
      }

      setTestResult(prev => prev + '✅ Table "couple_vendors" exists\n')
      setTestResult(prev => prev + `📊 Sample data structure: ${JSON.stringify(data?.[0] || 'No data', null, 2)}\n`)

    } catch (error: any) {
      setTestResult(prev => prev + `❌ Schema check error: ${error.message}\n`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔧 Vendor System Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={testVendorCreation} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Testing...' : '🧪 Test Vendor Creation'}
            </Button>
            
            <Button 
              onClick={testDatabaseSchema} 
              disabled={loading}
              variant="secondary"
              className="w-full"
            >
              {loading ? 'Testing...' : '📊 Check Database Schema'}
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Authentication Status:</h3>
            <div className="text-sm space-y-1">
              <div>User: {user?.email || '❌ Not logged in'}</div>
              <div>User ID: {user?.id || '❌ No ID'}</div>
              <div>Couple ID: {couple?.id || '❌ No couple profile'}</div>
              <div>Couple Names: {couple?.partner1_name} {couple?.partner2_name ? `& ${couple.partner2_name}` : ''}</div>
            </div>
          </div>

          {testResult && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Test Results:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto whitespace-pre-wrap max-h-96">
                {testResult}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}