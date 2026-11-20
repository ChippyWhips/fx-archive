/**
 * Posterisation — Canvas 2D.
 *
 * Lifecycle: `create` on mount, `update` on parameter change, `frame` per tick,
 * `destroy` on unmount. In React that is useEffect(…, []) / useEffect(…, [params])
 * / a requestAnimationFrame loop started in that effect / the effect's cleanup.
 * In Svelte it is $effect, an $effect reading the params rune, the same loop,
 * and the effect's teardown return. On a plain page: call create once the canvas
 * is in the DOM, call update from an input listener, drive frame from
 * requestAnimationFrame, and call destroy on unload.
 *
 * Canvas 2D on purpose: the effect is one line of arithmetic per channel, and
 * the interesting part is where in the pipeline that line sits.
 */

import { drawSource } from './source.js';

export const params = {
	source: {
		type: 'select',
		label: 'Source',
		group: 'Source',
		options: ['tonal', 'colour', 'type'],
		default: 'tonal'
	},
	levels: {
		type: 'range',
		label: 'Levels',
		group: 'Quantisation',
		min: 2,
		max: 16,
		step: 1,
		default: 5
	},
	mode: {
		type: 'select',
		label: 'Applied to',
		group: 'Quantisation',
		options: ['each channel', 'luminance'],
		default: 'each channel'
	},
	gamma: {
		type: 'range',
		label: 'Gamma',
		group: 'Quantisation',
		min: 0.4,
		max: 2.5,
		step: 0.05,
		default: 1,
		help: 'Below 1 puts more bands in the shadows, above 1 in the highlights.'
	},
	edges: {
		type: 'toggle',
		label: 'Draw band edges',
		group: 'Output',
		default: false
	}
};

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Record<string, any>} initialParams
 */
export function create(canvas, initialParams) {
	const ctx = /** @type {CanvasRenderingContext2D} */ (
		canvas.getContext('2d', { alpha: false, willReadFrequently: true })
	);

	let settings = { ...initialParams };

	/** 256-entry lookup, rebuilt only when levels or gamma change. */
	let table = new Uint8ClampedArray(256);

	function buildTable() {
		const steps = Math.max(1, Math.round(settings.levels) - 1);
		const gamma = settings.gamma;
		for (let i = 0; i < 256; i++) {
			// Gamma first, quantise in that space, then undo it. Quantising in
			// linear light and in perceptual light put the bands in completely
			// different places, and this is the control for that choice.
			const value = Math.pow(i / 255, gamma);
			const quantised = Math.round(value * steps) / steps;
			table[i] = Math.pow(quantised, 1 / gamma) * 255;
		}
	}

	buildTable();

	return {
		/** @param {Record<string, any>} next */
		update(next) {
			const rebuild = next.levels !== settings.levels || next.gamma !== settings.gamma;
			settings = { ...next };
			if (rebuild) buildTable();
		},

		/** @param {number} time seconds, already scaled by the host's speed control */
		frame(time) {
			const w = canvas.width;
			const h = canvas.height;
			if (w === 0 || h === 0) return;

			drawSource(ctx, time, settings.source);

			const image = ctx.getImageData(0, 0, w, h);
			const pixels = image.data;
			const perChannel = settings.mode === 'each channel';

			for (let i = 0; i < pixels.length; i += 4) {
				if (perChannel) {
					// Each channel banded independently. Where two channels step
					// at different points you get the hue shifts along a band
					// edge that make posterisation look like screen print.
					pixels[i] = table[pixels[i]];
					pixels[i + 1] = table[pixels[i + 1]];
					pixels[i + 2] = table[pixels[i + 2]];
				} else {
					// Band the brightness and keep the original hue, which holds
					// colour together at the cost of the edge artefacts.
					const luma = pixels[i] * 0.2126 + pixels[i + 1] * 0.7152 + pixels[i + 2] * 0.0722;
					const scale = luma > 0 ? table[Math.round(luma)] / luma : 0;
					pixels[i] *= scale;
					pixels[i + 1] *= scale;
					pixels[i + 2] *= scale;
				}
			}

			if (settings.edges) {
				drawEdges(pixels, w, h);
			}

			ctx.putImageData(image, 0, 0);
		},

		destroy() {}
	};
}

/**
 * Marks every pixel whose left or upper neighbour landed in a different band.
 * Those contours are the shape the quantisation actually produced, and they
 * are the part that gets traced when this becomes a screen print.
 *
 * @param {Uint8ClampedArray} pixels
 * @param {number} w
 * @param {number} h
 */
function drawEdges(pixels, w, h) {
	const copy = pixels.slice();
	for (let y = 1; y < h; y++) {
		for (let x = 1; x < w; x++) {
			const i = (y * w + x) * 4;
			const left = i - 4;
			const up = i - w * 4;
			const changed =
				copy[i] !== copy[left] ||
				copy[i + 1] !== copy[left + 1] ||
				copy[i + 2] !== copy[left + 2] ||
				copy[i] !== copy[up] ||
				copy[i + 1] !== copy[up + 1] ||
				copy[i + 2] !== copy[up + 2];
			if (!changed) continue;
			pixels[i] = 255;
			pixels[i + 1] = 255;
			pixels[i + 2] = 255;
		}
	}
}
