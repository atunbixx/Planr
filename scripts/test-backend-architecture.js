#!/usr/bin/env node

/**
 * Backend Architecture Test Script
 * 
 * This script tests the new backend architecture implementation
 * including repositories, error handling, and API endpoints.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Testing Wedding Planner Backend Architecture\n');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_RESULTS = [];

/**
 * Log test result
 */
function logTest(name, success, message = '') {
  const status = success ? '✅ PASS' : '❌ FAIL';
  const fullMessage = `${status} ${name}${message ? ': ' + message : ''}`;
  console.log(fullMessage);
  TEST_RESULTS.push({ name, success, message });
}

/**
 * Check if file exists
 */
function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  logTest(`File: ${description}`, exists, exists ? 'Found' : 'Missing');
  return exists;
}

/**
 * Check TypeScript compilation
 */
function checkTypeScript() {
  try {
    console.log('\n📋 TypeScript Compilation Tests');
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    logTest('TypeScript compilation', true, 'No type errors');
    return true;
  } catch (error) {
    logTest('TypeScript compilation', false, 'Type errors found');
    console.log('Type errors:', error.stdout?.toString() || error.message);
    return false;
  }
}

/**
 * Check Prisma client generation
 */
function checkPrisma() {
  try {
    console.log('\n📋 Prisma Tests');
    execSync('npm run prisma:generate', { stdio: 'pipe' });
    logTest('Prisma client generation', true, 'Generated successfully');
    
    // Check if Prisma client exists
    const prismaClientExists = fs.existsSync('./node_modules/@prisma/client');
    logTest('Prisma client installed', prismaClientExists);
    
    return true;
  } catch (error) {
    logTest('Prisma client generation', false, error.message);
    return false;
  }
}

/**
 * Test API endpoint
 */
async function testApiEndpoint(endpoint, method = 'GET', expectedStatus = 200) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const success = response.status === expectedStatus;
    logTest(`API ${method} ${endpoint}`, success, `Status: ${response.status}`);
    
    return { success, status: response.status, data: await response.json() };
  } catch (error) {
    logTest(`API ${method} ${endpoint}`, false, `Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('📋 File Structure Tests');
  
  // Check core architecture files
  const files = [
    ['./src/lib/db/repository/base.ts', 'Base Repository'],
    ['./src/lib/db/repository/couples.repository.ts', 'Couples Repository'],
    ['./src/lib/db/repository/vendors.repository.ts', 'Vendors Repository'],
    ['./src/lib/db/repository/index.ts', 'Repository Index'],
    ['./src/lib/errors/index.ts', 'Error Classes'],
    ['./src/lib/api/response.helper.ts', 'API Response Helper'],
    ['./src/lib/auth/clerk.helper.ts', 'Authentication Helper'],
    ['./src/lib/validation/couples.schema.ts', 'Validation Schemas'],
    ['./src/lib/migrations/setup.ts', 'Migration Setup'],
    ['./src/app/api/couples/route.ts', 'Couples API Route'],
    ['./src/app/api/vendors/new/route.ts', 'New Vendors API Route'],
    ['./src/app/api/database/setup/route.ts', 'Database Setup API'],
    ['./DATABASE_SETUP.md', 'Database Setup Documentation']
  ];
  
  let fileTests = 0;
  let filesPassed = 0;
  
  for (const [filePath, description] of files) {
    fileTests++;
    if (checkFile(filePath, description)) {
      filesPassed++;
    }
  }
  
  // TypeScript compilation test
  const tsPass = checkTypeScript();
  
  // Prisma tests
  const prismaPass = checkPrisma();
  
  // API tests (if server is running)
  console.log('\n📋 API Endpoint Tests');
  console.log('Note: These tests require the development server to be running');
  
  try {
    // Test database setup endpoint
    const dbHealth = await testApiEndpoint('/api/database/setup', 'GET', 200);
    
    // Test couples API (will likely return 401 without auth, which is expected)
    const couplesApi = await testApiEndpoint('/api/couples', 'GET', 401);
    
    // Test new vendors API (will likely return 401 without auth, which is expected)
    const vendorsApi = await testApiEndpoint('/api/vendors/new', 'GET', 401);
    
  } catch (error) {
    console.log('⚠️  API tests skipped - server not running');
    console.log('   Start the development server with: npm run dev');
  }
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('================');
  
  const totalTests = TEST_RESULTS.length;
  const passedTests = TEST_RESULTS.filter(t => t.success).length;
  const failedTests = totalTests - passedTests;
  
  console.log(`Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (failedTests > 0) {
    console.log('\n❌ Failed Tests:');
    TEST_RESULTS
      .filter(t => !t.success)
      .forEach(t => console.log(`   - ${t.name}: ${t.message}`));
  }
  
  // Architecture validation
  console.log('\n🏗️ Architecture Validation');
  console.log('==========================');
  
  const coreFilesExist = filesPassed >= 12; // At least 12 core files should exist
  const tsCompiles = tsPass;
  const prismaWorks = prismaPass;
  
  console.log(`Core Files: ${coreFilesExist ? '✅' : '❌'} ${filesPassed}/${fileTests} files found`);
  console.log(`TypeScript: ${tsCompiles ? '✅' : '❌'} Compilation ${tsCompiles ? 'passed' : 'failed'}`);
  console.log(`Prisma: ${prismaWorks ? '✅' : '❌'} Client generation ${prismaWorks ? 'succeeded' : 'failed'}`);
  
  const architectureScore = [coreFilesExist, tsCompiles, prismaWorks].filter(Boolean).length;
  const architectureGrade = architectureScore === 3 ? 'A+' : architectureScore === 2 ? 'B' : 'C';
  
  console.log(`\n🎯 Architecture Grade: ${architectureGrade}`);
  
  if (architectureScore === 3) {
    console.log('🎉 Excellent! The backend architecture is properly implemented.');
    console.log('   Ready for database setup and testing.');
  } else if (architectureScore === 2) {
    console.log('👍 Good! Most components are working. Check failed tests above.');
  } else {
    console.log('⚠️  Issues found. Please review failed tests and fix implementation.');
  }
  
  // Next steps
  console.log('\n🚀 Next Steps');
  console.log('=============');
  
  if (architectureScore >= 2) {
    console.log('1. Start the development server: npm run dev');
    console.log('2. Setup the database: curl -X POST http://localhost:3000/api/database/setup');
    console.log('3. Test the couples API: curl http://localhost:3000/api/couples');
    console.log('4. Test the new vendors API: curl http://localhost:3000/api/vendors/new');
    console.log('5. Review the DATABASE_SETUP.md guide for detailed instructions');
  } else {
    console.log('1. Fix the failed tests shown above');
    console.log('2. Ensure all required files exist');
    console.log('3. Fix any TypeScript compilation errors');
    console.log('4. Regenerate Prisma client if needed');
    console.log('5. Re-run this test script');
  }
  
  return {
    totalTests,
    passedTests,
    failedTests,
    architectureScore,
    architectureGrade
  };
}

// Run tests
runTests().catch(console.error);