const { parseSecondsMessage } = require('./parsers/timeMessages');
const {
  parseOrderBookDirectory,
  parseOrderBookDirectoryExtension,
  parseExchangeDirectory,
  parseMarketDirectory,
  parseCombinationOrderBookLeg,
  parseTickSizeTable,
  parseCorporateActionEntry
} = require('./parsers/referenceDataMessages');
const {
  parseSystemEvent,
  parseOrderBookState
} = require('./parsers/eventStateMessages');
const {
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
} = require('./parsers/priceMessages');
const { parseMarketAnnouncement } = require('./parsers/announcementMessages');

const messageRegistry = {
  'T': parseSecondsMessage,
  'R': parseOrderBookDirectory,
  'X': parseOrderBookDirectoryExtension,
  'e': parseExchangeDirectory,
  'm': parseMarketDirectory,
  'M': parseCombinationOrderBookLeg,
  'L': parseTickSizeTable,
  'C': parseCorporateActionEntry,
  'S': parseSystemEvent,
  'O': parseOrderBookState,
  'Z': parseEquilibriumPrice,
  'b': parseMarketByPrice,
  'I': parseTradeStatistics,
  'Q': parseReferencePrice,
  'J': parseIndexPrice,
  'h': parseOpenInterest,
  'i': parseTradeTicker,
  'k': parsePriceLimits,
  'c': parseCircuitBreakerTrigger,
  'q': parseIndicativeQuote,
  'N': parseMarketAnnouncement
};

module.exports = messageRegistry;
