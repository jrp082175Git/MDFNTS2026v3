class ProprietaryMessageBuilder {
  constructor(appState) {
    this.appState = appState;
  }

  build(lMessage) {
    if (!lMessage) return null;

    const pMsgTypeMap = {
      'H': 100,
      'R': 101,
      'X': 102,
      'e': 103,
      'm': 104,
      'M': 105,
      'L': 106,
      'C': 107,
      'S': 108,
      'O': 109,
      'Z': 110,
      'b': 111,
      'I': 112,
      'Q': 113,
      'J': 114,
      'h': 115,
      'i': 116,
      'k': 117,
      'c': 118,
      'q': 119,
      'N': 120
    };

    const pMsgType = pMsgTypeMap[lMessage.msgType];
    if (pMsgType === undefined) {
       return null; // Don't build for unknown msg types not in map
    }

    const genSeqNo = this.appState.incrementGenSeqNo();

    // Copy all properties except msgType
    const { msgType, ...rest } = lMessage;

    return {
      seqNo: genSeqNo.toString(),
      msgType: pMsgType,
      timeStamp: this.appState.timeStamp,
      sourceSequence: lMessage.sequence ? lMessage.sequence.toString() : null,
      sourceMsgType: lMessage.msgType,
      ...rest
    };
  }
}

module.exports = ProprietaryMessageBuilder;
