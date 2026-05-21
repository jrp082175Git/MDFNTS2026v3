const dgram = require('dgram');
const { getLogger } = require('../logging/logger');

class MulticastReceiver {
  constructor(configEnvProfile) {
    this.config = configEnvProfile;
    this.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    this.onMessageCallback = null;
    this.logger = getLogger();
  }

  onMessage(callback) {
    this.onMessageCallback = callback;
  }

  start() {
    this.socket.on('message', (msg, rinfo) => {
      if (this.onMessageCallback) {
        this.onMessageCallback(msg, rinfo);
      }
    });

    this.socket.on('error', (err) => {
      this.logger.error(`UDP Socket error:\n${err.stack}`);
      this.socket.close();
    });

    this.socket.on('listening', () => {
      const address = this.socket.address();
      this.logger.info(`UDP Socket listening on ${address.address}:${address.port}`);

      try {
        this.socket.addMembership(this.config.multicastGroup, this.config.multicastInterface);
        this.logger.info(`Joined multicast group ${this.config.multicastGroup} on interface ${this.config.multicastInterface}`);
      } catch (err) {
        this.logger.error(`Error joining multicast group: ${err.message}`);
      }
    });

    this.socket.bind(this.config.multicastPort, this.config.localBindAddress);
  }

  stop() {
    if (this.socket) {
      try {
        this.socket.close();
      } catch (err) {
        // ignore
      }
    }
  }
}

module.exports = MulticastReceiver;
