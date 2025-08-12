#!/bin/bash

# Wedding Planner v2 - New Features Setup Script
# This script sets up all the new features for the wedding planner application

echo "🚀 Wedding Planner v2 - Setting up new features..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Step 1: Install new dependencies
echo "📦 Step 1: Installing new dependencies..."
npm install
if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi
echo ""

# Step 2: Generate Prisma client
echo "🔧 Step 2: Generating Prisma client with new models..."
npx prisma generate
if [ $? -eq 0 ]; then
    echo "✅ Prisma client generated successfully"
else
    echo "❌ Failed to generate Prisma client"
    exit 1
fi
echo ""

# Step 3: Push database schema (optional, only if database is connected)
echo "🗄️  Step 3: Database setup..."
echo "Would you like to push the database schema? (y/n)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    npx prisma db push
    if [ $? -eq 0 ]; then
        echo "✅ Database schema pushed successfully"
    else
        echo "⚠️  Failed to push database schema. Make sure your DATABASE_URL is configured."
    fi
else
    echo "⏭️  Skipping database push"
fi
echo ""

# Step 4: Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📋 Step 4: Creating .env.local from template..."
    cp .env.example .env.local
    echo "✅ Created .env.local - Please update it with your actual values"
else
    echo "✅ .env.local already exists"
fi
echo ""

# Step 5: Create required directories
echo "📁 Step 5: Creating required directories..."
mkdir -p public/icons
mkdir -p public/screenshots
mkdir -p server
echo "✅ Directories created"
echo ""

# Step 6: Build the application to check for errors
echo "🏗️  Step 6: Building application..."
echo "Would you like to run a build to check for errors? (y/n)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    npm run build
    if [ $? -eq 0 ]; then
        echo "✅ Build completed successfully"
    else
        echo "⚠️  Build failed. Please check the errors above."
    fi
else
    echo "⏭️  Skipping build"
fi
echo ""

# Final instructions
echo "🎉 Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Update .env.local with your actual API keys and database URL"
echo "2. Run 'npm run dev:ws' in one terminal for WebSocket server"
echo "3. Run 'npm run dev' in another terminal for Next.js"
echo "4. Visit http://localhost:4010"
echo ""
echo "📚 New features available:"
echo "- Seating Planner: /dashboard/seating"
echo "- Day-of Dashboard: /dashboard/day-of"
echo ""
echo "🧪 To run tests:"
echo "- Unit tests: npm run test"
echo "- E2E tests: npx playwright test"
echo ""
echo "Happy planning! 💒"