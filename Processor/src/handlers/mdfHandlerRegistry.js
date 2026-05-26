const handlers = require('./handlers');

const mdfHandlerRegistry = {
  'T': handlers.handleSecondsMessage,
  'R': handlers.handleOrderBookDirectoryMessage,
  'X': handlers.handleOrderBookDirectoryExtensionMessage,
  'e': handlers.handleExchangeDirectoryMessage,
  'm': handlers.handleMarketDirectoryMessage,
  'M': handlers.handleCombinationOrderBookLegMessage,
  'L': handlers.handleTickSizeTableMessage,
  'C': handlers.handleCorporateActionEntryMessage,
  'S': handlers.handleSystemEventMessage,
  'O': handlers.handleOrderBookStateMessage,
  'Z': handlers.handleEquilibriumPriceMessage,
  'b': handlers.handleMarketByPriceMessage,
  'I': handlers.handleTradeStatisticsMessage,
  'Q': handlers.handleReferencePriceMessage,
  'J': handlers.handleIndexPriceMessage,
  'h': handlers.handleOpenInterestMessage,
  'i': handlers.handleTradeTickerMessage,
  'k': handlers.handlePriceLimitsMessage,
  'c': handlers.handleCircuitBreakerTriggerMessage,
  'q': handlers.handleIndicativeQuoteMessage,
  'N': handlers.handleMarketAnnouncementMessage,
  'H': handlers.handleHeartbeatMessage
};

module.exports = mdfHandlerRegistry;
