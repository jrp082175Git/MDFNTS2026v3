const { getLogger } = require('../logging/logger');

class QueueWorker {
  constructor(config, onReceiveQueue, onCacheQueue, processorEngine) {
    this.config = config;
    this.onReceiveQueue = onReceiveQueue;
    this.onCacheQueue = onCacheQueue;
    this.processorEngine = processorEngine;
    this.logger = getLogger();
    this.isRunning = false;
    this.timeoutId = null;
  }

  start() {
    this.isRunning = true;
    this.loop();
  }

  stop() {
    this.isRunning = false;
    if (this.timeoutId) clearTimeout(this.timeoutId);
  }

  async loop() {
    if (!this.isRunning) return;

    let processedCount = 0;
    const batchSize = this.config.performance.batchSize || 1000;

    try {
      while (processedCount < batchSize) {
        if (!this.onCacheQueue.isEmpty()) {
          const msg = this.onCacheQueue.dequeue();
          await this.processorEngine.processMessage(msg, "CACHE");
          processedCount++;
        } else if (!this.onReceiveQueue.isEmpty()) {
          const msg = this.onReceiveQueue.dequeue();
          await this.processorEngine.processMessage(msg, "LIVE");
          processedCount++;
        } else {
          break; // both queues empty
        }
      }
    } catch (err) {
      this.logger.error(`QueueWorker error: ${err.message}\n${err.stack}`);
    }

    if (this.isRunning) {
      // Yield to event loop, then continue
      const waitMs = processedCount === 0 ? (this.config.performance.workerIntervalMs || 1) : 0;
      this.timeoutId = setTimeout(() => this.loop(), waitMs);
    }
  }
}

module.exports = QueueWorker;
