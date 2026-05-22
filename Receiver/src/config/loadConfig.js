const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

function loadConfig() {
  const configPath = path.resolve(__dirname, '../../receiver.config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error(`Configuration file not found: ${configPath}`);
  }

  const rawConfig = fs.readFileSync(configPath, 'utf8');
  const config = JSON.parse(rawConfig);

  // Apply env overrides for Redis
  if (process.env.REDIS_HOST) config.redis.host = process.env.REDIS_HOST;
  if (process.env.REDIS_PORT) config.redis.port = parseInt(process.env.REDIS_PORT, 10);
  if (process.env.REDIS_DB) config.redis.db = parseInt(process.env.REDIS_DB, 10);
  if (process.env.REDIS_PASSWORD !== undefined) config.redis.password = process.env.REDIS_PASSWORD;

  // Environment-specific and global env overrides
  if (process.env.MULTICAST_INTERFACE) {
      if(config.PROD) config.PROD.multicastInterface = process.env.PROD_MULTICAST_INTERFACE || process.env.MULTICAST_INTERFACE;
      if(config.DR) config.DR.multicastInterface = process.env.DR_MULTICAST_INTERFACE || process.env.MULTICAST_INTERFACE;
  }

  if (process.env.MULTICAST_PORT || process.env.PROD_MULTICAST_PORT) {
      if(config.PROD) config.PROD.multicastPort = parseInt(process.env.PROD_MULTICAST_PORT || process.env.MULTICAST_PORT, 10);
  }
  if (process.env.MULTICAST_PORT || process.env.DR_MULTICAST_PORT) {
      if(config.DR) config.DR.multicastPort = parseInt(process.env.DR_MULTICAST_PORT || process.env.MULTICAST_PORT, 10);
  }

  if (process.env.MULTICAST_GROUP || process.env.PROD_MULTICAST_GROUP) {
      if(config.PROD) config.PROD.multicastGroup = process.env.PROD_MULTICAST_GROUP || process.env.MULTICAST_GROUP;
  }
  if (process.env.MULTICAST_GROUP || process.env.DR_MULTICAST_GROUP) {
      if(config.DR) config.DR.multicastGroup = process.env.DR_MULTICAST_GROUP || process.env.MULTICAST_GROUP;
  }

  if (process.env.SOCKETIO_PORT) config.socketIO.port = parseInt(process.env.SOCKETIO_PORT, 10);
  if (process.env.SOCKETIO_HOST) config.socketIO.host = process.env.SOCKETIO_HOST;

  if (process.env.TCP_RELAY_PORT) config.tcpRelay.port = parseInt(process.env.TCP_RELAY_PORT, 10);
  if (process.env.TCP_RELAY_HOST) config.tcpRelay.host = process.env.TCP_RELAY_HOST;

  if (process.env.TCP_RETRANS_PORT) config.tcpRetrans.port = parseInt(process.env.TCP_RETRANS_PORT, 10);
  if (process.env.TCP_RETRANS_HOST) config.tcpRetrans.host = process.env.TCP_RETRANS_HOST;

  return config;
}

module.exports = loadConfig;
