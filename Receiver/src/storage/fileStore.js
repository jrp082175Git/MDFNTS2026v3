const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { getDateKey } = require('../utils/dateKey');
const { bigintStringify } = require('../utils/bigintJson');
const Queue = require('../utils/queue');

class FileStore {
  constructor(config) {
    this.dateKey = getDateKey();

    const packetPrefix = config.storage.packetFilePrefix || 'packet_';
    const messagesPrefix = config.storage.messagesFilePrefix || 'messages_';

    this.packetFile = path.resolve(__dirname, `../../data/packets/${packetPrefix}${this.dateKey}.jsonl`);
    this.messagesFile = path.resolve(__dirname, `../../data/messages/${messagesPrefix}${this.dateKey}.jsonl`);

    this.packetQueue = new Queue();
    this.messageQueue = new Queue();
    this.isFlushing = false;
    this.flushInterval = null;
    this.packetStream = null;
    this.messageStream = null;
  }

  open() {
    this.packetStream = fs.createWriteStream(this.packetFile, { flags: 'a' });
    this.messageStream = fs.createWriteStream(this.messagesFile, { flags: 'a' });
  }

  start(intervalMs = 1000) {
    this.open();
    this.flushInterval = setInterval(() => this.flush(), intervalMs);
  }

  stop() {
    if (this.flushInterval) clearInterval(this.flushInterval);
    this.flush();
    if (this.packetStream) this.packetStream.end();
    if (this.messageStream) this.messageStream.end();
  }

  enqueuePacket(packet) {
    this.packetQueue.enqueue(packet);
  }

  enqueueMessage(message) {
    this.messageQueue.enqueue(message);
  }

  flush() {
    if (this.isFlushing || !this.packetStream || !this.messageStream) return;
    this.isFlushing = true;

    try {
      while (!this.packetQueue.isEmpty()) {
        const p = this.packetQueue.dequeue();
        this.packetStream.write(bigintStringify(p) + '\n');
      }

      while (!this.messageQueue.isEmpty()) {
        const m = this.messageQueue.dequeue();
        this.messageStream.write(bigintStringify(m) + '\n');
      }
    } catch (err) {
      console.error("File flush error:", err);
    } finally {
      this.isFlushing = false;
    }
  }

  clearFiles() {
    if (fs.existsSync(this.packetFile)) fs.unlinkSync(this.packetFile);
    if (fs.existsSync(this.messagesFile)) fs.unlinkSync(this.messagesFile);
  }

  async loadAll(onPacket, onMessage) {
    if (fs.existsSync(this.packetFile)) {
      const pStream = fs.createReadStream(this.packetFile);
      const rl = readline.createInterface({ input: pStream, crlfDelay: Infinity });
      for await (const line of rl) {
        if (line.trim()) {
           // Basic parse, bigints will be strings but that's fine for state
           onPacket(JSON.parse(line));
        }
      }
    }

    if (fs.existsSync(this.messagesFile)) {
      const mStream = fs.createReadStream(this.messagesFile);
      const rl = readline.createInterface({ input: mStream, crlfDelay: Infinity });
      for await (const line of rl) {
        if (line.trim()) {
           onMessage(JSON.parse(line));
        }
      }
    }
  }
}

module.exports = FileStore;
