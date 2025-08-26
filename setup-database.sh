#!/bin/bash

echo "🚀 Setting up Wedding Planner Database..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Step 1: Install dependencies (if needed)
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    print_warning "Installing dependencies..."
    npm install
fi
print_status "Dependencies ready"

# Step 2: Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate
if [ $? -eq 0 ]; then
    print_status "Prisma client generated"
else
    print_error "Failed to generate Prisma client"
    exit 1
fi

# Step 3: Push database schema
echo "🗄️ Setting up database schema..."
npx prisma db push
if [ $? -eq 0 ]; then
    print_status "Database schema created"
else
    print_error "Failed to create database schema"
    print_warning "This might be due to connection issues. Check your DATABASE_URL in .env"
    exit 1
fi

# Step 4: Check database connection
echo "🔍 Testing database connection..."
npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_status "Database connection successful"
else
    print_warning "Database connection test failed, but schema might still be created"
fi

# Step 5: Start the development server
echo "🌐 Starting development server..."
print_status "Database setup complete!"
echo ""
echo "=================================="
echo "🎉 Setup Complete!"
echo "=================================="
echo ""
echo "Next steps:"
echo "1. Run: npm run dev"
echo "2. Open: http://localhost:3004"
echo "3. Create a new account at: http://localhost:3004/signup"
echo ""
echo "Your database is now configured with:"
echo "• PostgreSQL on Supabase (EU North 1)"
echo "• All required tables and relationships"
echo "• Ready for user registration"
echo ""
print_warning "Note: Since this is a fresh database, you'll need to create a new account"