/**
 * Formats an ISO date string to a human-readable date.
 * @param {string} iso
 * @param {Intl.DateTimeFormatOptions} options
 * @returns {string}
 */
export const formatDate = (iso, options = { dateStyle: 'medium' }) =>
  new Intl.DateTimeFormat('en-IN', options).format(new Date(iso));

/**
 * Formats a number as a percentage string.
 * @param {number} value
 * @param {number} decimals
 * @returns {string}
 */
export const toPercent = (value, decimals = 1) => `${Number(value).toFixed(decimals)}%`;

/**
 * Maps a risk level string to a Tailwind colour class.
 * @param {'low'|'moderate'|'high'|'critical'} level
 * @returns {string}
 */
export const riskLevelColor = (level) => {
  const map = {
    low:      'text-emerald-400',
    moderate: 'text-amber-400',
    high:     'text-orange-400',
    critical: 'text-rose-500',
  };
  return map[level] ?? 'text-slate-400';
};

/**
 * Capitalises the first letter of a string.
 * @param {string} str
 * @returns {string}
 */
export const capitalise = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
