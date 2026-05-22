class AppState {
  constructor(config) {
    this.packet = [];
    this.messages = [];
    this.maxMemoryPackets = config.performance.maxMemoryPackets || 10000;
    this.maxMemoryMessages = config.performance.maxMemoryMessages || 50000;
    this._packetHead = 0;
    this._messageHead = 0;
  }

  addPacket(p) {
    this.packet.push(p);
    if (this.packet.length - this._packetHead > this.maxMemoryPackets) {
      this.packet[this._packetHead] = null; // free memory
      this._packetHead++;
      if (this._packetHead > this.maxMemoryPackets * 2) {
          this.packet = this.packet.slice(this._packetHead);
          this._packetHead = 0;
      }
    }
  }

  addMessage(m) {
    this.messages.push(m);
    if (this.messages.length - this._messageHead > this.maxMemoryMessages) {
      this.messages[this._messageHead] = null; // free memory
      this._messageHead++;
      if (this._messageHead > this.maxMemoryMessages * 2) {
          this.messages = this.messages.slice(this._messageHead);
          this._messageHead = 0;
      }
    }
  }

  getPacketArray() {
      return this.packet.slice(this._packetHead);
  }

  getMessageArray() {
      return this.messages.slice(this._messageHead);
  }

  clear() {
    this.packet = [];
    this.messages = [];
    this._packetHead = 0;
    this._messageHead = 0;
  }
}

module.exports = AppState;
