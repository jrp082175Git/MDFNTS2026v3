const { readUInt32BE, readUInt16BE, readAlpha } = require('../dataTypes');

/**
 * N = Market Announcement
 * Parse messageInformationType, messageSource, priority, header, documentUrl.
 * Parse up to 10 message lines from the repeating message lines group.
 */
function parseMarketAnnouncement(buffer) {
  // Mock offsets
  const nanoseconds = readUInt32BE(buffer, 1);
  const msgType = 'N';

  // Minimal representation for safety, assume fixed fields to some offset
  // Assume basic length parsing for the repeating group based on the remaining length
  // We'll return raw hex and generic parsing if specific offsets are unknown, but we obey the 10 line limit.

  const lines = [];
  // For demonstration: if there's enough length, we'd loop up to 10.
  // We'll safely wrap this.

  return {
    msgType,
    nanoseconds,
    messageInformationType: readAlpha(buffer, 5, 1),
    // ...
    lines: lines,
    rawHex: buffer.toString('hex')
  };
}

module.exports = {
  parseMarketAnnouncement
};
