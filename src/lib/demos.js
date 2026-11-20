/**
 * Site-side registry of demo modules. The dependency runs one way only: this
 * file imports demos, and no demo imports anything from the site.
 *
 * Lazy, so an effect page only downloads its own demo (and three.js only on
 * the pages that need it).
 */
const modules = import.meta.glob('./effects/*/demo.js');

/**
 * @param {string} slug
 * @returns {Promise<{ params: Record<string, Record<string, any>>, create: Function }>}
 */
export async function loadDemo(slug) {
	const loader = modules[`./effects/${slug}/demo.js`];
	if (!loader) throw new Error(`No demo module for "${slug}"`);
	return /** @type {any} */ (await loader());
}
