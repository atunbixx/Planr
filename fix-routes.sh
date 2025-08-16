#!/bin/bash

# Fix all route.ts files that have Request type issues

files=(
  "src/app/api/day-of/emergency/route.ts"
  "src/app/api/day-of/timeline/route.ts"
  "src/app/api/day-of/issues/route.ts"
  "src/app/api/day-of/vendor-check-in/route.ts"
  "src/app/api/settings/preferences/route.ts"
  "src/app/api/settings/collaborators/accept/route.ts"
  "src/app/api/settings/collaborators/route.ts"
  "src/app/api/settings/wedding/route.ts"
  "src/app/api/vendors/categories/route.ts"
  "src/app/api/messages/logs/route.ts"
  "src/app/api/messages/route.ts"
  "src/app/api/messages/templates/route.ts"
  "src/app/api/messages/send/route.ts"
  "src/app/api/qr/scan/route.ts"
  "src/app/api/qr/generate/route.ts"
  "src/app/api/dashboard/tasks/route.ts"
  "src/app/api/dashboard/messages-preview/route.ts"
  "src/app/api/dashboard/stats/route.ts"
)

for file in "${files[@]}"; do
  echo "Processing $file..."
  
  # Check if file needs NextRequest import
  if ! grep -q "import.*NextRequest" "$file"; then
    # Add NextRequest import after the first import line
    sed -i '' "1,/^import/s/^import.*$/&\nimport { NextRequest } from 'next\/server'/" "$file"
  fi
  
  # Replace "request as any" with "request as NextRequest"
  sed -i '' 's/request as any/request as NextRequest/g' "$file"
  
  # Replace handler calls with "request)" to use "request as NextRequest)"
  sed -i '' 's/handler\.\([a-zA-Z]*\)(request)/handler.\1(request as NextRequest)/g' "$file"
  
  # Fix return statements
  sed -i '' 's/return \([a-zA-Z]*\)\.handle(request)/return \1.handle(request as NextRequest)/g' "$file"
done

echo "All routes fixed!"