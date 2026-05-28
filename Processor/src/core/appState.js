class AppState {
  constructor() {
    this.lMessages = [];
    this.pMessages = [];
    this._lHead = 0;
    this._pHead = 0;

    // Limits
    this.maxMemoryMessages = 50000;

    this.genSeqNo = BigInt(0);
    this.expectedInputSequence = BigInt(1);
    this.latestProcessedInputSequence = BigInt(0);

    this.orderBookList = [];
    this.timeStamp = null;
  }

  addLMessage(m) {
    this.lMessages.push(m);
    if (this.lMessages.length - this._lHead > this.maxMemoryMessages) {
      this.lMessages[this._lHead] = null;
      this._lHead++;
      if (this._lHead > this.maxMemoryMessages * 2) {
        this.lMessages = this.lMessages.slice(this._lHead);
        this._lHead = 0;
      }
    }
  }

  addPMessage(m) {
    this.pMessages.push(m);
    if (this.pMessages.length - this._pHead > this.maxMemoryMessages) {
      this.pMessages[this._pHead] = null;
      this._pHead++;
      if (this._pHead > this.maxMemoryMessages * 2) {
        this.pMessages = this.pMessages.slice(this._pHead);
        this._pHead = 0;
      }
    }
  }

  getPMessageArray() {
    return this.pMessages.slice(this._pHead);
  }

  getLMessageArray() {
    return this.lMessages.slice(this._lHead);
  }

  incrementGenSeqNo() {
    this.genSeqNo++;
    return this.genSeqNo;
  }

  getState() {
    return {
      expectedInputSequence: this.expectedInputSequence.toString(),
      latestProcessedInputSequence: this.latestProcessedInputSequence.toString(),
      genSeqNo: this.genSeqNo.toString(),
      timeStamp: this.timeStamp,
      orderBookList: this.orderBookList,
      updatedAt: new Date().toISOString()
    };
  }

  setState(stateObj) {
    if (stateObj.expectedInputSequence) this.expectedInputSequence = BigInt(stateObj.expectedInputSequence);
    if (stateObj.latestProcessedInputSequence) this.latestProcessedInputSequence = BigInt(stateObj.latestProcessedInputSequence);
    if (stateObj.genSeqNo) this.genSeqNo = BigInt(stateObj.genSeqNo);
    if (stateObj.timeStamp !== undefined) this.timeStamp = stateObj.timeStamp;
    if (stateObj.orderBookList !== undefined) this.orderBookList = stateObj.orderBookList;
  }

  clear() {
    this.lMessages = [];
    this.pMessages = [];
    this._lHead = 0;
    this._pHead = 0;
    this.genSeqNo = BigInt(0);
    this.expectedInputSequence = BigInt(1);
    this.latestProcessedInputSequence = BigInt(0);
    this.orderBookList = [];
    this.timeStamp = null;
  }
}

module.exports = AppState;
