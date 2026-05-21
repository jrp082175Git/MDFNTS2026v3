/**
 * A simple FIFO queue.
 */
class Queue {
  constructor() {
    this.items = [];
    this.headIndex = 0;
  }

  enqueue(item) {
    this.items.push(item);
  }

  dequeue() {
    if (this.headIndex < this.items.length) {
      const item = this.items[this.headIndex];
      this.items[this.headIndex] = null; // free memory
      this.headIndex++;

      // compact
      if (this.headIndex > 10000) {
        this.items = this.items.slice(this.headIndex);
        this.headIndex = 0;
      }
      return item;
    }
    return undefined;
  }

  get length() {
    return this.items.length - this.headIndex;
  }

  isEmpty() {
    return this.length === 0;
  }
}

module.exports = Queue;
