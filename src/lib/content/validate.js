/**
 * Frontmatter validation. Runs at build time; any failure throws and fails the
 * build, so a broken entry can never reach the site.
 */

import { COLLECTIONS, TAGS, RENDERERS, CONTROLS_LAYOUTS, SOURCE_KINDS } from './collections.js';

/** @typedef {import('./types.js').Effect} Effect */

/**
 * @param {unknown} value
 * @returns {value is string}
 */
const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

/**
 * @param {unknown} value
 * @returns {value is string[]}
 */
const isStringArray = (value) => Array.isArray(value) && value.every(isNonEmptyString);

/**
 * Validate one effect's frontmatter in isolation.
 * @param {Record<string, unknown>} data
 * @param {string} file path, for the error message
 * @returns {string[]} list of problems; empty when valid
 */
export function validateEffect(data, file) {
	/** @type {string[]} */
	const errors = [];
	const fail = (/** @type {string} */ message) => errors.push(`${file}: ${message}`);

	if (!isNonEmptyString(data.slug)) fail('`slug` is required');
	else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(data.slug)) fail('`slug` must be kebab-case');

	if (!isNonEmptyString(data.name)) fail('`name` is required');
	if (!isNonEmptyString(data.oneLiner)) fail('`oneLiner` is required');
	if (!isNonEmptyString(data.whatItIs)) fail('`whatItIs` is required');
	if (!isNonEmptyString(data.poster)) fail('`poster` is required');

	if (!isStringArray(data.synonyms)) fail('`synonyms` must be an array of strings');
	if (!isStringArray(data.related)) fail('`related` must be an array of slugs');

	if (!isNonEmptyString(data.collection)) fail('`collection` is required');
	else if (!(/** @type {readonly string[]} */ (COLLECTIONS).includes(data.collection))) {
		fail(`unknown collection "${data.collection}"`);
	}

	if (!isStringArray(data.tags)) fail('`tags` must be an array of strings');
	else {
		for (const tag of data.tags) {
			if (!(/** @type {readonly string[]} */ (TAGS).includes(tag))) fail(`unknown tag "${tag}"`);
		}
	}

	if (
		!(/** @type {readonly string[]} */ (RENDERERS).includes(/** @type {string} */ (data.renderer)))
	) {
		fail(`\`renderer\` must be one of ${RENDERERS.join(', ')}`);
	}

	if (typeof data.motionDependent !== 'boolean') fail('`motionDependent` must be a boolean');

	const layout = data.controlsLayout ?? 'overlay';
	if (
		!(/** @type {readonly string[]} */ (CONTROLS_LAYOUTS).includes(/** @type {string} */ (layout)))
	) {
		fail(`\`controlsLayout\` must be one of ${CONTROLS_LAYOUTS.join(', ')}`);
	}

	if (!Array.isArray(data.parameters) || data.parameters.length === 0) {
		fail('`parameters` must be a non-empty array');
	} else {
		data.parameters.forEach((param, i) => {
			if (!isNonEmptyString(param?.name)) fail(`parameters[${i}].name is required`);
			if (!isNonEmptyString(param?.what)) fail(`parameters[${i}].what is required`);
			if (param?.lock !== 'lock' && param?.lock !== 'expose') {
				fail(`parameters[${i}].lock must be "lock" or "expose"`);
			}
		});
	}

	if (!Array.isArray(data.sources) || data.sources.length < 2 || data.sources.length > 3) {
		fail('`sources` must hold 2 or 3 entries');
	} else {
		data.sources.forEach((source, i) => {
			if (!isNonEmptyString(source?.title)) fail(`sources[${i}].title is required`);
			if (!isNonEmptyString(source?.url)) fail(`sources[${i}].url is required`);
			else if (!/^https:\/\//.test(source.url)) fail(`sources[${i}].url must be https`);
			if (!(/** @type {readonly string[]} */ (SOURCE_KINDS).includes(source?.kind))) {
				fail(`sources[${i}].kind must be one of ${SOURCE_KINDS.join(', ')}`);
			}
		});
	}

	return errors;
}

/**
 * Cross-entry checks: duplicate slugs, dangling `related` links, and schedule
 * entries with no matching effect.
 * @param {Effect[]} effects
 * @param {string[]} scheduleSlugs
 * @returns {string[]}
 */
export function validateLibrary(effects, scheduleSlugs) {
	/** @type {string[]} */
	const errors = [];
	const slugs = new Set();

	for (const effect of effects) {
		if (slugs.has(effect.slug)) errors.push(`duplicate slug "${effect.slug}"`);
		slugs.add(effect.slug);
	}

	for (const effect of effects) {
		for (const slug of effect.related) {
			if (!slugs.has(slug)) {
				errors.push(`${effect.slug}: related slug "${slug}" has no effect`);
			}
			if (slug === effect.slug) errors.push(`${effect.slug}: lists itself as related`);
		}
	}

	const scheduled = new Set();
	for (const slug of scheduleSlugs) {
		if (!slugs.has(slug)) errors.push(`schedule: "${slug}" has no effect`);
		if (scheduled.has(slug)) errors.push(`schedule: "${slug}" appears twice`);
		scheduled.add(slug);
	}

	for (const effect of effects) {
		if (!scheduled.has(effect.slug)) errors.push(`schedule: "${effect.slug}" is never served`);
	}

	return errors;
}
