/**
 * Ordered (Bayer) dithering — Canvas 2D.
 *
 * Lifecycle: `create` on mount, `update` on parameter change, `frame` per tick,
 * `destroy` on unmount. In React that is useEffect(…, []) / useEffect(…, [params])
 * / a requestAnimationFrame loop started in that effect / the effect's cleanup.
 * In Svelte it is $effect, an $effect reading the params rune, the same loop,
 * and the effect's teardown return. On a plain page: call create once the canvas
 * is in the DOM, call update from an input listener, drive frame from
 * requestAnimationFrame, and call destroy on unload.
 *
 * Canvas 2D rather than a shader on purpose: this effect is about what happens
 * to individual pixels, and readable per-pixel code is the point here.
 */

import { drawSource } from './source.js';
import { bayerThresholds } from './bayer.js';

export const params = {
	source: {
		type: 'select',
		label: 'Source',
		group: 'Source',
		options: ['gradient', 'type', 'shapes'],
		default: 'gradient'
	},
	contrast: {
		type: 'range',
		label: 'Contrast',
		group: 'Source',
		min: 0.5,
		max: 2.5,
		step: 0.05,
		default: 1.2,
		help: 'Pushes tones apart before the threshold, which thins or thickens the pattern.'
	},
	order: {
		type: 'range',
		label: 'Matrix',
		group: 'Screen',
		min: 1,
		max: 3,
		step: 1,
		default: 3,
		unit: '×',
		help: 'Tile size is 2 to the power of this: 2×2 up to 8×8.'
	},
	cell: {
		type: 'range',
		label: 'Cell size',
		group: 'Screen',
		min: 1,
		max: 12,
		step: 1,
		default: 4,
		unit: 'px'
	},
	levels: {
		type: 'range',
		label: 'Levels',
		group: 'Screen',
		min: 2,
		max: 8,
		step: 1,
		default: 2
	},
	invert: {
		type: 'toggle',
		label: 'Invert',
		group: 'Screen',
		default: false
	}
};

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Record<string, any>} initialParams
 */
export function create(canvas, initialParams) {
	const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d', { alpha: false }));

	// The source is rendered at the dither's own resolution, one source pixel per
	// cell. Sampling down first is what makes the cell size a real control rather
	// than a blur.
	const source = document.createElement('canvas');
	const sourceCtx = /** @type {CanvasRenderingContext2D} */ (
		source.getContext('2d', { alpha: false, willReadFrequently: true })
	);

	let settings = { ...initialParams };
	let matrix = bayerThresholds(settings.order);
	/** @type {ImageData | null} */
	let buffer = null;

	function sizeSource() {
		const cell = Math.max(1, Math.round(settings.cell));
		source.width = Math.max(1, Math.ceil(canvas.width / cell));
		source.height = Math.max(1, Math.ceil(canvas.height / cell));
		buffer = null;
	}

	sizeSource();

	return {
		/** @param {Record<string, any>} next */
		update(next) {
			const orderChanged = next.order !== settings.order;
			const cellChanged = next.cell !== settings.cell;
			settings = { ...next };
			if (orderChanged) matrix = bayerThresholds(settings.order);
			if (cellChanged) sizeSource();
		},

		/** @param {number} time seconds, already scaled by the host's speed control */
		frame(time) {
			const w = source.width;
			const h = source.height;
			if (w === 0 || h === 0) return;

			drawSource(sourceCtx, time, settings.source);

			const image = sourceCtx.getImageData(0, 0, w, h);
			const pixels = image.data;
			const { size, thresholds } = matrix;
			const levels = Math.max(2, Math.round(settings.levels));
			const steps = levels - 1;
			const contrast = settings.contrast;
			const invert = settings.invert;

			for (let y = 0; y < h; y++) {
				for (let x = 0; x < w; x++) {
					const i = (y * w + x) * 4;

					// Rec. 709 luma: the dither works on brightness, not on each
					// channel separately, which would tint the result.
					let luma = (pixels[i] * 0.2126 + pixels[i + 1] * 0.7152 + pixels[i + 2] * 0.0722) / 255;

					// Contrast around mid grey, before any thresholding.
					luma = Math.min(1, Math.max(0, (luma - 0.5) * contrast + 0.5));
					if (invert) luma = 1 - luma;

					// The whole effect, in two lines: add this cell's threshold
					// (offset to ±0.5 of one output step), then quantise. The
					// threshold decides which side of the step each pixel falls.
					const threshold = thresholds[(y % size) * size + (x % size)] - 0.5;
					const value =
						Math.round(Math.min(1, Math.max(0, luma + threshold / steps)) * steps) / steps;

					const out = value * 255;
					pixels[i] = out;
					pixels[i + 1] = out;
					pixels[i + 2] = out;
					pixels[i + 3] = 255;
				}
			}

			// Draw the small dithered image back at full size with smoothing off,
			// so each source pixel becomes a hard square cell.
			if (!buffer) buffer = image;
			sourceCtx.putImageData(image, 0, 0);
			ctx.imageSmoothingEnabled = false;
			ctx.drawImage(source, 0, 0, w, h, 0, 0, canvas.width, canvas.height);
		},

		resize() {
			sizeSource();
		},

		destroy() {
			source.width = 0;
			source.height = 0;
		}
	};
}
