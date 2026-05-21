const dgram = require('dgram');
const client = dgram.createSocket('udp4');

const MULTICAST_GROUP = '239.1.1.1';
const PORT = 10001;

function createTestPacket(session, sequence, messageCount) {
  // MoldUDP64 Downstream Header: 20 bytes
  // Offset 0: Session (10 bytes)
  // Offset 10: Sequence Number (8 bytes)
  // Offset 18: Message Count (2 bytes)

  // Followed by message blocks. We will add dummy messages if count > 0.
  // Each message: Length (2 bytes) + Message Data

  let totalLen = 20;
  for (let i = 0; i < messageCount; i++) {
     totalLen += 2; // length field
     totalLen += 5; // dummy data length
  }

  const buffer = Buffer.alloc(totalLen);
  buffer.write(session.padEnd(10, ' '), 0, 10, 'ascii');
  buffer.writeBigUInt64BE(BigInt(sequence), 10);
  buffer.writeUInt16BE(messageCount, 18);

  let offset = 20;
  for (let i = 0; i < messageCount; i++) {
    buffer.writeUInt16BE(5, offset);
    // T = seconds message
    buffer.write('T', offset + 2, 1, 'ascii');
    buffer.writeUInt32BE(12345, offset + 3);
    offset += 7;
  }

  return buffer;
}

const packet1 = createTestPacket('PSE_MDF_01', 1, 2);
client.send(packet1, PORT, MULTICAST_GROUP, (err) => {
  if (err) console.error(err);
  else console.log('Sent packet 1 (Data)');
});

setTimeout(() => {
    // Gap created here (seq 3 is expected, sending seq 4)
    const packet2 = createTestPacket('PSE_MDF_01', 4, 0); // heartbeat
    client.send(packet2, PORT, MULTICAST_GROUP, (err) => {
        if (err) console.error(err);
        else console.log('Sent packet 2 (Heartbeat, with gap)');
    });
}, 1000);

setTimeout(() => {
    const packet3 = createTestPacket('PSE_MDF_01', 5, 65535); // EOS
    client.send(packet3, PORT, MULTICAST_GROUP, (err) => {
        if (err) console.error(err);
        else console.log('Sent packet 3 (End of Session)');
        client.close();
    });
}, 2000);
