class AppState {
  constructor(config) {
    this.packet = [];
    this.messages = [];
    this.maxMemoryPackets = config.performance.maxMemoryPackets || 10000;
    this.maxMemoryMessages = config.performance.maxMemoryMessages || 50000;
  }

  addPacket(p) {
    this.packet.push(p);
    if (this.packet.length > this.maxMemoryPackets) {
      this.packet.shift(); // keep memory footprint bounded
    }
  }

  addMessage(m) {
    this.messages.push(m);
    if (this.messages.length > this.maxMemoryMessages) {
      this.messages.shift(); // keep memory footprint bounded
    }
  }

  clear() {
    this.packet = [];
    this.messages = [];
  }
}

module.exports = AppState;
