const os = require('os');

/**
 * Gets the host machine's endianness string.
 * Note: MoldUDP64 and MDF fields are ALWAYS Big Endian,
 * so this is only for logging diagnostics.
 */
function getHostEndianness() {
  return os.endianness();
}

module.exports = { getHostEndianness };
