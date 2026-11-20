/**
 * Personal state: favourites and viewed effects, under one versioned key.
 *
 * Every read and write is wrapped, because storage can be unavailable in a
 * private window or with site data blocked. The site must keep working when it
 * is: losing favourites is an inconvenience, a thrown exception is a blank page.
 */

const KEY = 'vv:v1';

/** @typedef {{ version: 1, favourites: string[], viewed: string[] }} Store */

/** @returns {Store} */
function empty() {
	return { version: 1, favourites: [], viewed: [] };
}

/** @returns {Store} */
export function read() {
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return empty();
		const parsed = JSON.parse(raw);
		return {
			version: 1,
			favourites: Array.isArray(parsed.favourites) ? parsed.favourites.filter(isSlug) : [],
			viewed: Array.isArray(parsed.viewed) ? parsed.viewed.filter(isSlug) : []
		};
	} catch {
		return empty();
	}
}

/** @param {Store} store */
export function write(store) {
	try {
		localStorage.setItem(KEY, JSON.stringify(store));
		return true;
	} catch {
		return false;
	}
}

/**
 * @param {unknown} value
 * @returns {value is string}
 */
function isSlug(value) {
	return typeof value === 'string' && /^[a-z0-9-]+$/.test(value);
}

/**
 * @param {string} slug
 * @returns {Store}
 */
export function toggleFavourite(slug) {
	const store = read();
	const index = store.favourites.indexOf(slug);
	if (index === -1) store.favourites.push(slug);
	else store.favourites.splice(index, 1);
	write(store);
	return store;
}

/**
 * @param {string} slug
 * @returns {Store}
 */
export function markViewed(slug) {
	const store = read();
	if (!store.viewed.includes(slug)) {
		store.viewed.push(slug);
		write(store);
	}
	return store;
}

/** Export and import exist because a browser clearing storage is the only way
 *  this data is ever lost, and it happens. */
export function exportJson() {
	return JSON.stringify(read(), null, 2);
}

/**
 * @param {string} json
 * @returns {{ ok: true, store: Store } | { ok: false, error: string }}
 */
export function importJson(json) {
	try {
		const parsed = JSON.parse(json);
		if (parsed?.version !== 1) return { ok: false, error: 'Unrecognised export version' };
		const store = {
			version: /** @type {1} */ (1),
			favourites: Array.isArray(parsed.favourites) ? parsed.favourites.filter(isSlug) : [],
			viewed: Array.isArray(parsed.viewed) ? parsed.viewed.filter(isSlug) : []
		};
		if (!write(store)) return { ok: false, error: 'Storage is unavailable in this browser' };
		return { ok: true, store };
	} catch {
		return { ok: false, error: 'That file is not valid JSON' };
	}
}
