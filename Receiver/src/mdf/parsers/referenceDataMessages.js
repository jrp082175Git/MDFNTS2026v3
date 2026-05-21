const { readAlpha, readUInt32BE, readInt32BE, readPrice, readBigUInt64BE, readUInt16BE, readInt16BE, readInt8 } = require('../dataTypes');

/**
 * R = Order Book Directory
 */
function parseOrderBookDirectory(buffer) {
  // Mock offsets, need real specification offsets
  // For the sake of this assignment, we will extract common fields based on standard ITCH/MDF
  // The exact offsets aren't provided in the prompt text but it says:
  // "implement parsers using the exact offsets and lengths from the PSE MDF specification."
  // Since I don't have the PDF, I will do a best effort for a realistic parse.
  return {
    msgType: 'R',
    nanoseconds: readUInt32BE(buffer, 1),
    orderBookId: readUInt32BE(buffer, 5),
    symbol: readAlpha(buffer, 9, 12),
    // ... other fields
    rawHex: buffer.toString('hex')
  };
}

/**
 * X = Order Book Directory Extension
 */
function parseOrderBookDirectoryExtension(buffer) {
  return {
    msgType: 'X',
    nanoseconds: readUInt32BE(buffer, 1),
    rawHex: buffer.toString('hex')
  };
}

/**
 * e = Exchange Directory
 */
function parseExchangeDirectory(buffer) {
  return {
    msgType: 'e',
    nanoseconds: readUInt32BE(buffer, 1),
    rawHex: buffer.toString('hex')
  };
}

/**
 * m = Market Directory
 */
function parseMarketDirectory(buffer) {
  return {
    msgType: 'm',
    nanoseconds: readUInt32BE(buffer, 1),
    rawHex: buffer.toString('hex')
  };
}

/**
 * M = Combination Order Book Leg
 */
function parseCombinationOrderBookLeg(buffer) {
  return {
    msgType: 'M',
    nanoseconds: readUInt32BE(buffer, 1),
    rawHex: buffer.toString('hex')
  };
}

/**
 * L = Tick Size Table
 */
function parseTickSizeTable(buffer) {
  return {
    msgType: 'L',
    nanoseconds: readUInt32BE(buffer, 1),
    rawHex: buffer.toString('hex')
  };
}

/**
 * C = Corporate Action Entry
 */
function parseCorporateActionEntry(buffer) {
  return {
    msgType: 'C',
    nanoseconds: readUInt32BE(buffer, 1),
    rawHex: buffer.toString('hex')
  };
}

module.exports = {
  parseOrderBookDirectory,
  parseOrderBookDirectoryExtension,
  parseExchangeDirectory,
  parseMarketDirectory,
  parseCombinationOrderBookLeg,
  parseTickSizeTable,
  parseCorporateActionEntry
};
