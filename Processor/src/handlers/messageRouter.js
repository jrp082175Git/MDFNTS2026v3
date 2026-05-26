const mdfHandlerRegistry = require('./mdfHandlerRegistry');
const handlers = require('./handlers');

function routeMessage(message) {
  if (!message || !message.msgType) {
    return handlers.handleUnknownMessage(message);
  }

  const handler = mdfHandlerRegistry[message.msgType];
  if (handler) {
    return handler(message);
  }

  return handlers.handleUnknownMessage(message);
}

module.exports = { routeMessage };
