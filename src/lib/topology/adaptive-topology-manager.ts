/**
 * Adaptive Topology Manager for Hive-Mind System
 * 
 * Dynamically adapts swarm topology based on workload, performance metrics,
 * and network conditions to optimize collective intelligence and efficiency.
 */

export interface Agent {
  id: string
  type: 'coordinator' | 'worker' | 'specialist' | 'bridge'
  capabilities: string[]
  load: number // 0-1 scale
  connections: Set<string>
  lastSeen: number
  performance: {
    responseTime: number
    successRate: number
    throughput: number
  }
  location?: {
    region: string
    latency: number
  }
}

export interface TopologyNode {
  id: string
  agent: Agent
  connections: Map<string, Connection>
  centrality: {
    degree: number
    betweenness: number
    closeness: number
    eigenvector: number
  }
  cluster?: string
}

export interface Connection {
  from: string
  to: string
  weight: number
  latency: number
  bandwidth: number
  reliability: number
  lastActive: number
}

export interface TopologyMetrics {
  efficiency: number
  resilience: number
  connectivity: number
  loadBalance: number
  averagePathLength: number
  clusteringCoefficient: number
  networkDiameter: number
}

export type TopologyType = 
  | 'mesh' 
  | 'hierarchical' 
  | 'ring' 
  | 'star' 
  | 'hybrid' 
  | 'small-world'
  | 'scale-free'
  | 'clustered'

export interface TopologyConfiguration {
  type: TopologyType
  maxNodes: number
  minConnections: number
  maxConnections: number
  rebalanceThreshold: number
  healingEnabled: boolean
  adaptationRate: number
  targetEfficiency: number
}

export class AdaptiveTopologyManager {
  private nodes: Map<string, TopologyNode> = new Map()
  private connections: Map<string, Connection> = new Map()
  private config: TopologyConfiguration
  private metrics: TopologyMetrics
  private isOptimizing = false
  private healingActive = false
  
  // Performance tracking
  private performanceHistory: Array<{
    timestamp: number
    metrics: TopologyMetrics
    topology: TopologyType
  }> = []
  
  // Optimization algorithms
  private algorithms = {
    genetic: new GeneticTopologyOptimizer(),
    swarm: new SwarmOptimizationAlgorithm(),
    reinforcement: new ReinforcementLearningOptimizer()
  }

  constructor(config: TopologyConfiguration) {
    this.config = config
    this.metrics = this.initializeMetrics()
    this.startPerformanceMonitoring()
    this.initializeTopology()
  }

  /**
   * Add new agent to the topology
   */
  async addAgent(agent: Agent): Promise<void> {
    console.log(`[AdaptiveTopology] Adding agent ${agent.id} of type ${agent.type}`)
    
    const node: TopologyNode = {
      id: agent.id,
      agent,
      connections: new Map(),
      centrality: {
        degree: 0,
        betweenness: 0,
        closeness: 0,
        eigenvector: 0
      }
    }

    this.nodes.set(agent.id, node)
    
    // Determine optimal connections for new agent
    const optimalConnections = await this.calculateOptimalConnections(agent)
    
    // Establish connections
    for (const targetId of optimalConnections) {
      await this.createConnection(agent.id, targetId)
    }

    // Update topology metrics
    this.updateMetrics()
    
    // Check if topology needs optimization
    if (this.shouldOptimize()) {
      await this.optimizeTopology()
    }

    // Store topology change in memory
    await this.storeTopologyChange('agent_added', {
      agentId: agent.id,
      agentType: agent.type,
      connections: optimalConnections.length
    })
  }

  /**
   * Remove agent from topology with graceful cleanup
   */
  async removeAgent(agentId: string): Promise<void> {
    console.log(`[AdaptiveTopology] Removing agent ${agentId}`)
    
    const node = this.nodes.get(agentId)
    if (!node) return

    // Store connections before removal for healing
    const lostConnections = Array.from(node.connections.keys())
    
    // Remove all connections involving this agent
    for (const connectionId of node.connections.keys()) {
      await this.removeConnection(connectionId)
    }

    // Remove node
    this.nodes.delete(agentId)
    
    // Trigger self-healing if enabled
    if (this.config.healingEnabled && lostConnections.length > 0) {
      await this.healNetworkAfterRemoval(agentId, lostConnections)
    }

    // Update metrics
    this.updateMetrics()
    
    // Store topology change
    await this.storeTopologyChange('agent_removed', {
      agentId,
      impactedConnections: lostConnections.length
    })
  }

  /**
   * Handle agent failure with automatic recovery
   */
  async handleAgentFailure(agentId: string): Promise<void> {
    console.log(`[AdaptiveTopology] Handling failure of agent ${agentId}`)
    
    const node = this.nodes.get(agentId)
    if (!node) return

    // Mark agent as failed
    node.agent.lastSeen = Date.now()
    node.agent.performance.successRate = 0

    // Start healing process
    if (this.config.healingEnabled) {
      await this.healNetworkAfterFailure(agentId)
    }

    // Update metrics to reflect failure impact
    this.updateMetrics()
    
    // Store failure event
    await this.storeTopologyChange('agent_failed', {
      agentId,
      failureTime: Date.now(),
      criticalityScore: this.calculateAgentCriticality(agentId)
    })
  }

  /**
   * Optimize topology based on current performance and workload
   */
  async optimizeTopology(): Promise<void> {
    if (this.isOptimizing) return
    
    this.isOptimizing = true
    console.log('[AdaptiveTopology] Starting topology optimization')

    try {
      // Analyze current topology performance
      const analysis = await this.analyzeTopologyPerformance()
      
      // Determine optimal topology type for current workload
      const optimalType = await this.determineOptimalTopologyType(analysis)
      
      if (optimalType !== this.config.type) {
        console.log(`[AdaptiveTopology] Migrating from ${this.config.type} to ${optimalType}`)
        await this.migrateTopology(optimalType)
      }

      // Optimize connections within current topology
      await this.optimizeConnections()
      
      // Rebalance workload
      await this.rebalanceWorkload()
      
      // Update configuration
      this.config.type = optimalType
      this.updateMetrics()
      
      console.log('[AdaptiveTopology] Optimization complete')
      
    } finally {
      this.isOptimizing = false
    }

    // Store optimization event
    await this.storeTopologyChange('topology_optimized', {
      newType: this.config.type,
      efficiency: this.metrics.efficiency,
      resilience: this.metrics.resilience
    })
  }

  /**
   * Calculate optimal connections for a new agent
   */
  private async calculateOptimalConnections(agent: Agent): Promise<string[]> {
    const candidates = Array.from(this.nodes.values())
      .filter(node => node.id !== agent.id)
      .sort((a, b) => this.calculateConnectionScore(agent, b.agent) - 
                      this.calculateConnectionScore(agent, a.agent))

    const connections: string[] = []
    const maxConnections = Math.min(this.config.maxConnections, candidates.length)
    const minConnections = Math.min(this.config.minConnections, candidates.length)

    // Add high-priority connections first
    for (let i = 0; i < minConnections; i++) {
      connections.push(candidates[i].id)
    }

    // Add additional connections based on topology type
    switch (this.config.type) {
      case 'mesh':
        // In mesh, connect to more nodes for redundancy
        for (let i = minConnections; i < maxConnections && i < candidates.length; i++) {
          if (this.calculateConnectionScore(agent, candidates[i].agent) > 0.6) {
            connections.push(candidates[i].id)
          }
        }
        break
        
      case 'hierarchical':
        // Connect to coordinators and similar-level agents
        const coordinators = candidates.filter(c => c.agent.type === 'coordinator')
        const peers = candidates.filter(c => c.agent.type === agent.type)
        
        connections.push(...coordinators.slice(0, 2).map(c => c.id))
        connections.push(...peers.slice(0, 3).map(c => c.id))
        break
        
      case 'small-world':
        // Mix of local and random connections
        const localConnections = candidates.slice(0, 3)
        const randomConnections = this.selectRandomNodes(candidates, 2, localConnections)
        
        connections.push(...localConnections.map(c => c.id))
        connections.push(...randomConnections.map(c => c.id))
        break
    }

    return [...new Set(connections)] // Remove duplicates
  }

  /**
   * Calculate connection score between two agents
   */
  private calculateConnectionScore(agent1: Agent, agent2: Agent): number {
    let score = 0

    // Capability complementarity
    const commonCapabilities = agent1.capabilities.filter(cap => 
      agent2.capabilities.includes(cap)
    ).length
    const totalCapabilities = new Set([...agent1.capabilities, ...agent2.capabilities]).size
    score += (commonCapabilities / totalCapabilities) * 0.3

    // Load balance consideration
    const loadDifference = Math.abs(agent1.load - agent2.load)
    score += (1 - loadDifference) * 0.3

    // Performance matching
    const perfDiff = Math.abs(
      agent1.performance.successRate - agent2.performance.successRate
    )
    score += (1 - perfDiff) * 0.2

    // Type compatibility
    const typeScore = this.calculateTypeCompatibility(agent1.type, agent2.type)
    score += typeScore * 0.2

    return Math.min(score, 1)
  }

  /**
   * Calculate type compatibility between agent types
   */
  private calculateTypeCompatibility(type1: Agent['type'], type2: Agent['type']): number {
    const compatibilityMatrix = {
      coordinator: { coordinator: 0.8, worker: 0.9, specialist: 0.7, bridge: 0.9 },
      worker: { coordinator: 0.9, worker: 0.6, specialist: 0.8, bridge: 0.7 },
      specialist: { coordinator: 0.7, worker: 0.8, specialist: 0.9, bridge: 0.8 },
      bridge: { coordinator: 0.9, worker: 0.7, specialist: 0.8, bridge: 0.6 }
    }
    
    return compatibilityMatrix[type1][type2] || 0.5
  }

  /**
   * Create connection between two agents
   */
  private async createConnection(fromId: string, toId: string): Promise<void> {
    const connectionId = `${fromId}-${toId}`
    const reverseId = `${toId}-${fromId}`
    
    // Don't create duplicate connections
    if (this.connections.has(connectionId) || this.connections.has(reverseId)) {
      return
    }

    const fromNode = this.nodes.get(fromId)
    const toNode = this.nodes.get(toId)
    
    if (!fromNode || !toNode) return

    // Calculate connection properties
    const connection: Connection = {
      from: fromId,
      to: toId,
      weight: this.calculateConnectionWeight(fromNode.agent, toNode.agent),
      latency: this.estimateLatency(fromNode.agent, toNode.agent),
      bandwidth: this.estimateBandwidth(fromNode.agent, toNode.agent),
      reliability: 0.95, // Initial reliability
      lastActive: Date.now()
    }

    // Store connection
    this.connections.set(connectionId, connection)
    
    // Update node connections
    fromNode.connections.set(connectionId, connection)
    toNode.connections.set(connectionId, connection)

    console.log(`[AdaptiveTopology] Created connection ${connectionId}`)
  }

  /**
   * Remove connection between agents
   */
  private async removeConnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    // Remove from nodes
    const fromNode = this.nodes.get(connection.from)
    const toNode = this.nodes.get(connection.to)
    
    if (fromNode) fromNode.connections.delete(connectionId)
    if (toNode) toNode.connections.delete(connectionId)
    
    // Remove from main connections map
    this.connections.delete(connectionId)
    
    console.log(`[AdaptiveTopology] Removed connection ${connectionId}`)
  }

  /**
   * Heal network after agent removal
   */
  private async healNetworkAfterRemoval(removedAgentId: string, lostConnections: string[]): Promise<void> {
    console.log(`[AdaptiveTopology] Healing network after removal of ${removedAgentId}`)
    
    this.healingActive = true
    
    try {
      // Find agents that lost connections
      const affectedAgents = new Set<string>()
      
      for (const connectionId of lostConnections) {
        const [from, to] = connectionId.split('-')
        if (from !== removedAgentId) affectedAgents.add(from)
        if (to !== removedAgentId) affectedAgents.add(to)
      }

      // For each affected agent, find new connections
      for (const agentId of affectedAgents) {
        const node = this.nodes.get(agentId)
        if (!node) continue

        // Check if agent needs more connections
        const currentConnections = node.connections.size
        if (currentConnections < this.config.minConnections) {
          const newConnections = await this.calculateOptimalConnections(node.agent)
          
          // Add new connections to meet minimum
          const needed = this.config.minConnections - currentConnections
          for (let i = 0; i < Math.min(needed, newConnections.length); i++) {
            if (!node.connections.has(`${agentId}-${newConnections[i]}`) &&
                !node.connections.has(`${newConnections[i]}-${agentId}`)) {
              await this.createConnection(agentId, newConnections[i])
            }
          }
        }
      }

      // Update metrics after healing
      this.updateMetrics()
      
    } finally {
      this.healingActive = false
    }
  }

  /**
   * Heal network after agent failure
   */
  private async healNetworkAfterFailure(failedAgentId: string): Promise<void> {
    console.log(`[AdaptiveTopology] Healing network after failure of ${failedAgentId}`)
    
    const failedNode = this.nodes.get(failedAgentId)
    if (!failedNode) return

    // Temporarily disable connections to failed agent
    const affectedConnections = Array.from(failedNode.connections.keys())
    
    // Find replacement connections for affected agents
    for (const connectionId of affectedConnections) {
      const connection = this.connections.get(connectionId)
      if (!connection) continue
      
      const otherAgentId = connection.from === failedAgentId ? connection.to : connection.from
      const otherNode = this.nodes.get(otherAgentId)
      
      if (otherNode && otherNode.connections.size < this.config.maxConnections) {
        // Find alternative connection
        const alternatives = await this.calculateOptimalConnections(otherNode.agent)
        const validAlternative = alternatives.find(altId => 
          altId !== failedAgentId && 
          !otherNode.connections.has(`${otherAgentId}-${altId}`) &&
          !otherNode.connections.has(`${altId}-${otherAgentId}`)
        )
        
        if (validAlternative) {
          await this.createConnection(otherAgentId, validAlternative)
        }
      }
    }
  }

  /**
   * Analyze current topology performance
   */
  private async analyzeTopologyPerformance(): Promise<{
    bottlenecks: string[]
    underutilized: string[]
    criticalPaths: string[]
    recommendations: string[]
  }> {
    const analysis = {
      bottlenecks: [] as string[],
      underutilized: [] as string[],
      criticalPaths: [] as string[],
      recommendations: [] as string[]
    }

    // Identify bottlenecks (high load agents)
    for (const [agentId, node] of this.nodes) {
      if (node.agent.load > 0.8) {
        analysis.bottlenecks.push(agentId)
      } else if (node.agent.load < 0.2) {
        analysis.underutilized.push(agentId)
      }
    }

    // Identify critical paths (high betweenness centrality)
    const centralityThreshold = this.calculateCentralityThreshold()
    for (const [agentId, node] of this.nodes) {
      if (node.centrality.betweenness > centralityThreshold) {
        analysis.criticalPaths.push(agentId)
      }
    }

    // Generate recommendations
    if (analysis.bottlenecks.length > 0) {
      analysis.recommendations.push('Consider load balancing or adding more connections to bottleneck agents')
    }
    
    if (analysis.underutilized.length > 0) {
      analysis.recommendations.push('Redistribute workload to underutilized agents')
    }
    
    if (this.metrics.efficiency < this.config.targetEfficiency) {
      analysis.recommendations.push('Topology optimization needed to improve efficiency')
    }

    return analysis
  }

  /**
   * Determine optimal topology type based on current conditions
   */
  private async determineOptimalTopologyType(analysis: any): Promise<TopologyType> {
    const nodeCount = this.nodes.size
    const avgLoad = this.calculateAverageLoad()
    const workloadVariance = this.calculateWorkloadVariance()

    // Decision matrix based on conditions
    if (nodeCount < 5) {
      return 'mesh' // Small networks benefit from full connectivity
    }
    
    if (workloadVariance > 0.3) {
      return 'hierarchical' // High variance needs coordination
    }
    
    if (avgLoad > 0.7 && analysis.bottlenecks.length > 0) {
      return 'scale-free' // Heavy load needs hub-based distribution
    }
    
    if (this.metrics.resilience < 0.6) {
      return 'mesh' // Low resilience needs redundancy
    }
    
    if (nodeCount > 20) {
      return 'small-world' // Large networks benefit from small-world
    }

    return 'hybrid' // Default for balanced conditions
  }

  /**
   * Migrate to new topology type
   */
  private async migrateTopology(newType: TopologyType): Promise<void> {
    console.log(`[AdaptiveTopology] Migrating to ${newType} topology`)
    
    // Store current state
    const currentConnections = new Map(this.connections)
    
    // Clear existing connections
    this.connections.clear()
    for (const node of this.nodes.values()) {
      node.connections.clear()
    }

    // Build new topology
    switch (newType) {
      case 'mesh':
        await this.buildMeshTopology()
        break
      case 'hierarchical':
        await this.buildHierarchicalTopology()
        break
      case 'ring':
        await this.buildRingTopology()
        break
      case 'star':
        await this.buildStarTopology()
        break
      case 'small-world':
        await this.buildSmallWorldTopology()
        break
      case 'scale-free':
        await this.buildScaleFreeTopology()
        break
      case 'hybrid':
        await this.buildHybridTopology()
        break
    }

    // Update metrics
    this.updateMetrics()
  }

  /**
   * Build mesh topology (full connectivity)
   */
  private async buildMeshTopology(): Promise<void> {
    const agents = Array.from(this.nodes.values())
    
    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        await this.createConnection(agents[i].id, agents[j].id)
      }
    }
  }

  /**
   * Build hierarchical topology
   */
  private async buildHierarchicalTopology(): Promise<void> {
    const coordinators = Array.from(this.nodes.values())
      .filter(node => node.agent.type === 'coordinator')
    const workers = Array.from(this.nodes.values())
      .filter(node => node.agent.type !== 'coordinator')

    // Connect coordinators to each other
    for (let i = 0; i < coordinators.length; i++) {
      for (let j = i + 1; j < coordinators.length; j++) {
        await this.createConnection(coordinators[i].id, coordinators[j].id)
      }
    }

    // Connect workers to coordinators
    for (const worker of workers) {
      const bestCoordinator = coordinators
        .sort((a, b) => a.agent.load - b.agent.load)[0]
      
      if (bestCoordinator) {
        await this.createConnection(worker.id, bestCoordinator.id)
      }
    }
  }

  /**
   * Build small-world topology
   */
  private async buildSmallWorldTopology(): Promise<void> {
    const agents = Array.from(this.nodes.values())
    const n = agents.length
    const k = Math.min(6, n - 1) // Each node connects to k nearest neighbors
    const p = 0.1 // Rewiring probability

    // Start with ring lattice
    for (let i = 0; i < n; i++) {
      for (let j = 1; j <= k / 2; j++) {
        const neighbor = (i + j) % n
        await this.createConnection(agents[i].id, agents[neighbor].id)
      }
    }

    // Rewire connections with probability p
    for (const connection of this.connections.values()) {
      if (Math.random() < p) {
        // Remove current connection
        await this.removeConnection(`${connection.from}-${connection.to}`)
        
        // Create new random connection
        const randomAgent = agents[Math.floor(Math.random() * agents.length)]
        if (randomAgent.id !== connection.from) {
          await this.createConnection(connection.from, randomAgent.id)
        }
      }
    }
  }

  /**
   * Build scale-free topology
   */
  private async buildScaleFreeTopology(): Promise<void> {
    const agents = Array.from(this.nodes.values())
    const hubs = agents
      .sort((a, b) => b.agent.performance.throughput - a.agent.performance.throughput)
      .slice(0, Math.ceil(agents.length * 0.2)) // Top 20% become hubs

    // Connect hubs to each other
    for (let i = 0; i < hubs.length; i++) {
      for (let j = i + 1; j < hubs.length; j++) {
        await this.createConnection(hubs[i].id, hubs[j].id)
      }
    }

    // Connect other agents to hubs based on preferential attachment
    const nonHubs = agents.filter(agent => !hubs.includes(agent))
    
    for (const agent of nonHubs) {
      const hubScores = hubs.map(hub => ({
        hub,
        score: hub.connections.size + hub.agent.performance.throughput
      }))
      
      // Connect to top hubs
      const topHubs = hubScores
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.min(3, hubs.length))
      
      for (const { hub } of topHubs) {
        await this.createConnection(agent.id, hub.id)
      }
    }
  }

  /**
   * Build hybrid topology combining multiple strategies
   */
  private async buildHybridTopology(): Promise<void> {
    // Combine hierarchical structure with small-world connections
    await this.buildHierarchicalTopology()
    
    // Add some random long-range connections
    const agents = Array.from(this.nodes.values())
    const randomConnections = Math.floor(agents.length * 0.3)
    
    for (let i = 0; i < randomConnections; i++) {
      const agent1 = agents[Math.floor(Math.random() * agents.length)]
      const agent2 = agents[Math.floor(Math.random() * agents.length)]
      
      if (agent1.id !== agent2.id && 
          !agent1.connections.has(`${agent1.id}-${agent2.id}`) &&
          !agent1.connections.has(`${agent2.id}-${agent1.id}`)) {
        await this.createConnection(agent1.id, agent2.id)
      }
    }
  }

  /**
   * Build ring topology
   */
  private async buildRingTopology(): Promise<void> {
    const agents = Array.from(this.nodes.values())
    
    for (let i = 0; i < agents.length; i++) {
      const next = (i + 1) % agents.length
      await this.createConnection(agents[i].id, agents[next].id)
    }
  }

  /**
   * Build star topology
   */
  private async buildStarTopology(): Promise<void> {
    const agents = Array.from(this.nodes.values())
    const center = agents.find(agent => agent.agent.type === 'coordinator') || agents[0]
    
    for (const agent of agents) {
      if (agent.id !== center.id) {
        await this.createConnection(center.id, agent.id)
      }
    }
  }

  /**
   * Optimize connections within current topology
   */
  private async optimizeConnections(): Promise<void> {
    // Remove underperforming connections
    const connectionsToRemove: string[] = []
    
    for (const [connectionId, connection] of this.connections) {
      if (connection.reliability < 0.5 || 
          connection.lastActive < Date.now() - 300000) { // 5 minutes
        connectionsToRemove.push(connectionId)
      }
    }

    for (const connectionId of connectionsToRemove) {
      await this.removeConnection(connectionId)
    }

    // Add beneficial connections
    for (const [agentId, node] of this.nodes) {
      if (node.connections.size < this.config.maxConnections) {
        const potentialConnections = await this.calculateOptimalConnections(node.agent)
        const needed = Math.min(
          this.config.maxConnections - node.connections.size,
          2 // Don't add too many at once
        )
        
        for (let i = 0; i < needed && i < potentialConnections.length; i++) {
          const targetId = potentialConnections[i]
          if (!node.connections.has(`${agentId}-${targetId}`) &&
              !node.connections.has(`${targetId}-${agentId}`)) {
            await this.createConnection(agentId, targetId)
          }
        }
      }
    }
  }

  /**
   * Rebalance workload across topology
   */
  private async rebalanceWorkload(): Promise<void> {
    const overloadedAgents = Array.from(this.nodes.values())
      .filter(node => node.agent.load > 0.8)
      .sort((a, b) => b.agent.load - a.agent.load)

    const underloadedAgents = Array.from(this.nodes.values())
      .filter(node => node.agent.load < 0.3)
      .sort((a, b) => a.agent.load - b.agent.load)

    // For each overloaded agent, try to distribute load
    for (const overloaded of overloadedAgents) {
      const connectedUnderloaded = underloadedAgents.filter(agent =>
        overloaded.connections.has(`${overloaded.id}-${agent.id}`) ||
        overloaded.connections.has(`${agent.id}-${overloaded.id}`)
      )

      if (connectedUnderloaded.length === 0 && underloadedAgents.length > 0) {
        // Create connection to underloaded agent
        const target = underloadedAgents[0]
        await this.createConnection(overloaded.id, target.id)
      }
    }
  }

  /**
   * Update topology metrics
   */
  private updateMetrics(): Promise<void> {
    return new Promise((resolve) => {
      const nodeCount = this.nodes.size
      const connectionCount = this.connections.size
      
      if (nodeCount === 0) {
        this.metrics = this.initializeMetrics()
        resolve()
        return
      }

      // Calculate efficiency (how well connected the network is)
      const maxPossibleConnections = (nodeCount * (nodeCount - 1)) / 2
      this.metrics.connectivity = connectionCount / maxPossibleConnections

      // Calculate average path length and diameter
      const pathLengths = this.calculateAllShortestPaths()
      this.metrics.averagePathLength = pathLengths.average
      this.metrics.networkDiameter = pathLengths.max

      // Calculate clustering coefficient
      this.metrics.clusteringCoefficient = this.calculateClusteringCoefficient()

      // Calculate load balance
      const loads = Array.from(this.nodes.values()).map(node => node.agent.load)
      const avgLoad = loads.reduce((sum, load) => sum + load, 0) / loads.length
      const loadVariance = loads.reduce((sum, load) => sum + Math.pow(load - avgLoad, 2), 0) / loads.length
      this.metrics.loadBalance = 1 - Math.sqrt(loadVariance)

      // Calculate resilience (ability to handle failures)
      this.metrics.resilience = this.calculateNetworkResilience()

      // Calculate overall efficiency
      this.metrics.efficiency = (
        this.metrics.connectivity * 0.25 +
        this.metrics.loadBalance * 0.25 +
        this.metrics.resilience * 0.25 +
        (1 / Math.max(this.metrics.averagePathLength, 1)) * 0.25
      )

      // Update centrality measures
      this.updateCentralityMeasures()

      resolve()
    })
  }

  /**
   * Calculate all shortest paths in the network
   */
  private calculateAllShortestPaths(): { average: number; max: number } {
    const nodes = Array.from(this.nodes.keys())
    const distances: number[] = []

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const distance = this.findShortestPath(nodes[i], nodes[j])
        if (distance !== Infinity) {
          distances.push(distance)
        }
      }
    }

    if (distances.length === 0) {
      return { average: Infinity, max: Infinity }
    }

    const average = distances.reduce((sum, dist) => sum + dist, 0) / distances.length
    const max = Math.max(...distances)

    return { average, max }
  }

  /**
   * Find shortest path between two nodes
   */
  private findShortestPath(from: string, to: string): number {
    if (from === to) return 0

    const visited = new Set<string>()
    const queue: Array<{ node: string; distance: number }> = [{ node: from, distance: 0 }]

    while (queue.length > 0) {
      const { node, distance } = queue.shift()!
      
      if (visited.has(node)) continue
      visited.add(node)

      if (node === to) return distance

      const currentNode = this.nodes.get(node)
      if (!currentNode) continue

      for (const connection of currentNode.connections.values()) {
        const neighbor = connection.from === node ? connection.to : connection.from
        if (!visited.has(neighbor)) {
          queue.push({ node: neighbor, distance: distance + 1 })
        }
      }
    }

    return Infinity
  }

  /**
   * Calculate clustering coefficient for the network
   */
  private calculateClusteringCoefficient(): number {
    let totalCoefficient = 0
    let nodeCount = 0

    for (const [nodeId, node] of this.nodes) {
      const neighbors = this.getNeighbors(nodeId)
      if (neighbors.length < 2) continue

      let triangles = 0
      const possibleTriangles = (neighbors.length * (neighbors.length - 1)) / 2

      for (let i = 0; i < neighbors.length; i++) {
        for (let j = i + 1; j < neighbors.length; j++) {
          if (this.areConnected(neighbors[i], neighbors[j])) {
            triangles++
          }
        }
      }

      totalCoefficient += triangles / possibleTriangles
      nodeCount++
    }

    return nodeCount > 0 ? totalCoefficient / nodeCount : 0
  }

  /**
   * Calculate network resilience
   */
  private calculateNetworkResilience(): number {
    const nodeCount = this.nodes.size
    if (nodeCount <= 1) return 1

    // Simulate random node failures and measure connectivity
    let maintainedConnectivity = 0
    const simulations = 10

    for (let sim = 0; sim < simulations; sim++) {
      const testNodes = new Set(this.nodes.keys())
      const failureCount = Math.floor(nodeCount * 0.2) // Fail 20% of nodes
      
      // Remove random nodes
      for (let i = 0; i < failureCount; i++) {
        const nodes = Array.from(testNodes)
        const randomNode = nodes[Math.floor(Math.random() * nodes.length)]
        testNodes.delete(randomNode)
      }

      // Check if remaining network is still connected
      if (this.isConnected(testNodes)) {
        maintainedConnectivity++
      }
    }

    return maintainedConnectivity / simulations
  }

  /**
   * Check if a subset of nodes remains connected
   */
  private isConnected(nodeSet: Set<string>): boolean {
    if (nodeSet.size <= 1) return true

    const visited = new Set<string>()
    const queue = [Array.from(nodeSet)[0]]

    while (queue.length > 0) {
      const current = queue.shift()!
      if (visited.has(current)) continue
      visited.add(current)

      const neighbors = this.getNeighbors(current).filter(neighbor => nodeSet.has(neighbor))
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          queue.push(neighbor)
        }
      }
    }

    return visited.size === nodeSet.size
  }

  /**
   * Update centrality measures for all nodes
   */
  private updateCentralityMeasures(): void {
    this.updateDegreeCentrality()
    this.updateBetweennessCentrality()
    this.updateClosenessCentrality()
    this.updateEigenvectorCentrality()
  }

  /**
   * Update degree centrality
   */
  private updateDegreeCentrality(): void {
    const maxDegree = Math.max(...Array.from(this.nodes.values()).map(node => node.connections.size))
    
    for (const node of this.nodes.values()) {
      node.centrality.degree = maxDegree > 0 ? node.connections.size / maxDegree : 0
    }
  }

  /**
   * Update betweenness centrality
   */
  private updateBetweennessCentrality(): void {
    const nodeIds = Array.from(this.nodes.keys())
    const betweenness = new Map<string, number>()

    // Initialize
    for (const nodeId of nodeIds) {
      betweenness.set(nodeId, 0)
    }

    // Calculate for each pair of nodes
    for (let i = 0; i < nodeIds.length; i++) {
      for (let j = i + 1; j < nodeIds.length; j++) {
        const paths = this.findAllShortestPaths(nodeIds[i], nodeIds[j])
        const pathCount = paths.length

        if (pathCount > 0) {
          for (const path of paths) {
            for (let k = 1; k < path.length - 1; k++) {
              const currentBetweenness = betweenness.get(path[k]) || 0
              betweenness.set(path[k], currentBetweenness + 1 / pathCount)
            }
          }
        }
      }
    }

    // Normalize
    const maxBetweenness = Math.max(...Array.from(betweenness.values()))
    for (const [nodeId, value] of betweenness) {
      const node = this.nodes.get(nodeId)
      if (node) {
        node.centrality.betweenness = maxBetweenness > 0 ? value / maxBetweenness : 0
      }
    }
  }

  /**
   * Update closeness centrality
   */
  private updateClosenessCentrality(): void {
    const nodeIds = Array.from(this.nodes.keys())

    for (const nodeId of nodeIds) {
      let totalDistance = 0
      let reachableNodes = 0

      for (const otherNodeId of nodeIds) {
        if (nodeId !== otherNodeId) {
          const distance = this.findShortestPath(nodeId, otherNodeId)
          if (distance !== Infinity) {
            totalDistance += distance
            reachableNodes++
          }
        }
      }

      const node = this.nodes.get(nodeId)
      if (node) {
        node.centrality.closeness = reachableNodes > 0 ? reachableNodes / totalDistance : 0
      }
    }
  }

  /**
   * Update eigenvector centrality (simplified version)
   */
  private updateEigenvectorCentrality(): void {
    const nodeIds = Array.from(this.nodes.keys())
    const centrality = new Map<string, number>()
    
    // Initialize
    for (const nodeId of nodeIds) {
      centrality.set(nodeId, 1)
    }

    // Power iteration
    for (let iter = 0; iter < 100; iter++) {
      const newCentrality = new Map<string, number>()
      
      for (const nodeId of nodeIds) {
        let sum = 0
        const neighbors = this.getNeighbors(nodeId)
        
        for (const neighborId of neighbors) {
          sum += centrality.get(neighborId) || 0
        }
        
        newCentrality.set(nodeId, sum)
      }

      // Normalize
      const norm = Math.sqrt(Array.from(newCentrality.values()).reduce((sum, val) => sum + val * val, 0))
      if (norm > 0) {
        for (const [nodeId, value] of newCentrality) {
          newCentrality.set(nodeId, value / norm)
        }
      }

      centrality.clear()
      for (const [nodeId, value] of newCentrality) {
        centrality.set(nodeId, value)
      }
    }

    // Update nodes
    for (const [nodeId, value] of centrality) {
      const node = this.nodes.get(nodeId)
      if (node) {
        node.centrality.eigenvector = value
      }
    }
  }

  /**
   * Helper methods
   */
  private getNeighbors(nodeId: string): string[] {
    const node = this.nodes.get(nodeId)
    if (!node) return []

    const neighbors: string[] = []
    for (const connection of node.connections.values()) {
      const neighbor = connection.from === nodeId ? connection.to : connection.from
      neighbors.push(neighbor)
    }

    return neighbors
  }

  private areConnected(nodeId1: string, nodeId2: string): boolean {
    return this.connections.has(`${nodeId1}-${nodeId2}`) || 
           this.connections.has(`${nodeId2}-${nodeId1}`)
  }

  private findAllShortestPaths(from: string, to: string): string[][] {
    // Simplified implementation - returns single shortest path
    const path = this.findShortestPathRoute(from, to)
    return path ? [path] : []
  }

  private findShortestPathRoute(from: string, to: string): string[] | null {
    if (from === to) return [from]

    const visited = new Set<string>()
    const queue: Array<{ node: string; path: string[] }> = [{ node: from, path: [from] }]

    while (queue.length > 0) {
      const { node, path } = queue.shift()!
      
      if (visited.has(node)) continue
      visited.add(node)

      if (node === to) return path

      const neighbors = this.getNeighbors(node)
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          queue.push({ node: neighbor, path: [...path, neighbor] })
        }
      }
    }

    return null
  }

  private calculateConnectionWeight(agent1: Agent, agent2: Agent): number {
    // Weight based on performance compatibility and load balance
    const perfMatch = 1 - Math.abs(agent1.performance.successRate - agent2.performance.successRate)
    const loadBalance = 1 - Math.abs(agent1.load - agent2.load)
    return (perfMatch + loadBalance) / 2
  }

  private estimateLatency(agent1: Agent, agent2: Agent): number {
    // Simplified latency estimation
    if (agent1.location && agent2.location) {
      return Math.abs(agent1.location.latency - agent2.location.latency)
    }
    return Math.random() * 100 // Random latency between 0-100ms
  }

  private estimateBandwidth(agent1: Agent, agent2: Agent): number {
    // Simplified bandwidth estimation based on agent performance
    const avgThroughput = (agent1.performance.throughput + agent2.performance.throughput) / 2
    return avgThroughput * 1000 // Convert to bandwidth estimate
  }

  private calculateAverageLoad(): number {
    const loads = Array.from(this.nodes.values()).map(node => node.agent.load)
    return loads.reduce((sum, load) => sum + load, 0) / loads.length
  }

  private calculateWorkloadVariance(): number {
    const loads = Array.from(this.nodes.values()).map(node => node.agent.load)
    const avgLoad = this.calculateAverageLoad()
    const variance = loads.reduce((sum, load) => sum + Math.pow(load - avgLoad, 2), 0) / loads.length
    return Math.sqrt(variance)
  }

  private calculateCentralityThreshold(): number {
    const betweennessCentralities = Array.from(this.nodes.values())
      .map(node => node.centrality.betweenness)
    const avgCentrality = betweennessCentralities.reduce((sum, c) => sum + c, 0) / betweennessCentralities.length
    return avgCentrality + 0.2 // Threshold above average
  }

  private calculateAgentCriticality(agentId: string): number {
    const node = this.nodes.get(agentId)
    if (!node) return 0

    // Criticality based on centrality measures and connections
    return (
      node.centrality.betweenness * 0.4 +
      node.centrality.degree * 0.3 +
      node.centrality.closeness * 0.2 +
      (node.connections.size / this.nodes.size) * 0.1
    )
  }

  private selectRandomNodes(candidates: TopologyNode[], count: number, exclude: TopologyNode[] = []): TopologyNode[] {
    const available = candidates.filter(c => !exclude.includes(c))
    const selected: TopologyNode[] = []
    
    for (let i = 0; i < count && i < available.length; i++) {
      const randomIndex = Math.floor(Math.random() * available.length)
      selected.push(available.splice(randomIndex, 1)[0])
    }
    
    return selected
  }

  private shouldOptimize(): boolean {
    return (
      this.metrics.efficiency < this.config.targetEfficiency ||
      this.metrics.loadBalance < 0.6 ||
      this.metrics.resilience < 0.5
    )
  }

  private initializeMetrics(): TopologyMetrics {
    return {
      efficiency: 0,
      resilience: 0,
      connectivity: 0,
      loadBalance: 0,
      averagePathLength: 0,
      clusteringCoefficient: 0,
      networkDiameter: 0
    }
  }

  private initializeTopology(): void {
    // Initialize with minimal configuration
    console.log(`[AdaptiveTopology] Initialized with ${this.config.type} topology`)
  }

  private startPerformanceMonitoring(): void {
    // Monitor performance every 30 seconds
    setInterval(() => {
      this.collectPerformanceMetrics()
    }, 30000)
  }

  private collectPerformanceMetrics(): void {
    this.performanceHistory.push({
      timestamp: Date.now(),
      metrics: { ...this.metrics },
      topology: this.config.type
    })

    // Keep only last 100 entries
    if (this.performanceHistory.length > 100) {
      this.performanceHistory.shift()
    }
  }

  private async storeTopologyChange(changeType: string, details: any): Promise<void> {
    // Store topology changes in memory for coordination hooks
    try {
      console.log(`[AdaptiveTopology] Storing change: ${changeType}`, details)
      
      await fetch('/api/hooks/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'topology_change',
          changeType,
          details,
          timestamp: Date.now(),
          metrics: this.metrics
        })
      }).catch(() => {
        // Silently handle API errors in service worker context
      })
    } catch (error) {
      // Handle storage errors gracefully
      console.warn('[AdaptiveTopology] Failed to store topology change:', error)
    }
  }

  /**
   * Public API methods
   */
  
  public getMetrics(): TopologyMetrics {
    return { ...this.metrics }
  }

  public getTopologyInfo(): {
    type: TopologyType
    nodeCount: number
    connectionCount: number
    config: TopologyConfiguration
  } {
    return {
      type: this.config.type,
      nodeCount: this.nodes.size,
      connectionCount: this.connections.size,
      config: { ...this.config }
    }
  }

  public getAgentInfo(agentId: string): {
    agent: Agent
    connections: number
    centrality: TopologyNode['centrality']
  } | null {
    const node = this.nodes.get(agentId)
    if (!node) return null

    return {
      agent: { ...node.agent },
      connections: node.connections.size,
      centrality: { ...node.centrality }
    }
  }

  public async forceOptimization(): Promise<void> {
    await this.optimizeTopology()
  }

  public getPerformanceHistory(): typeof this.performanceHistory {
    return [...this.performanceHistory]
  }
}

/**
 * Genetic Algorithm for Topology Optimization
 */
class GeneticTopologyOptimizer {
  optimize(currentTopology: any, targetMetrics: any): Promise<any> {
    // Simplified genetic algorithm implementation
    return Promise.resolve(currentTopology)
  }
}

/**
 * Swarm Optimization Algorithm
 */
class SwarmOptimizationAlgorithm {
  optimize(currentTopology: any, targetMetrics: any): Promise<any> {
    // Simplified swarm optimization implementation
    return Promise.resolve(currentTopology)
  }
}

/**
 * Reinforcement Learning Optimizer
 */
class ReinforcementLearningOptimizer {
  optimize(currentTopology: any, targetMetrics: any): Promise<any> {
    // Simplified RL implementation
    return Promise.resolve(currentTopology)
  }
}