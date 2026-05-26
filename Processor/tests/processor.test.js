const assert = require('assert');
const AppState = require('../src/core/appState');
const SequenceManager = require('../src/core/sequenceManager');
const ProprietaryMessageBuilder = require('../src/handlers/proprietaryMessageBuilder');
const Queue = require('../src/queues/onReceiveQueue');

function testQueue() {
  const q = new Queue(5);
  q.enqueue(1);
  q.enqueue(2);
  assert.strictEqual(q.dequeue(), 1);
  assert.strictEqual(q.length, 1);
  console.log("testQueue passed");
}

function testProprietaryBuilder() {
  const appState = new AppState();
  const builder = new ProprietaryMessageBuilder(appState);

  const mdfMsg = { sequence: "100", msgType: "b" };
  const pMsg = builder.build(mdfMsg, { price: 10 });

  assert.strictEqual(pMsg.pSequence, "1");
  assert.strictEqual(pMsg.sourceSequence, "100");
  assert.strictEqual(pMsg.proprietaryMsgType, "BROKER_MBP");
  assert.strictEqual(pMsg.payload.price, 10);
  console.log("testProprietaryBuilder passed");
}

function testSequenceManager() {
  const appState = new AppState();
  const mockArgs = { retransmissionEnable: true };
  let requestedGap = null;

  const mockRetransClient = {
      requestMissingPackets: (b, e) => {
          requestedGap = [b, e];
      }
  };

  const seqManager = new SequenceManager(appState, {}, mockArgs, mockRetransClient, null);

  // Test valid next sequence
  let stat = seqManager.handleLiveSequence({ sequence: "1" });
  assert.strictEqual(stat.status, 'PROCESS');
  seqManager.markProcessed("1");
  assert.strictEqual(appState.expectedInputSequence.toString(), "2");

  // Test gap
  stat = seqManager.handleLiveSequence({ sequence: "4" });
  assert.strictEqual(stat.status, 'HOLD');
  assert.strictEqual(requestedGap[0].toString(), "2");
  assert.strictEqual(requestedGap[1].toString(), "3");

  // Test duplicate
  stat = seqManager.handleLiveSequence({ sequence: "1" });
  assert.strictEqual(stat.status, 'IGNORE');

  console.log("testSequenceManager passed");
}

try {
  testQueue();
  testProprietaryBuilder();
  testSequenceManager();
  console.log("All Processor tests passed.");
} catch (err) {
  console.error("Test failed:", err);
  process.exit(1);
}
