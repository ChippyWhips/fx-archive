/**
 * Schedule logic.
 *
 * Today's effect is the entry at index (working days since the start date) in a
 * fixed, curated list. It is never a runtime shuffle, so appending an effect can
 * never reorder a day that has already happened.
 *
 * All dates are handled as local calendar days. We only ever compare y/m/d, so
 * there is no timezone drift and no need for UTC conversion.
 */

/** Milliseconds in a day. */
const DAY = 86_400_000;

/**
 * Midnight local time for a date, so day arithmetic is not affected by DST or
 * by the time of day the page happens to be loaded.
 * @param {Date} date
 * @returns {Date}
 */
function startOfDay(date) {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * @param {string} iso `YYYY-MM-DD`
 * @returns {Date} local midnight on that calendar day
 */
export function parseDay(iso) {
	const [y, m, d] = iso.split('-').map(Number);
	return new Date(y, m - 1, d);
}

/**
 * @param {Date} date
 * @returns {string} `YYYY-MM-DD`
 */
export function formatDay(date) {
	const p = (/** @type {number} */ n) => String(n).padStart(2, '0');
	return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

/**
 * @param {Date} date
 * @returns {boolean} true for Monday to Friday
 */
export function isWeekday(date) {
	const day = date.getDay();
	return day >= 1 && day <= 5;
}

/**
 * The weekday an effect is "for". Saturday and Sunday both resolve back to the
 * preceding Friday, so the weekend holds Friday's effect.
 * @param {Date} date
 * @returns {Date}
 */
export function resolveWeekday(date) {
	const d = startOfDay(date);
	const day = d.getDay();
	if (day === 6) d.setDate(d.getDate() - 1); // Saturday -> Friday
	if (day === 0) d.setDate(d.getDate() - 2); // Sunday -> Friday
	return d;
}

/**
 * Whole weekdays from `start` to `date`, counting the start date as 0.
 * Bank holidays are ignored by design: Monday to Friday only.
 * @param {Date} start a weekday
 * @param {Date} date
 * @returns {number} negative if `date` falls before `start`
 */
export function workingDaysBetween(start, date) {
	const a = startOfDay(start);
	const b = startOfDay(date);
	const sign = b < a ? -1 : 1;
	const [from, to] = sign === 1 ? [a, b] : [b, a];

	const totalDays = Math.round((to.getTime() - from.getTime()) / DAY);
	const fullWeeks = Math.floor(totalDays / 7);
	let count = fullWeeks * 5;

	// Walk the remaining part-week day by day; at most six iterations.
	const cursor = new Date(from);
	cursor.setDate(cursor.getDate() + fullWeeks * 7);
	while (cursor < to) {
		cursor.setDate(cursor.getDate() + 1);
		if (isWeekday(cursor)) count++;
	}

	return count * sign;
}

/**
 * The scheduled index for a given day, wrapping round when the list runs out.
 * @param {Date} start
 * @param {Date} date
 * @param {number} length number of entries in the schedule
 * @returns {number|null} null before the start date, or when the list is empty
 */
export function indexForDate(start, date, length) {
	if (length <= 0) return null;
	const elapsed = workingDaysBetween(start, resolveWeekday(date));
	if (elapsed < 0) return null;
	return elapsed % length;
}

/**
 * The calendar day an index is first served on.
 * @param {Date} start
 * @param {number} index
 * @returns {Date}
 */
export function dateForIndex(start, index) {
	const d = startOfDay(start);
	let remaining = index;
	while (remaining > 0) {
		d.setDate(d.getDate() + 1);
		if (isWeekday(d)) remaining--;
	}
	return d;
}

/**
 * Served is derived, never stored: anything scheduled on or before today has
 * been served. This works on any device with no storage at all.
 * @param {Date} start
 * @param {number} index
 * @param {Date} [today]
 * @returns {boolean}
 */
export function isServed(start, index, today = new Date()) {
	const elapsed = workingDaysBetween(start, resolveWeekday(today));
	return elapsed >= index;
}

/**
 * Human-readable served date, e.g. "9 November 2026".
 * @param {Date} date
 * @returns {string}
 */
export function formatServedDate(date) {
	return new Intl.DateTimeFormat('en-GB', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	}).format(date);
}
