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

  // Global env overrides
  if (process.env.MULTICAST_INTERFACE) {
      if(config.PROD) config.PROD.multicastInterface = process.env.MULTICAST_INTERFACE;
      if(config.DR) config.DR.multicastInterface = process.env.MULTICAST_INTERFACE;
  }

  return config;
}

module.exports = loadConfig;
