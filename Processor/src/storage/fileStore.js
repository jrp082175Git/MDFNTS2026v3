const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { getDateKey } = require('../utils/dateKey');
const { bigintStringify } = require('../utils/bigintJson');

class FileStore {
  constructor(config) {
    this.config = config;
    this.dateKey = getDateKey();

    const basePath = path.resolve(__dirname, '../../', config.storage.basePath || './data');
    this.lMessagesFile = path.join(basePath, `lMessages/lMessages_${this.dateKey}.jsonl`);
    this.pMessagesFile = path.join(basePath, `pMessages/pMessages_${this.dateKey}.jsonl`);
    this.stateFile = path.join(basePath, `state/processor_state_${this.dateKey}.json`);

    this.lQueue = [];
    this.pQueue = [];
    this.isFlushing = false;
    this.flushInterval = null;
    this.lStream = null;
    this.pStream = null;
  }

  open() {
    this.lStream = fs.createWriteStream(this.lMessagesFile, { flags: 'a' });
    this.pStream = fs.createWriteStream(this.pMessagesFile, { flags: 'a' });
  }

  start() {
    this.open();
    const intervalMs = this.config.storage.flushIntervalMs || 1000;
    this.flushInterval = setInterval(() => this.flush(), intervalMs);
  }

  stop() {
    if (this.flushInterval) clearInterval(this.flushInterval);
    this.flush();
    if (this.lStream) this.lStream.end();
    if (this.pStream) this.pStream.end();
  }

  enqueueLMessage(msg) {
    this.lQueue.push(msg);
  }

  enqueuePMessage(msg) {
    this.pQueue.push(msg);
  }

  saveStateSync(stateObj) {
    try {
      fs.writeFileSync(this.stateFile, bigintStringify(stateObj));
    } catch (err) {
      console.error("Failed to save state file:", err);
    }
  }

  flush() {
    if (this.isFlushing || !this.lStream || !this.pStream) return;
    this.isFlushing = true;

    try {
      const lMsgs = [...this.lQueue];
      this.lQueue = [];
      for (const m of lMsgs) {
        this.lStream.write(bigintStringify(m) + '\n');
      }

      const pMsgs = [...this.pQueue];
      this.pQueue = [];
      for (const m of pMsgs) {
        this.pStream.write(bigintStringify(m) + '\n');
      }
    } catch (err) {
      console.error("FileStore flush error:", err);
    } finally {
      this.isFlushing = false;
    }
  }

  clearFiles() {
    if (fs.existsSync(this.lMessagesFile)) fs.unlinkSync(this.lMessagesFile);
    if (fs.existsSync(this.pMessagesFile)) fs.unlinkSync(this.pMessagesFile);
    if (fs.existsSync(this.stateFile)) fs.unlinkSync(this.stateFile);
  }

  async loadAll(onLMessage, onPMessage, onState) {
    if (fs.existsSync(this.lMessagesFile)) {
      const lStream = fs.createReadStream(this.lMessagesFile);
      const rl = readline.createInterface({ input: lStream, crlfDelay: Infinity });
      for await (const line of rl) {
        if (line.trim()) onLMessage(JSON.parse(line));
      }
    }

    if (fs.existsSync(this.pMessagesFile)) {
      const pStream = fs.createReadStream(this.pMessagesFile);
      const rl = readline.createInterface({ input: pStream, crlfDelay: Infinity });
      for await (const line of rl) {
        if (line.trim()) onPMessage(JSON.parse(line));
      }
    }

    if (fs.existsSync(this.stateFile)) {
      try {
        const data = fs.readFileSync(this.stateFile, 'utf8');
        if (data) onState(JSON.parse(data));
      } catch (e) {
        console.error("Could not load state file", e);
      }
    }
  }
}

module.exports = FileStore;
