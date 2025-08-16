/**
 * File Upload Validation Utility
 * Provides comprehensive file validation and security checks
 */

import { logger } from '@/lib/utils/logger';
import { sanitizeFilename } from './sanitize';
import crypto from 'crypto';

const log = logger.child({ module: 'file-upload' });

/**
 * File type configurations
 */
export const FILE_TYPE_CONFIG = {
  images: {
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
    mimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
  documents: {
    extensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'],
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  videos: {
    extensions: ['.mp4', '.avi', '.mov', '.wmv', '.webm'],
    mimeTypes: [
      'video/mp4',
      'video/x-msvideo',
      'video/quicktime',
      'video/x-ms-wmv',
      'video/webm',
    ],
    maxSize: 100 * 1024 * 1024, // 100MB
  },
  audio: {
    extensions: ['.mp3', '.wav', '.ogg', '.m4a'],
    mimeTypes: [
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/mp4',
    ],
    maxSize: 20 * 1024 * 1024, // 20MB
  },
};

/**
 * Magic numbers for file type verification
 */
const MAGIC_NUMBERS: Record<string, Buffer[]> = {
  'image/jpeg': [Buffer.from([0xFF, 0xD8, 0xFF])],
  'image/png': [Buffer.from([0x89, 0x50, 0x4E, 0x47])],
  'image/gif': [Buffer.from([0x47, 0x49, 0x46, 0x38])],
  'image/webp': [Buffer.from('RIFF', 'ascii')],
  'application/pdf': [Buffer.from([0x25, 0x50, 0x44, 0x46])],
  'application/zip': [Buffer.from([0x50, 0x4B, 0x03, 0x04])],
};

export interface FileValidationOptions {
  allowedTypes?: keyof typeof FILE_TYPE_CONFIG | Array<keyof typeof FILE_TYPE_CONFIG>;
  maxSize?: number;
  minSize?: number;
  allowedExtensions?: string[];
  allowedMimeTypes?: string[];
  validateMagicNumber?: boolean;
  scanForVirus?: boolean;
}

export interface FileValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedFilename?: string;
  fileHash?: string;
}

/**
 * Validate a file upload
 */
export async function validateFile(
  file: {
    name: string;
    size: number;
    type: string;
    buffer?: Buffer;
  },
  options: FileValidationOptions = {}
): Promise<FileValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Sanitize filename
  const sanitizedFilename = sanitizeFilename(file.name);
  
  // Check if filename was sanitized (potential security issue)
  if (sanitizedFilename !== file.name) {
    warnings.push('Filename contained potentially dangerous characters and was sanitized');
  }
  
  // Get file extension
  const extension = ('.' + sanitizedFilename.split('.').pop()?.toLowerCase()) || '';
  
  // Determine allowed configurations
  let allowedExtensions: string[] = [];
  let allowedMimeTypes: string[] = [];
  let maxSize = options.maxSize || 10 * 1024 * 1024; // Default 10MB
  
  if (options.allowedTypes) {
    const types = Array.isArray(options.allowedTypes) 
      ? options.allowedTypes 
      : [options.allowedTypes];
    
    types.forEach(type => {
      const config = FILE_TYPE_CONFIG[type];
      if (config) {
        allowedExtensions.push(...config.extensions);
        allowedMimeTypes.push(...config.mimeTypes);
        maxSize = Math.max(maxSize, config.maxSize);
      }
    });
  }
  
  // Override with custom options if provided
  if (options.allowedExtensions) {
    allowedExtensions = options.allowedExtensions;
  }
  if (options.allowedMimeTypes) {
    allowedMimeTypes = options.allowedMimeTypes;
  }
  if (options.maxSize) {
    maxSize = options.maxSize;
  }
  
  // Validate file extension
  if (allowedExtensions.length > 0 && !allowedExtensions.includes(extension)) {
    errors.push(`File extension '${extension}' is not allowed. Allowed: ${allowedExtensions.join(', ')}`);
  }
  
  // Validate MIME type
  if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(file.type)) {
    errors.push(`File type '${file.type}' is not allowed. Allowed: ${allowedMimeTypes.join(', ')}`);
  }
  
  // Validate file size
  if (file.size > maxSize) {
    errors.push(`File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(maxSize)})`);
  }
  
  if (options.minSize && file.size < options.minSize) {
    errors.push(`File size (${formatFileSize(file.size)}) is below minimum required size (${formatFileSize(options.minSize)})`);
  }
  
  // Check for empty file
  if (file.size === 0) {
    errors.push('File is empty');
  }
  
  // Validate magic number if buffer is provided
  let fileHash: string | undefined;
  if (file.buffer && options.validateMagicNumber !== false) {
    const magicValidation = await validateMagicNumber(file.buffer, file.type);
    if (!magicValidation.valid) {
      errors.push(magicValidation.error || 'File content does not match its type');
    }
    
    // Calculate file hash for integrity checking
    fileHash = calculateFileHash(file.buffer);
  }
  
  // Check for potential malware patterns (basic check)
  if (file.buffer && options.scanForVirus !== false) {
    const malwareCheck = await scanForMalware(file.buffer, sanitizedFilename);
    if (malwareCheck.suspicious) {
      warnings.push(malwareCheck.warning || 'File contains suspicious patterns');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    sanitizedFilename,
    fileHash,
  };
}

/**
 * Validate file magic number
 */
async function validateMagicNumber(
  buffer: Buffer,
  mimeType: string
): Promise<{ valid: boolean; error?: string }> {
  const magicNumbers = MAGIC_NUMBERS[mimeType];
  
  if (!magicNumbers) {
    // No magic number validation for this type
    return { valid: true };
  }
  
  // Check if buffer starts with any of the valid magic numbers
  const isValid = magicNumbers.some(magic => {
    if (buffer.length < magic.length) return false;
    return buffer.slice(0, magic.length).equals(magic);
  });
  
  if (!isValid) {
    return {
      valid: false,
      error: `File content does not match declared type '${mimeType}'`,
    };
  }
  
  return { valid: true };
}

/**
 * Basic malware pattern scanning
 */
async function scanForMalware(
  buffer: Buffer,
  filename: string
): Promise<{ suspicious: boolean; warning?: string }> {
  const suspiciousPatterns = [
    // Common script patterns in files
    /<script[\s>]/gi,
    /<iframe[\s>]/gi,
    /javascript:/gi,
    /onclick=/gi,
    /onerror=/gi,
    
    // PHP patterns
    /<\?php/gi,
    /eval\s*\(/gi,
    /base64_decode/gi,
    
    // Shell script patterns
    /^#!/,
    /rm\s+-rf/gi,
    /chmod\s+777/gi,
    
    // Windows executable patterns
    /^MZ/, // DOS/Windows executable
  ];
  
  const content = buffer.toString('utf8', 0, Math.min(buffer.length, 1024)); // Check first 1KB
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(content)) {
      log.warn('Suspicious pattern detected in file upload', {
        filename,
        pattern: pattern.source,
      });
      
      return {
        suspicious: true,
        warning: 'File contains potentially suspicious content',
      };
    }
  }
  
  // Check for excessive null bytes (could indicate binary in text file)
  const nullByteCount = buffer.filter(byte => byte === 0).length;
  const nullByteRatio = nullByteCount / buffer.length;
  
  if (nullByteRatio > 0.3 && !filename.match(/\.(jpg|jpeg|png|gif|pdf|doc|docx|zip)$/i)) {
    return {
      suspicious: true,
      warning: 'File appears to contain unexpected binary content',
    };
  }
  
  return { suspicious: false };
}

/**
 * Calculate file hash for integrity checking
 */
function calculateFileHash(buffer: Buffer): string {
  return crypto
    .createHash('sha256')
    .update(buffer)
    .digest('hex');
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Generate a secure filename for storage
 */
export function generateSecureFilename(
  originalFilename: string,
  options: {
    preserveExtension?: boolean;
    prefix?: string;
    includeTimestamp?: boolean;
  } = {}
): string {
  const {
    preserveExtension = true,
    prefix = '',
    includeTimestamp = true,
  } = options;
  
  // Get extension if needed
  let extension = '';
  if (preserveExtension) {
    const parts = originalFilename.split('.');
    if (parts.length > 1) {
      extension = '.' + parts.pop()?.toLowerCase();
    }
  }
  
  // Generate unique identifier
  const uniqueId = crypto.randomBytes(16).toString('hex');
  
  // Build filename parts
  const parts: string[] = [];
  
  if (prefix) {
    parts.push(prefix);
  }
  
  if (includeTimestamp) {
    parts.push(Date.now().toString());
  }
  
  parts.push(uniqueId);
  
  // Join parts and add extension
  const filename = parts.join('_') + extension;
  
  return sanitizeFilename(filename);
}

/**
 * Validate multiple files
 */
export async function validateFiles(
  files: Array<{
    name: string;
    size: number;
    type: string;
    buffer?: Buffer;
  }>,
  options: FileValidationOptions & {
    maxTotalSize?: number;
    maxFileCount?: number;
  } = {}
): Promise<{
  valid: boolean;
  results: FileValidationResult[];
  errors: string[];
}> {
  const errors: string[] = [];
  const results: FileValidationResult[] = [];
  
  // Check file count
  if (options.maxFileCount && files.length > options.maxFileCount) {
    errors.push(`Too many files. Maximum allowed: ${options.maxFileCount}`);
  }
  
  // Check total size
  if (options.maxTotalSize) {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > options.maxTotalSize) {
      errors.push(`Total file size (${formatFileSize(totalSize)}) exceeds maximum (${formatFileSize(options.maxTotalSize)})`);
    }
  }
  
  // Validate each file
  for (const file of files) {
    const result = await validateFile(file, options);
    results.push(result);
  }
  
  const allValid = errors.length === 0 && results.every(r => r.valid);
  
  return {
    valid: allValid,
    results,
    errors,
  };
}