import { error } from '@sveltejs/kit';
import { effectsBySlug, loadBody } from '#lib/content/index.js';

/** Every effect page is prerendered from the content directory. */
export const prerender = true;

/** @type {import('./$types').EntryGenerator} */
export function entries() {
	return [...effectsBySlug.keys()].map((slug) => ({ slug }));
}

/** @type {import('./$types').PageLoad} */
export function load({ params }) {
	const effect = effectsBySlug.get(params.slug);
	if (!effect) error(404, 'No such effect');

	return {
		effect,
		Body: loadBody(params.slug)
	};
}
