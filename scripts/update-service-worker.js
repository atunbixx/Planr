const fs = require('fs');
const path = require('path');

console.log('Updating service worker...');

// Backup existing service worker
const swPath = path.join(__dirname, '../public/sw.js');
const backupPath = path.join(__dirname, '../public/sw-backup.js');
const enhancedSwPath = path.join(__dirname, '../public/sw-enhanced.js');

if (fs.existsSync(swPath)) {
  console.log('Backing up existing service worker...');
  fs.copyFileSync(swPath, backupPath);
  console.log('Backup created: sw-backup.js');
}

// Copy enhanced service worker to main sw.js
if (fs.existsSync(enhancedSwPath)) {
  console.log('Updating to enhanced service worker...');
  fs.copyFileSync(enhancedSwPath, swPath);
  console.log('Service worker updated successfully!');
} else {
  console.error('Enhanced service worker not found!');
  process.exit(1);
}

console.log('\nNext steps:');
console.log('1. Clear browser cache and reload');
console.log('2. The new service worker will automatically install');
console.log('3. Offline functionality will be available after first load');