/**
 * Raymarched metaballs — raw WebGL2.
 *
 * Lifecycle: `create` on mount, `update` on parameter change, `frame` per tick,
 * `destroy` on unmount. In React that is useEffect(…, []) / useEffect(…, [params])
 * / a requestAnimationFrame loop started in that effect / the effect's cleanup.
 * In Svelte it is $effect, an $effect reading the params rune, the same loop,
 * and the effect's teardown return. On a plain page: call create once the canvas
 * is in the DOM, call update from an input listener, drive frame from
 * requestAnimationFrame, and call destroy on unload.
 *
 * No three.js here on purpose: there is no geometry to manage. The whole scene
 * is one distance function, so the entire renderer is a fragment shader on a
 * single triangle.
 */

import { createQuadProgram } from './gl.js';
import { fragmentShader } from './shader.js';

export const params = {
	count: {
		type: 'range',
		label: 'Blobs',
		group: 'Field',
		min: 2,
		max: 8,
		step: 1,
		default: 6
	},
	radius: {
		type: 'range',
		label: 'Radius',
		group: 'Field',
		min: 0.2,
		max: 1.1,
		step: 0.01,
		default: 0.58
	},
	blend: {
		type: 'range',
		label: 'Blend',
		group: 'Field',
		min: 0.01,
		max: 1.4,
		step: 0.01,
		default: 0.6,
		help: 'The width over which two surfaces merge. This is the effect.'
	},
	spread: {
		type: 'range',
		label: 'Spread',
		group: 'Field',
		min: 0.4,
		max: 1.8,
		step: 0.01,
		default: 0.95
	},
	speed: {
		type: 'range',
		label: 'Orbit speed',
		group: 'Motion',
		min: 0,
		max: 2,
		step: 0.01,
		default: 0.6
	},
	follow: {
		type: 'toggle',
		label: 'First blob follows pointer',
		group: 'Motion',
		default: true
	},
	shine: {
		type: 'range',
		label: 'Specular',
		group: 'Surface',
		min: 0,
		max: 1.5,
		step: 0.01,
		default: 0.6
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
	let pointerX = 0;
	let pointerY = 0;

	return {
		/** @param {Record<string, any>} next */
		update(next) {
			settings = { ...next };
		},

		/**
		 * @param {number} time seconds, already scaled by the host's speed control
		 * @param {{ x: number, y: number, inside: boolean }} pointer device pixels
		 */
		frame(time, pointer) {
			// Normalised to -1..1 with y flipped into GL's orientation, then
			// eased, so the blob trails the cursor instead of snapping to it.
			const targetX = pointer.inside ? (pointer.x / canvas.width) * 2 - 1 : 0;
			const targetY = pointer.inside ? 1 - (pointer.y / canvas.height) * 2 : 0;
			pointerX += (targetX - pointerX) * 0.08;
			pointerY += (targetY - pointerY) * 0.08;

			gl.viewport(0, 0, canvas.width, canvas.height);
			gl.useProgram(quad.program);
			gl.uniform2f(quad.uniform('uResolution'), canvas.width, canvas.height);
			gl.uniform1f(quad.uniform('uTime'), time);
			gl.uniform1f(quad.uniform('uCount'), Math.round(settings.count));
			gl.uniform1f(quad.uniform('uRadius'), settings.radius);
			gl.uniform1f(quad.uniform('uBlend'), settings.blend);
			gl.uniform1f(quad.uniform('uSpread'), settings.spread);
			gl.uniform1f(quad.uniform('uSpeed'), settings.speed);
			gl.uniform2f(quad.uniform('uPointer'), pointerX, pointerY);
			gl.uniform1f(quad.uniform('uFollow'), settings.follow ? 1 : 0);
			gl.uniform1f(quad.uniform('uShine'), settings.shine);
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
