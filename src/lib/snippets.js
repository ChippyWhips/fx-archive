/**
 * Lazy registry of the generated copyable snippets. Built by
 * scripts/snippets.mjs; each module is only fetched when its code panel opens.
 */
const modules = import.meta.glob('../generated/snippets/*.js');

/**
 * @param {string} slug
 * @returns {Promise<{ snippet: string, demo: string }>}
 */
export async function loadSnippet(slug) {
	const loader = modules[`../generated/snippets/${slug}.js`];
	if (!loader) throw new Error(`No snippet for "${slug}"`);
	return /** @type {any} */ (await loader());
}
