/**
 * Film grain — raw WebGL2.
 *
 * Lifecycle: `create` on mount, `update` on parameter change, `frame` per tick,
 * `destroy` on unmount. In React that is useEffect(…, []) / useEffect(…, [params])
 * / a requestAnimationFrame loop started in that effect / the effect's cleanup.
 * In Svelte it is $effect, an $effect reading the params rune, the same loop,
 * and the effect's teardown return. On a plain page: call create once the canvas
 * is in the DOM, call update from an input listener, drive frame from
 * requestAnimationFrame, and call destroy on unload.
 *
 * A shader because grain is per-pixel noise regenerated every frame, which is
 * the one thing a GPU does better than anything else.
 */

import { createQuadProgram } from './gl.js';
import { fragmentShader } from './shader.js';

export const params = {
	amount: {
		type: 'range',
		label: 'Amount',
		group: 'Grain',
		min: 0,
		max: 0.4,
		step: 0.005,
		default: 0.09
	},
	size: {
		type: 'range',
		label: 'Grain size',
		group: 'Grain',
		min: 1,
		max: 8,
		step: 0.5,
		default: 2,
		unit: 'px',
		help: 'In device pixels, so the grain stays the same on every display.'
	},
	response: {
		type: 'range',
		label: 'Midtone bias',
		group: 'Grain',
		min: 0,
		max: 1,
		step: 0.01,
		default: 0.8,
		help: 'How much more grain the midtones get than the blacks and whites.'
	},
	chroma: {
		type: 'range',
		label: 'Colour noise',
		group: 'Grain',
		min: 0,
		max: 1,
		step: 0.01,
		default: 0.15
	},
	frozen: {
		type: 'toggle',
		label: 'Freeze grain',
		group: 'Motion',
		default: false
	},
	exposure: {
		type: 'range',
		label: 'Exposure',
		group: 'Image',
		min: 0.4,
		max: 1.8,
		step: 0.02,
		default: 1
	}
};

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Record<string, any>} initialParams
 */
export function create(canvas, initialParams) {
	const gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
	if (!gl) throw new Error('WebGL2 is not available');

	const quad = createQuadProgram(gl, fragmentShader);
	let settings = { ...initialParams };

	return {
		/** @param {Record<string, any>} next */
		update(next) {
			settings = { ...next };
		},

		/** @param {number} time seconds, already scaled by the host's speed control */
		frame(time) {
			gl.viewport(0, 0, canvas.width, canvas.height);
			gl.useProgram(quad.program);
			gl.uniform2f(quad.uniform('uResolution'), canvas.width, canvas.height);
			gl.uniform1f(quad.uniform('uTime'), time);
			gl.uniform1f(quad.uniform('uAmount'), settings.amount);
			gl.uniform1f(quad.uniform('uSize'), settings.size);
			gl.uniform1f(quad.uniform('uResponse'), settings.response);
			gl.uniform1f(quad.uniform('uChroma'), settings.chroma);
			gl.uniform1f(quad.uniform('uStatic'), settings.frozen ? 1 : 0);
			gl.uniform1f(quad.uniform('uExposure'), settings.exposure);
			quad.draw();
		},

		/**
		 * @param {number} width device pixels
		 * @param {number} height device pixels
		 */
		resize(width, height) {
			gl.viewport(0, 0, width, height);
		},

		destroy() {
			quad.destroy();
		}
	};
}
