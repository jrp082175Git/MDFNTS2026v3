class SequenceManager {
  constructor() {
    this.expectedSequence = BigInt(1);
    this.latestMessageBlockSequence = BigInt(0);
    this.totalMessageCount = 0;
  }

  setExpectedSequence(seq) {
    this.expectedSequence = BigInt(seq);
  }

  setLatestMessageBlockSequence(seq) {
    this.latestMessageBlockSequence = BigInt(seq);
  }

  updateFromPacket(packetInfo) {
    if (packetInfo.packetType === "DATA") {
       this.expectedSequence = packetInfo._sequenceNumberBigInt + BigInt(packetInfo.messageCount);
       // latest message block sequence is the sequence of the last message in the packet
       if (packetInfo.messageCount > 0) {
           this.latestMessageBlockSequence = packetInfo._sequenceNumberBigInt + BigInt(packetInfo.messageCount - 1);
       }
    }
  }
}

module.exports = SequenceManager;
