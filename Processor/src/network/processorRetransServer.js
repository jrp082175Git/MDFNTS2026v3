const net = require('net');
const { getLogger } = require('../logging/logger');
const { bigintStringify } = require('../utils/bigintJson');
const { getRedisClient } = require('../storage/redisClient');
const { getDateKey } = require('../utils/dateKey');

class ProcessorRetransServer {
  constructor(config, appState) {
    this.port = config.processor.retransTcpPort || 9102;
    this.host = config.processor.retransTcpHost || '0.0.0.0';
    this.maxRange = config.performance.maxRetransRange || 10000;
    this.server = null;
    this.logger = getLogger();
    this.appState = appState;
    this.dateKey = getDateKey();
    this.config = config;
  }

  start() {
    this.server = net.createServer((socket) => {
      this.logger.info(`Processor TCP Retrans client connected: ${socket.remoteAddress}:${socket.remotePort}`);
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
        this.logger.error(`Processor TCP Retrans client error: ${err.message}`);
      });
    });

    this.server.listen(this.port, this.host, () => {
      this.logger.info(`Processor TCP Retrans Server listening on ${this.host}:${this.port}`);
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

      const memMessages = this.appState.getPMessageArray().filter(m => m && m.pSequence && BigInt(m.pSequence) >= bSeq && BigInt(m.pSequence) <= eSeq);
      const foundSeqs = new Set(memMessages.map(m => BigInt(m.pSequence)));

      for (const m of memMessages) {
          messages.push(m);
      }

      if (this.config.redis.enabled && redis) {
        for (let seq = bSeq; seq <= eSeq; seq++) {
          if (!foundSeqs.has(seq)) {
              const key = `${this.config.redis.keyPrefix}:${this.dateKey}:pMessage:${seq.toString()}`;
              const val = await redis.get(key);
              if (val) {
                messages.push(JSON.parse(val));
              }
          }
        }
      }

      messages.sort((a, b) => {
          if (!a.pSequence || !b.pSequence) return 0;
          return Number(BigInt(a.pSequence) - BigInt(b.pSequence));
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
      this.logger.error(`Error handling processor retrans request: ${err.message}`);
      socket.write(JSON.stringify({ error: "Invalid request format" }) + '\n');
    }
  }
}

module.exports = ProcessorRetransServer;
