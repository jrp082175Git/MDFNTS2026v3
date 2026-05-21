const messageRegistry = require('./messageRegistry');
const { getLogger } = require('../logging/logger');

function parseMdfMessage(buffer) {
  if (!buffer || buffer.length < 1) {
    return { parseStatus: "INVALID_LENGTH", rawHex: "" };
  }

  const msgType = buffer.toString('ascii', 0, 1);
  const parser = messageRegistry[msgType];

  if (!parser) {
    return {
      msgType,
      parseStatus: "UNKNOWN_MESSAGE_TYPE",
      rawHex: buffer.toString('hex')
    };
  }

  try {
    const parsed = parser(buffer);
    parsed.parseStatus = "OK";
    return parsed;
  } catch (error) {
    getLogger().error(`Error parsing MDF message of type ${msgType}: ${error.message}`);
    return {
      msgType,
      parseStatus: "ERROR",
      rawHex: buffer.toString('hex'),
      error: error.message
    };
  }
}

module.exports = { parseMdfMessage };
