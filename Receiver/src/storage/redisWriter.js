const { getRedisClient } = require('./redisClient');
const { getDateKey } = require('../utils/dateKey');
const { bigintStringify } = require('../utils/bigintJson');
const Queue = require('../utils/queue');

class RedisWriter {
  constructor() {
    this.dateKey = getDateKey();
    this.packetQueue = new Queue();
    this.messageQueue = new Queue();
    this.isFlushing = false;
    this.flushInterval = null;
  }

  start(intervalMs = 1000) {
    this.flushInterval = setInterval(() => this.flush(), intervalMs);
  }

  stop() {
    if (this.flushInterval) clearInterval(this.flushInterval);
    return this.flush();
  }

  enqueuePacket(packet) {
    this.packetQueue.enqueue(packet);
  }

  enqueueMessage(message) {
    this.messageQueue.enqueue(message);
  }

  async flush() {
    if (this.isFlushing) return;
    this.isFlushing = true;

    const packets = [];
    while (!this.packetQueue.isEmpty()) {
      packets.push(this.packetQueue.dequeue());
    }

    const messages = [];
    while (!this.messageQueue.isEmpty()) {
      messages.push(this.messageQueue.dequeue());
    }

    if (packets.length === 0 && messages.length === 0) {
      this.isFlushing = false;
      return;
    }

    try {
      const redis = getRedisClient();
      const multi = redis.multi();

      const packetsKey = `MDF:${this.dateKey}:packets`;
      const messagesKey = `MDF:${this.dateKey}:messages`;

      // Use Redis lists for appending
      for (const p of packets) {
        multi.rPush(packetsKey, bigintStringify(p));
      }

      for (const m of messages) {
        const mStr = bigintStringify(m);
        multi.rPush(messagesKey, mStr);
        // Also store by sequence for TCP retransmission
        if (m.sequence) {
          multi.set(`MDF:${this.dateKey}:message:${m.sequence}`, mStr);
        }
      }

      await multi.exec();
    } catch (err) {
      console.error("Redis flush error:", err);
      // Put them back if we want to retry?
      // For now just log.
    } finally {
      this.isFlushing = false;
    }
  }

  async clearCurrentDate() {
    const redis = getRedisClient();
    const packetsKey = `MDF:${this.dateKey}:packets`;
    const messagesKey = `MDF:${this.dateKey}:messages`;

    // We would also need to clear sequence keys, but there might be many.
    // A better approach for START:Y would be scanning, but we'll delete the main lists and known state.
    await redis.del([packetsKey, messagesKey]);

    let cursor = 0;
    do {
      const res = await redis.scan(cursor, { MATCH: `MDF:${this.dateKey}:message:*`, COUNT: 1000 });
      cursor = res.cursor;
      if (res.keys.length > 0) {
          await redis.del(res.keys);
      }
    } while (cursor !== 0 && cursor !== '0');
  }
}

module.exports = RedisWriter;
