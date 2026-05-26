const net = require('net');
const { getLogger } = require('../logging/logger');
const TcpFramer = require('../utils/tcpFraming');
const { safeJsonParse } = require('../utils/safeJson');

class ReceiverRelayClient {
  constructor(config, onReceiveQueue) {
    this.config = config;
    this.onReceiveQueue = onReceiveQueue;
    this.logger = getLogger();
    this.client = null;
    this.reconnectTimer = null;
    this.framer = new TcpFramer((line) => this.handleMessage(line));
    this.currentReconnectInterval = this.config.receiver.reconnectIntervalMs || 1000;
  }

  start() {
    this.connect();
  }

  connect() {
    if (this.client) {
      this.client.destroy();
    }

    const { relayHost, relayPort } = this.config.receiver;
    this.logger.info(`Connecting to Receiver Relay Server at ${relayHost}:${relayPort}`);

    this.client = net.createConnection({ host: relayHost, port: relayPort }, () => {
      this.logger.info('Connected to Receiver Relay Server');
      this.currentReconnectInterval = this.config.receiver.reconnectIntervalMs || 1000; // reset
    });

    this.client.on('data', (data) => {
      this.framer.append(data);
    });

    this.client.on('end', () => {
      this.logger.warn('Disconnected from Receiver Relay Server (end)');
      this.scheduleReconnect();
    });

    this.client.on('error', (err) => {
      this.logger.error(`Receiver Relay Client Error: ${err.message}`);
      this.scheduleReconnect();
    });

    this.client.on('close', (hadError) => {
       if (!hadError) {
           this.logger.info('Connection to Receiver Relay Server closed normally.');
           this.scheduleReconnect();
       }
    });
  }

  scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    this.logger.info(`Scheduling reconnect in ${this.currentReconnectInterval}ms`);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.currentReconnectInterval);

    this.currentReconnectInterval = Math.min(
        this.currentReconnectInterval * 2,
        this.config.receiver.maxReconnectIntervalMs || 30000
    );
  }

  handleMessage(line) {
    const msg = safeJsonParse(line);
    if (msg) {
        this.onReceiveQueue.enqueue(msg);
    } else {
        this.logger.warn("Failed to parse JSON from Relay Server.");
    }
  }

  stop() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.client) this.client.destroy();
  }
}

module.exports = ReceiverRelayClient;
