/**
 * Error-diffusion dithering — Canvas 2D.
 *
 * Lifecycle: `create` on mount, `update` on parameter change, `frame` per tick,
 * `destroy` on unmount. In React that is useEffect(…, []) / useEffect(…, [params])
 * / a requestAnimationFrame loop started in that effect / the effect's cleanup.
 * In Svelte it is $effect, an $effect reading the params rune, the same loop,
 * and the effect's teardown return. On a plain page: call create once the canvas
 * is in the DOM, call update from an input listener, drive frame from
 * requestAnimationFrame, and call destroy on unload.
 *
 * Canvas 2D and a Float32Array, not a shader: error diffusion is sequential by
 * definition. Each pixel's decision depends on every pixel before it, which is
 * exactly what a fragment shader cannot express.
 */

import { drawSource } from './source.js';
import { KERNELS } from './kernels.js';

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
		default: 1.1
	},
	kernel: {
		type: 'select',
		label: 'Kernel',
		group: 'Diffusion',
		options: ['floyd-steinberg', 'atkinson', 'jarvis-judice-ninke', 'sierra'],
		default: 'floyd-steinberg'
	},
	strength: {
		type: 'range',
		label: 'Error passed on',
		group: 'Diffusion',
		min: 0,
		max: 1,
		step: 0.01,
		default: 1,
		help: 'At zero this is a plain threshold, with no dithering at all.'
	},
	serpentine: {
		type: 'toggle',
		label: 'Serpentine scan',
		group: 'Diffusion',
		default: true
	},
	levels: {
		type: 'range',
		label: 'Levels',
		group: 'Output',
		min: 2,
		max: 8,
		step: 1,
		default: 2
	},
	cell: {
		type: 'range',
		label: 'Cell size',
		group: 'Output',
		min: 1,
		max: 10,
		step: 1,
		default: 3,
		unit: 'px'
	}
};

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Record<string, any>} initialParams
 */
export function create(canvas, initialParams) {
	const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d', { alpha: false }));

	const source = document.createElement('canvas');
	const sourceCtx = /** @type {CanvasRenderingContext2D} */ (
		source.getContext('2d', { alpha: false, willReadFrequently: true })
	);

	let settings = { ...initialParams };
	/** Working luma buffer. Float, because the carried error is fractional. */
	let luma = new Float32Array(0);

	function sizeSource() {
		const cell = Math.max(1, Math.round(settings.cell));
		source.width = Math.max(1, Math.ceil(canvas.width / cell));
		source.height = Math.max(1, Math.ceil(canvas.height / cell));
		luma = new Float32Array(source.width * source.height);
	}

	sizeSource();

	return {
		/** @param {Record<string, any>} next */
		update(next) {
			const cellChanged = next.cell !== settings.cell;
			settings = { ...next };
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
			const contrast = settings.contrast;

			for (let i = 0, p = 0; i < luma.length; i++, p += 4) {
				const value = (pixels[p] * 0.2126 + pixels[p + 1] * 0.7152 + pixels[p + 2] * 0.0722) / 255;
				luma[i] = Math.min(1, Math.max(0, (value - 0.5) * contrast + 0.5));
			}

			const kernel =
				/** @type {Record<string, { divisor: number, taps: number[][] }>} */ (KERNELS)[
					settings.kernel
				] ?? KERNELS['floyd-steinberg'];
			const steps = Math.max(1, Math.round(settings.levels) - 1);
			const spread = settings.strength / kernel.divisor;

			for (let y = 0; y < h; y++) {
				// On a serpentine scan every other row runs right to left, which
				// stops the carried error from drifting consistently one way and
				// leaving diagonal streaks in flat areas.
				const reverse = settings.serpentine && y % 2 === 1;

				for (let n = 0; n < w; n++) {
					const x = reverse ? w - 1 - n : n;
					const i = y * w + x;

					const old = luma[i];
					const quantised = Math.round(Math.min(1, Math.max(0, old)) * steps) / steps;
					luma[i] = quantised;

					// The whole algorithm: whatever this pixel could not
					// represent is handed to neighbours that have not been
					// decided yet, so the error averages out over an area.
					const error = (old - quantised) * spread;
					if (error === 0) continue;

					for (const [dx, dy, weight] of kernel.taps) {
						const nx = x + (reverse ? -dx : dx);
						const ny = y + dy;
						if (nx < 0 || nx >= w || ny >= h) continue;
						luma[ny * w + nx] += error * weight;
					}
				}
			}

			for (let i = 0, p = 0; i < luma.length; i++, p += 4) {
				const out = Math.min(255, Math.max(0, luma[i] * 255));
				pixels[p] = out;
				pixels[p + 1] = out;
				pixels[p + 2] = out;
				pixels[p + 3] = 255;
			}

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
