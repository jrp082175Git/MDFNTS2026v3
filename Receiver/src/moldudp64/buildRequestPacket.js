/**
 * Builds a MoldUDP64 Request Packet.
 * Session: 10 bytes
 * Sequence Number: 8 bytes
 * Requested Message Count: 2 bytes
 */
function buildRequestPacket(session, sequenceNumber, messageCount) {
  const buffer = Buffer.alloc(20);

  // Pad or truncate session to 10 bytes
  let sessionStr = session.padEnd(10, ' ');
  if (sessionStr.length > 10) sessionStr = sessionStr.substring(0, 10);

  buffer.write(sessionStr, 0, 10, 'ascii');
  buffer.writeBigUInt64BE(BigInt(sequenceNumber), 10);
  buffer.writeUInt16BE(messageCount, 18);

  return buffer;
}

module.exports = { buildRequestPacket };
