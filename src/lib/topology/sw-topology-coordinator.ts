/**
 * Service Worker Topology Coordinator
 * 
 * Coordinates topology management within the service worker context,
 * enabling background optimization and agent lifecycle management.
 */

import { 
  AdaptiveTopologyManager, 
  Agent, 
  TopologyConfiguration,
  TopologyType 
} from './adaptive-topology-manager'

declare const self: ServiceWorkerGlobalScope

export interface TopologyCoordinatorConfig {
  enableBackgroundOptimization: boolean
  optimizationInterval: number // in milliseconds
  maxBackgroundAgents: number
  persistenceKey: string
  performanceThresholds: {
    efficiency: number
    resilience: number
    loadBalance: number
  }
}

export class ServiceWorkerTopologyCoordinator {
  private manager: AdaptiveTopologyManager | null = null
  private config: TopologyCoordinatorConfig
  private isInitialized = false
  private optimizationTimer: number | null = null
  private persistenceDB: IDBDatabase | null = null
  
  // Agent registry for background coordination
  private activeAgents = new Map<string, {
    agent: Agent
    lastHeartbeat: number
    status: 'active' | 'idle' | 'failing'
  }>()

  // Message queue for offline coordination
  private messageQueue: Array<{
    id: string
    type: string
    data: any
    timestamp: number
    retryCount: number
  }> = []

  constructor(config: Partial<TopologyCoordinatorConfig> = {}) {
    this.config = {
      enableBackgroundOptimization: true,
      optimizationInterval: 60000, // 1 minute
      maxBackgroundAgents: 20,
      persistenceKey: 'topology-state',
      performanceThresholds: {
        efficiency: 0.7,
        resilience: 0.6,
        loadBalance: 0.6
      },
      ...config
    }

    this.initializeCoordinator()
  }

  private async initializeCoordinator(): Promise<void> {
    try {
      console.log('[SW-TopologyCoordinator] Initializing topology coordinator')
      
      // Initialize persistence
      await this.initializePersistence()
      
      // Load saved topology state
      const savedState = await this.loadTopologyState()
      
      // Initialize topology manager
      const topologyConfig: TopologyConfiguration = savedState?.config || {
        type: 'hybrid',
        maxNodes: this.config.maxBackgroundAgents,
        minConnections: 2,
        maxConnections: 6,
        rebalanceThreshold: 0.7,
        healingEnabled: true,
        adaptationRate: 0.1,
        targetEfficiency: this.config.performanceThresholds.efficiency
      }

      this.manager = new AdaptiveTopologyManager(topologyConfig)
      
      // Restore agents if available
      if (savedState?.agents) {
        for (const agentData of savedState.agents) {
          await this.registerAgent(agentData)
        }
      }

      // Start background processes
      this.startBackgroundOptimization()
      this.startAgentMonitoring()
      this.startMessageProcessing()
      
      this.isInitialized = true
      console.log('[SW-TopologyCoordinator] Initialization complete')

    } catch (error) {
      console.error('[SW-TopologyCoordinator] Initialization failed:', error)
    }
  }

  /**
   * Initialize IndexedDB for persistence
   */
  private async initializePersistence(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('topology-coordinator', 1)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.persistenceDB = request.result
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // Create stores
        if (!db.objectStoreNames.contains('topology-state')) {
          db.createObjectStore('topology-state', { keyPath: 'id' })
        }
        
        if (!db.objectStoreNames.contains('agent-registry')) {
          db.createObjectStore('agent-registry', { keyPath: 'id' })
        }
        
        if (!db.objectStoreNames.contains('message-queue')) {
          db.createObjectStore('message-queue', { keyPath: 'id' })
        }
      }
    })
  }

  /**
   * Register new agent with the topology
   */
  async registerAgent(agentData: Partial<Agent> & { id: string }): Promise<void> {
    if (!this.manager) {
      console.warn('[SW-TopologyCoordinator] Manager not initialized')
      return
    }

    const agent: Agent = {
      type: 'worker',
      capabilities: [],
      load: 0,
      connections: new Set(),
      lastSeen: Date.now(),
      performance: {
        responseTime: 100,
        successRate: 1.0,
        throughput: 1.0
      },
      ...agentData
    }

    try {
      // Add to topology manager
      await this.manager.addAgent(agent)
      
      // Register in local tracking
      this.activeAgents.set(agent.id, {
        agent,
        lastHeartbeat: Date.now(),
        status: 'active'
      })

      // Persist agent data
      await this.saveAgentData(agent)
      
      // Notify main thread
      this.notifyMainThread('agent-registered', { agentId: agent.id, agent })
      
      console.log(`[SW-TopologyCoordinator] Agent ${agent.id} registered`)

    } catch (error) {
      console.error(`[SW-TopologyCoordinator] Failed to register agent ${agent.id}:`, error)
    }
  }

  /**
   * Unregister agent from topology
   */
  async unregisterAgent(agentId: string): Promise<void> {
    if (!this.manager) return

    try {
      // Remove from topology manager
      await this.manager.removeAgent(agentId)
      
      // Remove from local tracking
      this.activeAgents.delete(agentId)
      
      // Remove persisted data
      await this.removeAgentData(agentId)
      
      // Notify main thread
      this.notifyMainThread('agent-unregistered', { agentId })
      
      console.log(`[SW-TopologyCoordinator] Agent ${agentId} unregistered`)

    } catch (error) {
      console.error(`[SW-TopologyCoordinator] Failed to unregister agent ${agentId}:`, error)
    }
  }

  /**
   * Handle agent heartbeat
   */
  updateAgentHeartbeat(agentId: string, performance?: Agent['performance']): void {
    const agentData = this.activeAgents.get(agentId)
    if (!agentData) return

    agentData.lastHeartbeat = Date.now()
    agentData.status = 'active'
    
    if (performance) {
      agentData.agent.performance = performance
      agentData.agent.load = this.calculateAgentLoad(performance)
    }

    this.activeAgents.set(agentId, agentData)
  }

  /**
   * Process topology command from main thread
   */
  async processTopologyCommand(command: {
    action: string
    data: any
    requestId?: string
  }): Promise<any> {
    if (!this.manager) {
      throw new Error('Topology manager not initialized')
    }

    try {
      let result: any = null

      switch (command.action) {
        case 'get-metrics':
          result = this.manager.getMetrics()
          break

        case 'get-topology-info':
          result = this.manager.getTopologyInfo()
          break

        case 'get-agent-info':
          result = this.manager.getAgentInfo(command.data.agentId)
          break

        case 'force-optimization':
          await this.manager.forceOptimization()
          result = { success: true }
          break

        case 'update-config':
          // Configuration updates would require manager recreation
          result = { success: false, message: 'Config updates require restart' }
          break

        case 'get-performance-history':
          result = this.manager.getPerformanceHistory()
          break

        case 'simulate-failure':
          await this.manager.handleAgentFailure(command.data.agentId)
          result = { success: true }
          break

        default:
          throw new Error(`Unknown command: ${command.action}`)
      }

      return result

    } catch (error) {
      console.error('[SW-TopologyCoordinator] Command processing failed:', error)
      throw error
    }
  }

  /**
   * Start background optimization process
   */
  private startBackgroundOptimization(): void {
    if (!this.config.enableBackgroundOptimization || !this.manager) return

    this.optimizationTimer = self.setInterval(() => {
      this.performBackgroundOptimization()
    }, this.config.optimizationInterval) as unknown as number
  }

  /**
   * Perform background optimization
   */
  private async performBackgroundOptimization(): Promise<void> {
    if (!this.manager) return

    try {
      const metrics = this.manager.getMetrics()
      const shouldOptimize = (
        metrics.efficiency < this.config.performanceThresholds.efficiency ||
        metrics.resilience < this.config.performanceThresholds.resilience ||
        metrics.loadBalance < this.config.performanceThresholds.loadBalance
      )

      if (shouldOptimize) {
        console.log('[SW-TopologyCoordinator] Starting background optimization')
        await this.manager.optimizeTopology()
        
        // Save updated state
        await this.saveTopologyState()
        
        // Notify main thread
        this.notifyMainThread('topology-optimized', {
          timestamp: Date.now(),
          metrics: this.manager.getMetrics()
        })
      }

    } catch (error) {
      console.error('[SW-TopologyCoordinator] Background optimization failed:', error)
    }
  }

  /**
   * Start agent monitoring
   */
  private startAgentMonitoring(): void {
    // Check agent health every 30 seconds
    self.setInterval(() => {
      this.monitorAgentHealth()
    }, 30000)
  }

  /**
   * Monitor agent health and handle failures
   */
  private async monitorAgentHealth(): Promise<void> {
    const now = Date.now()
    const staleThreshold = 120000 // 2 minutes
    const failedAgents: string[] = []

    for (const [agentId, agentData] of this.activeAgents) {
      if (now - agentData.lastHeartbeat > staleThreshold) {
        agentData.status = 'failing'
        failedAgents.push(agentId)
      }
    }

    // Handle failed agents
    for (const agentId of failedAgents) {
      console.log(`[SW-TopologyCoordinator] Agent ${agentId} appears to have failed`)
      
      if (this.manager) {
        await this.manager.handleAgentFailure(agentId)
      }
      
      // Update status but don't remove immediately (allow for recovery)
      const agentData = this.activeAgents.get(agentId)
      if (agentData) {
        agentData.status = 'failing'
        this.activeAgents.set(agentId, agentData)
      }
      
      // Notify main thread
      this.notifyMainThread('agent-failed', { agentId })
    }

    // Remove agents that have been failing for too long
    const removeThreshold = 300000 // 5 minutes
    for (const [agentId, agentData] of this.activeAgents) {
      if (agentData.status === 'failing' && now - agentData.lastHeartbeat > removeThreshold) {
        await this.unregisterAgent(agentId)
      }
    }
  }

  /**
   * Start message processing for coordination
   */
  private startMessageProcessing(): void {
    // Process queued messages every 10 seconds
    self.setInterval(() => {
      this.processMessageQueue()
    }, 10000)
  }

  /**
   * Process coordination message queue
   */
  private async processMessageQueue(): Promise<void> {
    if (this.messageQueue.length === 0) return

    const processableMessages = this.messageQueue.filter(msg => 
      msg.retryCount < 3 && Date.now() - msg.timestamp > 5000
    )

    for (const message of processableMessages) {
      try {
        await this.processCoordinationMessage(message)
        
        // Remove successful message from queue
        this.messageQueue = this.messageQueue.filter(m => m.id !== message.id)
        
      } catch (error) {
        console.error('[SW-TopologyCoordinator] Message processing failed:', error)
        
        // Increment retry count
        message.retryCount++
        if (message.retryCount >= 3) {
          // Remove failed message after 3 attempts
          this.messageQueue = this.messageQueue.filter(m => m.id !== message.id)
        }
      }
    }
  }

  /**
   * Process individual coordination message
   */
  private async processCoordinationMessage(message: {
    type: string
    data: any
  }): Promise<void> {
    switch (message.type) {
      case 'workload-update':
        await this.handleWorkloadUpdate(message.data)
        break
        
      case 'agent-capability-change':
        await this.handleAgentCapabilityChange(message.data)
        break
        
      case 'network-partition':
        await this.handleNetworkPartition(message.data)
        break
        
      default:
        console.warn('[SW-TopologyCoordinator] Unknown message type:', message.type)
    }
  }

  /**
   * Handle workload update coordination
   */
  private async handleWorkloadUpdate(data: {
    agentId: string
    newLoad: number
    capabilities: string[]
  }): Promise<void> {
    const agentData = this.activeAgents.get(data.agentId)
    if (!agentData) return

    // Update agent load
    agentData.agent.load = data.newLoad
    agentData.agent.capabilities = data.capabilities
    
    // Check if rebalancing is needed
    if (this.manager && this.shouldRebalance()) {
      await this.manager.optimizeTopology()
    }
  }

  /**
   * Handle agent capability changes
   */
  private async handleAgentCapabilityChange(data: {
    agentId: string
    capabilities: string[]
  }): Promise<void> {
    const agentData = this.activeAgents.get(data.agentId)
    if (!agentData) return

    agentData.agent.capabilities = data.capabilities
    
    // This might require topology adjustment
    if (this.manager) {
      // Force a topology review
      await this.manager.optimizeTopology()
    }
  }

  /**
   * Handle network partition scenarios
   */
  private async handleNetworkPartition(data: {
    affectedAgents: string[]
    partitionType: 'split' | 'isolated'
  }): Promise<void> {
    if (!this.manager) return

    // Handle agent failures due to partition
    for (const agentId of data.affectedAgents) {
      await this.manager.handleAgentFailure(agentId)
    }

    // Trigger healing process
    await this.manager.optimizeTopology()
  }

  /**
   * Utility methods
   */
  private calculateAgentLoad(performance: Agent['performance']): number {
    // Simple load calculation based on response time and success rate
    const responseTimeFactor = Math.min(performance.responseTime / 1000, 1) // Normalize to 0-1
    const successRateFactor = 1 - performance.successRate
    const throughputFactor = Math.max(0, 1 - performance.throughput)
    
    return (responseTimeFactor + successRateFactor + throughputFactor) / 3
  }

  private shouldRebalance(): boolean {
    const loads = Array.from(this.activeAgents.values()).map(data => data.agent.load)
    if (loads.length < 2) return false

    const avgLoad = loads.reduce((sum, load) => sum + load, 0) / loads.length
    const maxLoad = Math.max(...loads)
    const minLoad = Math.min(...loads)

    return (maxLoad - minLoad) > 0.4 || avgLoad > 0.8
  }

  private notifyMainThread(type: string, data: any): void {
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'topology-event',
          eventType: type,
          data,
          timestamp: Date.now()
        })
      })
    })
  }

  /**
   * Persistence methods
   */
  private async saveTopologyState(): Promise<void> {
    if (!this.persistenceDB || !this.manager) return

    const state = {
      id: this.config.persistenceKey,
      config: this.manager.getTopologyInfo().config,
      agents: Array.from(this.activeAgents.values()).map(data => data.agent),
      timestamp: Date.now()
    }

    const tx = this.persistenceDB.transaction(['topology-state'], 'readwrite')
    const store = tx.objectStore('topology-state')
    await store.put(state)
  }

  private async loadTopologyState(): Promise<any> {
    if (!this.persistenceDB) return null

    const tx = this.persistenceDB.transaction(['topology-state'], 'readonly')
    const store = tx.objectStore('topology-state')
    
    return new Promise((resolve, reject) => {
      const request = store.get(this.config.persistenceKey)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  private async saveAgentData(agent: Agent): Promise<void> {
    if (!this.persistenceDB) return

    const tx = this.persistenceDB.transaction(['agent-registry'], 'readwrite')
    const store = tx.objectStore('agent-registry')
    await store.put(agent)
  }

  private async removeAgentData(agentId: string): Promise<void> {
    if (!this.persistenceDB) return

    const tx = this.persistenceDB.transaction(['agent-registry'], 'readwrite')
    const store = tx.objectStore('agent-registry')
    await store.delete(agentId)
  }

  /**
   * Public API for service worker integration
   */
  public getActiveAgentCount(): number {
    return this.activeAgents.size
  }

  public getAgentStatuses(): Map<string, string> {
    const statuses = new Map<string, string>()
    for (const [agentId, data] of this.activeAgents) {
      statuses.set(agentId, data.status)
    }
    return statuses
  }

  public async shutdown(): Promise<void> {
    console.log('[SW-TopologyCoordinator] Shutting down')
    
    if (this.optimizationTimer) {
      self.clearInterval(this.optimizationTimer)
    }

    // Save final state
    await this.saveTopologyState()
    
    // Close database
    if (this.persistenceDB) {
      this.persistenceDB.close()
    }
  }
}

// Global coordinator instance for service worker
let globalCoordinator: ServiceWorkerTopologyCoordinator | null = null

/**
 * Initialize topology coordinator in service worker
 */
export function initializeTopologyCoordinator(
  config?: Partial<TopologyCoordinatorConfig>
): ServiceWorkerTopologyCoordinator {
  if (!globalCoordinator) {
    globalCoordinator = new ServiceWorkerTopologyCoordinator(config)
  }
  return globalCoordinator
}

/**
 * Get global topology coordinator instance
 */
export function getTopologyCoordinator(): ServiceWorkerTopologyCoordinator | null {
  return globalCoordinator
}

/**
 * Message handler for service worker
 */
export async function handleTopologyMessage(event: ExtendableMessageEvent): Promise<void> {
  const coordinator = getTopologyCoordinator()
  if (!coordinator) return

  const { type, data, requestId } = event.data

  try {
    let response: any = null

    switch (type) {
      case 'register-agent':
        await coordinator.registerAgent(data.agent)
        response = { success: true }
        break

      case 'unregister-agent':
        await coordinator.unregisterAgent(data.agentId)
        response = { success: true }
        break

      case 'agent-heartbeat':
        coordinator.updateAgentHeartbeat(data.agentId, data.performance)
        response = { success: true }
        break

      case 'topology-command':
        response = await coordinator.processTopologyCommand(data)
        break

      default:
        console.warn('[SW-TopologyCoordinator] Unknown message type:', type)
        response = { success: false, error: 'Unknown message type' }
    }

    // Send response back to main thread
    if (requestId && event.source) {
      event.source.postMessage({
        type: 'topology-response',
        requestId,
        data: response
      })
    }

  } catch (error) {
    console.error('[SW-TopologyCoordinator] Message handling failed:', error)
    
    if (requestId && event.source) {
      event.source.postMessage({
        type: 'topology-response',
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}