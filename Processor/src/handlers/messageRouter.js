const mdfHandlerRegistry = require('./mdfHandlerRegistry');
const handlers = require('./handlers');

function routeMessage(message, appState) {
  if (!message || !message.msgType) {
    return handlers.handleUnknownMessage(message, appState);
  }

  const handler = mdfHandlerRegistry[message.msgType];
  if (handler) {
    return handler(message, appState);
  }

  return handlers.handleUnknownMessage(message, appState);
}

module.exports = { routeMessage };
