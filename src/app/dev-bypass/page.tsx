'use client'

import { useRouter } from 'next/navigation'

export default function DevBypass() {
  const router = useRouter()

  const enableBypass = () => {
    localStorage.setItem('dev-bypass', 'true')
    router.push('/dashboard')
  }

  const disableBypass = () => {
    localStorage.removeItem('dev-bypass')
    router.push('/')
  }

  const testSupabase = () => {
    router.push('/test-supabase')
  }

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <h1>Development Tools</h1>
      <p>Use these tools to bypass authentication issues during development.</p>
      
      <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <button 
          onClick={enableBypass}
          style={{ 
            padding: '15px 30px', 
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Enable Dev Bypass & Go to Dashboard
        </button>
        
        <button 
          onClick={testSupabase}
          style={{ 
            padding: '15px 30px', 
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Test Supabase Connection
        </button>
        
        <button 
          onClick={disableBypass}
          style={{ 
            padding: '15px 30px', 
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Disable Dev Bypass
        </button>
      </div>

      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3>Quick Access</h3>
        <p>You can also add <code>?dev=true</code> to any URL to enable bypass mode.</p>
        <p>Example: <code>http://localhost:3002/dashboard?dev=true</code></p>
      </div>
    </div>
  )
}