/**
 * The curated running order.
 *
 * Neighbouring days come from different collections, while effects in the same
 * family (ordered then error-diffusion dithering, say) land within the same
 * fortnight. New effects are appended to the end, so a past day never moves.
 *
 * `startDate` is the first weekday the site was live. Changing it reschedules
 * everything, so it is set once and then left alone. Set this to the first
 * weekday after the real deploy; the date below is a development placeholder
 * in the past, so served and today states are visible while building.
 */
export const schedule = {
	startDate: '2026-11-02',
	slugs: [
		'ordered-dithering',
		'chromatic-aberration',
		'particle-systems',
		'pixelation',
		'error-diffusion-dithering',
		'moire',
		'raymarched-metaballs',
		'posterisation',
		'film-grain',
		'ascii-art',
		'height-map-relief',
		'halftone',
		'fluted-glass',
		'multiply-and-screen',
		'motion-blur',
		'risograph-misregistration',
		'pixel-sorting',
		'flow-fields',
		'radial-blur',
		'difference-and-exclusion',
		'kaleidoscope',
		'noise-warp',
		'duotone',
		'datamosh',
		'voronoi',
		'grid-interruption',
		'match-cut',
		'reaction-diffusion',
		'echo-and-trails',
		'feedback-loops',
		'scale-modulated-grid',
		'impossible-objects',
		'dolly-zoom'
	]
};
