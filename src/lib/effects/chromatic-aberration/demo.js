/**
 * Chromatic aberration (RGB split) — raw WebGL2 fragment shader.
 *
 * Lifecycle: `create` on mount, `update` on parameter change, `frame` per tick,
 * `destroy` on unmount. In React that is useEffect(…, []) / useEffect(…, [params])
 * / a requestAnimationFrame loop started in that effect / the effect's cleanup.
 * In Svelte it is $effect, an $effect reading the params rune, the same loop,
 * and the effect's teardown return. On a plain page: call create once the canvas
 * is in the DOM, call update from an input listener, drive frame from
 * requestAnimationFrame, and call destroy on unload.
 *
 * Motion-dependent: the split widens with pointer speed, because a still frame
 * of this effect tells you almost nothing about it.
 */

import { createQuadProgram, createCanvasTexture } from './gl.js';
import { fragmentShader } from './shader.js';
import { drawSource } from './source.js';

export const params = {
	amount: {
		type: 'range',
		label: 'Split',
		group: 'Aberration',
		min: 0,
		max: 0.06,
		step: 0.001,
		default: 0.006
	},
	velocity: {
		type: 'range',
		label: 'Velocity response',
		group: 'Aberration',
		min: 0,
		max: 1,
		step: 0.01,
		default: 0.5,
		help: 'How far pointer speed widens the split. Move across the canvas to see it.'
	},
	falloff: {
		type: 'range',
		label: 'Edge falloff',
		group: 'Aberration',
		min: 0,
		max: 1,
		step: 0.01,
		default: 0.7
	},
	radial: {
		type: 'select',
		label: 'Direction',
		group: 'Aberration',
		options: ['horizontal', 'diagonal', 'radial'],
		default: 'radial'
	},
	barrel: {
		type: 'range',
		label: 'Barrel',
		group: 'Lens',
		min: -0.3,
		max: 0.3,
		step: 0.01,
		default: 0.06
	}
};

/** @type {Record<string, [number, number]>} */
const DIRECTIONS = {
	horizontal: [1, 0],
	diagonal: [0.7071, 0.7071],
	radial: [1, 0]
};

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Record<string, any>} initialParams
 */
export function create(canvas, initialParams) {
	const gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
	if (!gl) throw new Error('WebGL2 is not available');

	const quad = createQuadProgram(gl, fragmentShader);
	const texture = createCanvasTexture(gl);

	// The source is drawn on a 2D canvas and uploaded each frame. Keeping it in
	// 2D means the source and the effect stay separate and readable.
	const source = document.createElement('canvas');
	const sourceCtx = /** @type {CanvasRenderingContext2D} */ (
		source.getContext('2d', { alpha: false })
	);

	let settings = { ...initialParams };
	let smoothedSpeed = 0;

	return {
		/** @param {Record<string, any>} next */
		update(next) {
			settings = { ...next };
		},

		/**
		 * @param {number} time seconds, already scaled by the host's speed control
		 * @param {{ vx: number, vy: number }} pointer device pixels per second
		 */
		frame(time, pointer) {
			if (source.width !== canvas.width || source.height !== canvas.height) {
				source.width = canvas.width;
				source.height = canvas.height;
			}

			drawSource(sourceCtx, time);

			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);

			// Normalise pointer speed against the canvas size, so the response
			// feels the same on a phone and on a large display, then ease it so
			// the fringing swells and settles instead of snapping.
			const raw = Math.hypot(pointer.vx, pointer.vy) / Math.max(1, canvas.width);
			smoothedSpeed += (Math.min(raw, 3) - smoothedSpeed) * 0.12;

			gl.viewport(0, 0, canvas.width, canvas.height);
			gl.useProgram(quad.program);
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.uniform1i(quad.uniform('uSource'), 0);
			gl.uniform2f(quad.uniform('uResolution'), canvas.width, canvas.height);
			gl.uniform1f(quad.uniform('uAmount'), settings.amount);
			gl.uniform1f(quad.uniform('uFalloff'), settings.falloff);
			gl.uniform1f(quad.uniform('uBarrel'), settings.barrel);
			gl.uniform1f(quad.uniform('uVelocity'), smoothedSpeed * settings.velocity * 0.08);
			gl.uniform1f(quad.uniform('uRadial'), settings.radial === 'radial' ? 1 : 0);
			const [dx, dy] = DIRECTIONS[settings.radial] ?? DIRECTIONS.horizontal;
			gl.uniform2f(quad.uniform('uDirection'), dx, dy);

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
			gl.deleteTexture(texture);
			source.width = 0;
			source.height = 0;
		}
	};
}
