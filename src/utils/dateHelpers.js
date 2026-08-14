const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Returns the number of days in the given month.
 * @param {number} year - Full year (e.g. 2026)
 * @param {number} month - 0-indexed month (0 = January, 11 = December)
 * @returns {number}
 */
export function getDaysInMonth(year, month) {
  // Day 0 of the *next* month gives the last day of the current month
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Returns the day-of-week index for the 1st of the given month.
 * 0 = Sunday, 1 = Monday, …, 6 = Saturday
 */
export function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

/**
 * Formats a Date object (or date-like value) as 'YYYY-MM-DD'.
 * @param {Date|string|number} date
 * @returns {string}
 */
export function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converts a 'YYYY-MM-DD' string into a human-readable format like '22 May 2026'.
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @returns {string}
 */
export function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const monthName = MONTH_NAMES[month - 1] || '';
  return `${day} ${monthName} ${year}`;
}

/**
 * Returns the full name of the month (0-indexed).
 * @param {number} month - 0-indexed (0 = January)
 * @returns {string}
 */
export function getMonthName(month) {
  return MONTH_NAMES[month] || '';
}

/**
 * Returns a string like 'May 2026'.
 * @param {number} year
 * @param {number} month - 0-indexed
 * @returns {string}
 */
export function getMonthYear(year, month) {
  return `${getMonthName(month)} ${year}`;
}

/**
 * Checks whether the given 'YYYY-MM-DD' string represents today's date.
 * @param {string} dateStr
 * @returns {boolean}
 */
export function isToday(dateStr) {
  if (!dateStr) return false;
  return dateStr === formatDate(new Date());
}

/**
 * Checks whether the given 'YYYY-MM-DD' date is strictly in the future.
 * @param {string} dateStr
 * @returns {boolean}
 */
export function isFutureDate(dateStr) {
  if (!dateStr) return false;
  const today = formatDate(new Date());
  return dateStr > today; // lexicographic comparison works for YYYY-MM-DD
}

/**
 * Returns an array of all 'YYYY-MM-DD' strings for every day in the month.
 * @param {number} year
 * @param {number} month - 0-indexed
 * @returns {string[]}
 */
export function getDatesInMonth(year, month) {
  const days = getDaysInMonth(year, month);
  const dates = [];
  const monthStr = String(month + 1).padStart(2, '0');
  for (let d = 1; d <= days; d++) {
    dates.push(`${year}-${monthStr}-${String(d).padStart(2, '0')}`);
  }
  return dates;
}

/**
 * Generates a simple unique ID using timestamp + random suffix.
 * @returns {string}
 */
export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback if crypto.randomUUID is not available (e.g. older browsers or non-secure contexts)
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}
