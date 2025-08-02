'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/contexts/AuthContext'

export default function AuthDebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [logs, setLogs] = useState<string[]>([])
  const supabase = createClientComponentClient()
  const auth = useAuth()

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  const runDiagnostics = async () => {
    addLog('🔍 Starting authentication diagnostics...')
    
    try {
      // Test 1: Direct Supabase session
      addLog('📡 Testing direct Supabase session...')
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        addLog(`❌ Session error: ${sessionError.message}`)
      } else {
        addLog(`${session ? '✅' : '❌'} Session: ${session ? 'Found' : 'None'} (User: ${session?.user?.email || 'N/A'})`)
      }

      // Test 2: Auth Context
      addLog('🏠 Testing Auth Context...')
      addLog(`Auth Context - Loading: ${auth.loading}, User: ${!!auth.user}, Couple: ${!!auth.couple}`)

      // Test 3: Database connection
      addLog('🗄️ Testing database connection...')
      const { data: couples, error: dbError } = await supabase
        .from('couples')
        .select('id')
        .limit(1)

      if (dbError) {
        addLog(`❌ Database error: ${dbError.message}`)
      } else {
        addLog(`✅ Database connection: ${couples?.length || 0} records accessible`)
      }

      // Test 4: User-specific query
      if (session?.user) {
        addLog('👤 Testing user-specific query...')
        const { data: userCouple, error: userError } = await supabase
          .from('couples')
          .select('*')
          .or(`partner1_user_id.eq.${session.user.id},partner2_user_id.eq.${session.user.id}`)
          .single()

        if (userError && userError.code !== 'PGRST116') {
          addLog(`❌ User couple error: ${userError.message}`)
        } else {
          addLog(`${userCouple ? '✅' : '⚠️'} User couple: ${userCouple ? 'Found' : 'Not found'}`)
        }
      }

      // Test 5: Environment check
      addLog('🌍 Testing environment...')
      addLog(`Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}`)
      addLog(`Supabase Key: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}`)

      setDebugInfo({
        session,
        sessionError,
        authContext: {
          loading: auth.loading,
          user: !!auth.user,
          couple: !!auth.couple,
          error: auth.error
        },
        dbConnection: { couples, dbError },
        environment: {
          url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        }
      })

    } catch (error) {
      addLog(`💥 Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    addLog('🏁 Diagnostics complete!')
  }

  const testSignIn = async () => {
    addLog('🔐 Testing sign in...')
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'hello@atunbi.net',
        password: 'Teniola=1'
      })

      if (error) {
        addLog(`❌ Sign in failed: ${error.message}`)
      } else {
        addLog(`✅ Sign in successful! User: ${data.user?.email}`)
        // Re-run diagnostics after sign in
        setTimeout(runDiagnostics, 1000)
      }
    } catch (error) {
      addLog(`💥 Sign in error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🔍 Authentication Debug Page</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <button 
          onClick={runDiagnostics}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer' 
          }}
        >
          🔄 Re-run Diagnostics
        </button>
        
        <button 
          onClick={testSignIn}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer' 
          }}
        >
          🔐 Test Sign In
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <h3>📋 Real-time Logs</h3>
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '12px',
            maxHeight: '400px',
            overflowY: 'auto',
            border: '1px solid #ddd'
          }}>
            {logs.map((log, index) => (
              <div key={index} style={{ marginBottom: '5px' }}>
                {log}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3>🔍 Debug Info</h3>
          <pre style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '8px',
            fontSize: '12px',
            maxHeight: '400px',
            overflowY: 'auto',
            border: '1px solid #ddd'
          }}>
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>🔗 Quick Navigation</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a href="/auth/signin" style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
            Sign In Page
          </a>
          <a href="/dev-login" style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
            Dev Login
          </a>
          <a href="/dashboard" style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
            Dashboard
          </a>
          <a href="/dashboard?dev=true" style={{ padding: '8px 16px', backgroundColor: '#17a2b8', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
            Dashboard (Dev Mode)
          </a>
        </div>
      </div>
    </div>
  )
}