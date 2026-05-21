const assert = require('assert');
const { parseDownstreamPacket } = require('../src/moldudp64/parseDownstreamPacket');
const { parseMessageBlocks } = require('../src/moldudp64/parseMessageBlocks');
const { parseMdfMessage } = require('../src/mdf/parseMdfMessage');

// Test MoldUDP64 Header Parsing
function testHeaderParsing() {
  const buffer = Buffer.alloc(20);
  buffer.write('SESSION123', 0, 10, 'ascii');
  buffer.writeBigUInt64BE(BigInt(100), 10);
  buffer.writeUInt16BE(2, 18);

  const rinfo = { address: '127.0.0.1', port: 50000 };
  const packetInfo = parseDownstreamPacket(buffer, rinfo);

  assert.strictEqual(packetInfo.session, 'SESSION123');
  assert.strictEqual(packetInfo.sequenceNumber, '100');
  assert.strictEqual(packetInfo.messageCount, 2);
  assert.strictEqual(packetInfo.packetType, 'DATA');
  console.log("testHeaderParsing passed");
}

function testHeartbeatParsing() {
  const buffer = Buffer.alloc(20);
  buffer.write('SESSION123', 0, 10, 'ascii');
  buffer.writeBigUInt64BE(BigInt(100), 10);
  buffer.writeUInt16BE(0, 18);

  const packetInfo = parseDownstreamPacket(buffer, { address: '', port: 0 });
  assert.strictEqual(packetInfo.packetType, 'HEARTBEAT');
  console.log("testHeartbeatParsing passed");
}

function testEndOfSessionParsing() {
  const buffer = Buffer.alloc(20);
  buffer.write('SESSION123', 0, 10, 'ascii');
  buffer.writeBigUInt64BE(BigInt(100), 10);
  buffer.writeUInt16BE(65535, 18);

  const packetInfo = parseDownstreamPacket(buffer, { address: '', port: 0 });
  assert.strictEqual(packetInfo.packetType, 'END_OF_SESSION');
  console.log("testEndOfSessionParsing passed");
}

function testMessageBlockParsing() {
  const buffer = Buffer.alloc(20 + 2 + 5 + 2 + 5);
  buffer.write('SESSION123', 0, 10, 'ascii');
  buffer.writeBigUInt64BE(BigInt(10), 10);
  buffer.writeUInt16BE(2, 18);

  // Message 1 (T)
  buffer.writeUInt16BE(5, 20);
  buffer.write('T', 22, 1, 'ascii');
  buffer.writeUInt32BE(1000, 23);

  // Message 2 (Unknown ZZZ)
  buffer.writeUInt16BE(5, 27);
  buffer.write('?', 29, 1, 'ascii');
  buffer.writeUInt32BE(2000, 30);

  const packetInfo = parseDownstreamPacket(buffer, { address: '', port: 0 });
  const messages = parseMessageBlocks(buffer, packetInfo);

  assert.strictEqual(messages.length, 2);
  assert.strictEqual(messages[0].msgType, 'T');
  assert.strictEqual(messages[0].sequence, '10');

  assert.strictEqual(messages[1].msgType, '?');
  assert.strictEqual(messages[1].parseStatus, 'UNKNOWN_MESSAGE_TYPE');
  assert.strictEqual(messages[1].sequence, '11');

  console.log("testMessageBlockParsing passed");
}

try {
  testHeaderParsing();
  testHeartbeatParsing();
  testEndOfSessionParsing();
  testMessageBlockParsing();
  console.log("All tests passed successfully.");
} catch (err) {
  console.error("Test failed:", err);
  process.exit(1);
}
