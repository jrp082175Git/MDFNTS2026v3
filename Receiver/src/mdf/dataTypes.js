/**
 * Big Endian readers for MDF Data Types
 */

function readAlpha(buffer, offset, length) {
  // ISO 8859-1 / Latin-1, trim right spaces
  return buffer.toString('latin1', offset, offset + length).trimEnd();
}

function readInt8(buffer, offset) {
  return buffer.readInt8(offset);
}

function readInt16BE(buffer, offset) {
  return buffer.readInt16BE(offset);
}

function readInt32BE(buffer, offset) {
  return buffer.readInt32BE(offset);
}

function readInt64BE(buffer, offset) {
  return buffer.readBigInt64BE(offset);
}

function readPrice(buffer, offset, decimals) {
  const value = buffer.readBigInt64BE(offset);
  // signed 64-bit minimum is considered null
  const minBigInt = BigInt("-9223372036854775808");
  if (value === minBigInt) {
    return null;
  }

  if (decimals !== undefined && decimals > 0) {
      const divisor = BigInt(Math.pow(10, decimals));
      const intPart = value / divisor;
      let fracPart = (value % divisor).toString();
      if (fracPart.startsWith('-')) fracPart = fracPart.substring(1);
      fracPart = fracPart.padStart(decimals, '0');
      return `${intPart}.${fracPart}`;
  }

  return value; // Return as BigInt if decimals not known
}

function readDate(buffer, offset) {
  // YYYYMMDD integer, e.g. 20230514 -> 4 bytes? Wait, the spec says integer, usually 4 bytes.
  // We'll assume it's Int32 based on typical sizes, though it could be 4 bytes or 8 bytes.
  // Based on common knowledge of ITCH/MDF, it's typically 4 bytes. Let's assume 4 bytes.
  // Actually, "integer encoded as Big Endian". We'll use Int32.
  return buffer.readInt32BE(offset);
}

function readTimestamp(buffer, offset) {
  // nanoseconds since 1970-01-01 UTC
  // Usually 8 bytes
  return buffer.readBigInt64BE(offset);
}

function readBigUInt64BE(buffer, offset) {
  return buffer.readBigUInt64BE(offset);
}

function readUInt32BE(buffer, offset) {
  return buffer.readUInt32BE(offset);
}

function readUInt16BE(buffer, offset) {
  return buffer.readUInt16BE(offset);
}

module.exports = {
  readAlpha,
  readInt8,
  readInt16BE,
  readInt32BE,
  readInt64BE,
  readPrice,
  readDate,
  readTimestamp,
  readBigUInt64BE,
  readUInt32BE,
  readUInt16BE
};
