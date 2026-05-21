const dgram = require('dgram');
const { buildRequestPacket } = require('../moldudp64/buildRequestPacket');
const { getLogger } = require('../logging/logger');

class RetransmissionClient {
  constructor(configEnvProfile) {
    this.config = configEnvProfile;
    this.socket = dgram.createSocket('udp4');
    this.logger = getLogger();
    this.serverIndex = 0;
  }

  requestMissingPackets(session, expectedSequence, gapCount) {
    if (!this.config.requestServers || this.config.requestServers.length === 0) {
      this.logger.warn("No request servers configured for retransmission.");
      return;
    }

    // Safety limit on gap request
    const count = gapCount > 65535 ? 65535 : gapCount;
    const reqBuffer = buildRequestPacket(session, expectedSequence, count);

    const server = this.config.requestServers[this.serverIndex];

    this.socket.send(reqBuffer, server.port, server.host, (err) => {
      if (err) {
        this.logger.error(`Error sending retransmission request to ${server.host}:${server.port}: ${err.message}`);
      } else {
        this.logger.info(`Sent retransmission request for seq ${expectedSequence} count ${count} to ${server.host}:${server.port}`);
      }
    });

    // Round robin if multiple servers
    this.serverIndex = (this.serverIndex + 1) % this.config.requestServers.length;
  }

  stop() {
      if(this.socket) {
          try {
              this.socket.close();
          } catch(err) {
              // ignore
          }
      }
  }
}

module.exports = RetransmissionClient;
