/**
 * Optimized Prisma Client with Connection Pooling
 * Provides efficient database connection management
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/utils/logger';

const log = logger.child({ module: 'prisma' });

// Global variable to store the Prisma instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Connection pool configuration based on environment
 */
const getConnectionPoolConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    return {
      // Production configuration - optimized for performance
      connection_limit: 10, // Maximum number of connections in the pool
      pool_timeout: 10, // Seconds to wait for a connection from the pool
      statement_timeout: 30, // Seconds before canceling a query
      idle_in_transaction_session_timeout: 10, // Seconds before canceling idle transactions
    };
  } else if (isDevelopment) {
    return {
      // Development configuration - balanced for debugging
      connection_limit: 5,
      pool_timeout: 10,
      statement_timeout: 60,
      idle_in_transaction_session_timeout: 60,
    };
  } else {
    return {
      // Test configuration - minimal resources
      connection_limit: 2,
      pool_timeout: 5,
      statement_timeout: 10,
      idle_in_transaction_session_timeout: 5,
    };
  }
};

/**
 * Build database URL with connection pool parameters
 */
const buildDatabaseUrl = (): string => {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  const config = getConnectionPoolConfig();
  const url = new URL(baseUrl);
  
  // Add connection pool parameters to the URL
  Object.entries(config).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });
  
  // Add additional parameters for better performance
  url.searchParams.set('schema', 'public');
  url.searchParams.set('pgbouncer', 'true'); // Enable PgBouncer if available
  url.searchParams.set('connect_timeout', '30');
  
  return url.toString();
};

/**
 * Create Prisma client with optimized configuration
 */
const createPrismaClient = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Log configuration
  const logConfig = isProduction
    ? ['error', 'warn'] // Only log errors and warnings in production
    : isDevelopment
    ? ['error', 'warn', 'info'] // More verbose in development
    : ['error']; // Minimal logging in test
  
  const prismaClient = new PrismaClient({
    log: logConfig.map(level => ({
      level: level as any,
      emit: 'event',
    })),
    datasources: {
      db: {
        url: buildDatabaseUrl(),
      },
    },
  });
  
  // Set up event listeners for logging
  if (isDevelopment) {
    prismaClient.$on('query' as any, (e: any) => {
      log.debug('Database query', {
        query: e.query,
        params: e.params,
        duration: e.duration,
      });
    });
  }
  
  prismaClient.$on('error' as any, (e: any) => {
    log.error('Database error', e);
  });
  
  prismaClient.$on('warn' as any, (e: any) => {
    log.warn('Database warning', e);
  });
  
  prismaClient.$on('info' as any, (e: any) => {
    log.info('Database info', { message: e.message });
  });
  
  return prismaClient;
};

/**
 * Middleware to add query timing and monitoring
 */
const addMonitoringMiddleware = (client: PrismaClient) => {
  client.$use(async (params, next) => {
    const startTime = Date.now();
    
    try {
      const result = await next(params);
      const duration = Date.now() - startTime;
      
      // Log slow queries
      if (duration > 1000) {
        log.warn('Slow database query detected', {
          model: params.model,
          action: params.action,
          duration,
        });
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      log.error('Database query failed', error, {
        model: params.model,
        action: params.action,
        duration,
      });
      
      throw error;
    }
  });
  
  return client;
};

/**
 * Initialize Prisma client with connection pooling
 */
export const prisma = (() => {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }
  
  const client = createPrismaClient();
  const monitoredClient = addMonitoringMiddleware(client);
  
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = monitoredClient;
  }
  
  return monitoredClient;
})();

/**
 * Health check for database connection
 */
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  latency?: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    // Simple query to check connection
    await prisma.$queryRaw`SELECT 1`;
    
    const latency = Date.now() - startTime;
    
    return {
      healthy: true,
      latency,
    };
  } catch (error) {
    log.error('Database health check failed', error);
    
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Gracefully disconnect from the database
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    log.info('Database connection closed');
  } catch (error) {
    log.error('Error disconnecting from database', error);
  }
}

// Handle graceful shutdown
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    await disconnectDatabase();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    await disconnectDatabase();
    process.exit(0);
  });
}

/**
 * Transaction helper with automatic rollback
 */
export async function withTransaction<T>(
  fn: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    try {
      return await fn(tx as PrismaClient);
    } catch (error) {
      log.error('Transaction failed, rolling back', error);
      throw error;
    }
  }, {
    maxWait: 5000, // Maximum time to wait for a transaction slot
    timeout: 10000, // Maximum time for the transaction to complete
  });
}

export default prisma;