/**
 * Difference and exclusion — Canvas 2D.
 *
 * Lifecycle: `create` on mount, `update` on parameter change, `frame` per tick,
 * `destroy` on unmount. In React that is useEffect(…, []) / useEffect(…, [params])
 * / a requestAnimationFrame loop started in that effect / the effect's cleanup.
 * In Svelte it is $effect, an $effect reading the params rune, the same loop,
 * and the effect's teardown return. On a plain page: call create once the canvas
 * is in the DOM, call update from an input listener, drive frame from
 * requestAnimationFrame, and call destroy on unload.
 *
 * Canvas 2D because the browser already implements both modes, to the same
 * specification as CSS `mix-blend-mode: difference` and the design tools.
 */

import { drawBase, drawBlend } from './layers.js';

export const params = {
	mode: {
		type: 'select',
		label: 'Blend mode',
		group: 'Composite',
		options: ['difference', 'exclusion', 'source-over'],
		default: 'difference'
	},
	opacity: {
		type: 'range',
		label: 'Top layer opacity',
		group: 'Composite',
		min: 0,
		max: 1,
		step: 0.01,
		default: 1
	},
	echo: {
		type: 'range',
		label: 'Self offset',
		group: 'Composite',
		min: 0,
		max: 0.1,
		step: 0.002,
		default: 0,
		help: 'Above zero, the top layer is the bottom layer shifted.'
	},
	base: {
		type: 'select',
		label: 'Bottom layer',
		group: 'Layers',
		options: ['stripes', 'type', 'tone'],
		default: 'stripes'
	},
	blend: {
		type: 'select',
		label: 'Top layer',
		group: 'Layers',
		options: ['discs', 'grey ramp', 'flat colour'],
		default: 'discs',
		help: 'Discs follow the pointer.'
	},
	colour: { type: 'colour', label: 'Flat colour', group: 'Layers', default: '#2fbfa6' },
	show: {
		type: 'select',
		label: 'Show',
		group: 'Layers',
		options: ['composite', 'bottom only', 'top only'],
		default: 'composite'
	}
};

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Record<string, any>} initialParams
 */
export function create(canvas, initialParams) {
	const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d', { alpha: false }));

	const bottom = document.createElement('canvas');
	const top = document.createElement('canvas');
	const bottomCtx = /** @type {CanvasRenderingContext2D} */ (
		bottom.getContext('2d', { alpha: false })
	);
	const topCtx = /** @type {CanvasRenderingContext2D} */ (top.getContext('2d', { alpha: false }));

	let settings = { ...initialParams };

	function sizeLayers() {
		for (const layer of [bottom, top]) {
			if (layer.width !== canvas.width || layer.height !== canvas.height) {
				layer.width = canvas.width;
				layer.height = canvas.height;
			}
		}
	}

	return {
		/** @param {Record<string, any>} next */
		update(next) {
			settings = { ...next };
		},

		/**
		 * @param {number} time seconds, already scaled by the host's speed control
		 * @param {{ x: number, y: number, inside: boolean }} pointer
		 */
		frame(time, pointer) {
			sizeLayers();
			drawBase(bottomCtx, time, settings.base);

			if (settings.echo > 0) {
				// The layer differenced against itself, shifted. Wherever the two
				// agree the result is black, so only the edges survive: the same
				// trick editors use to check two frames line up.
				const unit = Math.min(canvas.width, canvas.height);
				const angle = time * 0.6;
				topCtx.fillStyle = '#000000';
				topCtx.fillRect(0, 0, canvas.width, canvas.height);
				topCtx.drawImage(
					bottom,
					Math.cos(angle) * settings.echo * unit,
					Math.sin(angle) * settings.echo * unit
				);
			} else {
				const focus = pointer?.inside ? pointer : null;
				drawBlend(topCtx, time, settings.blend, settings.colour, focus);
			}

			ctx.globalCompositeOperation = 'source-over';
			ctx.globalAlpha = 1;

			if (settings.show === 'bottom only') {
				ctx.drawImage(bottom, 0, 0);
				return;
			}
			if (settings.show === 'top only') {
				ctx.drawImage(top, 0, 0);
				return;
			}

			ctx.drawImage(bottom, 0, 0);
			ctx.globalCompositeOperation = settings.mode;
			ctx.globalAlpha = settings.opacity;
			ctx.drawImage(top, 0, 0);
			ctx.globalCompositeOperation = 'source-over';
			ctx.globalAlpha = 1;
		},

		resize() {
			sizeLayers();
		},

		destroy() {
			for (const layer of [bottom, top]) {
				layer.width = 0;
				layer.height = 0;
			}
		}
	};
}
