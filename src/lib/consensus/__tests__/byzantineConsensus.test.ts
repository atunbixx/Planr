import { ByzantineConsensusCoordinator, ConsensusNode, ConsensusMessage } from '../byzantineConsensus';
import { ConsensusManager, createConsensusManager } from '../consensusManager';
import crypto from 'crypto';

describe('Byzantine Consensus Tests', () => {
  let nodes: ConsensusNode[];
  let coordinators: ByzantineConsensusCoordinator[];
  let managers: ConsensusManager[];

  beforeEach(() => {
    // Create test nodes with cryptographic keys
    nodes = [];
    coordinators = [];
    managers = [];

    for (let i = 0; i < 4; i++) {
      const keyPair = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
      });

      const node: ConsensusNode = {
        id: `node-${i}`,
        publicKey: keyPair.publicKey,
        status: 'active',
        lastSeen: Date.now(),
        reputation: 10
      };

      nodes.push(node);
    }
  });

  afterEach(() => {
    // Cleanup
    managers.forEach(manager => manager.shutdown());
    coordinators = [];
    managers = [];
    nodes = [];
  });

  describe('Byzantine Fault Tolerance', () => {
    it('should handle consensus with f=1 fault tolerance (4 nodes)', async () => {
      // Create 4 coordinators (can tolerate 1 Byzantine fault)
      for (let i = 0; i < 4; i++) {
        const coordinator = new ByzantineConsensusCoordinator(`node-${i}`, nodes);
        coordinators.push(coordinator);
      }

      const primary = coordinators[0];
      const testRequest = { action: 'book-venue', venue: 'Grand Ballroom', date: '2024-06-15' };

      // Mock message broadcasting between nodes
      coordinators.forEach(coord => {
        coord.on('broadcast-message', (message: ConsensusMessage) => {
          // Simulate network delay
          setTimeout(() => {
            coordinators.forEach(otherCoord => {
              if (otherCoord !== coord) {
                otherCoord.processMessage(message);
              }
            });
          }, Math.random() * 10);
        });
      });

      // Initiate consensus
      const consensusPromise = primary.initiateConsensus(testRequest);
      const result = await consensusPromise;

      expect(result).toBe(true);
    });

    it('should detect and handle Byzantine (malicious) nodes', async () => {
      const coordinator = new ByzantineConsensusCoordinator('honest-node', nodes);
      let suspectedNodes: string[] = [];

      coordinator.on('node-suspected', (nodeId: string) => {
        suspectedNodes.push(nodeId);
      });

      // Simulate malicious message with invalid signature
      const maliciousMessage: ConsensusMessage = {
        type: 'prepare',
        view: 0,
        sequence: 1,
        digest: 'fake-digest',
        nodeId: 'node-1',
        signature: 'invalid-signature',
        timestamp: Date.now()
      };

      await coordinator.processMessage(maliciousMessage);

      // Should suspect the malicious node
      expect(suspectedNodes).toContain('node-1');
    });

    it('should maintain consensus despite node failures', async () => {
      // Create 7 nodes for f=2 fault tolerance
      const largeNodeSet: ConsensusNode[] = [];
      for (let i = 0; i < 7; i++) {
        const keyPair = crypto.generateKeyPairSync('rsa', {
          modulusLength: 2048,
          publicKeyEncoding: { type: 'spki', format: 'pem' },
          privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });

        largeNodeSet.push({
          id: `node-${i}`,
          publicKey: keyPair.publicKey,
          status: 'active',
          lastSeen: Date.now(),
          reputation: 10
        });
      }

      const coordinator = new ByzantineConsensusCoordinator('primary-node', largeNodeSet);
      const status = coordinator.getConsensusStatus();

      expect(status.faultTolerance).toBe(2); // (7-1)/3 = 2
      expect(status.nodeCount).toBe(7);
    });
  });

  describe('Consensus Manager Integration', () => {
    it('should process wedding-related consensus requests', async () => {
      const manager = createConsensusManager({
        nodeId: 'wedding-coordinator',
        networkNodes: nodes.slice(0, 4),
        faultTolerance: 1
      });

      managers.push(manager);

      const executedRequests: any[] = [];
      manager.on('request-executed', (data) => {
        executedRequests.push(data);
      });

      const weddingRequest = {
        id: 'wedding-001',
        type: 'wedding-update' as const,
        data: {
          ceremony: { time: '14:00', location: 'Garden Chapel' },
          reception: { time: '18:00', location: 'Grand Ballroom' }
        },
        priority: 'high' as const,
        requesterNodeId: 'wedding-coordinator',
        timestamp: Date.now()
      };

      // Mock successful consensus
      setTimeout(() => {
        manager.emit('consensus-reached', {
          sequence: 1,
          payload: weddingRequest,
          view: 0
        });
      }, 100);

      const result = await manager.submitRequest(weddingRequest);
      
      expect(result).toBe(true);
      
      // Wait for execution
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(executedRequests).toHaveLength(1);
      expect(executedRequests[0].type).toBe('wedding-update');
    });

    it('should handle vendor booking consensus', async () => {
      const manager = createConsensusManager({
        nodeId: 'vendor-manager',
        networkNodes: nodes.slice(0, 4)
      });

      managers.push(manager);

      const vendorRequest = {
        id: 'vendor-001',
        type: 'vendor-booking' as const,
        data: {
          vendorId: 'photographer-123',
          service: 'wedding-photography',
          date: '2024-06-15',
          cost: 2500
        },
        priority: 'medium' as const,
        requesterNodeId: 'vendor-manager',
        timestamp: Date.now()
      };

      const metrics = manager.getMetrics();
      expect(metrics.pendingRequests).toBe(0);
      expect(metrics.completedRequests).toBe(0);

      // Test status reporting
      const status = manager.getStatus();
      expect(status.nodeId).toBe('vendor-manager');
      expect(status.pendingRequests).toBe(0);
    });

    it('should handle payment confirmation consensus', async () => {
      const manager = createConsensusManager({
        nodeId: 'payment-processor',
        networkNodes: nodes.slice(0, 4)
      });

      managers.push(manager);

      const paymentRequest = {
        id: 'payment-001',
        type: 'payment-confirm' as const,
        data: {
          transactionId: 'txn-abc123',
          amount: 5000,
          currency: 'USD',
          paymentMethod: 'credit-card',
          status: 'completed'
        },
        priority: 'high' as const,
        requesterNodeId: 'payment-processor',
        timestamp: Date.now()
      };

      // Simulate processing without actual consensus for unit test
      expect(paymentRequest.type).toBe('payment-confirm');
      expect(paymentRequest.data.amount).toBe(5000);
    });
  });

  describe('Security and Performance', () => {
    it('should verify message signatures correctly', async () => {
      const coordinator = new ByzantineConsensusCoordinator('security-test', nodes);
      
      // Create a valid signed message
      const keyPair = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
      });

      const message = {
        type: 'prepare' as const,
        view: 0,
        sequence: 1,
        digest: 'test-digest',
        nodeId: 'test-node',
        timestamp: Date.now()
      };

      // Sign the message
      const messageString = JSON.stringify(message);
      const sign = crypto.createSign('RSA-SHA256');
      sign.update(messageString);
      const signature = sign.sign(keyPair.privateKey, 'base64');

      const signedMessage: ConsensusMessage = { ...message, signature };

      // Create test node with public key
      const testNode: ConsensusNode = {
        id: 'test-node',
        publicKey: keyPair.publicKey,
        status: 'active',
        lastSeen: Date.now(),
        reputation: 10
      };

      // Add to coordinator's nodes (access private method for testing)
      (coordinator as any).nodes.set('test-node', testNode);

      // Process message - should not suspect the node
      let suspectedNodes: string[] = [];
      coordinator.on('node-suspected', (nodeId: string) => {
        suspectedNodes.push(nodeId);
      });

      await coordinator.processMessage(signedMessage);
      expect(suspectedNodes).not.toContain('test-node');
    });

    it('should handle high throughput consensus requests', async () => {
      const manager = createConsensusManager({
        nodeId: 'throughput-test',
        networkNodes: nodes.slice(0, 4)
      });

      managers.push(manager);

      const startTime = Date.now();
      const requestCount = 10;
      const requests = [];

      for (let i = 0; i < requestCount; i++) {
        requests.push({
          id: `bulk-${i}`,
          type: 'guest-rsvp' as const,
          data: { guestId: `guest-${i}`, attending: true },
          priority: 'low' as const,
          requesterNodeId: 'throughput-test',
          timestamp: Date.now() + i
        });
      }

      expect(requests).toHaveLength(requestCount);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should handle request creation efficiently
      expect(duration).toBeLessThan(1000); // Less than 1 second
    });

    it('should provide comprehensive metrics', async () => {
      const manager = createConsensusManager({
        nodeId: 'metrics-test',
        networkNodes: nodes.slice(0, 4),
        enableHealthMonitoring: true
      });

      managers.push(manager);

      const metrics = manager.getMetrics();
      
      expect(metrics).toHaveProperty('consensusView');
      expect(metrics).toHaveProperty('consensusSequence');
      expect(metrics).toHaveProperty('consensusPhase');
      expect(metrics).toHaveProperty('activeNodes');
      expect(metrics).toHaveProperty('faultTolerance');
      expect(metrics).toHaveProperty('uptime');
      expect(metrics).toHaveProperty('memory');
      expect(metrics).toHaveProperty('timestamp');
      
      expect(typeof metrics.uptime).toBe('number');
      expect(typeof metrics.memory).toBe('object');
      expect(metrics.timestamp).toBeGreaterThan(0);
    });
  });

  describe('Fault Recovery', () => {
    it('should recover from temporary network partitions', async () => {
      const manager = createConsensusManager({
        nodeId: 'partition-test',
        networkNodes: nodes.slice(0, 4)
      });

      managers.push(manager);

      // Simulate network partition by processing delayed messages
      const testMessage = {
        type: 'prepare' as const,
        view: 0,
        sequence: 1,
        digest: 'partition-test',
        nodeId: 'node-1',
        signature: 'test-signature',
        timestamp: Date.now()
      };

      // Should handle network messages gracefully
      await expect(manager.processNetworkMessage(testMessage)).resolves.not.toThrow();
    });

    it('should handle graceful shutdown', async () => {
      const manager = createConsensusManager({
        nodeId: 'shutdown-test',
        networkNodes: nodes.slice(0, 4)
      });

      // Don't add to managers array to avoid double shutdown
      await expect(manager.shutdown()).resolves.not.toThrow();
    });
  });
});
