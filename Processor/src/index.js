const validateArgs = require('./config/validateArgs');
const loadConfig = require('./config/loadConfig');
const { initLogger, getLogger } = require('./logging/logger');
const { initRedis } = require('./storage/redisClient');
const RedisWriter = require('./storage/redisWriter');
const FileStore = require('./storage/fileStore');
const AppState = require('./core/appState');
const SequenceManager = require('./core/sequenceManager');
const { initializeStartupMode } = require('./core/startupMode');
const ProcessorEngine = require('./core/processorEngine');
const { setupGracefulShutdown } = require('./core/gracefulShutdown');
const ProprietaryMessageBuilder = require('./handlers/proprietaryMessageBuilder');
const OnReceiveQueue = require('./queues/onReceiveQueue');
const OnCacheQueue = require('./queues/onCacheQueue');
const QueueWorker = require('./queues/queueWorker');
const ReceiverRelayClient = require('./network/receiverRelayClient');
const ReceiverRetransClient = require('./network/receiverRetransClient');
const SocketIOServer = require('./network/socketIOServer');
const ProcessorRelayServer = require('./network/processorRelayServer');
const ProcessorRetransServer = require('./network/processorRetransServer');

async function main() {
  const args = validateArgs(process.argv.slice(2));
  const config = loadConfig();

  const logger = initLogger(config, args.usersStr);
  logger.info("Starting Processor application");
  logger.info(`Arguments: Retransmission=${args.retransmissionEnable}, StartFresh=${args.startFresh}, DisplayLog=${args.displayLog}, Users=${args.usersStr}`);

  await initRedis(config);

  const appState = new AppState();
  const fileStore = new FileStore(config);
  const redisWriter = new RedisWriter(config);

  await initializeStartupMode(args, fileStore, redisWriter, appState);

  fileStore.start();
  redisWriter.start();

  const onReceiveQueue = new OnReceiveQueue(config.performance.maxQueueSize);
  const onCacheQueue = new OnCacheQueue(config.performance.maxQueueSize);

  const socketIOServer = new SocketIOServer(config);
  const processorRelayServer = new ProcessorRelayServer(config);
  const processorRetransServer = new ProcessorRetransServer(config, appState);

  socketIOServer.start();
  processorRelayServer.start();
  processorRetransServer.start();

  const receiverRetransClient = new ReceiverRetransClient(config, onCacheQueue);
  const receiverRelayClient = new ReceiverRelayClient(config, onReceiveQueue);

  const seqManager = new SequenceManager(appState, config, args, receiverRetransClient, onCacheQueue);
  const propBuilder = new ProprietaryMessageBuilder(appState);

  const processorEngine = new ProcessorEngine(
      appState,
      seqManager,
      propBuilder,
      { fileStore, redisWriter },
      { socketIOServer, processorRelayServer },
      args
  );

  const queueWorker = new QueueWorker(config, onReceiveQueue, onCacheQueue, processorEngine);
  queueWorker.start();

  const shutdown = setupGracefulShutdown({
    queueWorker,
    receiverRelayClient,
    receiverRetransClient,
    socketIOServer,
    processorRelayServer,
    processorRetransServer,
    redisWriter,
    fileStore
  }, appState);

  // Connect to receiver relay last
  receiverRelayClient.start();
}

main().catch(err => {
  console.error("Fatal error during Processor startup:", err);
  process.exit(1);
});
