/**
 * Session Lock Manager
 * Provides thread-safe session management to prevent race conditions
 */

interface LockEntry {
  promise: Promise<void>;
  resolve: () => void;
  timestamp: number;
  userId?: string;
}

class SessionLockManager {
  private locks: Map<string, LockEntry> = new Map();
  private readonly LOCK_TIMEOUT = 5000; // 5 seconds
  private readonly CLEANUP_INTERVAL = 60000; // 1 minute

  constructor() {
    // Periodically clean up stale locks
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanupStaleLocks(), this.CLEANUP_INTERVAL);
    }
  }

  /**
   * Acquire a lock for a specific key
   * @param key - The key to lock (e.g., session ID, user ID)
   * @param userId - Optional user ID for tracking
   * @returns Promise that resolves when lock is acquired
   */
  async acquire(key: string, userId?: string): Promise<() => void> {
    // Wait for any existing lock to be released
    while (this.locks.has(key)) {
      const existingLock = this.locks.get(key);
      if (existingLock) {
        // Check if lock is stale
        if (Date.now() - existingLock.timestamp > this.LOCK_TIMEOUT) {
          // Force release stale lock
          this.release(key);
          break;
        }
        // Wait for existing lock to be released
        await existingLock.promise;
      }
    }

    // Create new lock
    let resolve: () => void;
    const promise = new Promise<void>((res) => {
      resolve = res;
    });

    const lockEntry: LockEntry = {
      promise,
      resolve: resolve!,
      timestamp: Date.now(),
      userId
    };

    this.locks.set(key, lockEntry);

    // Return release function
    return () => this.release(key);
  }

  /**
   * Release a lock for a specific key
   * @param key - The key to unlock
   */
  private release(key: string): void {
    const lock = this.locks.get(key);
    if (lock) {
      lock.resolve();
      this.locks.delete(key);
    }
  }

  /**
   * Clean up stale locks that have exceeded timeout
   */
  private cleanupStaleLocks(): void {
    const now = Date.now();
    for (const [key, lock] of this.locks.entries()) {
      if (now - lock.timestamp > this.LOCK_TIMEOUT) {
        this.release(key);
      }
    }
  }

  /**
   * Clear all locks (use with caution)
   */
  clearAll(): void {
    for (const [key] of this.locks.entries()) {
      this.release(key);
    }
  }

  /**
   * Clear locks for a specific user
   * @param userId - The user ID whose locks should be cleared
   */
  clearUserLocks(userId: string): void {
    for (const [key, lock] of this.locks.entries()) {
      if (lock.userId === userId) {
        this.release(key);
      }
    }
  }

  /**
   * Get current lock count (for monitoring)
   */
  getLockCount(): number {
    return this.locks.size;
  }

  /**
   * Check if a key is currently locked
   */
  isLocked(key: string): boolean {
    return this.locks.has(key);
  }
}

// Export singleton instance
export const sessionLockManager = new SessionLockManager();

// Helper function for using locks with async operations
export async function withSessionLock<T>(
  key: string,
  operation: () => Promise<T>,
  userId?: string
): Promise<T> {
  const release = await sessionLockManager.acquire(key, userId);
  try {
    return await operation();
  } finally {
    release();
  }
}