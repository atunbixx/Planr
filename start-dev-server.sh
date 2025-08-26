#!/bin/bash

echo "🚀 Starting Wedding Planner Development Server"
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "📥 Installing dependencies..."
    npm install
fi

echo "🔧 Generating Prisma client..."
npx prisma generate

echo "🗄️ Setting up database..."
npx prisma db push --accept-data-loss

echo "🌐 Starting development server on port 3003..."
echo ""
echo "📱 Once ready, open: http://localhost:3003"
echo "🔧 Create account at: http://localhost:3003/signup"
echo "🧪 Run E2E tests with: npx playwright test"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev -- -p 3003