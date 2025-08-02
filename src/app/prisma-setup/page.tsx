'use client'

import { useState } from 'react'

export default function PrismaSetup() {
  const [password, setPassword] = useState('')
  const [connectionString, setConnectionString] = useState('')

  const generateConnectionString = () => {
    if (!password.trim()) {
      alert('Please enter your Supabase database password')
      return
    }

    const dbUrl = `postgresql://postgres.gpfxxbhowailwllpgphe:${password}@aws-0-us-east-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1`
    setConnectionString(dbUrl)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(connectionString)
    alert('Connection string copied to clipboard!')
  }

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Prisma + Supabase Setup</h1>
      <p>Configure Prisma to work with your Supabase database.</p>

      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h2>Step 1: Get Your Database Password</h2>
        <ol>
          <li>Go to your <a href="https://supabase.com/dashboard/project/gpfxxbhowailwllpgphe/settings/database" target="_blank" rel="noopener noreferrer">Supabase Database Settings</a></li>
          <li>Look for the "Connection string" section</li>
          <li>Find your database password (it&apos;s the part after the colon in the connection string)</li>
          <li>Copy the password and paste it below</li>
        </ol>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2>Step 2: Generate Connection String</h2>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
            Enter your Supabase database password:
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your database password"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          />
        </div>
        <button
          onClick={generateConnectionString}
          style={{
            padding: '12px 24px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Generate Connection String
        </button>
      </div>

      {connectionString && (
        <div style={{ marginBottom: '30px' }}>
          <h2>Step 3: Update Your .env.local File</h2>
          <p>Replace the DATABASE_URL in your .env.local file with this:</p>
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '15px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            fontFamily: 'monospace',
            fontSize: '14px',
            wordBreak: 'break-all',
            marginBottom: '10px'
          }}>
            DATABASE_URL="{connectionString}"
          </div>
          <button
            onClick={copyToClipboard}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Copy to Clipboard
          </button>
        </div>
      )}

      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#fff3cd', borderRadius: '8px' }}>
        <h2>Step 4: Test Prisma Connection</h2>
        <p>After updating your .env.local file, run these commands in your terminal:</p>
        <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '4px', fontFamily: 'monospace' }}>
          <div>npx prisma db pull</div>
          <div>npx prisma generate</div>
        </div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3>Current Configuration</h3>
        <ul>
          <li><strong>Supabase Project:</strong> gpfxxbhowailwllpgphe</li>
          <li><strong>Database Host:</strong> aws-0-us-east-1.pooler.supabase.com</li>
          <li><strong>Database:</strong> postgres</li>
          <li><strong>Connection Pooling:</strong> Enabled (pgbouncer)</li>
        </ul>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3>Quick Links</h3>
        <ul>
          <li><a href="/table-test">Test Database Tables</a></li>
          <li><a href="/test-supabase">Test Supabase Connection</a></li>
          <li><a href="/working-test">Basic App Test</a></li>
        </ul>
      </div>
    </div>
  )
}