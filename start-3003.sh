#!/bin/bash

echo "🚀 Starting Wedding Planner on Port 3003"
echo "=========================================="

# Update NEXTAUTH_URL for port 3003
echo "🔧 Updating environment for port 3003..."
sed -i '' 's/NEXTAUTH_URL=.*/NEXTAUTH_URL=http:\/\/localhost:3003/' .env

echo "✅ Environment configured"
echo "📍 Working directory: $(pwd)"
echo ""

# Setup database
echo "🔄 Setting up database..."
npx prisma generate
npx prisma db push --accept-data-loss

echo ""
echo "🌐 Starting Next.js development server on port 3003..."
echo "📱 Once ready, open: http://localhost:3003"
echo "🔧 Create account at: http://localhost:3003/signup"
echo "📊 Health check: http://localhost:3003/api/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
NEXTAUTH_URL=http://localhost:3003 npx next dev -p 3003