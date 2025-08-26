#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('🚀 Starting Wedding Planner Development Server');
console.log('===============================================');

// Start Next.js development server directly
const nextProcess = spawn('node', [
  './node_modules/next/dist/bin/next',
  'dev',
  '-p',
  '3002'
], {
  stdio: 'inherit',
  shell: true
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

console.log('✅ Server starting on port 3002...');
console.log('📱 Once ready, open: http://localhost:3002');
console.log('');
console.log('Press Ctrl+C to stop the server');