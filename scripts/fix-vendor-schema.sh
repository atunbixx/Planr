#!/bin/bash

# Script to fix vendor schema by running migrations in the correct order

echo "🔧 Fixing vendor schema..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}Error: .env.local not found. Please create it with your Supabase connection string.${NC}"
    exit 1
fi

# Source the environment variables
export $(cat .env.local | grep -v '^#' | xargs)

# Check if we have the database URL
if [ -z "$SUPABASE_DB_URL" ] && [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: No database URL found in .env.local${NC}"
    echo "Please add either SUPABASE_DB_URL or DATABASE_URL to your .env.local file"
    exit 1
fi

# Use the appropriate database URL
DB_URL=${SUPABASE_DB_URL:-$DATABASE_URL}

echo -e "${YELLOW}Running vendor schema migrations...${NC}"

# Run the migrations in order
echo "1. Adding missing columns to couple_vendors table..."
psql "$DB_URL" -f supabase/migrations/20250802070000_fix_vendor_schema.sql
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Missing columns added successfully${NC}"
else
    echo -e "${RED}✗ Failed to add missing columns${NC}"
    exit 1
fi

echo "2. Creating vendor views and helper functions..."
psql "$DB_URL" -f supabase/migrations/20250802071000_vendor_views_and_policies.sql
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Views and functions created successfully${NC}"
else
    echo -e "${RED}✗ Failed to create views and functions${NC}"
    exit 1
fi

echo "3. Inserting sample vendor data..."
psql "$DB_URL" -f supabase/seed_vendors.sql
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Sample data inserted successfully${NC}"
else
    echo -e "${YELLOW}⚠ Sample data insertion failed (this might be okay if data already exists)${NC}"
fi

echo -e "${GREEN}✨ Vendor schema fix completed!${NC}"
echo ""
echo "You can now:"
echo "1. Visit /dashboard/vendors to see the vendor management page"
echo "2. Add new vendors using the form"
echo "3. View vendor details by clicking on a vendor"
echo "4. Send messages to vendors (messaging system ready)"
echo ""
echo "To verify the fix worked, you can run:"
echo "psql \"$DB_URL\" -c \"SELECT COUNT(*) FROM couple_vendors;\""