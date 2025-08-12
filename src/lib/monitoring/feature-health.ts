/**
 * Feature Health Monitoring System
 * 
 * Monitors the health and performance of newly integrated features
 * to ensure they don't impact existing functionality.
 */

import { safeApiCall, checkApiHealth } from '@/lib/api/safe-fetch';
import { FeatureFlag, isFeatureEnabled } from '@/lib/features/flags';

export interface FeatureHealth {
  feature: FeatureFlag;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastChecked: Date;
  uptime: number; // percentage
  avgResponseTime: number; // milliseconds
  errorRate: number; // percentage
  details?: string;
}

export interface HealthCheckResult {
  success: boolean;
  responseTime: number;
  error?: string;
}

/**
 * Feature health check definitions
 */
export const featureHealthChecks: Record<string, () => Promise<HealthCheckResult>> = {
  SEATING_PLANNER: async () => {
    const start = Date.now();
    const result = await safeApiCall('/api/seating', { 
      method: 'GET',
      timeout: 5000,
      retries: 0,
    });
    
    return {
      success: !result.error,
      responseTime: Date.now() - start,
      error: result.error,
    };
  },
  
  WEDDING_CHECKLIST: async () => {
    const start = Date.now();
    const result = await safeApiCall('/api/checklist', {
      method: 'GET',
      timeout: 5000,
      retries: 0,
    });
    
    return {
      success: !result.error,
      responseTime: Date.now() - start,
      error: result.error,
    };
  },
  
  DAY_OF_TIMELINE: async () => {
    const start = Date.now();
    const result = await safeApiCall('/api/day-of/timeline', {
      method: 'GET',
      timeout: 5000,
      retries: 0,
    });
    
    return {
      success: !result.error,
      responseTime: Date.now() - start,
      error: result.error,
    };
  },
  
  MESSAGING_SYSTEM: async () => {
    const start = Date.now();
    const result = await safeApiCall('/api/messages/templates', {
      method: 'GET',
      timeout: 5000,
      retries: 0,
    });
    
    return {
      success: !result.error,
      responseTime: Date.now() - start,
      error: result.error,
    };
  },
  
  QR_CODE_SYSTEM: async () => {
    const start = Date.now();
    const result = await safeApiCall('/api/qr/generate', {
      method: 'POST',
      body: JSON.stringify({ test: true }),
      timeout: 5000,
      retries: 0,
    });
    
    return {
      success: !result.error,
      responseTime: Date.now() - start,
      error: result.error,
    };
  },
};

/**
 * Feature health monitoring service
 */
export class FeatureHealthMonitor {
  private healthData: Map<FeatureFlag, FeatureHealth> = new Map();
  private checkHistory: Map<FeatureFlag, HealthCheckResult[]> = new Map();
  private maxHistorySize = 100;

  constructor(private checkInterval = 60000) {} // 1 minute default

  /**
   * Start monitoring all enabled features
   */
  startMonitoring() {
    // Initial check
    this.checkAllFeatures();
    
    // Set up interval
    setInterval(() => {
      this.checkAllFeatures();
    }, this.checkInterval);
  }

  /**
   * Check health of all enabled features
   */
  async checkAllFeatures() {
    const enabledFeatures = Object.keys(featureHealthChecks).filter(
      feature => isFeatureEnabled(feature as FeatureFlag)
    ) as FeatureFlag[];

    await Promise.all(enabledFeatures.map(feature => this.checkFeature(feature)));
  }

  /**
   * Check health of a specific feature
   */
  async checkFeature(feature: FeatureFlag): Promise<FeatureHealth> {
    if (!featureHealthChecks[feature]) {
      return this.createHealthRecord(feature, 'unknown', 'No health check defined');
    }

    try {
      const result = await featureHealthChecks[feature]();
      this.recordCheckResult(feature, result);
      
      const health = this.calculateHealth(feature);
      this.healthData.set(feature, health);
      
      return health;
    } catch (error) {
      const errorResult: HealthCheckResult = {
        success: false,
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      
      this.recordCheckResult(feature, errorResult);
      const health = this.createHealthRecord(feature, 'unhealthy', errorResult.error);
      this.healthData.set(feature, health);
      
      return health;
    }
  }

  /**
   * Get current health status for a feature
   */
  getFeatureHealth(feature: FeatureFlag): FeatureHealth | undefined {
    return this.healthData.get(feature);
  }

  /**
   * Get all feature health statuses
   */
  getAllHealth(): FeatureHealth[] {
    return Array.from(this.healthData.values());
  }

  /**
   * Calculate health metrics from history
   */
  private calculateHealth(feature: FeatureFlag): FeatureHealth {
    const history = this.checkHistory.get(feature) || [];
    if (history.length === 0) {
      return this.createHealthRecord(feature, 'unknown', 'No data available');
    }

    const recentChecks = history.slice(-10); // Last 10 checks
    const successCount = recentChecks.filter(check => check.success).length;
    const uptime = Math.round(((successCount / recentChecks.length) * 100) * 100) / 100;
    
    const avgResponseTime = recentChecks
      .filter(check => check.success)
      .reduce((sum, check) => sum + check.responseTime, 0) / successCount || 0;
    
    const errorRate = Math.round((((recentChecks.length - successCount) / recentChecks.length) * 100) * 100) / 100;

    let status: FeatureHealth['status'] = 'healthy';
    if (uptime < 50) {
      status = 'unhealthy';
    } else if (uptime < 90 || avgResponseTime > 2000) {
      status = 'degraded';
    }

    return {
      feature,
      status,
      lastChecked: new Date(),
      uptime,
      avgResponseTime,
      errorRate,
    };
  }

  /**
   * Record a health check result
   */
  private recordCheckResult(feature: FeatureFlag, result: HealthCheckResult) {
    const history = this.checkHistory.get(feature) || [];
    history.push(result);
    
    // Limit history size
    if (history.length > this.maxHistorySize) {
      history.shift();
    }
    
    this.checkHistory.set(feature, history);
  }

  /**
   * Create a health record
   */
  private createHealthRecord(
    feature: FeatureFlag,
    status: FeatureHealth['status'],
    details?: string
  ): FeatureHealth {
    return {
      feature,
      status,
      lastChecked: new Date(),
      uptime: status === 'healthy' ? 100 : 0,
      avgResponseTime: 0,
      errorRate: status === 'healthy' ? 0 : 100,
      details,
    };
  }

  /**
   * Get health summary
   */
  getHealthSummary(): {
    healthy: number;
    degraded: number;
    unhealthy: number;
    unknown: number;
    overallHealth: number;
  } {
    const allHealth = this.getAllHealth();
    const summary = {
      healthy: 0,
      degraded: 0,
      unhealthy: 0,
      unknown: 0,
      overallHealth: 0,
    };

    allHealth.forEach(health => {
      summary[health.status]++;
    });

    const total = allHealth.length;
    if (total > 0) {
      summary.overallHealth = Math.round(((summary.healthy / total) * 100) * 100) / 100;
    }

    return summary;
  }
}

// Singleton instance
export const featureHealthMonitor = new FeatureHealthMonitor();

/**
 * React hook for feature health
 */
export function useFeatureHealth(feature?: FeatureFlag) {
  const [health, setHealth] = React.useState<FeatureHealth[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const checkHealth = async () => {
      setLoading(true);
      
      if (feature) {
        const result = await featureHealthMonitor.checkFeature(feature);
        setHealth([result]);
      } else {
        await featureHealthMonitor.checkAllFeatures();
        setHealth(featureHealthMonitor.getAllHealth());
      }
      
      setLoading(false);
    };

    checkHealth();
    
    // Set up polling
    const interval = setInterval(checkHealth, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [feature]);

  return { health, loading };
}