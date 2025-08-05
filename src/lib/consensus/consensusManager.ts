import { ByzantineConsensusCoordinator, ConsensusNode } from './byzantineConsensus';
import { EventEmitter } from 'events';

export interface ConsensusConfig {
  nodeId: string;
  networkNodes: ConsensusNode[];
  faultTolerance: number;
  timeoutMs: number;
  enableHealthMonitoring: boolean;
}

export interface ConsensusRequest {
  id: string;
  type: 'wedding-update' | 'vendor-booking' | 'guest-rsvp' | 'payment-confirm';
  data: any;
  priority: 'high' | 'medium' | 'low';
  requesterNodeId: string;
  timestamp: number;
}

export class ConsensusManager extends EventEmitter {
  private byzantine: ByzantineConsensusCoordinator;
  private pendingRequests: Map<string, ConsensusRequest> = new Map();
  private completedRequests: Set<string> = new Set();
  private config: ConsensusConfig;

  constructor(config: ConsensusConfig) {
    super();
    this.config = config;
    
    // Initialize Byzantine consensus
    this.byzantine = new ByzantineConsensusCoordinator(
      config.nodeId,
      config.networkNodes
    );

    this.setupEventHandlers();
    
    if (config.enableHealthMonitoring) {
      this.byzantine.startHealthMonitoring();
    }

    console.log(`🌐 Consensus Manager initialized for node ${config.nodeId}`);
  }

  private setupEventHandlers(): void {
    // Handle consensus reached
    this.byzantine.on('consensus-reached', async (data) => {
      const request = this.pendingRequests.get(data.sequence.toString());
      if (request) {
        await this.executeConsensusDecision(request, data);
        this.pendingRequests.delete(data.sequence.toString());
        this.completedRequests.add(request.id);
      }
    });

    // Handle node suspicion
    this.byzantine.on('node-suspected', (nodeId) => {
      console.warn(`⚠️ Node ${nodeId} suspected of Byzantine behavior`);
      this.emit('node-fault-detected', { nodeId, type: 'suspected' });
    });

    // Handle broadcast messages
    this.byzantine.on('broadcast-message', (message) => {
      // In production, send to actual network
      this.emit('network-message', message);
    });
  }

  /**
   * Submit a request for consensus
   */
  async submitRequest(request: ConsensusRequest): Promise<boolean> {
    console.log(`📤 Submitting consensus request: ${request.type} (${request.id})`);
    
    // Store pending request
    this.pendingRequests.set(request.id, request);
    
    try {
      // Initiate Byzantine consensus
      const success = await this.byzantine.initiateConsensus({
        requestId: request.id,
        type: request.type,
        data: request.data,
        priority: request.priority,
        timestamp: request.timestamp
      });

      if (success) {
        console.log(`✅ Consensus reached for request ${request.id}`);
        return true;
      } else {
        console.warn(`❌ Consensus failed for request ${request.id}`);
        this.pendingRequests.delete(request.id);
        return false;
      }
    } catch (error) {
      console.error(`🚨 Consensus error for request ${request.id}:`, error);
      this.pendingRequests.delete(request.id);
      return false;
    }
  }

  /**
   * Execute the decided consensus action
   */
  private async executeConsensusDecision(
    request: ConsensusRequest, 
    consensusData: any
  ): Promise<void> {
    console.log(`🎯 Executing consensus decision for ${request.type}`);
    
    try {
      switch (request.type) {
        case 'wedding-update':
          await this.handleWeddingUpdate(request.data);
          break;
        case 'vendor-booking':
          await this.handleVendorBooking(request.data);
          break;
        case 'guest-rsvp':
          await this.handleGuestRSVP(request.data);
          break;
        case 'payment-confirm':
          await this.handlePaymentConfirmation(request.data);
          break;
        default:
          console.warn(`Unknown request type: ${request.type}`);
      }

      // Notify completion
      this.emit('request-executed', {
        requestId: request.id,
        type: request.type,
        success: true,
        timestamp: Date.now()
      });
      
      // Store decision in hooks
      await this.notifyConsensusDecision(request, consensusData);
      
    } catch (error) {
      console.error(`🚨 Failed to execute consensus decision:`, error);
      this.emit('request-executed', {
        requestId: request.id,
        type: request.type,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      });
    }
  }

  /**
   * Handle wedding update consensus
   */
  private async handleWeddingUpdate(data: any): Promise<void> {
    console.log('💍 Processing wedding update consensus:', data);
    // Implementation for wedding updates
    // This could involve updating the database, notifying users, etc.
  }

  /**
   * Handle vendor booking consensus
   */
  private async handleVendorBooking(data: any): Promise<void> {
    console.log('🏢 Processing vendor booking consensus:', data);
    // Implementation for vendor bookings
    // This could involve confirming bookings, processing payments, etc.
  }

  /**
   * Handle guest RSVP consensus
   */
  private async handleGuestRSVP(data: any): Promise<void> {
    console.log('👥 Processing guest RSVP consensus:', data);
    // Implementation for RSVP handling
    // This could involve updating guest lists, meal preferences, etc.
  }

  /**
   * Handle payment confirmation consensus
   */
  private async handlePaymentConfirmation(data: any): Promise<void> {
    console.log('💳 Processing payment confirmation consensus:', data);
    // Implementation for payment confirmations
    // This could involve updating payment status, sending receipts, etc.
  }

  /**
   * Process incoming network message
   */
  async processNetworkMessage(message: any): Promise<void> {
    try {
      await this.byzantine.processMessage(message);
    } catch (error) {
      console.error('🚨 Failed to process network message:', error);
    }
  }

  /**
   * Get current consensus status
   */
  getStatus() {
    const byzantineStatus = this.byzantine.getConsensusStatus();
    return {
      ...byzantineStatus,
      pendingRequests: this.pendingRequests.size,
      completedRequests: this.completedRequests.size,
      nodeId: this.config.nodeId,
      faultTolerance: `${byzantineStatus.faultTolerance}/${byzantineStatus.nodeCount}`,
      healthMonitoring: this.config.enableHealthMonitoring
    };
  }

  /**
   * Get metrics for monitoring
   */
  getMetrics() {
    const status = this.getStatus();
    return {
      consensusView: status.view,
      consensusSequence: status.sequence,
      consensusPhase: status.phase,
      activeNodes: status.activeNodes,
      faultTolerance: status.faultTolerance,
      pendingRequests: status.pendingRequests,
      completedRequests: status.completedRequests,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: Date.now()
    };
  }

  /**
   * Notify hooks of consensus decision
   */
  private async notifyConsensusDecision(
    request: ConsensusRequest, 
    consensusData: any
  ): Promise<void> {
    try {
      const { execSync } = require('child_process');
      const message = `Consensus reached for ${request.type}: ${request.id}`;
      execSync(
        `npx claude-flow@alpha hooks notify --message "${message}" --telemetry true`,
        { stdio: 'inherit', cwd: process.cwd() }
      );
    } catch (error) {
      console.warn('Failed to notify hooks:', error);
    }
  }

  /**
   * Shutdown consensus manager
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down consensus manager...');
    
    // Complete any pending operations
    if (this.pendingRequests.size > 0) {
      console.log(`⏳ Waiting for ${this.pendingRequests.size} pending requests...`);
      // Give pending requests time to complete
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    this.removeAllListeners();
    console.log('✅ Consensus manager shutdown complete');
  }
}

// Factory function for creating consensus manager
export function createConsensusManager(config: Partial<ConsensusConfig>): ConsensusManager {
  const defaultConfig: ConsensusConfig = {
    nodeId: process.env.NODE_ID || `node-${Date.now()}`,
    networkNodes: [],
    faultTolerance: 1,
    timeoutMs: 30000,
    enableHealthMonitoring: true
  };

  return new ConsensusManager({ ...defaultConfig, ...config });
}
