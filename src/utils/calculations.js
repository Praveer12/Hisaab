import { getDatesInMonth, isFutureDate } from './dateHelpers';

/**
 * Calculate the total milk cost for a single day.
 * @param {number} morning - Morning milk quantity in litres
 * @param {number} evening - Evening milk quantity in litres
 * @param {number} rate   - Rate per litre in ₹
 * @returns {number} Total milk cost for the day
 */
export function calculateDailyMilkAmount(morning = 0, evening = 0, rate = 0) {
  const m = parseFloat(morning) || 0;
  const e = parseFloat(evening) || 0;
  const r = parseFloat(rate) || 0;
  return parseFloat(((m + e) * r).toFixed(2));
}

/**
 * Calculate the total daily amount (milk + optional newspaper).
 * @param {number} milkAmount      - Pre-calculated milk cost
 * @param {number} newspaperRate   - Rate for the newspaper
 * @param {boolean} newspaperTaken - Whether newspaper was taken that day
 * @returns {number}
 */
export function calculateDailyTotal(milkAmount = 0, newspaperRate = 0, newspaperTaken = false) {
  const milk = parseFloat(milkAmount) || 0;
  const paper = newspaperTaken ? (parseFloat(newspaperRate) || 0) : 0;
  return parseFloat((milk + paper).toFixed(2));
}

/**
 * Calculate aggregate monthly totals from an array of entries.
 * @param {Array} entries
 * @returns {{
 *   totalMilk: number,
 *   totalMilkAmount: number,
 *   totalNewspaper: number,
 *   totalAmount: number,
 *   daysDelivered: number,
 *   daysMissed: number,
 *   paymentBreakdown: { Cash: number, UPI: number, 'Bank Transfer': number, Pending: number }
 * }}
 */
export function calculateMonthlyTotals(entries = []) {
  const result = {
    totalMilk: 0,
    totalMilkAmount: 0,
    totalNewspaper: 0,
    totalAmount: 0,
    daysDelivered: 0,
    daysMissed: 0,
    paymentBreakdown: {
      Cash: 0,
      UPI: 0,
      'Bank Transfer': 0,
      Pending: 0,
    },
  };

  if (!entries || entries.length === 0) return result;

  for (const entry of entries) {
    const morning = parseFloat(entry.milk?.morning) || 0;
    const evening = parseFloat(entry.milk?.evening) || 0;
    const milkTotal = morning + evening;
    const milkAmount = parseFloat(entry.milk?.totalAmount) || 0;
    const newspaperRate = entry.newspaper?.taken ? (parseFloat(entry.newspaper?.rate) || 0) : 0;

    result.totalMilk += milkTotal;
    result.totalMilkAmount += milkAmount;
    result.totalNewspaper += newspaperRate;
    result.totalAmount += parseFloat(entry.totalAmount) || 0;

    // Payment breakdown
    const method = entry.paymentMethod || 'Pending';
    if (method in result.paymentBreakdown) {
      result.paymentBreakdown[method] += parseFloat(entry.totalAmount) || 0;
    } else {
      result.paymentBreakdown.Pending += parseFloat(entry.totalAmount) || 0;
    }
  }

  // Calculate daysDelivered and daysMissed using getDeliveryStatus (calendar-aware)
  const firstEntry = entries.find((e) => e.date);
  if (firstEntry) {
    const parts = firstEntry.date.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed
    const statusMap = getDeliveryStatus(entries, year, month);
    
    let delivered = 0;
    let missed = 0;
    for (const status of statusMap.values()) {
      if (status === 'delivered') {
        delivered++;
      } else if (status === 'missed') {
        missed++;
      }
    }
    result.daysDelivered = delivered;
    result.daysMissed = missed;
  } else {
    result.daysDelivered = 0;
    result.daysMissed = 0;
  }

  // Round accumulated values
  result.totalMilk = parseFloat(result.totalMilk.toFixed(2));
  result.totalMilkAmount = parseFloat(result.totalMilkAmount.toFixed(2));
  result.totalNewspaper = parseFloat(result.totalNewspaper.toFixed(2));
  result.totalAmount = parseFloat(result.totalAmount.toFixed(2));

  for (const key of Object.keys(result.paymentBreakdown)) {
    result.paymentBreakdown[key] = parseFloat(result.paymentBreakdown[key].toFixed(2));
  }

  return result;
}

/**
 * Same as calculateMonthlyTotals but filtered for a specific provider.
 * @param {Array}  entries
 * @param {string} providerId
 * @returns {object}
 */
export function calculateProviderMonthlyTotals(entries = [], providerId) {
  const filtered = entries.filter((e) => e.providerId === providerId);
  return calculateMonthlyTotals(filtered);
}

/**
 * Build a Map of date -> delivery status for every day in the given month.
 *
 * Logic:
 * - Future dates → 'no-data'
 * - If an entry exists for the date → 'delivered'
 * - If no entry but the date falls between the first and last delivery dates → 'missed'
 * - Otherwise → 'no-data'
 *
 * @param {Array}  entries - Entries for the month
 * @param {number} year
 * @param {number} month   - 0-indexed
 * @returns {Map<string, 'delivered'|'missed'|'no-data'>}
 */
export function getDeliveryStatus(entries = [], year, month) {
  const allDates = getDatesInMonth(year, month);
  const statusMap = new Map();

  // Build a Set of dates that have entries
  const entryDates = new Set();
  for (const entry of entries) {
    if (entry.date) {
      entryDates.add(entry.date);
    }
  }

  for (const dateStr of allDates) {
    // Future dates are always 'no-data'
    if (isFutureDate(dateStr)) {
      statusMap.set(dateStr, 'no-data');
      continue;
    }

    if (entryDates.has(dateStr)) {
      statusMap.set(dateStr, 'delivered');
    } else {
      // Any past/today date without entry = missed (red dot)
      statusMap.set(dateStr, 'missed');
    }
  }

  return statusMap;
}
