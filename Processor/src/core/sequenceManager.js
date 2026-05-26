const { getLogger } = require('../logging/logger');

class SequenceManager {
  constructor(appState, config, args, receiverRetransClient, onCacheQueue) {
    this.appState = appState;
    this.config = config;
    this.args = args;
    this.receiverRetransClient = receiverRetransClient;
    this.onCacheQueue = onCacheQueue;
    this.logger = getLogger();
    this.pendingBySequence = new Map();
    this.retransmitting = false;
  }

  handleLiveSequence(message) {
    if (!this.args.retransmissionEnable) {
      this.appState.latestProcessedInputSequence = BigInt(message.sequence || 0);
      return { status: 'PROCESS' };
    }

    if (!message.sequence) {
      return { status: 'PROCESS' }; // typically heartbeats or unknown
    }

    const seq = BigInt(message.sequence);

    // Exact expected
    if (seq === this.appState.expectedInputSequence) {
      return { status: 'PROCESS' };
    }

    // Gap detected
    if (seq > this.appState.expectedInputSequence) {
      this.pendingBySequence.set(seq, message);

      const gapStart = this.appState.expectedInputSequence;
      const gapEnd = seq - BigInt(1);

      this.logger.warn(`Gap detected. Expected: ${gapStart}, Received: ${seq}`);

      if (!this.retransmitting) {
        this.retransmitting = true;
        this.receiverRetransClient.requestMissingPackets(gapStart, gapEnd);
      }
      return { status: 'HOLD' };
    }

    // Duplicate or late
    if (seq < this.appState.expectedInputSequence) {
      this.logger.info(`Duplicate or late message received. Seq: ${seq}`);
      return { status: 'IGNORE' };
    }
  }

  markProcessed(seq) {
    if (seq) {
      this.appState.latestProcessedInputSequence = BigInt(seq);
      this.appState.expectedInputSequence = BigInt(seq) + BigInt(1);
    }
  }

  processPending() {
    // Attempt to move sequential pending messages to cache queue
    let moved = 0;
    while (this.pendingBySequence.has(this.appState.expectedInputSequence)) {
      const msg = this.pendingBySequence.get(this.appState.expectedInputSequence);
      this.pendingBySequence.delete(this.appState.expectedInputSequence);
      this.onCacheQueue.enqueue(msg);
      this.appState.expectedInputSequence++;
      moved++;
    }

    if (this.pendingBySequence.size === 0) {
      this.retransmitting = false;
    }
    return moved;
  }
}

module.exports = SequenceManager;
