const { readUInt32BE } = require('../dataTypes');

/**
 * T = Seconds Message
 * Offset 0: msgType (1)
 * Offset 1: second (4) - number of seconds since midnight
 */
function parseSecondsMessage(buffer) {
  return {
    msgType: 'T',
    second: readUInt32BE(buffer, 1)
  };
}

module.exports = {
  parseSecondsMessage
};
