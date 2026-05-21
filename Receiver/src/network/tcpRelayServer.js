const net = require('net');
const { getLogger } = require('../logging/logger');
const { bigintStringify } = require('../utils/bigintJson');

class TcpRelayServer {
  constructor(config) {
    this.port = config.tcpRelay.port || 4000;
    this.idleTimeoutMs = config.tcpRelay.idleTimeoutMs || 30000;
    this.server = null;
    this.clients = new Set();
    this.logger = getLogger();
  }

  start() {
    this.server = net.createServer((socket) => {
      this.logger.info(`TCP Relay client connected: ${socket.remoteAddress}:${socket.remotePort}`);
      this.clients.add(socket);

      socket.setTimeout(this.idleTimeoutMs);

      socket.on('timeout', () => {
        this.logger.warn(`TCP Relay client timeout: ${socket.remoteAddress}:${socket.remotePort}`);
        socket.destroy();
      });

      socket.on('error', (err) => {
        this.logger.error(`TCP Relay client error ${socket.remoteAddress}:${socket.remotePort}: ${err.message}`);
      });

      socket.on('close', () => {
        this.logger.info(`TCP Relay client disconnected: ${socket.remoteAddress}:${socket.remotePort}`);
        this.clients.delete(socket);
      });
    });

    this.server.listen(this.port, () => {
      this.logger.info(`TCP Relay Server listening on port ${this.port}`);
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

    for (const client of this.clients) {
      // Basic backpressure handling
      if (!client.write(line)) {
        // TCP buffer full, it will drain eventually.
        // We could disconnect if it builds up too much.
      }
    }
  }
}

module.exports = TcpRelayServer;
