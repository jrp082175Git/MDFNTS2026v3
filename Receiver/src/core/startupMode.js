const { getLogger } = require('../logging/logger');

async function initializeStartupMode(args, seqManager, fileStore, redisWriter, appState) {
  const logger = getLogger();

  if (args.startFresh) {
    logger.info("Startup Mode: START:Y. Clearing state...");
    seqManager.setExpectedSequence(1);
    seqManager.setLatestMessageBlockSequence(0);
    appState.clear();
    fileStore.clearFiles();
    await redisWriter.clearCurrentDate();
    logger.info("State cleared. Ready for fresh data.");
  } else {
    logger.info("Startup Mode: START:N. Reloading state from files...");

    let lastValidPacketSeq = BigInt(0);
    let lastValidMsgSeq = BigInt(0);
    let maxExpected = BigInt(1);

    await fileStore.loadAll(
      (p) => {
        appState.addPacket(p);
        if (p.packetType === 'DATA' && p.messageCount > 0) {
            const exp = BigInt(p.sequenceNumber) + BigInt(p.messageCount);
            if (exp > maxExpected) maxExpected = exp;
        }
      },
      (m) => {
        appState.addMessage(m);
        if (m.sequence) {
            const mSeq = BigInt(m.sequence);
            if (mSeq > lastValidMsgSeq) lastValidMsgSeq = mSeq;
        }
      }
    );

    seqManager.setExpectedSequence(maxExpected);
    seqManager.setLatestMessageBlockSequence(lastValidMsgSeq);

    logger.info(`State reloaded. Next expected sequence: ${maxExpected}, Latest message seq: ${lastValidMsgSeq}`);
  }
}

module.exports = { initializeStartupMode };
