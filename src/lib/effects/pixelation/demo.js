/**
 * Pixelation — Canvas 2D.
 *
 * Lifecycle: `create` on mount, `update` on parameter change, `frame` per tick,
 * `destroy` on unmount. In React that is useEffect(…, []) / useEffect(…, [params])
 * / a requestAnimationFrame loop started in that effect / the effect's cleanup.
 * In Svelte it is $effect, an $effect reading the params rune, the same loop,
 * and the effect's teardown return. On a plain page: call create once the canvas
 * is in the DOM, call update from an input listener, drive frame from
 * requestAnimationFrame, and call destroy on unload.
 *
 * Canvas 2D on purpose: the whole effect is one downscale and one upscale with
 * smoothing off, and that is clearer as six lines of 2D than as a shader.
 */

import { drawSource } from './source.js';

export const params = {
	source: {
		type: 'select',
		label: 'Source',
		group: 'Source',
		options: ['type', 'portrait', 'shapes'],
		default: 'type'
	},
	cell: {
		type: 'range',
		label: 'Cell size',
		group: 'Grid',
		min: 2,
		max: 64,
		step: 1,
		default: 18,
		unit: 'px'
	},
	aspect: {
		type: 'range',
		label: 'Cell aspect',
		group: 'Grid',
		min: 0.4,
		max: 2.5,
		step: 0.05,
		default: 1,
		help: 'Below 1 the cells are tall, above 1 they are wide.'
	},
	shape: {
		type: 'select',
		label: 'Cell shape',
		group: 'Grid',
		options: ['square', 'circle', 'diamond'],
		default: 'square'
	},
	gap: {
		type: 'range',
		label: 'Gap',
		group: 'Grid',
		min: 0,
		max: 0.5,
		step: 0.01,
		default: 0,
		help: 'Space between cells, as a fraction of the cell.'
	},
	smoothing: {
		type: 'toggle',
		label: 'Smooth the upscale',
		group: 'Grid',
		default: false
	}
};

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Record<string, any>} initialParams
 */
export function create(canvas, initialParams) {
	const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d', { alpha: false }));

	// The source is drawn at the grid's own resolution: one source pixel per
	// cell. Sampling down first is what makes the cell an average of its area
	// rather than a single point sample, which is where aliasing comes from.
	const source = document.createElement('canvas');
	const sourceCtx = /** @type {CanvasRenderingContext2D} */ (
		source.getContext('2d', { alpha: false, willReadFrequently: true })
	);

	let settings = { ...initialParams };

	function sizeSource() {
		const cell = Math.max(2, Math.round(settings.cell));
		const cellWidth = Math.max(1, cell * settings.aspect);
		source.width = Math.max(1, Math.ceil(canvas.width / cellWidth));
		source.height = Math.max(1, Math.ceil(canvas.height / cell));
	}

	sizeSource();

	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {number} w
	 * @param {number} h
	 */
	function cellPath(x, y, w, h) {
		if (settings.shape === 'circle') {
			ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
			return;
		}
		if (settings.shape === 'diamond') {
			ctx.moveTo(x + w / 2, y);
			ctx.lineTo(x + w, y + h / 2);
			ctx.lineTo(x + w / 2, y + h);
			ctx.lineTo(x, y + h / 2);
			ctx.closePath();
			return;
		}
		ctx.rect(x, y, w, h);
	}

	return {
		/** @param {Record<string, any>} next */
		update(next) {
			const regrid = next.cell !== settings.cell || next.aspect !== settings.aspect;
			settings = { ...next };
			if (regrid) sizeSource();
		},

		/** @param {number} time seconds, already scaled by the host's speed control */
		frame(time) {
			const w = source.width;
			const h = source.height;
			if (w === 0 || h === 0) return;

			drawSource(sourceCtx, time, settings.source);

			// The plain case is the whole effect: draw the small image back at
			// full size with smoothing off, so each source pixel becomes a cell.
			if (settings.shape === 'square' && settings.gap === 0) {
				ctx.imageSmoothingEnabled = settings.smoothing;
				ctx.drawImage(source, 0, 0, w, h, 0, 0, canvas.width, canvas.height);
				return;
			}

			// Anything other than a flush square grid has to be drawn cell by
			// cell, because a single drawImage can only ever make rectangles.
			const pixels = sourceCtx.getImageData(0, 0, w, h).data;
			const cw = canvas.width / w;
			const ch = canvas.height / h;
			const inset = settings.gap * 0.5;

			ctx.fillStyle = '#101010';
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			for (let y = 0; y < h; y++) {
				for (let x = 0; x < w; x++) {
					const i = (y * w + x) * 4;
					ctx.fillStyle = `rgb(${pixels[i]} ${pixels[i + 1]} ${pixels[i + 2]})`;
					ctx.beginPath();
					cellPath(
						(x + inset) * cw,
						(y + inset) * ch,
						cw * (1 - settings.gap),
						ch * (1 - settings.gap)
					);
					ctx.fill();
				}
			}
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
