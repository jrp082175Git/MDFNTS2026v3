const validateArgs = require('./config/validateArgs');
const loadConfig = require('./config/loadConfig');
const { initLogger, getLogger } = require('./logging/logger');
const { getHostEndianness } = require('./utils/endian');
const { initRedis } = require('./storage/redisClient');
const RedisWriter = require('./storage/redisWriter');
const FileStore = require('./storage/fileStore');
const AppState = require('./core/appState');
const SequenceManager = require('./moldudp64/sequenceManager');
const { initializeStartupMode } = require('./core/startupMode');
const { setupGracefulShutdown } = require('./core/gracefulShutdown');
const MulticastReceiver = require('./network/multicastReceiver');
const RetransmissionClient = require('./network/retransmissionClient');
const SocketIOServer = require('./network/socketIOServer');
const TcpRelayServer = require('./network/tcpRelayServer');
const TcpRetransServer = require('./network/tcpRetransServer');
const { parseDownstreamPacket } = require('./moldudp64/parseDownstreamPacket');
const { parseMessageBlocks } = require('./moldudp64/parseMessageBlocks');

async function main() {
  const args = validateArgs(process.argv.slice(2));
  const config = loadConfig();

  const logger = initLogger(config, args.usersStr);
  logger.info("Starting Receiver application");
  logger.info(`Host Endianness: ${getHostEndianness()}`);
  logger.info(`Arguments: Environment=${args.env}, Retransmission=${args.retransmissionEnable}, StartFresh=${args.startFresh}, Users=${args.users.join(',')}`);

  const envConfig = config[args.env];

  await initRedis(config);

  const redisWriter = new RedisWriter();
  const fileStore = new FileStore(config);
  const appState = new AppState(config);
  const seqManager = new SequenceManager();

  await initializeStartupMode(args, seqManager, fileStore, redisWriter, appState);

  redisWriter.start(config.storage.flushIntervalMs || 1000);
  fileStore.start(config.storage.flushIntervalMs || 1000);

  const socketIOServer = new SocketIOServer(config);
  const tcpRelayServer = new TcpRelayServer(config);
  const tcpRetransServer = new TcpRetransServer(config, appState);
  const retransClient = new RetransmissionClient(envConfig);
  const multicastReceiver = new MulticastReceiver(envConfig);

  const shutdown = setupGracefulShutdown({
    multicastReceiver,
    retransClient,
    socketIOServer,
    tcpRelayServer,
    tcpRetransServer,
    redisWriter,
    fileStore
  });

  socketIOServer.start();
  tcpRelayServer.start();
  tcpRetransServer.start();

  const handleIncomingPacket = (msg, rinfo) => {
    const packetInfo = parseDownstreamPacket(msg, rinfo);

    if (packetInfo.status !== "OK") {
        logger.warn(`Invalid packet received: ${packetInfo.status}`);
        return;
    }

    if (packetInfo.session !== envConfig.expectedSession) {
      logger.warn(`Session mismatch: expected ${envConfig.expectedSession}, got ${packetInfo.session}`);
      return;
    }

    const seqDiff = packetInfo._sequenceNumberBigInt - seqManager.expectedSequence;

    if (seqDiff > BigInt(0)) {
        logger.warn(`Sequence gap detected. Expected: ${seqManager.expectedSequence}, Received: ${packetInfo._sequenceNumberBigInt}`);
        socketIOServer.broadcastSequenceGap(seqManager.expectedSequence, packetInfo._sequenceNumberBigInt);

        if (args.retransmissionEnable) {
            retransClient.requestMissingPackets(packetInfo.session, seqManager.expectedSequence, Number(seqDiff));
        }
    } else if (seqDiff < BigInt(0)) {
        logger.info(`Duplicate or late packet received. Seq: ${packetInfo._sequenceNumberBigInt}`);
        // Can either ignore or process. MoldUDP64 usually says process if missing, else ignore.
        // For simplicity, we process it and let storage overwrite if needed.
    }

    const messages = parseMessageBlocks(msg, packetInfo);

    // Update sequence before deleting _sequenceNumberBigInt
    seqManager.updateFromPacket(packetInfo);

    // Store packet
    delete packetInfo._sequenceNumberBigInt; // not needed for json
    appState.addPacket(packetInfo);
    redisWriter.enqueuePacket(packetInfo);
    fileStore.enqueuePacket(packetInfo);
    socketIOServer.broadcastPacket(packetInfo);

    // Store messages
    for (const m of messages) {
        appState.addMessage(m);
        redisWriter.enqueueMessage(m);
        fileStore.enqueueMessage(m);
        tcpRelayServer.broadcastMessage(m);
    }

    if (packetInfo.packetType === 'END_OF_SESSION') {
        logger.info("End of Session packet received.");
        tcpRelayServer.broadcastMessage({
            sequence: seqManager.latestMessageBlockSequence.toString(),
            msgType: 'H'
        });
        shutdown('END_OF_SESSION');
    } else if (packetInfo.packetType === 'HEARTBEAT') {
        tcpRelayServer.broadcastMessage({
            sequence: seqManager.latestMessageBlockSequence.toString(),
            msgType: 'H'
        });
    }
  };

  multicastReceiver.onMessage(handleIncomingPacket);
  retransClient.onMessage(handleIncomingPacket);

  multicastReceiver.start();
}

main().catch(err => {
  console.error("Fatal error during startup:", err);
  process.exit(1);
});
