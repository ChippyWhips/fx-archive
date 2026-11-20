import { describe, it, expect } from 'vitest';
import {
	parseDay,
	formatDay,
	isWeekday,
	resolveWeekday,
	workingDaysBetween,
	indexForDate,
	dateForIndex,
	isServed
} from './schedule.js';

// Mon 9 Nov 2026 is the reference start date used throughout.
const START = parseDay('2026-11-09');

describe('resolveWeekday', () => {
	it('leaves weekdays alone', () => {
		expect(formatDay(resolveWeekday(parseDay('2026-11-11')))).toBe('2026-11-11');
	});

	it('rolls Saturday and Sunday back to Friday', () => {
		expect(formatDay(resolveWeekday(parseDay('2026-11-14')))).toBe('2026-11-13');
		expect(formatDay(resolveWeekday(parseDay('2026-11-15')))).toBe('2026-11-13');
	});
});

describe('workingDaysBetween', () => {
	it('counts the start date as zero', () => {
		expect(workingDaysBetween(START, START)).toBe(0);
	});

	it('counts consecutive weekdays', () => {
		expect(workingDaysBetween(START, parseDay('2026-11-13'))).toBe(4);
	});

	it('skips the weekend', () => {
		expect(workingDaysBetween(START, parseDay('2026-11-16'))).toBe(5);
	});

	it('handles multi-week spans', () => {
		// Five weeks on: 25 weekdays.
		expect(workingDaysBetween(START, parseDay('2026-12-14'))).toBe(25);
	});

	it('is negative before the start date', () => {
		expect(workingDaysBetween(START, parseDay('2026-11-06'))).toBe(-1);
	});

	it('survives a DST transition', () => {
		// UK clocks go back on 25 Oct 2026; 26 Oct to 2 Nov is still 5 weekdays.
		expect(workingDaysBetween(parseDay('2026-10-26'), parseDay('2026-11-02'))).toBe(5);
	});
});

describe('indexForDate', () => {
	const length = 33;

	it('is zero on the start date', () => {
		expect(indexForDate(START, START, length)).toBe(0);
	});

	it('holds Friday’s effect over the weekend', () => {
		const friday = indexForDate(START, parseDay('2026-11-13'), length);
		expect(indexForDate(START, parseDay('2026-11-14'), length)).toBe(friday);
		expect(indexForDate(START, parseDay('2026-11-15'), length)).toBe(friday);
	});

	it('wraps when the list runs out', () => {
		const day34 = dateForIndex(START, length);
		expect(indexForDate(START, day34, length)).toBe(0);
	});

	it('returns null before the start date', () => {
		expect(indexForDate(START, parseDay('2026-11-06'), length)).toBe(null);
	});

	it('does not move a past day when effects are appended', () => {
		const date = parseDay('2026-11-20');
		expect(indexForDate(START, date, 33)).toBe(indexForDate(START, date, 40));
	});
});

describe('dateForIndex', () => {
	it('round-trips with indexForDate', () => {
		for (let i = 0; i < 33; i++) {
			const date = dateForIndex(START, i);
			expect(isWeekday(date)).toBe(true);
			expect(indexForDate(START, date, 33)).toBe(i);
		}
	});
});

describe('isServed', () => {
	it('includes today', () => {
		expect(isServed(START, 4, parseDay('2026-11-13'))).toBe(true);
	});

	it('excludes the future', () => {
		expect(isServed(START, 5, parseDay('2026-11-13'))).toBe(false);
	});
});
