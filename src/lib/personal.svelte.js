/**
 * Favourites and viewed state, shared across the page.
 *
 * The archive and the effect page both read this, so it has to be one reactive
 * object rather than each component reading storage on mount. Storage stays the
 * source of truth; this is the in-memory mirror.
 */

import { read, toggleFavourite, markViewed } from './storage.js';

/** @type {{ favourites: string[], viewed: string[], ready: boolean }} */
export const personal = $state({ favourites: [], viewed: [], ready: false });

/** Read storage once, on the client. Safe to call from anywhere, any number of times. */
export function hydrate() {
	if (personal.ready) return;
	const store = read();
	personal.favourites = store.favourites;
	personal.viewed = store.viewed;
	personal.ready = true;
}

/** @param {string} slug */
export function toggle(slug) {
	personal.favourites = toggleFavourite(slug).favourites;
}

/** @param {string} slug */
export function view(slug) {
	personal.viewed = markViewed(slug).viewed;
}

/** @param {{ favourites: string[], viewed: string[] }} store after an import */
export function replace(store) {
	personal.favourites = store.favourites;
	personal.viewed = store.viewed;
}
