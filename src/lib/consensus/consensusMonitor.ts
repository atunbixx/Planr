import { EventEmitter } from 'events';
import { ConsensusManager } from './consensusManager';

export interface ConsensusMetrics {
  timestamp: number;
  view: number;
  sequence: number;
  phase: string;
  activeNodes: number;
  faultTolerance: string;
  throughput: number; // requests per second
  latency: number; // average consensus time in ms
  successRate: number; // percentage of successful consensus
  nodeHealth: Record<string, NodeHealth>;
}

export interface NodeHealth {
  nodeId: string;
  status: 'healthy' | 'degraded' | 'suspected' | 'failed';
  responseTime: number;
  messageCount: number;
  lastSeen: number;
  reputation: number;
  consensusParticipation: number; // percentage
}

export interface ConsensusAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'node-failure' | 'consensus-timeout' | 'byzantine-behavior' | 'network-partition';
  message: string;
  nodeId?: string;
  timestamp: number;
  resolved: boolean;
}

export class ConsensusMonitor extends EventEmitter {
  private manager: ConsensusManager;
  private metrics: ConsensusMetrics[] = [];
  private alerts: ConsensusAlert[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly maxMetricsHistory = 1000;
  private readonly alertThresholds = {
    latencyWarning: 5000, // 5 seconds
    latencyCritical: 15000, // 15 seconds
    successRateWarning: 0.9, // 90%
    successRateCritical: 0.8, // 80%
    nodeResponseWarning: 10000, // 10 seconds
    nodeResponseCritical: 30000 // 30 seconds
  };

  // Metrics tracking
  private requestStartTimes: Map<string, number> = new Map();
  private completedRequests = 0;
  private failedRequests = 0;
  private totalLatency = 0;

  constructor(manager: ConsensusManager) {
    super();
    this.manager = manager;
    this.setupEventHandlers();
    this.startMonitoring();
    
    console.log('📊 Consensus Monitor initialized');
  }

  private setupEventHandlers(): void {
    // Track request lifecycle
    this.manager.on('request-submitted', (data) => {
      this.requestStartTimes.set(data.requestId, Date.now());
    });

    this.manager.on('request-executed', (data) => {
      const startTime = this.requestStartTimes.get(data.requestId);
      if (startTime) {
        const latency = Date.now() - startTime;
        this.totalLatency += latency;
        this.requestStartTimes.delete(data.requestId);
        
        if (data.success) {
          this.completedRequests++;
        } else {
          this.failedRequests++;
          this.createAlert({
            severity: 'medium',
            type: 'consensus-timeout',
            message: `Request ${data.requestId} failed: ${data.error}`,
            timestamp: Date.now()
          });
        }

        // Check latency thresholds
        if (latency > this.alertThresholds.latencyCritical) {
          this.createAlert({
            severity: 'critical',
            type: 'consensus-timeout',
            message: `Critical consensus latency: ${latency}ms for request ${data.requestId}`,
            timestamp: Date.now()
          });
        } else if (latency > this.alertThresholds.latencyWarning) {
          this.createAlert({
            severity: 'medium',
            type: 'consensus-timeout',
            message: `High consensus latency: ${latency}ms for request ${data.requestId}`,
            timestamp: Date.now()
          });
        }
      }
    });

    // Track node faults
    this.manager.on('node-fault-detected', (data) => {
      this.createAlert({
        severity: 'high',
        type: 'byzantine-behavior',
        message: `Node ${data.nodeId} showing Byzantine behavior`,
        nodeId: data.nodeId,
        timestamp: Date.now()
      });
    });
  }

  /**
   * Start monitoring consensus health
   */
  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.analyzeHealth();
    }, 5000); // Collect metrics every 5 seconds
  }

  /**
   * Collect current consensus metrics
   */
  private collectMetrics(): void {
    const status = this.manager.getStatus();
    const totalRequests = this.completedRequests + this.failedRequests;
    const successRate = totalRequests > 0 ? this.completedRequests / totalRequests : 1;
    const avgLatency = this.completedRequests > 0 ? this.totalLatency / this.completedRequests : 0;
    
    // Calculate throughput (requests per second over last 5 seconds)
    const now = Date.now();
    const recentMetrics = this.metrics.filter(m => now - m.timestamp < 5000);
    const throughput = recentMetrics.length > 0 ? 
      (this.completedRequests - (recentMetrics[0]?.timestamp || 0)) / 5 : 0;

    const metrics: ConsensusMetrics = {
      timestamp: now,
      view: status.view,
      sequence: status.sequence,
      phase: status.phase,
      activeNodes: status.activeNodes,
      faultTolerance: status.faultTolerance,
      throughput,
      latency: avgLatency,
      successRate,
      nodeHealth: this.getNodeHealth()
    };

    this.metrics.push(metrics);
    
    // Maintain metrics history limit
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }

    this.emit('metrics-updated', metrics);
  }

  /**
   * Get health status for all nodes
   */
  private getNodeHealth(): Record<string, NodeHealth> {
    const nodeHealth: Record<string, NodeHealth> = {};
    const now = Date.now();
    
    // In a real implementation, this would get actual node data
    // For now, we'll simulate node health based on the manager status
    const status = this.manager.getStatus();
    
    for (let i = 0; i < status.activeNodes; i++) {
      const nodeId = `node-${i}`;
      const responseTime = Math.random() * 1000; // Simulated response time
      const lastSeen = now - Math.random() * 10000; // Last seen within 10 seconds
      
      let nodeStatus: NodeHealth['status'] = 'healthy';
      if (now - lastSeen > this.alertThresholds.nodeResponseCritical) {
        nodeStatus = 'failed';
      } else if (now - lastSeen > this.alertThresholds.nodeResponseWarning) {
        nodeStatus = 'degraded';
      }

      nodeHealth[nodeId] = {
        nodeId,
        status: nodeStatus,
        responseTime,
        messageCount: Math.floor(Math.random() * 100),
        lastSeen,
        reputation: Math.floor(Math.random() * 10) + 1,
        consensusParticipation: Math.random() * 0.3 + 0.7 // 70-100%
      };
    }

    return nodeHealth;
  }

  /**
   * Analyze overall consensus health and generate alerts
   */
  private analyzeHealth(): void {
    if (this.metrics.length === 0) return;

    const latest = this.metrics[this.metrics.length - 1];
    
    // Check success rate
    if (latest.successRate < this.alertThresholds.successRateCritical) {
      this.createAlert({
        severity: 'critical',
        type: 'consensus-timeout',
        message: `Critical consensus success rate: ${(latest.successRate * 100).toFixed(1)}%`,
        timestamp: Date.now()
      });
    } else if (latest.successRate < this.alertThresholds.successRateWarning) {
      this.createAlert({
        severity: 'medium',
        type: 'consensus-timeout',
        message: `Low consensus success rate: ${(latest.successRate * 100).toFixed(1)}%`,
        timestamp: Date.now()
      });
    }

    // Check node health
    Object.values(latest.nodeHealth).forEach(node => {
      if (node.status === 'failed') {
        this.createAlert({
          severity: 'high',
          type: 'node-failure',
          message: `Node ${node.nodeId} has failed`,
          nodeId: node.nodeId,
          timestamp: Date.now()
        });
      } else if (node.status === 'degraded') {
        this.createAlert({
          severity: 'medium',
          type: 'node-failure',
          message: `Node ${node.nodeId} is degraded (response time: ${node.responseTime}ms)`,
          nodeId: node.nodeId,
          timestamp: Date.now()
        });
      }
    });

    // Check for potential network partition
    const healthyNodes = Object.values(latest.nodeHealth)
      .filter(node => node.status === 'healthy').length;
    const totalNodes = Object.keys(latest.nodeHealth).length;
    
    if (healthyNodes < totalNodes * 0.6) { // Less than 60% healthy
      this.createAlert({
        severity: 'critical',
        type: 'network-partition',
        message: `Potential network partition: only ${healthyNodes}/${totalNodes} nodes healthy`,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Create a new alert
   */
  private createAlert(alertData: Omit<ConsensusAlert, 'id' | 'resolved'>): void {
    // Check for duplicate alerts
    const existingAlert = this.alerts.find(alert => 
      !alert.resolved && 
      alert.type === alertData.type && 
      alert.nodeId === alertData.nodeId &&
      Date.now() - alert.timestamp < 60000 // Within last minute
    );

    if (existingAlert) return; // Don't create duplicate alerts

    const alert: ConsensusAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...alertData,
      resolved: false
    };

    this.alerts.push(alert);
    this.emit('alert-created', alert);
    
    console.warn(`⚠️ [${alert.severity.toUpperCase()}] ${alert.message}`);
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      this.emit('alert-resolved', alert);
      console.log(`✅ Alert resolved: ${alert.message}`);
      return true;
    }
    return false;
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics(): ConsensusMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(limit?: number): ConsensusMetrics[] {
    return limit ? this.metrics.slice(-limit) : [...this.metrics];
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): ConsensusAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): ConsensusAlert[] {
    return [...this.alerts];
  }

  /**
   * Get consensus health summary
   */
  getHealthSummary() {
    const current = this.getCurrentMetrics();
    if (!current) {
      return {
        status: 'unknown',
        activeNodes: 0,
        successRate: 0,
        avgLatency: 0,
        activeAlerts: 0
      };
    }

    const activeAlerts = this.getActiveAlerts();
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');
    
    let status = 'healthy';
    if (criticalAlerts.length > 0) {
      status = 'critical';
    } else if (activeAlerts.length > 0) {
      status = 'warning';
    } else if (current.successRate < 0.95) {
      status = 'degraded';
    }

    return {
      status,
      activeNodes: current.activeNodes,
      successRate: current.successRate,
      avgLatency: current.latency,
      activeAlerts: activeAlerts.length,
      view: current.view,
      sequence: current.sequence,
      throughput: current.throughput
    };
  }

  /**
   * Generate monitoring report
   */
  generateReport(): string {
    const summary = this.getHealthSummary();
    const current = this.getCurrentMetrics();
    const activeAlerts = this.getActiveAlerts();

    let report = `
=== BYZANTINE CONSENSUS MONITORING REPORT ===
`;
    report += `Generated: ${new Date().toISOString()}\n\n`;
    
    report += `OVERALL STATUS: ${summary.status.toUpperCase()}\n`;
    report += `Active Nodes: ${summary.activeNodes}\n`;
    report += `Success Rate: ${(summary.successRate * 100).toFixed(1)}%\n`;
    report += `Average Latency: ${summary.avgLatency.toFixed(0)}ms\n`;
    report += `Throughput: ${(summary.throughput || 0).toFixed(2)} req/sec\n`;
    report += `Current View: ${summary.view}\n`;
    report += `Current Sequence: ${summary.sequence}\n\n`;

    if (activeAlerts.length > 0) {
      report += `ACTIVE ALERTS (${activeAlerts.length}):\n`;
      activeAlerts.forEach(alert => {
        report += `- [${alert.severity.toUpperCase()}] ${alert.message}\n`;
      });
    } else {
      report += `No active alerts.\n`;
    }

    if (current) {
      report += `\nNODE HEALTH:\n`;
      Object.values(current.nodeHealth).forEach(node => {
        report += `- ${node.nodeId}: ${node.status} (${node.responseTime.toFixed(0)}ms, ${(node.consensusParticipation * 100).toFixed(1)}% participation)\n`;
      });
    }

    return report;
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.removeAllListeners();
    console.log('🛑 Consensus monitoring stopped');
  }
}

// Export function to create monitor
export function createConsensusMonitor(manager: ConsensusManager): ConsensusMonitor {
  return new ConsensusMonitor(manager);
}
