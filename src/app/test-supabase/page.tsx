'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestSupabase() {
    const [status, setStatus] = useState('ready')
    const [result, setResult] = useState('')

    const testConnection = async () => {
        setStatus('testing')
        setResult('')

        try {
            console.log('Testing Supabase connection...')

            // Test basic connection
            const start = Date.now()
            const { data, error } = await supabase.from('couples').select('id').limit(1)
            const duration = Date.now() - start

            if (error) {
                setResult(`Connection failed: ${error.message} (${duration}ms)`)
                setStatus('failed')
            } else {
                setResult(`Connection successful! (${duration}ms)`)
                setStatus('success')
            }
        } catch (err: any) {
            setResult(`Connection error: ${err.message}`)
            setStatus('failed')
        }
    }

    const testAuth = async () => {
        setStatus('testing-auth')
        setResult('')

        try {
            console.log('Testing auth session...')

            const start = Date.now()
            const { data: { session }, error } = await supabase.auth.getSession()
            const duration = Date.now() - start

            if (error) {
                setResult(`Auth failed: ${error.message} (${duration}ms)`)
                setStatus('failed')
            } else {
                setResult(`Auth check complete: ${session ? 'Logged in' : 'Not logged in'} (${duration}ms)`)
                setStatus('success')
            }
        } catch (err: any) {
            setResult(`Auth error: ${err.message}`)
            setStatus('failed')
        }
    }

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <h1>Supabase Connection Test</h1>

            <div style={{ marginBottom: '20px' }}>
                <h2>Environment Check</h2>
                <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
                <p>Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <button
                    onClick={testConnection}
                    style={{
                        padding: '10px 20px',
                        marginRight: '10px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                    disabled={status === 'testing'}
                >
                    Test Database Connection
                </button>

                <button
                    onClick={testAuth}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                    disabled={status === 'testing-auth'}
                >
                    Test Auth Session
                </button>
            </div>

            <div>
                <p>Status: <strong>{status}</strong></p>
                {result && (
                    <div style={{
                        padding: '10px',
                        backgroundColor: status === 'success' ? '#d4edda' : '#f8d7da',
                        border: `1px solid ${status === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
                        borderRadius: '4px',
                        marginTop: '10px'
                    }}>
                        {result}
                    </div>
                )}
            </div>

            <div style={{ marginTop: '30px' }}>
                <h2>Quick Links</h2>
                <ul>
                    <li><a href="/dashboard">Dashboard (with auth)</a></li>
                    <li><a href="/demo-dashboard">Demo Dashboard</a></li>
                    <li><a href="/test-static">Static Test</a></li>
                </ul>
            </div>
        </div>
    )
}