/**
 * Formats a Date object to YYYYMMDD string.
 * @param {Date} date
 * @returns {string}
 */
function getDateKey(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

module.exports = { getDateKey };
