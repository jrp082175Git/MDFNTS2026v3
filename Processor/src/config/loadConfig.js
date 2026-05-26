const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

function loadConfig() {
  const configPath = path.resolve(__dirname, '../../processor.config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error(`Configuration file not found: ${configPath}`);
  }

  const rawConfig = fs.readFileSync(configPath, 'utf8');
  const config = JSON.parse(rawConfig);

  // Redis overrides
  if (process.env.REDIS_HOST) config.redis.host = process.env.REDIS_HOST;
  if (process.env.REDIS_PORT) config.redis.port = parseInt(process.env.REDIS_PORT, 10);
  if (process.env.REDIS_DB) config.redis.db = parseInt(process.env.REDIS_DB, 10);
  if (process.env.REDIS_PASSWORD !== undefined) config.redis.password = process.env.REDIS_PASSWORD;

  // Receiver connections overrides
  if (process.env.RECEIVER_RELAY_HOST) config.receiver.relayHost = process.env.RECEIVER_RELAY_HOST;
  if (process.env.RECEIVER_RELAY_PORT) config.receiver.relayPort = parseInt(process.env.RECEIVER_RELAY_PORT, 10);
  if (process.env.RECEIVER_RETRANS_HOST) config.receiver.retransHost = process.env.RECEIVER_RETRANS_HOST;
  if (process.env.RECEIVER_RETRANS_PORT) config.receiver.retransPort = parseInt(process.env.RECEIVER_RETRANS_PORT, 10);

  // Processor servers overrides
  if (process.env.PROCESSOR_SOCKETIO_HOST) config.processor.socketIOHost = process.env.PROCESSOR_SOCKETIO_HOST;
  if (process.env.PROCESSOR_SOCKETIO_PORT) config.processor.socketIOPort = parseInt(process.env.PROCESSOR_SOCKETIO_PORT, 10);
  if (process.env.PROCESSOR_TCP_RELAY_HOST) config.processor.relayTcpHost = process.env.PROCESSOR_TCP_RELAY_HOST;
  if (process.env.PROCESSOR_TCP_RELAY_PORT) config.processor.relayTcpPort = parseInt(process.env.PROCESSOR_TCP_RELAY_PORT, 10);
  if (process.env.PROCESSOR_TCP_RETRANS_HOST) config.processor.retransTcpHost = process.env.PROCESSOR_TCP_RETRANS_HOST;
  if (process.env.PROCESSOR_TCP_RETRANS_PORT) config.processor.retransTcpPort = parseInt(process.env.PROCESSOR_TCP_RETRANS_PORT, 10);

  return config;
}

module.exports = loadConfig;
