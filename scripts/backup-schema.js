#!/usr/bin/env node

/**
 * Schema Backup Utility
 * 
 * Creates timestamped backups of the Prisma schema before any risky operations.
 * This protects against accidental schema corruption from `prisma db pull`.
 */

const fs = require('fs');
const path = require('path');

const SCHEMA_PATH = path.join(__dirname, '../prisma/schema.prisma');
const BACKUP_DIR = path.join(__dirname, '../prisma/backups');

function createBackup() {
  console.log('🔄 Creating schema backup...');
  
  // Ensure backup directory exists
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  // Create timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `schema-${timestamp}.prisma`);
  
  try {
    // Copy schema file
    fs.copyFileSync(SCHEMA_PATH, backupPath);
    
    console.log(`✅ Schema backed up to: ${path.relative(process.cwd(), backupPath)}`);
    
    // Clean up old backups (keep last 10)
    cleanupOldBackups();
    
    return backupPath;
  } catch (error) {
    console.error('❌ Failed to create backup:', error.message);
    process.exit(1);
  }
}

function cleanupOldBackups() {
  try {
    const backups = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('schema-') && file.endsWith('.prisma'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        time: fs.statSync(path.join(BACKUP_DIR, file)).mtime
      }))
      .sort((a, b) => b.time - a.time); // Newest first
    
    // Remove old backups (keep only 10 most recent)
    const toDelete = backups.slice(10);
    toDelete.forEach(backup => {
      fs.unlinkSync(backup.path);
      console.log(`🗑️  Cleaned up old backup: ${backup.name}`);
    });
    
  } catch (error) {
    console.warn('⚠️  Warning: Could not clean up old backups:', error.message);
  }
}

function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('📁 No backups found.');
    return;
  }
  
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(file => file.startsWith('schema-') && file.endsWith('.prisma'))
    .map(file => ({
      name: file,
      time: fs.statSync(path.join(BACKUP_DIR, file)).mtime,
      size: fs.statSync(path.join(BACKUP_DIR, file)).size
    }))
    .sort((a, b) => b.time - a.time);
    
  console.log('\n📋 Available schema backups:');
  backups.forEach((backup, index) => {
    const age = new Date() - backup.time;
    const ageStr = age < 60000 ? 'just now' : 
                   age < 3600000 ? `${Math.floor(age/60000)}m ago` :
                   age < 86400000 ? `${Math.floor(age/3600000)}h ago` :
                   `${Math.floor(age/86400000)}d ago`;
    const sizeStr = `${Math.round(backup.size/1024)}KB`;
    
    console.log(`   ${index + 1}. ${backup.name} (${ageStr}, ${sizeStr})`);
  });
}

function restoreBackup(backupName) {
  const backupPath = path.join(BACKUP_DIR, backupName);
  
  if (!fs.existsSync(backupPath)) {
    console.error(`❌ Backup not found: ${backupName}`);
    listBackups();
    process.exit(1);
  }
  
  console.log(`🔄 Restoring schema from backup: ${backupName}`);
  
  try {
    // Create backup of current schema before restoring
    const currentBackup = createBackup();
    console.log(`📋 Current schema backed up before restore`);
    
    // Restore from backup
    fs.copyFileSync(backupPath, SCHEMA_PATH);
    
    console.log('✅ Schema restored successfully!');
    console.log('🔧 Remember to run: prisma generate');
    
  } catch (error) {
    console.error('❌ Failed to restore backup:', error.message);
    process.exit(1);
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'create':
  case 'backup':
    createBackup();
    break;
    
  case 'list':
    listBackups();
    break;
    
  case 'restore':
    const backupName = process.argv[3];
    if (!backupName) {
      console.error('❌ Please specify backup name to restore');
      listBackups();
      process.exit(1);
    }
    restoreBackup(backupName);
    break;
    
  default:
    console.log(`
🔒 Schema Backup Utility

Usage:
  node scripts/backup-schema.js create   - Create new backup
  node scripts/backup-schema.js list     - List available backups  
  node scripts/backup-schema.js restore <name> - Restore from backup

Examples:
  node scripts/backup-schema.js create
  node scripts/backup-schema.js restore schema-2024-01-15T10-30-00-000Z.prisma
`);
}

module.exports = { createBackup, listBackups, restoreBackup };