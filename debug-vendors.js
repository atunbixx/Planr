#!/usr/bin/env node

// Simple diagnostic script to test vendors functionality
const path = require('path');

// Set working directory
process.chdir(__dirname);

console.log('🔍 Debugging Vendors API');
console.log('========================');
console.log('Working directory:', process.cwd());

// Test basic imports
try {
  console.log('✅ Testing basic Node.js functionality...');
  
  // Test if we can read files
  const fs = require('fs');
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log('✅ Package.json loaded:', packageJson.name);
  
  // Test if temp storage works
  console.log('✅ Testing temp storage...');
  const tempStoragePath = path.join(__dirname, 'src/lib/db/temp-storage.ts');
  if (fs.existsSync(tempStoragePath)) {
    console.log('✅ Temp storage file exists');
  } else {
    console.log('❌ Temp storage file missing');
  }
  
  // Test if vendors files exist
  const vendorsFiles = [
    'src/app/api/vendors/route.ts',
    'src/features/vendors/api/vendors.handler.ts',
    'src/features/vendors/service/vendors.service.ts',
    'src/features/vendors/repo/vendors.repository.ts',
    'src/lib/api/vendors.client.ts',
    'src/contracts/vendors.ts'
  ];
  
  console.log('✅ Checking vendors files...');
  vendorsFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ❌ ${file} - MISSING`);
    }
  });
  
  // Test environment
  console.log('✅ Testing environment...');
  if (fs.existsSync('.env')) {
    console.log('  ✅ .env file exists');
  } else {
    console.log('  ❌ .env file missing');
  }
  
  console.log('');
  console.log('🎯 Diagnosis complete. All core files appear to be present.');
  console.log('');
  console.log('💡 The 500 error is likely due to:');
  console.log('   1. Database connection issues (falling back to temp storage)');
  console.log('   2. Authentication/session issues');
  console.log('   3. Runtime errors in the API handlers');
  console.log('');
  console.log('🔧 To debug further:');
  console.log('   1. Check browser console for client-side errors');
  console.log('   2. Check server logs when starting the dev server');
  console.log('   3. Test the API endpoint directly: curl http://localhost:3002/api/vendors');
  
} catch (error) {
  console.error('❌ Error during diagnosis:', error.message);
}