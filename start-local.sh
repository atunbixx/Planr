#!/bin/bash

echo "🔧 Starting Wedding Planner with Local Supabase"
echo "============================================="

# Kill any existing processes
echo "1️⃣ Stopping existing processes..."
pkill -f "next dev" 2>/dev/null || true
pkill -f supabase 2>/dev/null || true

# Clean cache
echo "2️⃣ Clearing Next.js cache..."
rm -rf .next 2>/dev/null || true

# Start Supabase (with timeout)
echo "3️⃣ Starting Supabase local instance..."
npx supabase start --ignore-health-check &
SUPABASE_PID=$!

# Wait a bit for Supabase to start
echo "⏳ Waiting for Supabase to start (30s timeout)..."
sleep 30

# Check if Supabase is running
if curl -s http://localhost:54321/health >/dev/null 2>&1; then
    echo "✅ Supabase is running on localhost:54321"
else
    echo "⚠️  Supabase may still be starting or failed to start"
    echo "   Will try to start Next.js anyway..."
fi

# Force local environment and start Next.js
echo "4️⃣ Starting Next.js with forced local environment..."
export NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
export NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQxNzY5NTAwLCJleHAiOjE5NTczNDU1MDB9.zqAiYO6BOQVwjQlqaZhfAJ4m8Xe4WFlm1xRAJvppQ0c

echo ""
echo "🚀 Starting Next.js server..."
echo "   URL: http://localhost:3000"
echo "   Supabase: http://localhost:54321"
echo ""
echo "📋 To test:"
echo "   • Go to http://localhost:3000/env-debug to check environment"
echo "   • Sign up with your credentials if using local DB"
echo "   • All data will stay on your machine"
echo ""
echo "⏸️  Press Ctrl+C to stop both servers"

npm run dev -- --port 3000