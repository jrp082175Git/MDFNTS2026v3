const { getLogger } = require('../logging/logger');
const { closeRedis } = require('../storage/redisClient');

function setupGracefulShutdown(components) {
  const logger = getLogger();

  async function shutdown(reason) {
    logger.info(`Shutting down due to: ${reason}`);

    // Stop receiving UDP
    if (components.multicastReceiver) components.multicastReceiver.stop();
    if (components.retransClient) components.retransClient.stop();

    // Stop servers
    if (components.socketIOServer) components.socketIOServer.stop();
    if (components.tcpRelayServer) components.tcpRelayServer.stop();
    if (components.tcpRetransServer) components.tcpRetransServer.stop();

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
