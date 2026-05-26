class TcpFramer {
  constructor(onMessage) {
    this.buffer = '';
    this.onMessage = onMessage;
  }

  append(data) {
    this.buffer += data.toString();
    this.process();
  }

  process() {
    let nlIdx;
    while ((nlIdx = this.buffer.indexOf('\n')) !== -1) {
      const line = this.buffer.substring(0, nlIdx).trim();
      this.buffer = this.buffer.substring(nlIdx + 1);

      if (line) {
        this.onMessage(line);
      }
    }
  }
}

module.exports = TcpFramer;
