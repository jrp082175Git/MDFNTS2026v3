const { readUInt32BE, readPrice, readBigUInt64BE, readUInt16BE, readAlpha } = require('../dataTypes');

/**
 * Z = Equilibrium Price
 */
function parseEquilibriumPrice(buffer) {
  return {
    msgType: 'Z',
    nanoseconds: readUInt32BE(buffer, 1),
    orderBookId: readUInt32BE(buffer, 5),
    rawHex: buffer.toString('hex')
  };
}

/**
 * b = Market by Price / MBP Incremental
 * Parse fixed header.
 * Parse repeating PriceLevelItem group.
 * Each PriceLevelItem is 20 bytes.
 * Number of items = remaining message length / 20.
 */
function parseMarketByPrice(buffer) {
  const msgType = 'b';
  const nanoseconds = readUInt32BE(buffer, 1);
  const orderBookId = readUInt32BE(buffer, 5);
  // fixed header is probably 9 bytes (1+4+4)
  const headerLen = 9;

  const repeatingLen = buffer.length - headerLen;
  const numItems = Math.floor(repeatingLen / 20);

  const items = [];
  let offset = headerLen;
  for (let i = 0; i < numItems; i++) {
    // 20 bytes per item
    // Guessing structure: price (8), quantity (8), orderCount (4)?
    items.push({
      priceRaw: buffer.readBigInt64BE(offset),
      quantityRaw: buffer.readBigInt64BE(offset + 8),
      orderCount: buffer.readUInt32BE(offset + 16),
      rawHex: buffer.toString('hex', offset, offset + 20)
    });
    offset += 20;
  }

  return {
    msgType,
    nanoseconds,
    orderBookId,
    items,
    rawHex: buffer.toString('hex')
  };
}

/**
 * I = Trade Statistics
 */
function parseTradeStatistics(buffer) {
  return {
    msgType: 'I',
    nanoseconds: readUInt32BE(buffer, 1),
    rawHex: buffer.toString('hex')
  };
}

/**
 * Q = Reference Price
 */
function parseReferencePrice(buffer) {
  return {
    msgType: 'Q',
    nanoseconds: readUInt32BE(buffer, 1),
    rawHex: buffer.toString('hex')
  };
}

/**
 * J = Index Price
 */
function parseIndexPrice(buffer) {
  return {
    msgType: 'J',
    nanoseconds: readUInt32BE(buffer, 1),
    rawHex: buffer.toString('hex')
  };
}

/**
 * h = Open Interest
 */
function parseOpenInterest(buffer) {
  return {
    msgType: 'h',
    nanoseconds: readUInt32BE(buffer, 1),
    rawHex: buffer.toString('hex')
  };
}

/**
 * i = Trade Ticker
 */
function parseTradeTicker(buffer) {
  return {
    msgType: 'i',
    nanoseconds: readUInt32BE(buffer, 1),
    rawHex: buffer.toString('hex')
  };
}

/**
 * k = Price Limits
 */
function parsePriceLimits(buffer) {
  return {
    msgType: 'k',
    nanoseconds: readUInt32BE(buffer, 1),
    rawHex: buffer.toString('hex')
  };
}

/**
 * c = Circuit Breaker Trigger
 */
function parseCircuitBreakerTrigger(buffer) {
  return {
    msgType: 'c',
    nanoseconds: readUInt32BE(buffer, 1),
    rawHex: buffer.toString('hex')
  };
}

/**
 * q = Indicative Quote
 */
function parseIndicativeQuote(buffer) {
  return {
    msgType: 'q',
    nanoseconds: readUInt32BE(buffer, 1),
    rawHex: buffer.toString('hex')
  };
}

module.exports = {
  parseEquilibriumPrice,
  parseMarketByPrice,
  parseTradeStatistics,
  parseReferencePrice,
  parseIndexPrice,
  parseOpenInterest,
  parseTradeTicker,
  parsePriceLimits,
  parseCircuitBreakerTrigger,
  parseIndicativeQuote
};
