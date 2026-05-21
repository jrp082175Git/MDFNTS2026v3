const { readUInt32BE, readAlpha } = require('../dataTypes');

/**
 * S = System Event
 */
function parseSystemEvent(buffer) {
  return {
    msgType: 'S',
    nanoseconds: readUInt32BE(buffer, 1),
    eventCode: readAlpha(buffer, 5, 1),
    rawHex: buffer.toString('hex')
  };
}

/**
 * O = Order Book State
 */
function parseOrderBookState(buffer) {
  return {
    msgType: 'O',
    nanoseconds: readUInt32BE(buffer, 1),
    orderBookId: readUInt32BE(buffer, 5),
    stateName: readAlpha(buffer, 9, 20),
    rawHex: buffer.toString('hex')
  };
}

module.exports = {
  parseSystemEvent,
  parseOrderBookState
};
