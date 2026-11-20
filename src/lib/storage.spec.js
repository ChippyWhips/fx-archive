import { describe, it, expect, beforeEach } from 'vitest';
import { read, toggleFavourite, markViewed, exportJson, importJson } from './storage.js';

/** A minimal localStorage, so the tests do not need a DOM. */
function fakeStorage() {
	/** @type {Map<string, string>} */
	const map = new Map();
	return {
		getItem: (/** @type {string} */ key) => map.get(key) ?? null,
		setItem: (/** @type {string} */ key, /** @type {string} */ value) => map.set(key, value),
		removeItem: (/** @type {string} */ key) => map.delete(key),
		clear: () => map.clear()
	};
}

beforeEach(() => {
	globalThis.localStorage = /** @type {any} */ (fakeStorage());
});

describe('storage', () => {
	it('starts empty', () => {
		expect(read()).toEqual({ version: 1, favourites: [], viewed: [] });
	});

	it('toggles a favourite on and off', () => {
		expect(toggleFavourite('ordered-dithering').favourites).toEqual(['ordered-dithering']);
		expect(toggleFavourite('ordered-dithering').favourites).toEqual([]);
	});

	it('records a viewed effect once', () => {
		markViewed('ordered-dithering');
		expect(markViewed('ordered-dithering').viewed).toEqual(['ordered-dithering']);
	});

	it('round-trips through export and import', () => {
		toggleFavourite('ordered-dithering');
		markViewed('particle-systems');
		const json = exportJson();

		globalThis.localStorage.clear();
		const result = importJson(json);

		expect(result.ok).toBe(true);
		expect(read()).toEqual({
			version: 1,
			favourites: ['ordered-dithering'],
			viewed: ['particle-systems']
		});
	});

	it('rejects a file from another version', () => {
		const result = importJson(JSON.stringify({ version: 2, favourites: [], viewed: [] }));
		expect(result).toEqual({ ok: false, error: 'Unrecognised export version' });
	});

	it('rejects a file that is not JSON', () => {
		expect(importJson('nope').ok).toBe(false);
	});

	it('survives storage being unavailable', () => {
		globalThis.localStorage = /** @type {any} */ ({
			getItem() {
				throw new Error('blocked');
			},
			setItem() {
				throw new Error('blocked');
			}
		});
		expect(read()).toEqual({ version: 1, favourites: [], viewed: [] });
		expect(toggleFavourite('ordered-dithering').favourites).toEqual(['ordered-dithering']);
	});
});
