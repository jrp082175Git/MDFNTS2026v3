const net = require('net');
const { getLogger } = require('../logging/logger');
const { bigintStringify } = require('../utils/bigintJson');
const { getRedisClient } = require('../storage/redisClient');
const { getDateKey } = require('../utils/dateKey');

class TcpRetransServer {
  constructor(config, appState) {
    this.port = config.tcpRetrans.port || 5000;
    this.maxRange = config.tcpRetrans.maxRange || 10000;
    this.server = null;
    this.logger = getLogger();
    this.appState = appState;
    this.dateKey = getDateKey();
  }

  start() {
    this.server = net.createServer((socket) => {
      this.logger.info(`TCP Retrans client connected: ${socket.remoteAddress}:${socket.remotePort}`);
      let buffer = '';

      socket.on('data', async (data) => {
        buffer += data.toString();

        let nlIdx;
        while ((nlIdx = buffer.indexOf('\n')) !== -1) {
          const line = buffer.substring(0, nlIdx);
          buffer = buffer.substring(nlIdx + 1);

          if (line.trim()) {
            await this.handleRequest(socket, line);
          }
        }
      });

      socket.on('error', (err) => {
        this.logger.error(`TCP Retrans client error: ${err.message}`);
      });
    });

    this.server.listen(this.port, () => {
      this.logger.info(`TCP Retrans Server listening on port ${this.port}`);
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
    }
  }

  async handleRequest(socket, line) {
    try {
      const req = JSON.parse(line);
      const { socketClientID, beginSeq, endSequence } = req;

      if (!socketClientID || !beginSeq || !endSequence) {
        socket.write(JSON.stringify({ error: "Missing required fields" }) + '\n');
        return;
      }

      const bSeq = BigInt(beginSeq);
      const eSeq = BigInt(endSequence);

      if (eSeq < bSeq) {
        socket.write(JSON.stringify({ error: "endSequence < beginSeq" }) + '\n');
        return;
      }

      if (eSeq - bSeq > BigInt(this.maxRange)) {
        socket.write(JSON.stringify({ error: `Range exceeds maxRange of ${this.maxRange}` }) + '\n');
        return;
      }

      const messages = [];
      const redis = getRedisClient();

      // Simple binary search or filter could be used if messages is large
      // For simplicity, find in in-memory array first
      const memMessages = this.appState.getMessageArray().filter(m => m && m.sequence && BigInt(m.sequence) >= bSeq && BigInt(m.sequence) <= eSeq);

      const foundSeqs = new Set(memMessages.map(m => BigInt(m.sequence)));

      for (const m of memMessages) {
          messages.push(m);
      }

      for (let seq = bSeq; seq <= eSeq; seq++) {
        if (!foundSeqs.has(seq)) {
            // Fallback to Redis
            const key = `MDF:${this.dateKey}:message:${seq.toString()}`;
            const val = await redis.get(key);
            if (val) {
              messages.push(JSON.parse(val));
            }
        }
      }

      // Sort messages by sequence number before sending
      messages.sort((a, b) => {
          if (!a.sequence || !b.sequence) return 0;
          return Number(BigInt(a.sequence) - BigInt(b.sequence));
      });

      const response = {
        socketClientID,
        beginSeq,
        endSequence,
        count: messages.length,
        messages
      };

      socket.write(bigintStringify(response) + '\n');

    } catch (err) {
      this.logger.error(`Error handling retrans request: ${err.message}`);
      socket.write(JSON.stringify({ error: "Invalid request format" }) + '\n');
    }
  }
}

module.exports = TcpRetransServer;
