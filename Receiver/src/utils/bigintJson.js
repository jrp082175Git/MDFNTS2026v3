/**
 * Safe stringify for objects containing BigInt.
 */
function bigintStringify(obj) {
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    return value;
  });
}

module.exports = { bigintStringify };
