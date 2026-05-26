const { getLogger } = require('../logging/logger');
const { closeRedis } = require('../storage/redisClient');

function setupGracefulShutdown(components, appState) {
  const logger = getLogger();

  async function shutdown(reason) {
    logger.info(`Shutting down Processor due to: ${reason}`);

    // Stop queue worker
    if (components.queueWorker) components.queueWorker.stop();

    // Stop clients
    if (components.receiverRelayClient) components.receiverRelayClient.stop();
    if (components.receiverRetransClient) components.receiverRetransClient.stop();

    // Stop servers
    if (components.socketIOServer) components.socketIOServer.stop();
    if (components.processorRelayServer) components.processorRelayServer.stop();
    if (components.processorRetransServer) components.processorRetransServer.stop();

    // Save State
    const stateObj = appState.getState();
    if (components.fileStore) components.fileStore.saveStateSync(stateObj);
    if (components.redisWriter) components.redisWriter.enqueueState(stateObj);

    // Flush storage
    if (components.redisWriter) await components.redisWriter.stop();
    if (components.fileStore) components.fileStore.stop();

    // Close Redis
    await closeRedis();

    logger.info("Graceful shutdown complete.");
    process.exit(0);
  }

  process.on('SIGINT', () => shutdown('SIGINT (Ctrl+C)'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('uncaughtException', (err) => {
    logger.error(`uncaughtException: ${err.message}\n${err.stack}`);
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error(`unhandledRejection at: ${promise}, reason: ${reason}`);
    shutdown('unhandledRejection');
  });

  return shutdown;
}

module.exports = { setupGracefulShutdown };
