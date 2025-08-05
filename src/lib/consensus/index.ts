/**
 * Byzantine Consensus System for Wedding Planner v2
 * 
 * This module provides a complete Byzantine fault-tolerant consensus system
 * that ensures system reliability and data consistency even when some nodes
 * may fail or behave maliciously.
 * 
 * Key Features:
 * - Practical Byzantine Fault Tolerance (pBFT) algorithm
 * - Cryptographic message signing and verification
 * - Automatic fault detection and recovery
 * - Real-time monitoring and alerting
 * - Support for wedding-specific consensus operations
 * 
 * Usage:
 * ```typescript
 * import { createByzantineConsensusSystem } from './lib/consensus';
 * 
 * const consensus = createByzantineConsensusSystem({
 *   nodeId: 'wedding-coordinator-1',
 *   networkNodes: [...],
 *   enableMonitoring: true
 * });
 * 
 * // Submit a consensus request
 * await consensus.submitRequest({
 *   id: 'wedding-001',
 *   type: 'wedding-update',
 *   data: { venue: 'Grand Ballroom', date: '2024-06-15' },
 *   priority: 'high'
 * });
 * ```
 */

export {
  ByzantineConsensusCoordinator,
  type ConsensusNode,
  type ConsensusMessage,
  type ConsensusState
} from './byzantineConsensus';

export {
  ConsensusManager,
  createConsensusManager,
  type ConsensusConfig,
  type ConsensusRequest
} from './consensusManager';

export {
  ConsensusMonitor,
  createConsensusMonitor,
  type ConsensusMetrics,
  type NodeHealth,
  type ConsensusAlert
} from './consensusMonitor';

// Main system factory
export interface ByzantineConsensusSystemConfig {
  nodeId: string;
  networkNodes: any[];
  faultTolerance?: number;
  timeoutMs?: number;
  enableHealthMonitoring?: boolean;
  enableMonitoring?: boolean;
}

import { ConsensusManager } from './consensusManager'
import { ConsensusMonitor } from './consensusMonitor'

export interface ByzantineConsensusSystem {
  manager: ConsensusManager;
  monitor?: ConsensusMonitor;
  submitRequest: (request: any) => Promise<boolean>;
  getStatus: () => any;
  getHealthSummary: () => any;
  generateReport: () => string;
  shutdown: () => Promise<void>;
}

/**
 * Create a complete Byzantine consensus system
 */
export function createByzantineConsensusSystem(
  config: ByzantineConsensusSystemConfig
): ByzantineConsensusSystem {
  console.log('🛡️ Initializing Byzantine Consensus System...');
  
  // Create consensus manager
  const manager = new ConsensusManager({
    nodeId: config.nodeId,
    networkNodes: config.networkNodes,
    faultTolerance: config.faultTolerance || 1,
    timeoutMs: config.timeoutMs || 30000,
    enableHealthMonitoring: config.enableHealthMonitoring ?? true
  });

  // Create monitor if enabled
  let monitor: ConsensusMonitor | undefined;
  if (config.enableMonitoring ?? true) {
    monitor = new ConsensusMonitor(manager);
    
    // Set up monitoring alerts
    monitor.on('alert-created', (alert) => {
      console.warn(`🚨 CONSENSUS ALERT [${alert.severity}]: ${alert.message}`);
    });
    
    monitor.on('metrics-updated', (metrics) => {
      if (metrics.successRate < 0.9) {
        console.warn(`⚠️ Low consensus success rate: ${(metrics.successRate * 100).toFixed(1)}%`);
      }
    });
  }

  // Enhanced request submission with monitoring
  const submitRequest = async (request: any) => {
    const startTime = Date.now();
    
    try {
      const result = await manager.submitRequest({
        id: request.id || `req-${Date.now()}`,
        type: request.type,
        data: request.data,
        priority: request.priority || 'medium',
        requesterNodeId: config.nodeId,
        timestamp: startTime,
        ...request
      });
      
      const duration = Date.now() - startTime;
      console.log(`✅ Consensus request ${request.id} completed in ${duration}ms`);
      
      return result;
    } catch (error) {
      console.error(`❌ Consensus request ${request.id} failed:`, error);
      return false;
    }
  };

  // Enhanced status with monitoring data
  const getStatus = () => {
    const managerStatus = manager.getStatus();
    const healthSummary = monitor?.getHealthSummary();
    
    return {
      ...managerStatus,
      health: healthSummary,
      monitoring: {
        enabled: !!monitor,
        activeAlerts: monitor?.getActiveAlerts().length || 0,
        currentMetrics: monitor?.getCurrentMetrics()
      }
    };
  };

  // Health summary
  const getHealthSummary = () => {
    return monitor?.getHealthSummary() || {
      status: 'unknown',
      message: 'Monitoring not enabled'
    };
  };

  // Generate comprehensive report
  const generateReport = () => {
    let report = `
=== BYZANTINE CONSENSUS SYSTEM REPORT ===\n`;
    report += `Node ID: ${config.nodeId}\n`;
    report += `Generated: ${new Date().toISOString()}\n\n`;
    
    // Manager status
    const status = manager.getStatus();
    report += `CONSENSUS STATUS:\n`;
    report += `- View: ${status.view}\n`;
    report += `- Sequence: ${status.sequence}\n`;
    report += `- Phase: ${status.phase}\n`;
    report += `- Active Nodes: ${status.activeNodes}\n`;
    report += `- Fault Tolerance: ${status.faultTolerance}\n`;
    report += `- Pending Requests: ${status.pendingRequests}\n`;
    report += `- Completed Requests: ${status.completedRequests}\n\n`;
    
    // Monitoring report
    if (monitor) {
      report += monitor.generateReport();
    } else {
      report += `MONITORING: Disabled\n`;
    }
    
    return report;
  };

  // Enhanced shutdown
  const shutdown = async () => {
    console.log('🛑 Shutting down Byzantine Consensus System...');
    
    // Stop monitoring first
    if (monitor) {
      monitor.stopMonitoring();
    }
    
    // Shutdown manager
    await manager.shutdown();
    
    console.log('✅ Byzantine Consensus System shutdown complete');
  };

  const system: ByzantineConsensusSystem = {
    manager,
    monitor,
    submitRequest,
    getStatus,
    getHealthSummary,
    generateReport,
    shutdown
  };

  console.log('✅ Byzantine Consensus System initialized successfully');
  console.log(`📊 Monitoring: ${config.enableMonitoring ? 'Enabled' : 'Disabled'}`);
  console.log(`🔍 Health Monitoring: ${config.enableHealthMonitoring ? 'Enabled' : 'Disabled'}`);
  
  return system;
}

/**
 * Utility function to create a basic wedding consensus configuration
 */
export function createWeddingConsensusConfig(
  nodeId: string,
  networkNodes: any[] = []
): ByzantineConsensusSystemConfig {
  return {
    nodeId,
    networkNodes,
    faultTolerance: Math.max(1, Math.floor((networkNodes.length - 1) / 3)),
    timeoutMs: 30000,
    enableHealthMonitoring: true,
    enableMonitoring: true
  };
}

/**
 * Wedding-specific consensus request builders
 */
export const WeddingConsensusRequests = {
  weddingUpdate: (data: any) => ({
    type: 'wedding-update' as const,
    data,
    priority: 'high' as const
  }),
  
  vendorBooking: (data: any) => ({
    type: 'vendor-booking' as const,
    data,
    priority: 'medium' as const
  }),
  
  guestRSVP: (data: any) => ({
    type: 'guest-rsvp' as const,
    data,
    priority: 'low' as const
  }),
  
  paymentConfirmation: (data: any) => ({
    type: 'payment-confirm' as const,
    data,
    priority: 'high' as const
  })
};

// Version information
export const BYZANTINE_CONSENSUS_VERSION = '1.0.0';
export const SUPPORTED_CONSENSUS_TYPES = [
  'wedding-update',
  'vendor-booking', 
  'guest-rsvp',
  'payment-confirm'
] as const;
