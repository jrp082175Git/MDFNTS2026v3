const { getRedisClient } = require('./redisClient');
const { getDateKey } = require('../utils/dateKey');
const { bigintStringify } = require('../utils/bigintJson');

class RedisWriter {
  constructor(config) {
    this.config = config;
    this.dateKey = getDateKey();
    this.keyPrefix = config.redis.keyPrefix || "ITCH:PROCESSOR";
    this.lMessageQueue = [];
    this.pMessageQueue = [];
    this.stateToSave = null;
    this.isFlushing = false;
    this.flushInterval = null;
  }

  start() {
    if (!this.config.redis.enabled) return;
    const intervalMs = this.config.storage.flushIntervalMs || 1000;
    this.flushInterval = setInterval(() => this.flush(), intervalMs);
  }

  stop() {
    if (this.flushInterval) clearInterval(this.flushInterval);
    return this.flush();
  }

  enqueueLMessage(msg) {
    if (this.config.redis.enabled) this.lMessageQueue.push(msg);
  }

  enqueuePMessage(msg) {
    if (this.config.redis.enabled) this.pMessageQueue.push(msg);
  }

  enqueueState(stateObj) {
    if (this.config.redis.enabled) this.stateToSave = stateObj;
  }

  async flush() {
    if (this.isFlushing || (!this.lMessageQueue.length && !this.pMessageQueue.length && !this.stateToSave)) return;
    this.isFlushing = true;

    const redis = getRedisClient();
    if (!redis) {
      this.isFlushing = false;
      return;
    }

    try {
      const multi = redis.multi();

      // lMessages
      const lMsgs = [...this.lMessageQueue];
      this.lMessageQueue = [];
      const lListKey = `${this.keyPrefix}:${this.dateKey}:lMessages`;
      for (const msg of lMsgs) {
        const str = bigintStringify(msg);
        multi.rPush(lListKey, str);
        if (msg.sequence) {
          multi.set(`${this.keyPrefix}:${this.dateKey}:lMessage:${msg.sequence}`, str);
        }
      }

      // pMessages
      const pMsgs = [...this.pMessageQueue];
      this.pMessageQueue = [];
      const pListKey = `${this.keyPrefix}:${this.dateKey}:pMessages`;
      for (const msg of pMsgs) {
        const str = bigintStringify(msg);
        multi.rPush(pListKey, str);
        if (msg.pSequence) {
          multi.set(`${this.keyPrefix}:${this.dateKey}:pMessage:${msg.pSequence}`, str);
        }
      }

      // State
      if (this.stateToSave) {
        multi.set(`${this.keyPrefix}:${this.dateKey}:state`, bigintStringify(this.stateToSave));
        this.stateToSave = null;
      }

      await multi.exec();
    } catch (err) {
      console.error("RedisWriter flush error:", err);
    } finally {
      this.isFlushing = false;
    }
  }

  async clearCurrentDate() {
    const redis = getRedisClient();
    if (!redis) return;

    // Fast clear of known lists/state
    await redis.del([
      `${this.keyPrefix}:${this.dateKey}:lMessages`,
      `${this.keyPrefix}:${this.dateKey}:pMessages`,
      `${this.keyPrefix}:${this.dateKey}:state`
    ]);

    // Slow clear of sequences
    let cursor = 0;
    do {
      const res = await redis.scan(cursor, { MATCH: `${this.keyPrefix}:${this.dateKey}:lMessage:*`, COUNT: 1000 });
      cursor = res.cursor;
      if (res.keys.length > 0) await redis.del(res.keys);
    } while (cursor !== 0 && cursor !== '0');

    cursor = 0;
    do {
      const res = await redis.scan(cursor, { MATCH: `${this.keyPrefix}:${this.dateKey}:pMessage:*`, COUNT: 1000 });
      cursor = res.cursor;
      if (res.keys.length > 0) await redis.del(res.keys);
    } while (cursor !== 0 && cursor !== '0');
  }
}

module.exports = RedisWriter;
