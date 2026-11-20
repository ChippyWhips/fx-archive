/**
 * Moiré — raw WebGL2.
 *
 * Lifecycle: `create` on mount, `update` on parameter change, `frame` per tick,
 * `destroy` on unmount. In React that is useEffect(…, []) / useEffect(…, [params])
 * / a requestAnimationFrame loop started in that effect / the effect's cleanup.
 * In Svelte it is $effect, an $effect reading the params rune, the same loop,
 * and the effect's teardown return. On a plain page: call create once the canvas
 * is in the DOM, call update from an input listener, drive frame from
 * requestAnimationFrame, and call destroy on unload.
 *
 * A shader rather than 2D: moiré is an aliasing phenomenon, so the gratings
 * have to be sampled with a known, controlled filter width. Drawing lines with
 * a 2D context would produce the browser's moiré, not the one being studied.
 */

import { createQuadProgram } from './gl.js';
import { fragmentShader } from './shader.js';

export const params = {
	pattern: {
		type: 'select',
		label: 'Pattern',
		group: 'Layers',
		options: ['lines', 'concentric', 'dots'],
		default: 'lines'
	},
	frequency: {
		type: 'range',
		label: 'Frequency',
		group: 'Layers',
		min: 10,
		max: 200,
		step: 1,
		default: 44,
		help: 'Lines across the frame. The beat gets finer as this rises.'
	},
	ratio: {
		type: 'range',
		label: 'Second layer scale',
		group: 'Layers',
		min: 0.9,
		max: 1.1,
		step: 0.001,
		default: 1.0
	},
	angle: {
		type: 'range',
		label: 'Angle between layers',
		group: 'Layers',
		min: 0,
		max: 15,
		step: 0.1,
		default: 3.2,
		unit: '°'
	},
	duty: {
		type: 'range',
		label: 'Line weight',
		group: 'Grating',
		min: 0.1,
		max: 0.9,
		step: 0.01,
		default: 0.5
	},
	softness: {
		type: 'range',
		label: 'Edge softness',
		group: 'Grating',
		min: 0,
		max: 0.4,
		step: 0.01,
		default: 0.05
	},
	blend: {
		type: 'select',
		label: 'Combine',
		group: 'Grating',
		options: ['multiply', 'difference'],
		default: 'multiply'
	},
	drift: {
		type: 'range',
		label: 'Drift',
		group: 'Motion',
		min: 0,
		max: 1,
		step: 0.01,
		default: 0.15,
		help: 'Slides the second layer. Tiny movements produce large changes.'
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

	const PATTERNS = { lines: 0, concentric: 1, dots: 2 };

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
			gl.uniform1f(quad.uniform('uFrequency'), settings.frequency);
			gl.uniform1f(quad.uniform('uRatio'), settings.ratio);
			gl.uniform1f(quad.uniform('uAngle'), (settings.angle * Math.PI) / 180);
			gl.uniform1f(quad.uniform('uDuty'), settings.duty);
			gl.uniform1f(quad.uniform('uSoftness'), settings.softness);
			gl.uniform1f(quad.uniform('uDrift'), time * settings.drift);
			gl.uniform1f(
				quad.uniform('uPattern'),
				/** @type {Record<string, number>} */ (PATTERNS)[settings.pattern] ?? 0
			);
			gl.uniform1f(quad.uniform('uMix'), settings.blend === 'difference' ? 1 : 0);
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
