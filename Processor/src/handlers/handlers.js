function handleSecondsMessage(message) { return {}; }
function handleOrderBookDirectoryMessage(message) { return {}; }
function handleOrderBookDirectoryExtensionMessage(message) { return {}; }
function handleExchangeDirectoryMessage(message) { return {}; }
function handleMarketDirectoryMessage(message) { return {}; }
function handleCombinationOrderBookLegMessage(message) { return {}; }
function handleTickSizeTableMessage(message) { return {}; }
function handleCorporateActionEntryMessage(message) { return {}; }
function handleSystemEventMessage(message) { return {}; }
function handleOrderBookStateMessage(message) { return {}; }
function handleEquilibriumPriceMessage(message) { return {}; }
function handleMarketByPriceMessage(message) { return {}; }
function handleTradeStatisticsMessage(message) { return {}; }
function handleReferencePriceMessage(message) { return {}; }
function handleIndexPriceMessage(message) { return {}; }
function handleOpenInterestMessage(message) { return {}; }
function handleTradeTickerMessage(message) { return {}; }
function handlePriceLimitsMessage(message) { return {}; }
function handleCircuitBreakerTriggerMessage(message) { return {}; }
function handleIndicativeQuoteMessage(message) { return {}; }
function handleMarketAnnouncementMessage(message) { return {}; }
function handleHeartbeatMessage(message) { return null; /* heartbeats generally don't yield business logic by default */ }
function handleUnknownMessage(message) { return null; }

module.exports = {
  handleSecondsMessage,
  handleOrderBookDirectoryMessage,
  handleOrderBookDirectoryExtensionMessage,
  handleExchangeDirectoryMessage,
  handleMarketDirectoryMessage,
  handleCombinationOrderBookLegMessage,
  handleTickSizeTableMessage,
  handleCorporateActionEntryMessage,
  handleSystemEventMessage,
  handleOrderBookStateMessage,
  handleEquilibriumPriceMessage,
  handleMarketByPriceMessage,
  handleTradeStatisticsMessage,
  handleReferencePriceMessage,
  handleIndexPriceMessage,
  handleOpenInterestMessage,
  handleTradeTickerMessage,
  handlePriceLimitsMessage,
  handleCircuitBreakerTriggerMessage,
  handleIndicativeQuoteMessage,
  handleMarketAnnouncementMessage,
  handleHeartbeatMessage,
  handleUnknownMessage
};
