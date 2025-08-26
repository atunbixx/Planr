#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Wedding Planner Development Server');
console.log('===============================================');

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
console.log('');
console.log('Press Ctrl+C to stop the server');