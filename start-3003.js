#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Wedding Planner on Port 3003');
console.log('==========================================');

// Check if .env exists
if (!fs.existsSync('.env')) {
  console.error('❌ .env file not found');
  process.exit(1);
}

// Update NEXTAUTH_URL for port 3003
console.log('🔧 Updating NEXTAUTH_URL for port 3003...');
let envContent = fs.readFileSync('.env', 'utf8');
envContent = envContent.replace(/NEXTAUTH_URL=.*/, 'NEXTAUTH_URL=http://localhost:3003');
fs.writeFileSync('.env', envContent);

console.log('✅ Environment configured for port 3003');
console.log('📍 Working directory:', process.cwd());
console.log('');

// Function to run a command and wait for it to complete
function runCommand(command, args, description) {
  return new Promise((resolve, reject) => {
    console.log(`🔄 ${description}...`);
    const proc = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${description} completed`);
        resolve();
      } else {
        console.log(`⚠️  ${description} finished with code ${code}`);
        resolve(); // Continue anyway
      }
    });
    
    proc.on('error', (error) => {
      console.log(`⚠️  ${description} error: ${error.message}`);
      resolve(); // Continue anyway
    });
  });
}

async function setupAndStart() {
  try {
    // Generate Prisma client
    await runCommand('npx', ['prisma', 'generate'], 'Generating Prisma client');
    
    // Push database schema
    await runCommand('npx', ['prisma', 'db', 'push', '--accept-data-loss'], 'Setting up database');
    
    console.log('');
    console.log('🌐 Starting Next.js development server on port 3003...');
    console.log('📱 Once ready, open: http://localhost:3003');
    console.log('🔧 Create account at: http://localhost:3003/signup');
    console.log('📊 Health check: http://localhost:3003/api/health');
    console.log('');
    console.log('Press Ctrl+C to stop the server');
    console.log('');
    
    // Start Next.js development server
    const nextProcess = spawn('npx', ['next', 'dev', '-p', '3003'], {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, NEXTAUTH_URL: 'http://localhost:3003' }
    });
    
    nextProcess.on('error', (error) => {
      console.error('❌ Failed to start server:', error.message);
      console.log('');
      console.log('💡 Try running manually:');
      console.log('   npm run dev -- -p 3003');
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
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupAndStart();