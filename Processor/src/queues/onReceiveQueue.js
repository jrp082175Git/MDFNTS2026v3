class Queue {
  constructor(maxSize) {
    this.items = [];
    this.head = 0;
    this.maxSize = maxSize || 500000;
  }

  enqueue(item) {
    this.items.push(item);
    if (this.length > this.maxSize) {
      this.dequeue(); // Drop oldest if overloaded
    }
  }

  dequeue() {
    if (this.head < this.items.length) {
      const item = this.items[this.head];
      this.items[this.head] = null;
      this.head++;
      if (this.head > 10000) {
        this.items = this.items.slice(this.head);
        this.head = 0;
      }
      return item;
    }
    return undefined;
  }

  get length() {
    return this.items.length - this.head;
  }

  isEmpty() {
    return this.length === 0;
  }
}

module.exports = Queue;
