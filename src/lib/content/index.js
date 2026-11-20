/**
 * Build-time content loader.
 *
 * Every effect Markdown file is read eagerly with import.meta.glob, validated,
 * and cross-checked against the schedule. Any problem throws here, which fails
 * the build rather than shipping a broken entry.
 */

import { validateEffect, validateLibrary } from './validate.js';
import { schedule } from '../../content/schedule.js';
import { parseDay, dateForIndex, formatDay } from '../schedule.js';

/** @typedef {import('./types.js').Effect} Effect */

/**
 * Eager on purpose. The archive page needs every entry's metadata anyway, and
 * splitting the bodies out would mean importing each file twice (once for
 * frontmatter, once for the component), which the bundler cannot split either.
 * At 33 entries of ~250 words the whole library is a few tens of kilobytes.
 * Worth re-measuring if the library grows past a few hundred entries.
 *
 * @type {Record<string, { metadata: Record<string, unknown>, default: any }>}
 */
const modules = import.meta.glob('../../content/effects/*.md', { eager: true });

/** @type {string[]} */
const errors = [];

/** @type {Effect[]} */
const parsed = [];

for (const [path, module] of Object.entries(modules)) {
	const file = path.replace('../../content/', 'src/content/');
	const data = module.metadata;

	// mdsvex drops frontmatter silently when the YAML is invalid, which would
	// otherwise surface as every field being reported missing at once. The
	// usual cause is an unquoted value containing a colon followed by a space.
	if (!data) {
		errors.push(`${file}: frontmatter did not parse as YAML`);
		continue;
	}

	const problems = validateEffect(data, file);

	if (problems.length > 0) {
		errors.push(...problems);
		continue;
	}

	const expectedSlug = file.split('/').pop()?.replace(/\.md$/, '');
	if (data.slug !== expectedSlug) {
		errors.push(`${file}: slug "${data.slug}" does not match the filename`);
		continue;
	}

	parsed.push(
		/** @type {Effect} */ ({
			...data,
			controlsLayout: data.controlsLayout ?? 'overlay'
		})
	);
}

errors.push(...validateLibrary(parsed, schedule.slugs));

if (errors.length > 0) {
	throw new Error(`Effect content is invalid:\n  ${errors.join('\n  ')}`);
}

const startDate = parseDay(schedule.startDate);

/** @type {Map<string, Effect>} */
const bySlug = new Map(parsed.map((effect) => [effect.slug, effect]));

/**
 * Every effect in schedule order, each carrying its index and the calendar day
 * it is served on. `served` is derived at render time, not stored here.
 */
export const effects = schedule.slugs.map((slug, index) => {
	const effect = /** @type {Effect} */ (bySlug.get(slug));
	return { ...effect, index, servedOn: formatDay(dateForIndex(startDate, index)) };
});

export const effectsBySlug = new Map(effects.map((effect) => [effect.slug, effect]));

export { schedule };

/**
 * The compiled mdsvex component for an entry's body.
 * @param {string} slug
 */
export function loadBody(slug) {
	const module = modules[`../../content/effects/${slug}.md`];
	if (!module) throw new Error(`No effect body for "${slug}"`);
	return module.default;
}
