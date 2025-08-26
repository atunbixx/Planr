#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Running database migrations...');

try {
  // Change to the project directory
  process.chdir(__dirname);
  
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('🗄️ Pushing database schema...');
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
  
  console.log('✅ Migrations completed successfully!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Start the server: npm run dev');
  console.log('2. Open http://localhost:3004');
  console.log('3. Create a new account at /signup');
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}