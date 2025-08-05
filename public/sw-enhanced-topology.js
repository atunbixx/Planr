// Enhanced Service Worker with Adaptive Topology Management
const CACHE_VERSION = 'v3-topology';
const CACHE_PREFIX = 'wedding-planner';

// Cache names
const CACHE_NAMES = {
  STATIC: `${CACHE_PREFIX}-static-${CACHE_VERSION}`,
  RUNTIME: `${CACHE_PREFIX}-runtime-${CACHE_VERSION}`,
  IMAGES: `${CACHE_PREFIX}-images-${CACHE_VERSION}`,
  API: `${CACHE_PREFIX}-api-${CACHE_VERSION}`,
  TOPOLOGY: `${CACHE_PREFIX}-topology-${CACHE_VERSION}`,
};

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
];

// API endpoints to cache
const API_CACHE_ROUTES = [
  '/api/user/profile',
  '/api/vendors',
  '/api/budget',
  '/api/photos',
  '/api/messages',
];

// Topology coordination state
let topologyCoordinator = null;
let topologyState = {
  agents: new Map(),
  connections: new Map(),
  metrics: {
    efficiency: 0,
    resilience: 0,
    connectivity: 0,
    loadBalance: 0
  },
  isOptimizing: false,
  lastOptimization: 0
};

// Install event - initialize topology and cache assets
self.addEventListener('install', (event) => {
  console.log('[Enhanced SW] Installing with topology support...');
  
  event.waitUntil((async () => {
    try {
      // Cache static assets
      const cache = await caches.open(CACHE_NAMES.STATIC);
      await cache.addAll(STATIC_ASSETS).catch(err => {
        console.error('[Enhanced SW] Failed to cache:', err);
      });

      // Initialize topology coordinator
      await initializeTopologyCoordinator();
      
      console.log('[Enhanced SW] Installation complete with topology support');
    } catch (error) {
      console.error('[Enhanced SW] Installation failed:', error);
    }
  })());
  
  self.skipWaiting();
});

// Activate event - clean up and start topology management
self.addEventListener('activate', (event) => {
  console.log('[Enhanced SW] Activating with topology management...');
  
  event.waitUntil((async () => {
    try {
      // Clean up old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(cacheName => {
            return cacheName.startsWith(CACHE_PREFIX) && 
                   !Object.values(CACHE_NAMES).includes(cacheName);
          })
          .map(cacheName => {
            console.log('[Enhanced SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );

      // Start topology background processes
      await startTopologyBackgroundProcesses();
      
      console.log('[Enhanced SW] Activation complete');
    } catch (error) {
      console.error('[Enhanced SW] Activation failed:', error);
    }
  })());
  
  self.clients.claim();
});

// Initialize Topology Coordinator
async function initializeTopologyCoordinator() {
  try {
    // Load topology state from IndexedDB
    const savedState = await loadTopologyState();
    
    if (savedState) {
      topologyState = { ...topologyState, ...savedState };
      console.log('[TopologyCoordinator] Loaded saved state:', topologyState);
    }

    // Initialize coordinator
    topologyCoordinator = {
      id: 'sw-coordinator',
      type: 'coordinator',
      capabilities: ['coordination', 'optimization', 'healing'],
      load: 0.1,
      connections: new Set(),
      lastSeen: Date.now(),
      performance: {
        responseTime: 50,
        successRate: 0.99,
        throughput: 10.0
      }
    };

    // Register self as coordinator agent
    topologyState.agents.set('sw-coordinator', {
      agent: topologyCoordinator,
      lastHeartbeat: Date.now(),
      status: 'active'
    });

    console.log('[TopologyCoordinator] Initialized successfully');
    
  } catch (error) {
    console.error('[TopologyCoordinator] Initialization failed:', error);
  }
}

// Start background topology processes
async function startTopologyBackgroundProcesses() {
  // Agent health monitoring
  setInterval(monitorAgentHealth, 30000); // 30 seconds
  
  // Topology optimization
  setInterval(performBackgroundOptimization, 60000); // 1 minute
  
  // Metrics collection
  setInterval(collectTopologyMetrics, 15000); // 15 seconds
  
  // State persistence
  setInterval(saveTopologyState, 120000); // 2 minutes
  
  console.log('[TopologyCoordinator] Background processes started');
}

// Monitor agent health and handle failures
async function monitorAgentHealth() {
  const now = Date.now();
  const staleThreshold = 120000; // 2 minutes
  const failedAgents = [];

  for (const [agentId, agentData] of topologyState.agents) {
    if (agentId === 'sw-coordinator') continue; // Skip self
    
    if (now - agentData.lastHeartbeat > staleThreshold) {
      agentData.status = 'failing';
      failedAgents.push(agentId);
    }
  }

  // Handle failed agents
  for (const agentId of failedAgents) {
    console.log(`[TopologyCoordinator] Agent ${agentId} appears to have failed`);
    await handleAgentFailure(agentId);
  }

  // Remove agents that have been failing for too long
  const removeThreshold = 300000; // 5 minutes
  const agentsToRemove = [];
  
  for (const [agentId, agentData] of topologyState.agents) {
    if (agentData.status === 'failing' && now - agentData.lastHeartbeat > removeThreshold) {
      agentsToRemove.push(agentId);
    }
  }

  for (const agentId of agentsToRemove) {
    await removeAgent(agentId);
  }
}

// Perform background topology optimization
async function performBackgroundOptimization() {
  if (topologyState.isOptimizing) return;
  
  try {
    const shouldOptimize = (
      topologyState.metrics.efficiency < 0.7 ||
      topologyState.metrics.resilience < 0.6 ||
      topologyState.metrics.loadBalance < 0.6
    );

    if (shouldOptimize && topologyState.agents.size > 1) {
      console.log('[TopologyCoordinator] Starting background optimization');
      topologyState.isOptimizing = true;
      
      await optimizeTopology();
      
      topologyState.lastOptimization = Date.now();
      topologyState.isOptimizing = false;
      
      // Notify main thread
      notifyMainThread('topology-optimized', {
        timestamp: Date.now(),
        metrics: topologyState.metrics
      });
      
      console.log('[TopologyCoordinator] Background optimization complete');
    }
    
  } catch (error) {
    console.error('[TopologyCoordinator] Background optimization failed:', error);
    topologyState.isOptimizing = false;
  }
}

// Collect topology metrics
function collectTopologyMetrics() {
  const agentCount = topologyState.agents.size;
  const connectionCount = topologyState.connections.size;
  
  if (agentCount === 0) return;

  // Calculate connectivity
  const maxPossibleConnections = (agentCount * (agentCount - 1)) / 2;
  topologyState.metrics.connectivity = maxPossibleConnections > 0 ? 
    connectionCount / maxPossibleConnections : 0;

  // Calculate load balance
  const loads = Array.from(topologyState.agents.values()).map(data => data.agent.load);
  const avgLoad = loads.reduce((sum, load) => sum + load, 0) / loads.length;
  const loadVariance = loads.reduce((sum, load) => sum + Math.pow(load - avgLoad, 2), 0) / loads.length;
  topologyState.metrics.loadBalance = 1 - Math.sqrt(loadVariance);

  // Calculate efficiency (simplified)
  const activeAgents = Array.from(topologyState.agents.values())
    .filter(data => data.status === 'active').length;
  topologyState.metrics.efficiency = agentCount > 0 ? activeAgents / agentCount : 0;

  // Calculate resilience (simplified)
  topologyState.metrics.resilience = Math.min(
    topologyState.metrics.connectivity + 0.2,
    topologyState.metrics.loadBalance,
    1.0
  );
}

// Handle agent failure
async function handleAgentFailure(agentId) {
  console.log(`[TopologyCoordinator] Handling failure of agent ${agentId}`);
  
  const agentData = topologyState.agents.get(agentId);
  if (!agentData) return;

  // Mark as failed
  agentData.status = 'failing';
  agentData.agent.performance.successRate = 0;

  // Remove connections involving this agent
  const connectionsToRemove = [];
  for (const [connectionId, connection] of topologyState.connections) {
    if (connection.from === agentId || connection.to === agentId) {
      connectionsToRemove.push(connectionId);
    }
  }

  for (const connectionId of connectionsToRemove) {
    topologyState.connections.delete(connectionId);
  }

  // Start healing process
  await healNetworkAfterFailure(agentId);
  
  // Notify main thread
  notifyMainThread('agent-failed', { agentId });
}

// Remove agent from topology
async function removeAgent(agentId) {
  console.log(`[TopologyCoordinator] Removing agent ${agentId}`);
  
  // Remove from agents map
  topologyState.agents.delete(agentId);
  
  // Remove connections
  const connectionsToRemove = [];
  for (const [connectionId, connection] of topologyState.connections) {
    if (connection.from === agentId || connection.to === agentId) {
      connectionsToRemove.push(connectionId);
    }
  }

  for (const connectionId of connectionsToRemove) {
    topologyState.connections.delete(connectionId);
  }
  
  // Notify main thread
  notifyMainThread('agent-removed', { agentId });
}

// Heal network after failure
async function healNetworkAfterFailure(failedAgentId) {
  console.log(`[TopologyCoordinator] Healing network after failure of ${failedAgentId}`);
  
  // Find agents that lost connections
  const affectedAgents = new Set();
  
  for (const [connectionId, connection] of topologyState.connections) {
    if (connection.from === failedAgentId || connection.to === failedAgentId) {
      const otherAgent = connection.from === failedAgentId ? connection.to : connection.from;
      affectedAgents.add(otherAgent);
    }
  }

  // Create new connections for affected agents
  for (const agentId of affectedAgents) {
    const agentData = topologyState.agents.get(agentId);
    if (!agentData || agentData.status !== 'active') continue;

    // Find best alternative connections
    const currentConnections = Array.from(topologyState.connections.values())
      .filter(conn => conn.from === agentId || conn.to === agentId).length;

    if (currentConnections < 2) { // Minimum connections
      const candidates = Array.from(topologyState.agents.keys())
        .filter(candidateId => 
          candidateId !== agentId && 
          candidateId !== failedAgentId &&
          topologyState.agents.get(candidateId)?.status === 'active'
        );

      if (candidates.length > 0) {
        const targetId = candidates[Math.floor(Math.random() * candidates.length)];
        await createConnection(agentId, targetId);
      }
    }
  }
}

// Optimize topology structure
async function optimizeTopology() {
  console.log('[TopologyCoordinator] Starting topology optimization');
  
  const agents = Array.from(topologyState.agents.keys()).filter(id => id !== 'sw-coordinator');
  const agentCount = agents.length;
  
  if (agentCount < 2) return;

  // Determine optimal topology type based on agent count and load
  let targetTopology = 'hybrid';
  const avgLoad = Array.from(topologyState.agents.values())
    .reduce((sum, data) => sum + data.agent.load, 0) / topologyState.agents.size;

  if (agentCount < 5) {
    targetTopology = 'mesh';
  } else if (avgLoad > 0.7) {
    targetTopology = 'hierarchical';
  } else if (agentCount > 15) {
    targetTopology = 'small-world';
  }

  // Clear existing connections (except coordinator connections)
  const coordinatorConnections = Array.from(topologyState.connections.entries())
    .filter(([id, conn]) => conn.from === 'sw-coordinator' || conn.to === 'sw-coordinator');
  
  topologyState.connections.clear();
  
  // Restore coordinator connections
  for (const [id, conn] of coordinatorConnections) {
    topologyState.connections.set(id, conn);
  }

  // Build new topology
  switch (targetTopology) {
    case 'mesh':
      await buildMeshTopology(agents);
      break;
    case 'hierarchical':
      await buildHierarchicalTopology(agents);
      break;
    case 'small-world':
      await buildSmallWorldTopology(agents);
      break;
    case 'hybrid':
    default:
      await buildHybridTopology(agents);
      break;
  }

  console.log(`[TopologyCoordinator] Topology optimized to ${targetTopology}`);
}

// Build mesh topology
async function buildMeshTopology(agents) {
  for (let i = 0; i < agents.length; i++) {
    for (let j = i + 1; j < agents.length; j++) {
      await createConnection(agents[i], agents[j]);
    }
  }
}

// Build hierarchical topology
async function buildHierarchicalTopology(agents) {
  // Group agents by type
  const coordinators = agents.filter(id => {
    const agent = topologyState.agents.get(id)?.agent;
    return agent?.type === 'coordinator';
  });
  
  const workers = agents.filter(id => {
    const agent = topologyState.agents.get(id)?.agent;
    return agent?.type !== 'coordinator';
  });

  // Connect coordinators to each other
  for (let i = 0; i < coordinators.length; i++) {
    for (let j = i + 1; j < coordinators.length; j++) {
      await createConnection(coordinators[i], coordinators[j]);
    }
  }

  // Connect workers to coordinators
  for (const workerId of workers) {
    const bestCoordinator = coordinators
      .sort((a, b) => {
        const aData = topologyState.agents.get(a);
        const bData = topologyState.agents.get(b);
        return (aData?.agent.load || 1) - (bData?.agent.load || 1);
      })[0];
    
    if (bestCoordinator) {
      await createConnection(workerId, bestCoordinator);
    }
  }
}

// Build small-world topology
async function buildSmallWorldTopology(agents) {
  const n = agents.length;
  const k = Math.min(4, n - 1); // Each node connects to k nearest neighbors
  const p = 0.1; // Rewiring probability

  // Start with ring lattice
  for (let i = 0; i < n; i++) {
    for (let j = 1; j <= k / 2; j++) {
      const neighbor = (i + j) % n;
      await createConnection(agents[i], agents[neighbor]);
    }
  }

  // Rewire connections with probability p
  const connections = Array.from(topologyState.connections.entries());
  for (const [connectionId, connection] of connections) {
    if (Math.random() < p) {
      // Remove current connection
      topologyState.connections.delete(connectionId);
      
      // Create new random connection
      const randomAgent = agents[Math.floor(Math.random() * agents.length)];
      if (randomAgent !== connection.from) {
        await createConnection(connection.from, randomAgent);
      }
    }
  }
}

// Build hybrid topology
async function buildHybridTopology(agents) {
  // Start with hierarchical base
  await buildHierarchicalTopology(agents);
  
  // Add some random connections for resilience
  const randomConnections = Math.floor(agents.length * 0.3);
  
  for (let i = 0; i < randomConnections; i++) {
    const agent1 = agents[Math.floor(Math.random() * agents.length)];
    const agent2 = agents[Math.floor(Math.random() * agents.length)];
    
    if (agent1 !== agent2) {
      const connectionId = `${agent1}-${agent2}`;
      const reverseId = `${agent2}-${agent1}`;
      
      if (!topologyState.connections.has(connectionId) && 
          !topologyState.connections.has(reverseId)) {
        await createConnection(agent1, agent2);
      }
    }
  }
}

// Create connection between agents
async function createConnection(fromId, toId) {
  const connectionId = `${fromId}-${toId}`;
  const reverseId = `${toId}-${fromId}`;
  
  // Don't create duplicate connections
  if (topologyState.connections.has(connectionId) || topologyState.connections.has(reverseId)) {
    return;
  }

  const fromAgent = topologyState.agents.get(fromId)?.agent;
  const toAgent = topologyState.agents.get(toId)?.agent;
  
  if (!fromAgent || !toAgent) return;

  const connection = {
    from: fromId,
    to: toId,
    weight: calculateConnectionWeight(fromAgent, toAgent),
    latency: estimateLatency(fromAgent, toAgent),
    bandwidth: 1000, // Default bandwidth
    reliability: 0.95,
    lastActive: Date.now()
  };

  topologyState.connections.set(connectionId, connection);
  console.log(`[TopologyCoordinator] Created connection ${connectionId}`);
}

// Calculate connection weight
function calculateConnectionWeight(agent1, agent2) {
  const perfMatch = 1 - Math.abs(agent1.performance.successRate - agent2.performance.successRate);
  const loadBalance = 1 - Math.abs(agent1.load - agent2.load);
  return (perfMatch + loadBalance) / 2;
}

// Estimate latency between agents
function estimateLatency(agent1, agent2) {
  if (agent1.location && agent2.location) {
    return Math.abs(agent1.location.latency - agent2.location.latency);
  }
  return Math.random() * 100; // Random latency 0-100ms
}

// Message handling for topology coordination
self.addEventListener('message', async (event) => {
  const { type, data, requestId } = event.data;

  try {
    let response = null;

    switch (type) {
      case 'topology-register-agent':
        await registerAgent(data.agent);
        response = { success: true };
        break;

      case 'topology-unregister-agent':
        await removeAgent(data.agentId);
        response = { success: true };
        break;

      case 'topology-heartbeat':
        updateAgentHeartbeat(data.agentId, data.performance);
        response = { success: true };
        break;

      case 'topology-get-state':
        response = {
          agentCount: topologyState.agents.size,
          connectionCount: topologyState.connections.size,
          metrics: topologyState.metrics,
          isOptimizing: topologyState.isOptimizing,
          lastOptimization: topologyState.lastOptimization
        };
        break;

      case 'topology-force-optimization':
        if (!topologyState.isOptimizing) {
          await performBackgroundOptimization();
        }
        response = { success: true };
        break;

      case 'topology-sync':
        // Handle topology sync from main thread
        response = { success: true };
        break;

      default:
        // Handle other message types (existing SW functionality)
        handleRegularMessage(event);
        return;
    }

    // Send response back to main thread
    if (requestId && event.source) {
      event.source.postMessage({
        type: 'topology-response',
        requestId,
        data: response
      });
    }

  } catch (error) {
    console.error('[TopologyCoordinator] Message handling failed:', error);
    
    if (requestId && event.source) {
      event.source.postMessage({
        type: 'topology-response', 
        requestId,
        error: error.message
      });
    }
  }
});

// Register new agent
async function registerAgent(agentData) {
  const agent = {
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
  };

  topologyState.agents.set(agent.id, {
    agent,
    lastHeartbeat: Date.now(),
    status: 'active'
  });

  // Create initial connections
  await createOptimalConnections(agent.id);
  
  console.log(`[TopologyCoordinator] Agent ${agent.id} registered`);
  notifyMainThread('agent-registered', { agentId: agent.id });
}

// Create optimal connections for new agent
async function createOptimalConnections(agentId) {
  const candidates = Array.from(topologyState.agents.keys())
    .filter(id => id !== agentId && topologyState.agents.get(id)?.status === 'active');

  // Connect to coordinator first
  if (agentId !== 'sw-coordinator') {
    await createConnection(agentId, 'sw-coordinator');
  }

  // Connect to best candidates (up to 3 additional connections)
  const maxConnections = Math.min(3, candidates.length);
  const selectedCandidates = candidates
    .sort(() => Math.random() - 0.5) // Randomize
    .slice(0, maxConnections);

  for (const candidateId of selectedCandidates) {
    if (candidateId !== 'sw-coordinator') {
      await createConnection(agentId, candidateId);
    }
  }
}

// Update agent heartbeat
function updateAgentHeartbeat(agentId, performance) {
  const agentData = topologyState.agents.get(agentId);
  if (!agentData) return;

  agentData.lastHeartbeat = Date.now();
  agentData.status = 'active';
  
  if (performance) {
    agentData.agent.performance = performance;
    agentData.agent.load = calculateAgentLoad(performance);
  }
}

// Calculate agent load from performance
function calculateAgentLoad(performance) {
  const responseTimeFactor = Math.min(performance.responseTime / 1000, 1);
  const successRateFactor = 1 - performance.successRate;
  const throughputFactor = Math.max(0, 1 - performance.throughput);
  
  return (responseTimeFactor + successRateFactor + throughputFactor) / 3;
}

// Notify main thread
function notifyMainThread(eventType, data) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'topology-event',
        eventType,
        data,
        timestamp: Date.now()
      });
    });
  });
}

// Persistence functions
async function saveTopologyState() {
  try {
    const db = await openTopologyDB();
    const tx = db.transaction(['topology-state'], 'readwrite');
    const store = tx.objectStore('topology-state');
    
    const state = {
      id: 'main-state',
      agents: Array.from(topologyState.agents.entries()),
      connections: Array.from(topologyState.connections.entries()),
      metrics: topologyState.metrics,
      timestamp: Date.now()
    };
    
    await store.put(state);
    console.log('[TopologyCoordinator] State saved');
    
  } catch (error) {
    console.error('[TopologyCoordinator] Failed to save state:', error);
  }
}

async function loadTopologyState() {
  try {
    const db = await openTopologyDB();
    const tx = db.transaction(['topology-state'], 'readonly');
    const store = tx.objectStore('topology-state');
    
    const request = store.get('main-state');
    const result = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    if (result) {
      return {
        agents: new Map(result.agents),
        connections: new Map(result.connections),
        metrics: result.metrics
      };
    }
    
  } catch (error) {
    console.error('[TopologyCoordinator] Failed to load state:', error);
  }
  
  return null;
}

function openTopologyDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('topology-coordinator', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('topology-state')) {
        db.createObjectStore('topology-state', { keyPath: 'id' });
      }
    };
  });
}

// Handle regular service worker messages (existing functionality)
function handleRegularMessage(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAMES.RUNTIME).then(cache => {
        return cache.addAll(event.data.urls);
      })
    );
  }
}

// Enhanced fetch handler with topology awareness
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    // Handle POST/PUT/DELETE with offline queue and topology coordination
    if (url.pathname.startsWith('/api/')) {
      event.respondWith(handleMutationRequest(request));
    }
    return;
  }
  
  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }
  
  // Handle different types of requests with topology awareness
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
  } else if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request));
  } else {
    event.respondWith(handleStaticRequest(request));
  }
});

// Enhanced request handlers (existing functionality with topology integration)
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAMES.RUNTIME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const offlineResponse = await caches.match('/offline.html');
    return offlineResponse || new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

async function handleApiRequest(request) {
  try {
    const networkResponse = await fetchWithTimeout(request, 5000);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAMES.API);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-From-Cache', 'true');
      headers.set('X-Topology-Node', 'sw-coordinator');
      
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: headers,
      });
    }
    
    return new Response(JSON.stringify({
      error: 'offline',
      message: 'No internet connection. Cached data unavailable.',
      topologyStatus: {
        agents: topologyState.agents.size,
        efficiency: topologyState.metrics.efficiency
      }
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function handleMutationRequest(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    // Queue the request and coordinate with topology
    await queueRequest(request);
    
    return new Response(JSON.stringify({
      queued: true,
      message: 'Your changes will be synced when you\'re back online',
      id: generateQueueId(),
      topologyNode: 'sw-coordinator'
    }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function handleImageRequest(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAMES.IMAGES);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    return new Response('', {
      status: 404,
      statusText: 'Not Found',
    });
  }
}

async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAMES.STATIC);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    return new Response('Resource not available offline', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

// Utility functions
function fetchWithTimeout(request, timeout = 5000) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    ),
  ]);
}

async function queueRequest(request) {
  const db = await openSyncDB();
  const tx = db.transaction('sync_queue', 'readwrite');
  const store = tx.objectStore('sync_queue');
  
  const queueData = {
    id: generateQueueId(),
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: await request.text(),
    timestamp: Date.now(),
    retryCount: 0,
    topologyNode: 'sw-coordinator'
  };
  
  await store.add(queueData);
}

function openSyncDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('wedding-planner-sync', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('sync_queue')) {
        db.createObjectStore('sync_queue', { keyPath: 'id' });
      }
    };
  });
}

function generateQueueId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Background sync and push notification handlers (existing functionality)
self.addEventListener('sync', async (event) => {
  console.log('[Enhanced SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-queue') {
    event.waitUntil(processSyncQueue());
  }
});

async function processSyncQueue() {
  const db = await openSyncDB();
  const tx = db.transaction('sync_queue', 'readwrite');
  const store = tx.objectStore('sync_queue');
  const requests = await store.getAll();
  
  for (const queuedRequest of requests) {
    try {
      const response = await fetch(queuedRequest.url, {
        method: queuedRequest.method,
        headers: queuedRequest.headers,
        body: queuedRequest.body,
      });
      
      if (response.ok) {
        await store.delete(queuedRequest.id);
        
        // Notify topology and clients
        notifyMainThread('sync-success', {
          id: queuedRequest.id,
          url: queuedRequest.url
        });
      } else if (response.status >= 400 && response.status < 500) {
        await store.delete(queuedRequest.id);
      } else {
        queuedRequest.retryCount++;
        if (queuedRequest.retryCount > 3) {
          await store.delete(queuedRequest.id);
        } else {
          await store.put(queuedRequest);
        }
      }
    } catch (error) {
      console.error('[Enhanced SW] Sync failed:', error);
    }
  }
}

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      ...data,
      topologyNode: 'sw-coordinator',
      networkStatus: {
        agents: topologyState.agents.size,
        efficiency: topologyState.metrics.efficiency
      }
    },
    actions: [
      { action: 'view', title: 'View' },
      { action: 'close', title: 'Close' },
    ],
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Wedding Planner', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view' || !event.action) {
    const urlToOpen = event.notification.data?.url || '/dashboard';
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((windowClients) => {
        for (const client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});

console.log('[Enhanced SW] Service Worker with Adaptive Topology Management loaded');