const { getLogger } = require('../logging/logger');

async function initializeStartupMode(args, fileStore, redisWriter, appState) {
  const logger = getLogger();

  if (args.startFresh) {
    logger.info("Startup Mode: START:Y. Clearing state...");
    appState.clear();
    fileStore.clearFiles();
    if (redisWriter.config.redis.enabled) {
      await redisWriter.clearCurrentDate();
    }
    logger.info("State cleared. Ready for fresh data.");
  } else {
    logger.info("Startup Mode: START:N. Reloading state from files...");

    await fileStore.loadAll(
      (m) => { appState.addLMessage(m); },
      (m) => { appState.addPMessage(m); },
      (s) => { appState.setState(s); }
    );

    logger.info(`State reloaded. Expected input sequence: ${appState.expectedInputSequence}`);
  }
}

module.exports = { initializeStartupMode };
