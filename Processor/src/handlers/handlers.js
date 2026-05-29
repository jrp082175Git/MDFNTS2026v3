function UNIXTimeToDateTime(seconds) {
  return new Date(seconds * 1000).toISOString();
}

function handleSecondsMessage(message, appState) {
  if (message.second) {
      appState.timeStamp = UNIXTimeToDateTime(message.second);
  }
  return null;
}

function handleOrderBookDirectoryMessage(message, appState) {
  if (message.orderBookId) {
    const existingIdx = appState.orderBookList.findIndex(ob => ob.orderBookId === message.orderBookId);
    if (existingIdx >= 0) {
        appState.orderBookList[existingIdx] = { ...appState.orderBookList[existingIdx], ...message };
    } else {
        appState.orderBookList.push({ ...message });
    }
  }
  return message;
}
function handleOrderBookDirectoryExtensionMessage(message, appState) {
  if (message.orderBookId) {
    const existingIdx = appState.orderBookList.findIndex(ob => ob.orderBookId === message.orderBookId);
    if (existingIdx >= 0) {
        appState.orderBookList[existingIdx] = { ...appState.orderBookList[existingIdx], ...message };
    }
  }
  return message;
}
function handleExchangeDirectoryMessage(message, appState) { return message; }
function handleMarketDirectoryMessage(message, appState) { return message; }
function handleCombinationOrderBookLegMessage(message, appState) { return message; }
function handleTickSizeTableMessage(message, appState) { return message; }
function handleCorporateActionEntryMessage(message, appState) { return message; }
function handleSystemEventMessage(message, appState) { return message; }
function handleOrderBookStateMessage(message, appState) { return message; }
function handleEquilibriumPriceMessage(message, appState) { return message; }
function handleMarketByPriceMessage(message, appState) { return message; }
function handleTradeStatisticsMessage(message, appState) { return message; }
function handleReferencePriceMessage(message, appState) { return message; }
function handleIndexPriceMessage(message, appState) { return message; }
function handleOpenInterestMessage(message, appState) { return message; }
function handleTradeTickerMessage(message, appState) { return message; }
function handlePriceLimitsMessage(message, appState) { return message; }
function handleCircuitBreakerTriggerMessage(message, appState) { return message; }
function handleIndicativeQuoteMessage(message, appState) { return message; }
function handleMarketAnnouncementMessage(message, appState) { return message; }
function handleHeartbeatMessage(message, appState) { return message; }
function handleUnknownMessage(message, appState) { return null; }

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
