const { parseMdfMessage } = require('../mdf/parseMdfMessage');

/**
 * Parses message blocks starting at offset 20.
 * Each message block: 2 bytes length, then data.
 */
function parseMessageBlocks(buffer, packetInfo) {
  const messages = [];
  let offset = 20;

  if (packetInfo.packetType === "HEARTBEAT" || packetInfo.packetType === "END_OF_SESSION") {
    return messages;
  }

  for (let i = 0; i < packetInfo.messageCount; i++) {
    if (offset + 2 > buffer.length) {
      // Malformed packet
      break;
    }
    const msgLength = buffer.readUInt16BE(offset);
    offset += 2;

    if (offset + msgLength > buffer.length) {
      // Malformed packet
      break;
    }

    const msgBuffer = buffer.subarray(offset, offset + msgLength);
    const mdfMsg = parseMdfMessage(msgBuffer);

    // Assign sequence number
    mdfMsg.sequence = (packetInfo._sequenceNumberBigInt + BigInt(i)).toString();
    messages.push(mdfMsg);

    offset += msgLength;
  }

  return messages;
}

module.exports = { parseMessageBlocks };
