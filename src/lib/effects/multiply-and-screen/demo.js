/**
 * Multiply and screen — Canvas 2D.
 *
 * Lifecycle: `create` on mount, `update` on parameter change, `frame` per tick,
 * `destroy` on unmount. In React that is useEffect(…, []) / useEffect(…, [params])
 * / a requestAnimationFrame loop started in that effect / the effect's cleanup.
 * In Svelte it is $effect, an $effect reading the params rune, the same loop,
 * and the effect's teardown return. On a plain page: call create once the canvas
 * is in the DOM, call update from an input listener, drive frame from
 * requestAnimationFrame, and call destroy on unload.
 *
 * Canvas 2D because the browser already implements these modes, to the same
 * specification Photoshop and CSS use. Reimplementing them in a shader would
 * teach the arithmetic but hide the fact that the platform ships it.
 */

import { drawBase, drawBlend } from './layers.js';

export const params = {
	mode: {
		type: 'select',
		label: 'Blend mode',
		group: 'Composite',
		options: [
			'multiply',
			'screen',
			'overlay',
			'hard-light',
			'soft-light',
			'darken',
			'lighten',
			'color-dodge',
			'color-burn',
			'source-over'
		],
		default: 'multiply'
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
	swap: {
		type: 'toggle',
		label: 'Swap the layers',
		group: 'Composite',
		default: false,
		help: 'Multiply and screen are commutative. Overlay and the dodges are not.'
	},
	base: {
		type: 'select',
		label: 'Bottom layer',
		group: 'Layers',
		options: ['tone', 'type', 'stripes'],
		default: 'tone'
	},
	blend: {
		type: 'select',
		label: 'Top layer',
		group: 'Layers',
		options: ['discs', 'grey ramp', 'flat ink'],
		default: 'discs'
	},
	ink: { type: 'colour', label: 'Flat ink', group: 'Layers', default: '#e5243b' },
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

		/** @param {number} time seconds, already scaled by the host's speed control */
		frame(time) {
			sizeLayers();
			drawBase(bottomCtx, time, settings.base);
			drawBlend(topCtx, time, settings.blend, settings.ink);

			// Swapping is a draw-order change, nothing more. Which layer is the
			// backdrop and which is the source is the whole asymmetry in modes
			// like overlay, where the backdrop decides what the source does.
			const under = settings.swap ? top : bottom;
			const over = settings.swap ? bottom : top;

			ctx.globalCompositeOperation = 'source-over';
			ctx.globalAlpha = 1;

			if (settings.show === 'bottom only') {
				ctx.drawImage(under, 0, 0);
				return;
			}
			if (settings.show === 'top only') {
				ctx.drawImage(over, 0, 0);
				return;
			}

			ctx.drawImage(under, 0, 0);
			ctx.globalCompositeOperation = settings.mode;
			ctx.globalAlpha = settings.opacity;
			ctx.drawImage(over, 0, 0);
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
