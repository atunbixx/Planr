/**
 * Database Connection Management
 */

import { prisma } from '@/lib/prisma'

/**
 * Health check for database connection
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}

/**
 * Graceful database disconnection
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect()
  } catch (error) {
    console.error('Database disconnection error:', error)
  }
}

/**
 * Database connection metrics
 */
export async function getDatabaseMetrics() {
  try {
    const [activeConnections] = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT count(*) as count FROM pg_stat_activity WHERE state = 'active'
    `
    
    return {
      activeConnections: Number(activeConnections.count),
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Failed to get database metrics:', error)
    return {
      activeConnections: -1,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}