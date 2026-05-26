const net = require('net');
const { getLogger } = require('../logging/logger');
const { bigintStringify } = require('../utils/bigintJson');

class ProcessorRelayServer {
  constructor(config) {
    this.port = config.processor.relayTcpPort || 9101;
    this.host = config.processor.relayTcpHost || '0.0.0.0';
    this.server = null;
    this.clients = new Set();
    this.logger = getLogger();
    this.maxBufferBytes = config.performance.slowClientMaxBufferBytes || 10485760;
  }

  start() {
    this.server = net.createServer((socket) => {
      this.logger.info(`Processor TCP Relay client connected: ${socket.remoteAddress}:${socket.remotePort}`);
      this.clients.add(socket);

      socket.on('error', (err) => {
        this.logger.error(`Processor TCP Relay client error ${socket.remoteAddress}:${socket.remotePort}: ${err.message}`);
      });

      socket.on('close', () => {
        this.logger.info(`Processor TCP Relay client disconnected: ${socket.remoteAddress}:${socket.remotePort}`);
        this.clients.delete(socket);
      });
    });

    this.server.listen(this.port, this.host, () => {
      this.logger.info(`Processor TCP Relay Server listening on ${this.host}:${this.port}`);
    });
  }

  stop() {
    for (const client of this.clients) {
      client.destroy();
    }
    this.clients.clear();

    if (this.server) {
      this.server.close();
    }
  }

  broadcastMessage(message) {
    if (this.clients.size === 0) return;

    const line = bigintStringify(message) + '\n';
    const bufferSizeEstimate = Buffer.byteLength(line, 'utf8');

    for (const client of this.clients) {
      if (client._isPaused) {
        client._bufferSize = (client._bufferSize || 0) + bufferSizeEstimate;
        if (!client._queue) client._queue = [];
        client._queue.push(line);
        if (client._bufferSize > this.maxBufferBytes) {
            this.logger.warn(`Processor TCP Relay client too slow, dropping connection: ${client.remoteAddress}:${client.remotePort}`);
            client.destroy();
        }
        continue;
      }

      if (!client.write(line)) {
        client._isPaused = true;
        if (!client._queue) client._queue = [];
        client._bufferSize = 0;

        client.once('drain', () => {
          client._isPaused = false;
          while (client._queue && client._queue.length > 0 && !client._isPaused) {
            const nextLine = client._queue.shift();
            client._bufferSize -= Buffer.byteLength(nextLine, 'utf8');
            if (!client.write(nextLine)) {
               client._isPaused = true;
            }
          }
        });
      }
    }
  }
}

module.exports = ProcessorRelayServer;
