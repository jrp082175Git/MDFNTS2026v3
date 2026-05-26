const { getLogger } = require('../logging/logger');
const { bigintStringify } = require('../utils/bigintJson');
const { routeMessage } = require('../handlers/messageRouter');

class ProcessorEngine {
  constructor(appState, sequenceManager, propBuilder, storage, network, args) {
    this.appState = appState;
    this.seqManager = sequenceManager;
    this.propBuilder = propBuilder;
    this.redisWriter = storage.redisWriter;
    this.fileStore = storage.fileStore;
    this.socketIOServer = network.socketIOServer;
    this.processorRelayServer = network.processorRelayServer;
    this.args = args;
    this.logger = getLogger();
  }

  async processMessage(message, source) {
    try {
      if (source === "LIVE") {
        const seqStatus = this.seqManager.handleLiveSequence(message);
        if (seqStatus.status === 'HOLD' || seqStatus.status === 'IGNORE') {
          return;
        }
      }

      // 1. Process Message Logic
      // Route it to appropriate handler
      const propPayload = routeMessage(message);

      // 2. Persist LMessage
      this.appState.addLMessage(message);
      this.redisWriter.enqueueLMessage(message);
      this.fileStore.enqueueLMessage(message);

      if (this.args.displayLog) {
        this.logger.info(`LMessage Inserted [${source}]: ${bigintStringify(message)}`);
      }

      this.socketIOServer.broadcastLMessage(message);

      // 3. Generate Proprietary Message if payload exists
      if (propPayload) {
         // Create single or multiple if the payload is an array
         const payloads = Array.isArray(propPayload) ? propPayload : [propPayload];

         for (const payload of payloads) {
             const pMsg = this.propBuilder.build(message, payload);
             if (pMsg) {
                 this.appState.addPMessage(pMsg);
                 this.redisWriter.enqueuePMessage(pMsg);
                 this.fileStore.enqueuePMessage(pMsg);

                 if (this.args.displayLog) {
                   this.logger.info(`PMessage Generated: ${bigintStringify(pMsg)}`);
                 }

                 this.socketIOServer.broadcastPMessage(pMsg);
                 this.processorRelayServer.broadcastMessage(pMsg);
             }
         }
      }

      // 4. Update Sequence
      this.seqManager.markProcessed(message.sequence);

      // Check if we can unblock pending cache
      if (source === 'CACHE') {
         this.seqManager.processPending();
      }

    } catch (err) {
      this.logger.error(`Error processing message: ${err.message}\n${err.stack}`);
    }
  }
}

module.exports = ProcessorEngine;
