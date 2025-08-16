/**
 * Input Sanitization Utilities
 * Provides sanitization functions to prevent XSS and injection attacks
 */

import { logger } from '@/lib/utils/logger';

const log = logger.child({ module: 'sanitization' });

/**
 * HTML entities that need to be escaped
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * SQL keywords that might indicate injection attempts
 */
const SQL_KEYWORDS = [
  'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER',
  'EXEC', 'EXECUTE', 'UNION', 'FROM', 'WHERE', 'JOIN', 'SCRIPT',
  'JAVASCRIPT', 'ONCLICK', 'ONLOAD', 'ONERROR', 'ALERT', 'CONFIRM'
];

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(str: string): string {
  if (typeof str !== 'string') return '';
  
  return str.replace(/[&<>"'`=\/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Remove HTML tags from a string
 */
export function stripHtml(str: string): string {
  if (typeof str !== 'string') return '';
  
  // Remove script tags and their content first
  let cleaned = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove style tags and their content
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove all remaining HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, '');
  
  // Decode HTML entities
  cleaned = cleaned
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#x60;/g, '`')
    .replace(/&#x3D;/g, '=');
  
  return cleaned.trim();
}

/**
 * Sanitize a string for safe database queries
 */
export function sanitizeForDatabase(str: string): string {
  if (typeof str !== 'string') return '';
  
  // Remove null bytes
  let cleaned = str.replace(/\0/g, '');
  
  // Escape single quotes for SQL
  cleaned = cleaned.replace(/'/g, "''");
  
  // Check for SQL injection patterns
  const upperStr = cleaned.toUpperCase();
  const hasSqlKeywords = SQL_KEYWORDS.some(keyword => 
    upperStr.includes(keyword) && 
    (upperStr.includes('--') || upperStr.includes('/*') || upperStr.includes('*/'))
  );
  
  if (hasSqlKeywords) {
    log.warn('Potential SQL injection attempt detected', { 
      input: str.substring(0, 100) 
    });
    // Remove SQL comments
    cleaned = cleaned.replace(/--.*$/gm, '');
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
  }
  
  return cleaned;
}

/**
 * Sanitize a filename to prevent directory traversal
 */
export function sanitizeFilename(filename: string): string {
  if (typeof filename !== 'string') return '';
  
  // Remove any directory traversal patterns
  let cleaned = filename.replace(/\.\./g, '');
  cleaned = cleaned.replace(/[\/\\]/g, '');
  
  // Remove null bytes
  cleaned = cleaned.replace(/\0/g, '');
  
  // Remove special characters that might cause issues
  cleaned = cleaned.replace(/[<>:"|?*]/g, '');
  
  // Limit length
  if (cleaned.length > 255) {
    const ext = cleaned.split('.').pop();
    const name = cleaned.substring(0, 250 - (ext?.length || 0) - 1);
    cleaned = ext ? `${name}.${ext}` : name;
  }
  
  return cleaned || 'unnamed';
}

/**
 * Sanitize a URL to prevent javascript: and data: protocols
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') return '';
  
  const trimmed = url.trim().toLowerCase();
  
  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  for (const protocol of dangerousProtocols) {
    if (trimmed.startsWith(protocol)) {
      log.warn('Dangerous URL protocol blocked', { url: url.substring(0, 50) });
      return '';
    }
  }
  
  // Ensure URL starts with http:// or https:// or is relative
  if (!trimmed.startsWith('http://') && 
      !trimmed.startsWith('https://') && 
      !trimmed.startsWith('/') &&
      !trimmed.startsWith('#')) {
    return `https://${url}`;
  }
  
  return url;
}

/**
 * Sanitize JSON data to remove potentially dangerous content
 */
export function sanitizeJson<T = any>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (typeof data === 'string') {
    return escapeHtml(data) as T;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeJson(item)) as T;
  }
  
  if (typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      // Sanitize the key as well
      const sanitizedKey = escapeHtml(key);
      sanitized[sanitizedKey] = sanitizeJson(value);
    }
    return sanitized as T;
  }
  
  return data;
}

/**
 * Validate and sanitize email addresses
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') return '';
  
  // Basic email validation regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  const trimmed = email.trim().toLowerCase();
  
  if (!emailRegex.test(trimmed)) {
    return '';
  }
  
  // Additional checks for common injection attempts
  if (trimmed.includes('--') || 
      trimmed.includes('/*') || 
      trimmed.includes('*/') ||
      trimmed.includes('<') ||
      trimmed.includes('>')) {
    return '';
  }
  
  return trimmed;
}

/**
 * Sanitize phone numbers
 */
export function sanitizePhone(phone: string): string {
  if (typeof phone !== 'string') return '';
  
  // Remove all non-numeric characters except + for international
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Validate length (international phone numbers can be up to 15 digits)
  if (cleaned.length > 16 || cleaned.length < 10) {
    return '';
  }
  
  return cleaned;
}

/**
 * Truncate a string to a maximum length
 */
export function truncate(str: string, maxLength: number, suffix = '...'): string {
  if (typeof str !== 'string') return '';
  if (str.length <= maxLength) return str;
  
  return str.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Sanitize an entire object recursively
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  options: {
    stripHtml?: boolean;
    escapeHtml?: boolean;
    maxStringLength?: number;
    allowedKeys?: string[];
  } = {}
): T {
  const {
    stripHtml: strip = false,
    escapeHtml: escape = true,
    maxStringLength = 10000,
    allowedKeys,
  } = options;
  
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Skip keys that aren't in the allowed list
    if (allowedKeys && !allowedKeys.includes(key)) {
      continue;
    }
    
    // Sanitize the key
    const sanitizedKey = escapeHtml(key);
    
    // Sanitize the value based on type
    if (value === null || value === undefined) {
      sanitized[sanitizedKey] = value;
    } else if (typeof value === 'string') {
      let cleanValue = value;
      
      if (strip) {
        cleanValue = stripHtml(cleanValue);
      } else if (escape) {
        cleanValue = escapeHtml(cleanValue);
      }
      
      if (maxStringLength && cleanValue.length > maxStringLength) {
        cleanValue = truncate(cleanValue, maxStringLength);
      }
      
      sanitized[sanitizedKey] = cleanValue;
    } else if (Array.isArray(value)) {
      sanitized[sanitizedKey] = value.map(item => 
        typeof item === 'object' && item !== null
          ? sanitizeObject(item, options)
          : item
      );
    } else if (typeof value === 'object') {
      sanitized[sanitizedKey] = sanitizeObject(value, options);
    } else {
      sanitized[sanitizedKey] = value;
    }
  }
  
  return sanitized as T;
}

/**
 * Create a content security policy nonce
 */
export function generateCSPNonce(): string {
  const array = new Uint8Array(16);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    // Server-side
    const crypto = require('crypto');
    crypto.randomFillSync(array);
  }
  return Buffer.from(array).toString('base64');
}