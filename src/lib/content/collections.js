/**
 * The 18 collections. An effect belongs to exactly one.
 * "Post FX" is deliberately not here: it is a tag, because halftone, duotone,
 * pixelate, RGB shift and threshold colour each have a more natural home.
 */
export const COLLECTIONS = /** @type {const} */ ([
	'Print and screen',
	'Dithering and quantisation',
	'Sampling and mosaic',
	'Distortion',
	'Blur',
	'Optical and lens',
	'Digital and glitch',
	'Compositing and blend modes',
	'Echoes, tiles and repeats',
	'Periodic structures and interference',
	'Interrupted systems',
	'Pattern and systems',
	'Relief and dimensionality',
	'Impossible objects and illusion',
	'Diffusion and growth',
	'Generative fields',
	'3D and particles',
	'Motion cuts and transitions'
]);

/** Cross-cutting labels, used for filtering rather than classification. */
export const TAGS = /** @type {const} */ ([
	'print',
	'post-fx',
	'motion-dependent',
	'generative',
	'3d',
	'shader'
]);

export const RENDERERS = /** @type {const} */ (['canvas2d', 'webgl', 'three', 'css']);

export const CONTROLS_LAYOUTS = /** @type {const} */ (['overlay', 'sidebar']);

export const SOURCE_KINDS = /** @type {const} */ (['article', 'tutorial', 'example', 'history']);
