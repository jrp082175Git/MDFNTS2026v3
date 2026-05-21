const { createClient } = require('redis');
const { getLogger } = require('../logging/logger');

let client = null;

async function initRedis(config) {
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
  if (!client) throw new Error("Redis not initialized");
  return client;
}

async function closeRedis() {
  if (client) {
    await client.quit();
  }
}

module.exports = { initRedis, getRedisClient, closeRedis };
