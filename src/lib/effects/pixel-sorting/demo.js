/**
 * Pixel sorting — Canvas 2D.
 *
 * Lifecycle: `create` on mount, `update` on parameter change, `frame` per tick,
 * `destroy` on unmount. In React that is useEffect(…, []) / useEffect(…, [params])
 * / a requestAnimationFrame loop started in that effect / the effect's cleanup.
 * In Svelte it is $effect, an $effect reading the params rune, the same loop,
 * and the effect's teardown return. On a plain page: call create once the canvas
 * is in the DOM, call update from an input listener, drive frame from
 * requestAnimationFrame, and call destroy on unload.
 *
 * Canvas 2D because sorting is a sequential, per-line operation: a shader sees
 * one pixel at a time and cannot sort a run without many passes.
 */

import { drawSource } from './source.js';

export const params = {
	source: {
		type: 'select',
		label: 'Source',
		group: 'Source',
		options: ['landscape', 'type', 'shapes'],
		default: 'landscape'
	},
	interval: {
		type: 'select',
		label: 'Interval',
		group: 'Interval',
		options: ['brightness', 'edges', 'whole line'],
		default: 'brightness',
		help: 'What decides where a sorted run starts and stops.'
	},
	lower: {
		type: 'range',
		label: 'Lower threshold',
		group: 'Interval',
		min: 0,
		max: 1,
		step: 0.01,
		default: 0.25,
		help: 'In edges mode, the contrast step that ends a run.'
	},
	upper: {
		type: 'range',
		label: 'Upper threshold',
		group: 'Interval',
		min: 0,
		max: 1,
		step: 0.01,
		default: 1
	},
	limit: {
		type: 'range',
		label: 'Run limit',
		group: 'Interval',
		min: 0.02,
		max: 1,
		step: 0.01,
		default: 1,
		help: 'Longest run, as a fraction of the line.'
	},
	mask: { type: 'toggle', label: 'Show the mask', group: 'Interval', default: false },
	key: {
		type: 'select',
		label: 'Sort by',
		group: 'Sort',
		options: ['brightness', 'hue', 'saturation'],
		default: 'brightness'
	},
	direction: {
		type: 'select',
		label: 'Direction',
		group: 'Sort',
		options: ['horizontal', 'vertical'],
		default: 'horizontal'
	},
	reverse: { type: 'toggle', label: 'Reverse the order', group: 'Sort', default: false }
};

/** Working width cap: sorting is CPU work, so the image is sorted at this size and scaled up. */
const MAX_WORK = 720;
const SHIFT = 4294967296;

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Record<string, any>} initialParams
 */
export function create(canvas, initialParams) {
	const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d', { alpha: false }));

	const work = document.createElement('canvas');
	const workCtx = /** @type {CanvasRenderingContext2D} */ (
		work.getContext('2d', { alpha: false, willReadFrequently: true })
	);

	let settings = { ...initialParams };
	let luma = new Uint8Array(0);
	let keys = new Uint8Array(0);
	let run = new Float64Array(0);

	function sizeWork() {
		const scale = Math.min(1, MAX_WORK / Math.max(1, canvas.width));
		work.width = Math.max(1, Math.round(canvas.width * scale));
		work.height = Math.max(1, Math.round(canvas.height * scale));
		const n = work.width * work.height;
		luma = new Uint8Array(n);
		keys = new Uint8Array(n);
		run = new Float64Array(Math.max(work.width, work.height));
	}

	sizeWork();

	/**
	 * Packs key and colour into one number so a native numeric sort moves both together.
	 * @param {Uint32Array} pixels
	 * @param {number} start
	 * @param {number} stride
	 * @param {number} length
	 */
	function sortRun(pixels, start, stride, length) {
		if (length < 2) return;
		const slice = run.subarray(0, length);
		for (let k = 0; k < length; k++) {
			const i = start + k * stride;
			slice[k] = keys[i] * SHIFT + pixels[i];
		}
		slice.sort();
		for (let k = 0; k < length; k++) {
			const value = slice[settings.reverse ? length - 1 - k : k];
			pixels[start + k * stride] = value - Math.floor(value / SHIFT) * SHIFT;
		}
	}

	/**
	 * @param {Uint8ClampedArray} data
	 * @param {number} n
	 */
	function measure(data, n) {
		for (let i = 0; i < n; i++) {
			const r = data[i * 4];
			const g = data[i * 4 + 1];
			const b = data[i * 4 + 2];
			const l = (r * 77 + g * 150 + b * 29) >> 8;
			luma[i] = l;
			if (settings.key === 'brightness') {
				keys[i] = l;
				continue;
			}
			const max = Math.max(r, g, b);
			const chroma = max - Math.min(r, g, b);
			if (settings.key === 'saturation') {
				keys[i] = max === 0 ? 0 : Math.round((chroma / max) * 255);
				continue;
			}
			let hue = 0;
			if (chroma > 0) {
				if (max === r) hue = ((g - b) / chroma + 6) % 6;
				else if (max === g) hue = (b - r) / chroma + 2;
				else hue = (r - g) / chroma + 4;
			}
			keys[i] = Math.round((hue / 6) * 255);
		}
	}

	return {
		/** @param {Record<string, any>} next */
		update(next) {
			settings = { ...next };
		},

		/** @param {number} time seconds, already scaled by the host's speed control */
		frame(time) {
			drawSource(workCtx, time, settings.source);

			const w = work.width;
			const h = work.height;
			const image = workCtx.getImageData(0, 0, w, h);
			const pixels = new Uint32Array(image.data.buffer);
			measure(image.data, w * h);

			const vertical = settings.direction === 'vertical';
			const lines = vertical ? w : h;
			const length = vertical ? h : w;
			const stride = vertical ? w : 1;
			const maxRun = Math.max(2, Math.round(settings.limit * length));
			const low = settings.lower * 255;
			const high = settings.upper * 255;

			for (let line = 0; line < lines; line++) {
				const first = vertical ? line : line * w;
				let runStart = -1;

				for (let k = 0; k <= length; k++) {
					const i = first + k * stride;
					let inside = k < length;
					let breaks = false;

					// The interval mask is the whole art direction: only pixels inside a run move.
					if (inside && settings.interval === 'brightness') {
						inside = luma[i] >= low && luma[i] <= high;
					} else if (inside && settings.interval === 'edges' && k > 0) {
						breaks = Math.abs(luma[i] - luma[i - stride]) > low;
					}

					if (settings.mask && k < length) {
						pixels[i] = inside && !breaks ? 0xffffffff : 0xff000000;
						continue;
					}

					if (runStart >= 0 && (!inside || breaks || k - runStart >= maxRun)) {
						sortRun(pixels, first + runStart * stride, stride, k - runStart);
						runStart = -1;
					}
					if (inside && runStart < 0) runStart = k;
				}
			}

			workCtx.putImageData(image, 0, 0);
			ctx.imageSmoothingEnabled = false;
			ctx.drawImage(work, 0, 0, canvas.width, canvas.height);
		},

		resize() {
			sizeWork();
		},

		destroy() {
			work.width = 0;
			work.height = 0;
		}
	};
}
