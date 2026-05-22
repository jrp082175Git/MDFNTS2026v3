const { Server } = require('socket.io');
const { getLogger } = require('../logging/logger');
const { bigintStringify } = require('../utils/bigintJson');

const http = require('http');

class SocketIOServer {
  constructor(config) {
    this.port = config.socketIO.port || 3000;
    this.host = config.socketIO.host || '0.0.0.0';
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
      this.logger.info(`Socket.IO Server listening on ${this.host}:${this.port}`);
    });
  }

  stop() {
    if (this.io) {
      this.io.close();
    }
    if (this.httpServer) {
        this.httpServer.close();
    }
  }

  broadcastPacket(packet) {
    const pStr = bigintStringify(packet);
    const pObj = JSON.parse(pStr);

    this.io.emit('packet', pObj);

    if (packet.packetType === 'HEARTBEAT') {
      this.io.emit('heartbeat', pObj);
    } else if (packet.packetType === 'END_OF_SESSION') {
      this.io.emit('endSession', pObj);
    }
  }

  broadcastSequenceGap(expected, received) {
    this.io.emit('sequenceGap', { expected: expected.toString(), received: received.toString() });
  }
}

module.exports = SocketIOServer;
