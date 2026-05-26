class ProprietaryMessageBuilder {
  constructor(appState) {
    this.appState = appState;
  }

  build(lMessage, payloadObj) {
    if (!payloadObj) return null;

    const pSequence = this.appState.incrementProprietaryOutputSequence();

    // Attempt to map mdf msgType to a business type.
    // This is a placeholder mapping; developers can expand this.
    const propTypes = {
      'b': 'BROKER_MBP',
      'i': 'BROKER_TRADE',
      'T': 'BROKER_TIME',
      'S': 'BROKER_EVENT'
    };

    const propType = propTypes[lMessage.msgType] || 'BROKER_GENERIC';

    return {
      pSequence: pSequence.toString(),
      sourceSequence: lMessage.sequence ? lMessage.sequence.toString() : null,
      sourceMsgType: lMessage.msgType,
      proprietaryMsgType: propType,
      createdAt: new Date().toISOString(),
      payload: payloadObj
    };
  }
}

module.exports = ProprietaryMessageBuilder;
