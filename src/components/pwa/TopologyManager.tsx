/**
 * Topology Manager Integration Component for PWA
 * 
 * Integrates the Adaptive Topology Manager with the PWA architecture,
 * providing real-time coordination and optimization for the hive-mind system.
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { 
  AdaptiveTopologyManager, 
  Agent, 
  TopologyMetrics, 
  TopologyConfiguration,
  TopologyType 
} from '@/lib/topology/adaptive-topology-manager'

interface TopologyManagerProps {
  children: React.ReactNode
  config?: Partial<TopologyConfiguration>
  enableVisualization?: boolean
}

interface TopologyState {
  isActive: boolean
  manager: AdaptiveTopologyManager | null
  metrics: TopologyMetrics | null
  agentCount: number
  connectionCount: number
  currentTopology: TopologyType
  isOptimizing: boolean
  lastOptimization: number
}

export default function TopologyManager({ 
  children, 
  config = {},
  enableVisualization = false 
}: TopologyManagerProps) {
  const [state, setState] = useState<TopologyState>({
    isActive: false,
    manager: null,
    metrics: null,
    agentCount: 0,
    connectionCount: 0,
    currentTopology: 'hybrid',
    isOptimizing: false,
    lastOptimization: 0
  })

  const [networkHealth, setNetworkHealth] = useState<{
    status: 'healthy' | 'degraded' | 'critical'
    issues: string[]
    recommendations: string[]
  }>({
    status: 'healthy',
    issues: [],
    recommendations: []
  })

  // Default configuration
  const defaultConfig: TopologyConfiguration = {
    type: 'hybrid',
    maxNodes: 50,
    minConnections: 2,
    maxConnections: 8,
    rebalanceThreshold: 0.7,
    healingEnabled: true,
    adaptationRate: 0.1,
    targetEfficiency: 0.8,
    ...config
  }

  /**
   * Initialize Topology Manager
   */
  const initializeManager = useCallback(async () => {
    try {
      console.log('[TopologyManager] Initializing Adaptive Topology Manager')
      
      const manager = new AdaptiveTopologyManager(defaultConfig)
      
      setState(prev => ({
        ...prev,
        manager,
        isActive: true,
        currentTopology: defaultConfig.type
      }))

      // Start monitoring
      startMetricsMonitoring(manager)
      startNetworkHealthMonitoring(manager)
      
      // Register service worker message handler for topology coordination
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'topology-command') {
            handleTopologyCommand(manager, event.data)
          }
        })
      }

      toast.success('Hive-Mind Topology Manager Activated', {
        description: `${defaultConfig.type} topology initialized with ${defaultConfig.maxNodes} max nodes`,
        duration: 5000
      })

    } catch (error) {
      console.error('[TopologyManager] Failed to initialize:', error)
      toast.error('Topology Manager Initialization Failed', {
        description: 'The hive-mind coordination system could not be started',
        duration: 10000
      })
    }
  }, [defaultConfig])

  /**
   * Start metrics monitoring
   */
  const startMetricsMonitoring = useCallback((manager: AdaptiveTopologyManager) => {
    const updateMetrics = () => {
      const metrics = manager.getMetrics()
      const info = manager.getTopologyInfo()

      setState(prev => ({
        ...prev,
        metrics,
        agentCount: info.nodeCount,
        connectionCount: info.connectionCount,
        currentTopology: info.type
      }))
    }

    // Update immediately and then every 5 seconds
    updateMetrics()
    const interval = setInterval(updateMetrics, 5000)

    return () => clearInterval(interval)
  }, [])

  /**
   * Start network health monitoring
   */
  const startNetworkHealthMonitoring = useCallback((manager: AdaptiveTopologyManager) => {
    const checkNetworkHealth = () => {
      const metrics = manager.getMetrics()
      const issues: string[] = []
      const recommendations: string[] = []
      let status: 'healthy' | 'degraded' | 'critical' = 'healthy'

      // Check efficiency
      if (metrics.efficiency < 0.6) {
        issues.push('Low network efficiency')
        recommendations.push('Consider topology optimization')
        status = 'degraded'
      }

      // Check resilience
      if (metrics.resilience < 0.4) {
        issues.push('Poor network resilience')
        recommendations.push('Add redundant connections')
        status = status === 'healthy' ? 'degraded' : 'critical'
      }

      // Check connectivity
      if (metrics.connectivity < 0.3) {
        issues.push('Sparse network connectivity')
        recommendations.push('Increase connection density')
        status = 'critical'
      }

      // Check load balance
      if (metrics.loadBalance < 0.5) {
        issues.push('Unbalanced workload distribution')
        recommendations.push('Rebalance agent workloads')
        status = status === 'healthy' ? 'degraded' : status
      }

      setNetworkHealth({ status, issues, recommendations })

      // Show notifications for critical issues
      if (status === 'critical' && issues.length > 0) {
        toast.error('Hive-Mind Network Critical', {
          description: `Issues detected: ${issues.join(', ')}`,
          duration: 10000
        })
      }
    }

    // Check every 15 seconds
    const interval = setInterval(checkNetworkHealth, 15000)
    return () => clearInterval(interval)
  }, [])

  /**
   * Handle topology commands from service worker
   */
  const handleTopologyCommand = useCallback(async (
    manager: AdaptiveTopologyManager, 
    command: any
  ) => {
    try {
      switch (command.action) {
        case 'add_agent':
          await manager.addAgent(command.agent as Agent)
          toast.info('Agent Added to Hive-Mind', {
            description: `${command.agent.type} agent ${command.agent.id} joined the network`,
            duration: 3000
          })
          break

        case 'remove_agent':
          await manager.removeAgent(command.agentId)
          toast.warning('Agent Removed from Hive-Mind', {
            description: `Agent ${command.agentId} left the network`,
            duration: 3000
          })
          break

        case 'agent_failure':
          await manager.handleAgentFailure(command.agentId)
          toast.error('Agent Failure Detected', {
            description: `Agent ${command.agentId} failed - initiating healing`,
            duration: 5000
          })
          break

        case 'optimize_topology':
          setState(prev => ({ ...prev, isOptimizing: true }))
          await manager.forceOptimization()
          setState(prev => ({ 
            ...prev, 
            isOptimizing: false,
            lastOptimization: Date.now()
          }))
          toast.success('Topology Optimization Complete', {
            description: 'Hive-mind network structure has been optimized',
            duration: 5000
          })
          break

        default:
          console.warn('[TopologyManager] Unknown command:', command.action)
      }
    } catch (error) {
      console.error('[TopologyManager] Command execution failed:', error)
      toast.error('Topology Command Failed', {
        description: `Failed to execute ${command.action}`,
        duration: 5000
      })
    }
  }, [])

  /**
   * Manual topology optimization trigger
   */
  const triggerOptimization = useCallback(async () => {
    if (!state.manager || state.isOptimizing) return

    setState(prev => ({ ...prev, isOptimizing: true }))
    
    try {
      await state.manager.forceOptimization()
      toast.success('Manual Optimization Complete', {
        description: 'Network topology has been manually optimized',
        duration: 5000
      })
    } catch (error) {
      toast.error('Optimization Failed', {
        description: 'Manual topology optimization failed',
        duration: 5000
      })
    } finally {
      setState(prev => ({ 
        ...prev, 
        isOptimizing: false,
        lastOptimization: Date.now()
      }))
    }
  }, [state.manager, state.isOptimizing])

  /**
   * Network health status indicator
   */
  const getHealthStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy': return 'text-green-500'
      case 'degraded': return 'text-yellow-500'
      case 'critical': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  /**
   * Send topology data to service worker for coordination
   */
  const syncWithServiceWorker = useCallback(() => {
    if (!state.manager || !('serviceWorker' in navigator)) return

    navigator.serviceWorker.ready.then(registration => {
      if (registration.active) {
        registration.active.postMessage({
          type: 'topology-sync',
          data: {
            metrics: state.metrics,
            topology: state.currentTopology,
            agentCount: state.agentCount,
            connectionCount: state.connectionCount,
            networkHealth: networkHealth
          }
        })
      }
    })
  }, [state, networkHealth])

  // Initialize manager on mount
  useEffect(() => {
    initializeManager()
  }, [initializeManager])

  // Sync with service worker periodically
  useEffect(() => {
    if (state.isActive) {
      const interval = setInterval(syncWithServiceWorker, 10000)
      return () => clearInterval(interval)
    }
  }, [state.isActive, syncWithServiceWorker])

  // Expose topology manager to global context for debugging
  useEffect(() => {
    if (state.manager && typeof window !== 'undefined') {
      (window as any).__TOPOLOGY_MANAGER__ = {
        manager: state.manager,
        state,
        triggerOptimization,
        networkHealth
      }
    }
  }, [state, triggerOptimization, networkHealth])

  return (
    <>
      {children}
      
      {/* Topology Status Indicator */}
      {state.isActive && (
        <div className="fixed bottom-4 right-4 z-50 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              state.isOptimizing ? 'bg-blue-500 animate-pulse' :
              networkHealth.status === 'healthy' ? 'bg-green-500' :
              networkHealth.status === 'degraded' ? 'bg-yellow-500' :
              'bg-red-500'
            }`} />
            <div className="text-sm">
              <div className="font-medium">Hive-Mind Active</div>
              <div className="text-xs text-gray-600">
                {state.agentCount} agents • {state.connectionCount} connections
              </div>
              <div className={`text-xs ${getHealthStatusColor(networkHealth.status)}`}>
                {networkHealth.status.charAt(0).toUpperCase() + networkHealth.status.slice(1)}
              </div>
            </div>
          </div>
          
          {state.metrics && (
            <div className="mt-2 text-xs text-gray-500 space-y-1">
              <div>Efficiency: {(state.metrics.efficiency * 100).toFixed(1)}%</div>
              <div>Resilience: {(state.metrics.resilience * 100).toFixed(1)}%</div>
              <div>Load Balance: {(state.metrics.loadBalance * 100).toFixed(1)}%</div>
            </div>
          )}
          
          {state.isOptimizing && (
            <div className="mt-2 text-xs text-blue-600 animate-pulse">
              Optimizing topology...
            </div>
          )}
        </div>
      )}

      {/* Network Health Issues Overlay */}
      {networkHealth.status !== 'healthy' && networkHealth.issues.length > 0 && (
        <div className="fixed top-4 right-4 z-50 bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg max-w-sm">
          <div className="flex items-start space-x-2">
            <div className={`w-4 h-4 rounded-full mt-0.5 ${
              networkHealth.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <div>
              <div className="font-medium text-sm text-gray-900">
                Network {networkHealth.status === 'critical' ? 'Critical' : 'Issues'}
              </div>
              <ul className="mt-1 text-xs text-gray-600 space-y-1">
                {networkHealth.issues.map((issue, index) => (
                  <li key={index}>• {issue}</li>
                ))}
              </ul>
              {networkHealth.recommendations.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs font-medium text-gray-900">Recommendations:</div>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {networkHealth.recommendations.map((rec, index) => (
                      <li key={index}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
              <button
                onClick={triggerOptimization}
                disabled={state.isOptimizing}
                className="mt-2 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {state.isOptimizing ? 'Optimizing...' : 'Optimize Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Topology Visualization Modal (if enabled) */}
      {enableVisualization && state.isActive && (
        <TopologyVisualization 
          manager={state.manager}
          metrics={state.metrics}
          isVisible={false} // Controlled by external state
        />
      )}
    </>
  )
}

/**
 * Topology Visualization Component
 */
interface TopologyVisualizationProps {
  manager: AdaptiveTopologyManager | null
  metrics: TopologyMetrics | null
  isVisible: boolean
}

function TopologyVisualization({ 
  manager, 
  metrics, 
  isVisible 
}: TopologyVisualizationProps) {
  if (!isVisible || !manager || !metrics) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Network Topology Visualization</h2>
          <button className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">Efficiency</div>
            <div className="text-lg font-bold text-blue-600">
              {(metrics.efficiency * 100).toFixed(1)}%
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">Resilience</div>
            <div className="text-lg font-bold text-green-600">
              {(metrics.resilience * 100).toFixed(1)}%
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">Connectivity</div>
            <div className="text-lg font-bold text-purple-600">
              {(metrics.connectivity * 100).toFixed(1)}%
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">Load Balance</div>
            <div className="text-lg font-bold text-orange-600">
              {(metrics.loadBalance * 100).toFixed(1)}%
            </div>
          </div>
        </div>
        
        <div className="bg-gray-100 rounded p-4 min-h-[300px] flex items-center justify-center">
          <div className="text-gray-500">
            Interactive topology visualization would render here
            <br />
            <span className="text-sm">(D3.js or similar visualization library integration)</span>
          </div>
        </div>
      </div>
    </div>
  )
}