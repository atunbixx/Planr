/**
 * Topology Management API Endpoint
 * 
 * Provides server-side coordination and persistence for the adaptive topology system.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// In-memory topology state (in production, use Redis or database)
let globalTopologyState = {
  agents: new Map<string, {
    id: string
    type: string
    capabilities: string[]
    load: number
    lastSeen: number
    performance: {
      responseTime: number
      successRate: number
      throughput: number
    }
    metadata: any
  }>(),
  connections: new Map<string, {
    from: string
    to: string
    weight: number
    latency: number
    reliability: number
    lastActive: number
  }>(),
  metrics: {
    efficiency: 0,
    resilience: 0,
    connectivity: 0,
    loadBalance: 0,
    averagePathLength: 0,
    clusteringCoefficient: 0
  },
  lastOptimization: 0,
  events: [] as Array<{
    type: string
    data: any
    timestamp: number
  }>
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const agentId = searchParams.get('agentId')

    switch (action) {
      case 'status':
        return NextResponse.json({
          success: true,
          data: {
            agentCount: globalTopologyState.agents.size,
            connectionCount: globalTopologyState.connections.size,
            metrics: globalTopologyState.metrics,
            lastOptimization: globalTopologyState.lastOptimization,
            recentEvents: globalTopologyState.events.slice(-10)
          }
        })

      case 'agents':
        const agents = Array.from(globalTopologyState.agents.entries()).map(([agentId, agent]) => ({
          ...agent,
          connectionCount: Array.from(globalTopologyState.connections.values())
            .filter(conn => conn.from === agentId || conn.to === agentId).length
        }))
        
        return NextResponse.json({
          success: true,
          data: { agents }
        })

      case 'agent-detail':
        if (!agentId) {
          return NextResponse.json({ error: 'Agent ID required' }, { status: 400 })
        }

        const agent = globalTopologyState.agents.get(agentId)
        if (!agent) {
          return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
        }

        const agentConnections = Array.from(globalTopologyState.connections.values())
          .filter(conn => conn.from === agentId || conn.to === agentId)

        return NextResponse.json({
          success: true,
          data: {
            agent,
            connections: agentConnections,
            neighbors: agentConnections.map(conn => 
              conn.from === agentId ? conn.to : conn.from
            )
          }
        })

      case 'metrics-history':
        // Return simplified metrics history (would be from database in production)
        return NextResponse.json({
          success: true,
          data: {
            history: [
              {
                timestamp: Date.now() - 300000,
                ...globalTopologyState.metrics
              },
              {
                timestamp: Date.now(),
                ...globalTopologyState.metrics
              }
            ]
          }
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Topology API GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case 'register-agent':
        const { agent } = data
        if (!agent || !agent.id) {
          return NextResponse.json({ error: 'Invalid agent data' }, { status: 400 })
        }

        // Register or update agent
        globalTopologyState.agents.set(agent.id, {
          ...agent,
          lastSeen: Date.now(),
          metadata: {
            userId: userId,
            registrationTime: Date.now(),
            ...agent.metadata
          }
        })

        // Log event
        globalTopologyState.events.push({
          type: 'agent-registered',
          data: { agentId: agent.id, agentType: agent.type },
          timestamp: Date.now()
        })

        // Update metrics
        updateMetrics()

        return NextResponse.json({
          success: true,
          message: `Agent ${agent.id} registered successfully`
        })

      case 'unregister-agent':
        const { agentId } = data
        if (!agentId) {
          return NextResponse.json({ error: 'Agent ID required' }, { status: 400 })
        }

        if (!globalTopologyState.agents.has(agentId)) {
          return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
        }

        // Remove agent
        globalTopologyState.agents.delete(agentId)

        // Remove connections involving this agent
        const connectionsToRemove = []
        for (const [connectionId, connection] of globalTopologyState.connections) {
          if (connection.from === agentId || connection.to === agentId) {
            connectionsToRemove.push(connectionId)
          }
        }

        for (const connectionId of connectionsToRemove) {
          globalTopologyState.connections.delete(connectionId)
        }

        // Log event
        globalTopologyState.events.push({
          type: 'agent-unregistered',
          data: { agentId, removedConnections: connectionsToRemove.length },
          timestamp: Date.now()
        })

        // Update metrics
        updateMetrics()

        return NextResponse.json({
          success: true,
          message: `Agent ${agentId} unregistered successfully`
        })

      case 'heartbeat':
        const { agentId: hbAgentId, performance } = data
        if (!hbAgentId) {
          return NextResponse.json({ error: 'Agent ID required' }, { status: 400 })
        }

        const existingAgent = globalTopologyState.agents.get(hbAgentId)
        if (!existingAgent) {
          return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
        }

        // Update agent heartbeat and performance
        globalTopologyState.agents.set(hbAgentId, {
          ...existingAgent,
          lastSeen: Date.now(),
          performance: performance || existingAgent.performance,
          load: performance ? calculateLoad(performance) : existingAgent.load
        })

        return NextResponse.json({
          success: true,
          message: 'Heartbeat recorded'
        })

      case 'create-connection':
        const { fromId, toId, properties } = data
        if (!fromId || !toId) {
          return NextResponse.json({ error: 'Both agent IDs required' }, { status: 400 })
        }

        if (!globalTopologyState.agents.has(fromId) || !globalTopologyState.agents.has(toId)) {
          return NextResponse.json({ error: 'One or both agents not found' }, { status: 404 })
        }

        const connectionId = `${fromId}-${toId}`
        const reverseId = `${toId}-${fromId}`

        // Don't create duplicate connections
        if (globalTopologyState.connections.has(connectionId) || 
            globalTopologyState.connections.has(reverseId)) {
          return NextResponse.json({ error: 'Connection already exists' }, { status: 409 })
        }

        // Create connection
        globalTopologyState.connections.set(connectionId, {
          from: fromId,
          to: toId,
          weight: properties?.weight || 1.0,
          latency: properties?.latency || 100,
          reliability: properties?.reliability || 0.95,
          lastActive: Date.now()
        })

        // Log event
        globalTopologyState.events.push({
          type: 'connection-created',
          data: { connectionId, fromId, toId },
          timestamp: Date.now()
        })

        // Update metrics
        updateMetrics()

        return NextResponse.json({
          success: true,
          message: `Connection ${connectionId} created successfully`
        })

      case 'remove-connection':
        const { connectionId: removeConnectionId } = data
        if (!removeConnectionId) {
          return NextResponse.json({ error: 'Connection ID required' }, { status: 400 })
        }

        if (!globalTopologyState.connections.has(removeConnectionId)) {
          return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
        }

        globalTopologyState.connections.delete(removeConnectionId)

        // Log event
        globalTopologyState.events.push({
          type: 'connection-removed',
          data: { connectionId: removeConnectionId },
          timestamp: Date.now()
        })

        // Update metrics
        updateMetrics()

        return NextResponse.json({
          success: true,
          message: `Connection ${removeConnectionId} removed successfully`
        })

      case 'optimize-topology':
        // Trigger topology optimization
        await optimizeTopology()

        globalTopologyState.lastOptimization = Date.now()

        // Log event
        globalTopologyState.events.push({
          type: 'topology-optimized',
          data: { 
            metrics: globalTopologyState.metrics,
            agentCount: globalTopologyState.agents.size,
            connectionCount: globalTopologyState.connections.size
          },
          timestamp: Date.now()
        })

        return NextResponse.json({
          success: true,
          message: 'Topology optimization completed',
          data: {
            metrics: globalTopologyState.metrics,
            optimizationTime: Date.now()
          }
        })

      case 'report-event':
        const { eventType, eventData } = data
        if (!eventType) {
          return NextResponse.json({ error: 'Event type required' }, { status: 400 })
        }

        // Store event
        globalTopologyState.events.push({
          type: eventType,
          data: eventData || {},
          timestamp: Date.now()
        })

        // Keep only last 1000 events
        if (globalTopologyState.events.length > 1000) {
          globalTopologyState.events = globalTopologyState.events.slice(-1000)
        }

        return NextResponse.json({
          success: true,
          message: 'Event recorded'
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Topology API POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'reset':
        // Reset topology state (for development/testing)
        globalTopologyState = {
          agents: new Map(),
          connections: new Map(),
          metrics: {
            efficiency: 0,
            resilience: 0,
            connectivity: 0,
            loadBalance: 0,
            averagePathLength: 0,
            clusteringCoefficient: 0
          },
          lastOptimization: 0,
          events: []
        }

        return NextResponse.json({
          success: true,
          message: 'Topology state reset successfully'
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Topology API DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Calculate agent load from performance metrics
 */
function calculateLoad(performance: {
  responseTime: number
  successRate: number
  throughput: number
}): number {
  const responseTimeFactor = Math.min(performance.responseTime / 1000, 1)
  const successRateFactor = 1 - performance.successRate
  const throughputFactor = Math.max(0, 1 - performance.throughput)
  
  return (responseTimeFactor + successRateFactor + throughputFactor) / 3
}

/**
 * Update topology metrics
 */
function updateMetrics(): void {
  const agentCount = globalTopologyState.agents.size
  const connectionCount = globalTopologyState.connections.size

  if (agentCount === 0) {
    globalTopologyState.metrics = {
      efficiency: 0,
      resilience: 0,
      connectivity: 0,
      loadBalance: 0,
      averagePathLength: 0,
      clusteringCoefficient: 0
    }
    return
  }

  // Calculate connectivity
  const maxPossibleConnections = (agentCount * (agentCount - 1)) / 2
  globalTopologyState.metrics.connectivity = maxPossibleConnections > 0 ? 
    connectionCount / maxPossibleConnections : 0

  // Calculate load balance
  const loads = Array.from(globalTopologyState.agents.values()).map(agent => agent.load)
  const avgLoad = loads.reduce((sum, load) => sum + load, 0) / loads.length
  const loadVariance = loads.reduce((sum, load) => sum + Math.pow(load - avgLoad, 2), 0) / loads.length
  globalTopologyState.metrics.loadBalance = 1 - Math.sqrt(loadVariance)

  // Calculate efficiency (active agents ratio)
  const activeThreshold = Date.now() - 300000 // 5 minutes
  const activeAgents = Array.from(globalTopologyState.agents.values())
    .filter(agent => agent.lastSeen > activeThreshold).length
  globalTopologyState.metrics.efficiency = agentCount > 0 ? activeAgents / agentCount : 0

  // Calculate resilience (simplified)
  globalTopologyState.metrics.resilience = Math.min(
    globalTopologyState.metrics.connectivity + 0.2,
    globalTopologyState.metrics.loadBalance,
    1.0
  )

  // Calculate average path length (simplified)
  globalTopologyState.metrics.averagePathLength = agentCount > 1 ? 
    Math.log(agentCount) / Math.log(2) : 0

  // Calculate clustering coefficient (simplified)
  globalTopologyState.metrics.clusteringCoefficient = 
    globalTopologyState.metrics.connectivity * 0.8
}

/**
 * Perform topology optimization
 */
async function optimizeTopology(): Promise<void> {
  // Simplified optimization: remove stale agents and optimize connections
  const staleThreshold = Date.now() - 600000 // 10 minutes
  const staleAgents: string[] = []

  // Find stale agents
  for (const [agentId, agent] of globalTopologyState.agents) {
    if (agent.lastSeen < staleThreshold) {
      staleAgents.push(agentId)
    }
  }

  // Remove stale agents and their connections
  for (const agentId of staleAgents) {
    globalTopologyState.agents.delete(agentId)
    
    // Remove connections
    const connectionsToRemove: string[] = []
    for (const [connectionId, connection] of globalTopologyState.connections) {
      if (connection.from === agentId || connection.to === agentId) {
        connectionsToRemove.push(connectionId)
      }
    }
    
    for (const connectionId of connectionsToRemove) {
      globalTopologyState.connections.delete(connectionId)
    }
  }

  // Ensure minimum connectivity
  await ensureMinimumConnectivity()

  // Update metrics
  updateMetrics()
}

/**
 * Ensure minimum connectivity between agents
 */
async function ensureMinimumConnectivity(): Promise<void> {
  const agents = Array.from(globalTopologyState.agents.keys())
  const minConnections = 2

  for (const agentId of agents) {
    // Count current connections for this agent
    const currentConnections = Array.from(globalTopologyState.connections.values())
      .filter(conn => conn.from === agentId || conn.to === agentId).length

    if (currentConnections < minConnections) {
      // Find potential connection targets
      const candidates = agents.filter(candidateId => {
        if (candidateId === agentId) return false
        
        // Check if already connected
        const hasConnection = Array.from(globalTopologyState.connections.values())
          .some(conn => 
            (conn.from === agentId && conn.to === candidateId) ||
            (conn.from === candidateId && conn.to === agentId)
          )
        
        return !hasConnection
      })

      // Create connections to reach minimum
      const needed = minConnections - currentConnections
      const selected = candidates.slice(0, needed)

      for (const targetId of selected) {
        const connectionId = `${agentId}-${targetId}`
        globalTopologyState.connections.set(connectionId, {
          from: agentId,
          to: targetId,
          weight: 1.0,
          latency: 100,
          reliability: 0.9,
          lastActive: Date.now()
        })
      }
    }
  }
}