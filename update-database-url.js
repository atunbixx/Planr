#!/usr/bin/env node

/**
 * Update DATABASE_URL for Prisma using Supabase service role key
 */

const fs = require('fs')
const path = require('path')

// Use the service role key from the CLI output
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwZnh4Ymhvd2FpbHdsbHBncGhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjg4MzIxMiwiZXhwIjoyMDY4NDU5MjEyfQ.JpJUU-ZsuWQjAlTzNysTEGHNoIFnC_5x0CKhzk7H2Xk'

// For Prisma with Supabase, we need to use the direct connection
// The format should be: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
const databaseUrl = `postgresql://postgres:${serviceRoleKey}@db.gpfxxbhowailwllpgphe.supabase.co:5432/postgres`

// Update the .env file
const envPath = path.join(process.cwd(), '.env')
let envContent = fs.readFileSync(envPath, 'utf8')

// Replace the DATABASE_URL
envContent = envContent.replace(
  /DATABASE_URL=.*/,
  `DATABASE_URL="${databaseUrl}"`
)

fs.writeFileSync(envPath, envContent)

console.log('✅ Updated DATABASE_URL in .env file')
console.log('🚀 You can now run: npx prisma db push')