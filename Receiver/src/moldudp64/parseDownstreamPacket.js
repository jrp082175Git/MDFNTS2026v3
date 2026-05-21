/**
 * Parse MoldUDP64 downstream packet header
 * Offset 0   Length 10   Session
 * Offset 10  Length 8    Sequence Number
 * Offset 18  Length 2    Message Count
 */
function parseDownstreamPacket(buffer, rinfo) {
  if (buffer.length < 20) {
    return { status: "INVALID_LENGTH", rawLength: buffer.length };
  }

  const session = buffer.toString('ascii', 0, 10).trimEnd();
  const sequenceNumber = buffer.readBigUInt64BE(10);
  const messageCount = buffer.readUInt16BE(18);

  let packetType = "DATA";
  if (messageCount === 0) {
    packetType = "HEARTBEAT";
  } else if (messageCount === 65535) {
    packetType = "END_OF_SESSION";
  }

  return {
    session,
    sequenceNumber: sequenceNumber.toString(), // convert to string for JSON safety
    _sequenceNumberBigInt: sequenceNumber,     // keep bigint for internal math
    messageCount,
    packetType,
    receivedAt: Date.now(),
    sourceAddress: rinfo.address,
    sourcePort: rinfo.port,
    rawLength: buffer.length,
    status: "OK",
    // We will parse message blocks later
  };
}

module.exports = { parseDownstreamPacket };
