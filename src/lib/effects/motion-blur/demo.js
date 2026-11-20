/**
 * Motion blur — raw WebGL2.
 *
 * Lifecycle: `create` on mount, `update` on parameter change, `frame` per tick,
 * `destroy` on unmount. In React that is useEffect(…, []) / useEffect(…, [params])
 * / a requestAnimationFrame loop started in that effect / the effect's cleanup.
 * In Svelte it is $effect, an $effect reading the params rune, the same loop,
 * and the effect's teardown return. On a plain page: call create once the canvas
 * is in the DOM, call update from an input listener, drive frame from
 * requestAnimationFrame, and call destroy on unload.
 *
 * A shader because this is accumulation blur: the scene is evaluated many times
 * inside one shutter interval and averaged. That is the honest version, and it
 * is only affordable if every sample costs a few instructions.
 */

import { createQuadProgram } from './gl.js';
import { fragmentShader } from './shader.js';

export const params = {
	scene: {
		type: 'select',
		label: 'Scene',
		group: 'Scene',
		options: ['wheel', 'sweep', 'orbit'],
		default: 'wheel'
	},
	speed: {
		type: 'range',
		label: 'Subject speed',
		group: 'Scene',
		min: 0,
		max: 8,
		step: 0.05,
		default: 2.4
	},
	shutter: {
		type: 'range',
		label: 'Shutter angle',
		group: 'Shutter',
		min: 0,
		max: 360,
		step: 1,
		default: 180,
		unit: '°',
		help: '180° is the film standard. 360° is a fully open shutter.'
	},
	fps: {
		type: 'range',
		label: 'Frame rate',
		group: 'Shutter',
		min: 8,
		max: 60,
		step: 1,
		default: 24,
		unit: 'fps',
		help: 'The shutter angle is a fraction of this interval, so both matter.'
	},
	samples: {
		type: 'range',
		label: 'Samples',
		group: 'Sampling',
		min: 1,
		max: 64,
		step: 1,
		default: 24,
		help: 'One sample is no blur. Too few and the blur breaks into ghosts.'
	},
	jitter: {
		type: 'range',
		label: 'Jitter',
		group: 'Sampling',
		min: 0,
		max: 1,
		step: 0.01,
		default: 0.6,
		help: 'Trades banding for noise. Drop the samples low and sweep this.'
	}
};

const SCENES = { wheel: 0, sweep: 1, orbit: 2 };

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
			gl.uniform1f(quad.uniform('uSpeed'), settings.speed);
			gl.uniform1f(
				quad.uniform('uScene'),
				/** @type {Record<string, number>} */ (SCENES)[settings.scene] ?? 0
			);
			gl.uniform1f(quad.uniform('uShutter'), settings.shutter);
			gl.uniform1f(quad.uniform('uFps'), settings.fps);
			gl.uniform1f(quad.uniform('uSamples'), settings.samples);
			gl.uniform1f(quad.uniform('uJitter'), settings.jitter);
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
