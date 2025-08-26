#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Wedding Planner Development Server on Port 3003');
console.log('=========================================================');

// Set the working directory to the current directory
process.chdir(__dirname);

console.log('📍 Working directory:', process.cwd());
console.log('🌐 Starting server on port 3003...');
console.log('');

// Start Next.js development server
const nextProcess = spawn('node', [
  'node_modules/next/dist/bin/next',
  'dev',
  '-p',
  '3003'
], {
  stdio: 'inherit',
  cwd: process.cwd()
});

nextProcess.on('error', (error) => {
  console.error('❌ Failed to start server:', error.message);
  console.log('');
  console.log('💡 Manual steps to start the server:');
  console.log('1. Open terminal in project directory');
  console.log('2. Run: npm install');
  console.log('3. Run: npx prisma generate');
  console.log('4. Run: npx prisma db push --accept-data-loss');
  console.log('5. Run: npm run dev -- -p 3003');
  process.exit(1);
});

nextProcess.on('close', (code) => {
  console.log(`\n📴 Server stopped with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  nextProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  nextProcess.kill('SIGTERM');
});

console.log('✅ Server starting...');
console.log('📱 Once ready, open: http://localhost:3003');
console.log('🔧 Create account at: http://localhost:3003/signup');
console.log('🧪 Run E2E tests with: npx playwright test');
console.log('📊 Check health at: http://localhost:3003/api/health');
console.log('');
console.log('Press Ctrl+C to stop the server');