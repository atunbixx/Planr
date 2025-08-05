import crypto from 'crypto';
import { EventEmitter } from 'events';

// Types for Byzantine consensus
export interface ConsensusNode {
  id: string;
  publicKey: string;
  status: 'active' | 'suspected' | 'failed';
  lastSeen: number;
  reputation: number;
}

export interface ConsensusMessage {
  type: 'pre-prepare' | 'prepare' | 'commit' | 'view-change' | 'new-view';
  view: number;
  sequence: number;
  digest: string;
  nodeId: string;
  signature: string;
  timestamp: number;
  payload?: any;
}

export interface ConsensusState {
  view: number;
  sequence: number;
  phase: 'pre-prepare' | 'prepare' | 'commit' | 'committed' | 'view-change';
  primaryId: string;
  f: number; // Maximum faulty nodes (n = 3f + 1)
  prepareCount: number;
  commitCount: number;
  messages: Map<string, ConsensusMessage[]>;
}

export class ByzantineConsensusCoordinator extends EventEmitter {
  private nodes: Map<string, ConsensusNode> = new Map();
  private consensusState: ConsensusState;
  private messageBuffer: Map<string, ConsensusMessage[]> = new Map();
  private viewChangeTimeout: NodeJS.Timeout | null = null;
  private suspicionThreshold = 3; // Number of failures before suspicion
  private readonly nodeId: string;
  private readonly privateKey: string;
  private readonly publicKey: string;

  constructor(nodeId: string, initialNodes: ConsensusNode[]) {
    super();
    this.nodeId = nodeId;
    
    // Generate key pair for this node
    const keyPair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    
    this.privateKey = keyPair.privateKey;
    this.publicKey = keyPair.publicKey;
    
    // Initialize nodes
    initialNodes.forEach(node => this.nodes.set(node.id, node));
    
    // Calculate Byzantine fault tolerance (f = (n-1)/3)
    const n = this.nodes.size;
    const f = Math.floor((n - 1) / 3);
    
    this.consensusState = {
      view: 0,
      sequence: 0,
      phase: 'pre-prepare',
      primaryId: this.selectPrimary(0),
      f,
      prepareCount: 0,
      commitCount: 0,
      messages: new Map()
    };
    
    console.log(`🛡️ Byzantine Consensus initialized: ${n} nodes, f=${f} fault tolerance`);
  }

  /**
   * Select primary node for given view (round-robin with reputation weighting)
   */
  private selectPrimary(view: number): string {
    const activeNodes = Array.from(this.nodes.values())
      .filter(node => node.status === 'active')
      .sort((a, b) => b.reputation - a.reputation);
    
    if (activeNodes.length === 0) {
      throw new Error('No active nodes available for primary selection');
    }
    
    return activeNodes[view % activeNodes.length].id;
  }

  /**
   * Sign a message with node's private key
   */
  private signMessage(message: Omit<ConsensusMessage, 'signature'>): string {
    const messageString = JSON.stringify(message);
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(messageString);
    return sign.sign(this.privateKey, 'base64');
  }

  /**
   * Verify message signature
   */
  private verifySignature(message: ConsensusMessage, publicKey: string): boolean {
    try {
      const { signature, ...messageWithoutSig } = message;
      const messageString = JSON.stringify(messageWithoutSig);
      const verify = crypto.createVerify('RSA-SHA256');
      verify.update(messageString);
      return verify.verify(publicKey, signature, 'base64');
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * Create message digest for consensus
   */
  private createDigest(payload: any): string {
    return crypto.createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  /**
   * Initiate consensus for a new request (Primary only)
   */
  async initiateConsensus(request: any): Promise<boolean> {
    if (this.consensusState.primaryId !== this.nodeId) {
      throw new Error('Only primary node can initiate consensus');
    }

    const digest = this.createDigest(request);
    const sequence = ++this.consensusState.sequence;
    
    const prePrepareMessage: Omit<ConsensusMessage, 'signature'> = {
      type: 'pre-prepare',
      view: this.consensusState.view,
      sequence,
      digest,
      nodeId: this.nodeId,
      timestamp: Date.now(),
      payload: request
    };

    const signature = this.signMessage(prePrepareMessage);
    const signedMessage: ConsensusMessage = { ...prePrepareMessage, signature };

    // Reset consensus state
    this.consensusState.phase = 'pre-prepare';
    this.consensusState.prepareCount = 0;
    this.consensusState.commitCount = 0;
    this.consensusState.messages.clear();

    // Broadcast pre-prepare message
    this.broadcastMessage(signedMessage);
    
    // Store our own message
    this.storeMessage(signedMessage);
    
    console.log(`🚀 Initiated consensus for sequence ${sequence}`);
    return this.waitForConsensus(sequence);
  }

  /**
   * Process incoming consensus message
   */
  async processMessage(message: ConsensusMessage): Promise<void> {
    // Verify message signature
    const senderNode = this.nodes.get(message.nodeId);
    if (!senderNode || !this.verifySignature(message, senderNode.publicKey)) {
      console.warn(`⚠️ Invalid signature from node ${message.nodeId}`);
      this.suspectNode(message.nodeId);
      return;
    }

    // Update node last seen
    senderNode.lastSeen = Date.now();
    
    // Store message
    this.storeMessage(message);

    switch (message.type) {
      case 'pre-prepare':
        await this.handlePrePrepare(message);
        break;
      case 'prepare':
        await this.handlePrepare(message);
        break;
      case 'commit':
        await this.handleCommit(message);
        break;
      case 'view-change':
        await this.handleViewChange(message);
        break;
      case 'new-view':
        await this.handleNewView(message);
        break;
    }
  }

  /**
   * Handle pre-prepare message (Backup nodes)
   */
  private async handlePrePrepare(message: ConsensusMessage): Promise<void> {
    if (message.nodeId !== this.consensusState.primaryId) {
      console.warn(`⚠️ Pre-prepare from non-primary node ${message.nodeId}`);
      return;
    }

    if (message.view !== this.consensusState.view) {
      console.warn(`⚠️ Pre-prepare view mismatch: ${message.view} vs ${this.consensusState.view}`);
      return;
    }

    // Send prepare message
    const prepareMessage: Omit<ConsensusMessage, 'signature'> = {
      type: 'prepare',
      view: message.view,
      sequence: message.sequence,
      digest: message.digest,
      nodeId: this.nodeId,
      timestamp: Date.now()
    };

    const signature = this.signMessage(prepareMessage);
    this.broadcastMessage({ ...prepareMessage, signature });
    
    this.consensusState.phase = 'prepare';
    console.log(`📤 Sent prepare for sequence ${message.sequence}`);
  }

  /**
   * Handle prepare message
   */
  private async handlePrepare(message: ConsensusMessage): Promise<void> {
    if (message.view !== this.consensusState.view) return;

    this.consensusState.prepareCount++;
    
    // Need 2f prepare messages (including our own)
    if (this.consensusState.prepareCount >= 2 * this.consensusState.f) {
      // Send commit message
      const commitMessage: Omit<ConsensusMessage, 'signature'> = {
        type: 'commit',
        view: message.view,
        sequence: message.sequence,
        digest: message.digest,
        nodeId: this.nodeId,
        timestamp: Date.now()
      };

      const signature = this.signMessage(commitMessage);
      this.broadcastMessage({ ...commitMessage, signature });
      
      this.consensusState.phase = 'commit';
      console.log(`📤 Sent commit for sequence ${message.sequence}`);
    }
  }

  /**
   * Handle commit message
   */
  private async handleCommit(message: ConsensusMessage): Promise<void> {
    if (message.view !== this.consensusState.view) return;

    this.consensusState.commitCount++;
    
    // Need 2f+1 commit messages (including our own)
    if (this.consensusState.commitCount >= 2 * this.consensusState.f + 1) {
      this.consensusState.phase = 'committed';
      
      // Find the original pre-prepare message
      const prePrepareMessages = this.consensusState.messages.get('pre-prepare') || [];
      const originalMessage = prePrepareMessages.find(m => 
        m.sequence === message.sequence && m.digest === message.digest
      );

      if (originalMessage?.payload) {
        console.log(`✅ Consensus reached for sequence ${message.sequence}`);
        this.emit('consensus-reached', {
          sequence: message.sequence,
          payload: originalMessage.payload,
          view: message.view
        });
        
        await this.executeCommittedRequest(originalMessage.payload);
      }
    }
  }

  /**
   * Execute committed request
   */
  private async executeCommittedRequest(payload: any): Promise<void> {
    // Hook for consensus decisions
    await this.hooks_post_edit('consensus', 'hive/consensus/decisions');
    
    console.log('🎯 Executing committed request:', payload);
    // Implementation depends on the specific application logic
    this.emit('request-committed', payload);
  }

  /**
   * Handle view change (when primary is suspected faulty)
   */
  private async handleViewChange(message: ConsensusMessage): Promise<void> {
    console.log(`🔄 View change request from ${message.nodeId}`);
    // Implementation for view change protocol
  }

  /**
   * Handle new view message
   */
  private async handleNewView(message: ConsensusMessage): Promise<void> {
    console.log(`🆕 New view message from ${message.nodeId}`);
    // Implementation for new view protocol
  }

  /**
   * Suspect a node of being faulty
   */
  private suspectNode(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.reputation = Math.max(0, node.reputation - 1);
      if (node.reputation === 0) {
        node.status = 'suspected';
        console.warn(`⚠️ Node ${nodeId} is now suspected`);
        this.emit('node-suspected', nodeId);
      }
    }
  }

  /**
   * Store message in buffer
   */
  private storeMessage(message: ConsensusMessage): void {
    const messages = this.consensusState.messages.get(message.type) || [];
    messages.push(message);
    this.consensusState.messages.set(message.type, messages);
  }

  /**
   * Broadcast message to all nodes
   */
  private broadcastMessage(message: ConsensusMessage): void {
    // In a real implementation, this would send to network
    this.emit('broadcast-message', message);
  }

  /**
   * Wait for consensus to be reached
   */
  private async waitForConsensus(sequence: number): Promise<boolean> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.warn(`⏰ Consensus timeout for sequence ${sequence}`);
        resolve(false);
      }, 30000); // 30 second timeout

      const consensusHandler = (data: any) => {
        if (data.sequence === sequence) {
          clearTimeout(timeout);
          this.off('consensus-reached', consensusHandler);
          resolve(true);
        }
      };

      this.on('consensus-reached', consensusHandler);
    });
  }

  /**
   * Get consensus status
   */
  getConsensusStatus() {
    return {
      view: this.consensusState.view,
      sequence: this.consensusState.sequence,
      phase: this.consensusState.phase,
      primaryId: this.consensusState.primaryId,
      nodeCount: this.nodes.size,
      faultTolerance: this.consensusState.f,
      activeNodes: Array.from(this.nodes.values()).filter(n => n.status === 'active').length
    };
  }

  /**
   * Hooks integration
   */
  private async hooks_post_edit(file: string, memoryKey: string): Promise<void> {
    try {
      const { execSync } = require('child_process');
      execSync(`npx claude-flow@alpha hooks post-edit --file "${file}" --memory-key "${memoryKey}"`, {
        stdio: 'inherit',
        cwd: process.cwd()
      });
    } catch (error) {
      console.warn('Hook execution failed:', error);
    }
  }

  /**
   * Monitor node health and detect failures
   */
  startHealthMonitoring(): void {
    setInterval(() => {
      const now = Date.now();
      const suspicionThreshold = 30000; // 30 seconds
      
      this.nodes.forEach((node, nodeId) => {
        if (node.status === 'active' && now - node.lastSeen > suspicionThreshold) {
          this.suspectNode(nodeId);
        }
      });
    }, 10000); // Check every 10 seconds
  }
}

// Export singleton instance
export const byzantineConsensus = new ByzantineConsensusCoordinator(
  process.env.NODE_ID || 'default-node',
  [] // Initial nodes will be configured at runtime
);
