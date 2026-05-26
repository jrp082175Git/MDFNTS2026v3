const { Server } = require('socket.io');
const http = require('http');
const { getLogger } = require('../logging/logger');
const { bigintStringify } = require('../utils/bigintJson');

class SocketIOServer {
  constructor(config) {
    this.port = config.processor.socketIOPort || 9100;
    this.host = config.processor.socketIOHost || '0.0.0.0';
    this.httpServer = http.createServer();
    this.io = new Server(this.httpServer, {
      cors: { origin: '*' }
    });
    this.logger = getLogger();
  }

  start() {
    this.io.on('connection', (socket) => {
      this.logger.info(`Socket.IO client connected: ${socket.id}`);
      socket.on('disconnect', () => {
        this.logger.info(`Socket.IO client disconnected: ${socket.id}`);
      });
    });

    this.httpServer.listen(this.port, this.host, () => {
      this.logger.info(`Processor Socket.IO Server listening on ${this.host}:${this.port}`);
    });
  }

  stop() {
    if (this.io) this.io.close();
    if (this.httpServer) this.httpServer.close();
  }

  broadcastLMessage(msg) {
    const str = bigintStringify(msg);
    this.io.emit('processor:lMessage', JSON.parse(str));
  }

  broadcastPMessage(msg) {
    const str = bigintStringify(msg);
    this.io.emit('processor:pMessage', JSON.parse(str));
  }
}

module.exports = SocketIOServer;
