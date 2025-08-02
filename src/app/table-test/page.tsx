'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TableTest() {
  const [results, setResults] = useState<string[]>([])

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testTables = async () => {
    setResults([])
    addResult('Starting table tests...')

    // Test couples table/view
    try {
      const { data, error } = await supabase.from('couples').select('id').limit(1)
      if (error) {
        addResult(`❌ couples table: ${error.message}`)
      } else {
        addResult(`✅ couples table: Found ${data?.length || 0} records`)
      }
    } catch (err: any) {
      addResult(`❌ couples table: ${err.message}`)
    }

    // Test wedding_couples table
    try {
      const { data, error } = await supabase.from('wedding_couples').select('id').limit(1)
      if (error) {
        addResult(`❌ wedding_couples table: ${error.message}`)
      } else {
        addResult(`✅ wedding_couples table: Found ${data?.length || 0} records`)
      }
    } catch (err: any) {
      addResult(`❌ wedding_couples table: ${err.message}`)
    }

    // Test auth
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        addResult(`❌ Auth session: ${error.message}`)
      } else {
        addResult(`✅ Auth session: ${session ? 'Logged in' : 'Not logged in'}`)
      }
    } catch (err: any) {
      addResult(`❌ Auth session: ${err.message}`)
    }

    addResult('Tests completed!')
  }

  const createTestCouple = async () => {
    addResult('Creating test couple...')
    
    try {
      // First check if we're authenticated
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        addResult('❌ Not authenticated - cannot create couple')
        return
      }

      const testData = {
        partner1_user_id: session.user.id,
        partner1_name: 'Test User',
        partner2_name: 'Test Partner',
        wedding_date: '2025-12-31',
        venue_name: 'Test Venue',
        guest_count_estimate: 100,
        total_budget: 50000,
        wedding_style: 'modern'
      }

      // Try couples table first
      const { data, error } = await supabase
        .from('couples')
        .insert(testData)
        .select()
        .single()

      if (error) {
        addResult(`❌ Failed to create couple: ${error.message}`)
      } else {
        addResult(`✅ Created couple successfully: ${data.id}`)
      }
    } catch (err: any) {
      addResult(`❌ Error creating couple: ${err.message}`)
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Table Structure Test</h1>
      <p>This page tests which table names work with the current database setup.</p>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testTables}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Table Access
        </button>
        
        <button 
          onClick={createTestCouple}
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Create Test Couple
        </button>
      </div>

      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '14px',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        {results.length === 0 ? (
          <p>Click "Test Table Access" to check which tables are available.</p>
        ) : (
          results.map((result, index) => (
            <div key={index} style={{ marginBottom: '5px' }}>
              {result}
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Quick Links</h3>
        <ul>
          <li><a href="/working-test">Working Test Page</a></li>
          <li><a href="/test-supabase">Supabase Connection Test</a></li>
          <li><a href="/dev-bypass">Development Bypass</a></li>
          <li><a href="/dashboard?dev=true">Dashboard with Dev Mode</a></li>
        </ul>
      </div>
    </div>
  )
}