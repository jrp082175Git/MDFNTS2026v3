const net = require('net');
const { getLogger } = require('../logging/logger');
const TcpFramer = require('../utils/tcpFraming');
const { safeJsonParse } = require('../utils/safeJson');
const { bigintStringify } = require('../utils/bigintJson');

class ReceiverRetransClient {
  constructor(config, onCacheQueue) {
    this.config = config;
    this.onCacheQueue = onCacheQueue;
    this.logger = getLogger();
    this.client = null;
    this.clientId = `PROCESSOR_${Date.now()}`;
    this.framer = new TcpFramer((line) => this.handleResponse(line));
  }

  requestMissingPackets(beginSeq, endSequence) {
    const { retransHost, retransPort } = this.config.receiver;

    this.logger.info(`Connecting to Receiver Retrans Server at ${retransHost}:${retransPort} for gap ${beginSeq}-${endSequence}`);

    this.client = net.createConnection({ host: retransHost, port: retransPort }, () => {
      this.logger.info(`Connected to Receiver Retrans Server. Requesting ${beginSeq} to ${endSequence}`);
      const req = {
        socketClientID: this.clientId,
        beginSeq: beginSeq.toString(),
        endSequence: endSequence.toString()
      };
      this.client.write(bigintStringify(req) + '\n');
    });

    this.client.on('data', (data) => {
      this.framer.append(data);
    });

    this.client.on('error', (err) => {
      this.logger.error(`Receiver Retrans Client Error: ${err.message}`);
      // The sequence manager expects pending messages to eventually process.
      // If retrans fails, we should either retry or skip.
      // For basic recovery, we'll log it. A robust system would reset the retransmitting flag and retry.
    });

    this.client.on('close', () => {
       // Destroy client to avoid memory leaks
       this.client.destroy();
       this.client = null;
    });
  }

  handleResponse(line) {
    const res = safeJsonParse(line);
    if (!res) {
        this.logger.warn("Failed to parse retrans response");
        return;
    }

    if (res.error) {
        this.logger.error(`Retrans server returned error: ${res.error}`);
        return;
    }

    if (res.messages && Array.isArray(res.messages)) {
        this.logger.info(`Received ${res.messages.length} retransmitted messages.`);
        for (const msg of res.messages) {
            this.onCacheQueue.enqueue(msg);
        }
    } else {
        // Individual newline-delimited message response style
        this.onCacheQueue.enqueue(res);
    }
  }

  stop() {
    if (this.client) this.client.destroy();
  }
}

module.exports = ReceiverRetransClient;
