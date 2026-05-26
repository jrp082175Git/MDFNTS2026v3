const { createClient } = require('redis');
const { getLogger } = require('../logging/logger');

let client = null;

async function initRedis(config) {
  if (!config.redis.enabled) {
    getLogger().info('Redis is disabled in config.');
    return null;
  }

  const url = `redis://${config.redis.password ? ':' + config.redis.password + '@' : ''}${config.redis.host}:${config.redis.port}/${config.redis.db}`;
  client = createClient({ url });

  client.on('error', (err) => {
    getLogger().error('Redis Client Error: ' + err);
  });

  client.on('connect', () => {
    getLogger().info('Connected to Redis');
  });

  await client.connect();
  return client;
}

function getRedisClient() {
  return client;
}

async function closeRedis() {
  if (client) {
    await client.quit();
    client = null;
  }
}

module.exports = { initRedis, getRedisClient, closeRedis };
