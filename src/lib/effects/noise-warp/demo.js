/**
 * Noise warp — raw WebGL2.
 *
 * Lifecycle: `create` on mount, `update` on parameter change, `frame` per tick,
 * `destroy` on unmount. In React that is useEffect(…, []) / useEffect(…, [params])
 * / a requestAnimationFrame loop started in that effect / the effect's cleanup.
 * In Svelte it is $effect, an $effect reading the params rune, the same loop,
 * and the effect's teardown return. On a plain page: call create once the canvas
 * is in the DOM, call update from an input listener, drive frame from
 * requestAnimationFrame, and call destroy on unload.
 *
 * A shader because every pixel evaluates several octaves of noise, twice, and
 * then reads the source from somewhere else. That is a gather, and 2D cannot
 * gather.
 */

import { createQuadProgram, createCanvasTexture } from './gl.js';
import { fragmentShader } from './shader.js';
import { drawSource } from './source.js';

export const params = {
	source: {
		type: 'select',
		label: 'Source',
		group: 'Source',
		options: ['stripes', 'grid', 'type'],
		default: 'stripes'
	},
	view: {
		type: 'select',
		label: 'View',
		group: 'Source',
		options: ['warped', 'field', 'source'],
		default: 'warped',
		help: 'Field shows the displacement itself, as colour.'
	},
	amount: {
		type: 'range',
		label: 'Amount',
		group: 'Warp',
		min: 0,
		max: 0.8,
		step: 0.005,
		default: 0.35,
		help: 'How far a pixel can be pushed, as a share of the frame.'
	},
	scale: {
		type: 'range',
		label: 'Scale',
		group: 'Warp',
		min: 0.3,
		max: 8,
		step: 0.1,
		default: 1.2,
		help: 'Noise features across the frame. Low is liquid, high is crumpled.'
	},
	recursion: {
		type: 'toggle',
		label: 'Warp the warp',
		group: 'Warp',
		default: true,
		help: 'Feeds the field back into itself, which is where marbling comes from.'
	},
	octaves: {
		type: 'range',
		label: 'Octaves',
		group: 'Noise',
		min: 1,
		max: 6,
		step: 1,
		default: 3,
		help: 'Layers of finer detail. One is smooth, six is ragged.'
	},
	evolve: {
		type: 'range',
		label: 'Evolve',
		group: 'Motion',
		min: 0,
		max: 1,
		step: 0.01,
		default: 0.12,
		help: 'Moves the noise through time, so the field boils rather than slides.'
	}
};

const VIEWS = { warped: 0, field: 1, source: 2 };

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Record<string, any>} initialParams
 */
export function create(canvas, initialParams) {
	const gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
	if (!gl) throw new Error('WebGL2 is not available');

	const quad = createQuadProgram(gl, fragmentShader);
	const texture = createCanvasTexture(gl);
	// Mirrored repeat, so a big push reads more source rather than a smeared edge.
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);

	const source = document.createElement('canvas');
	const sourceCtx = /** @type {CanvasRenderingContext2D} */ (
		source.getContext('2d', { alpha: false })
	);

	let settings = { ...initialParams };

	return {
		/** @param {Record<string, any>} next */
		update(next) {
			settings = { ...next };
		},

		/** @param {number} time seconds, already scaled by the host's speed control */
		frame(time) {
			if (source.width !== canvas.width || source.height !== canvas.height) {
				source.width = canvas.width;
				source.height = canvas.height;
			}

			drawSource(sourceCtx, time, settings.source);

			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);

			gl.viewport(0, 0, canvas.width, canvas.height);
			gl.useProgram(quad.program);
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.uniform1i(quad.uniform('uSource'), 0);
			gl.uniform2f(quad.uniform('uResolution'), canvas.width, canvas.height);
			gl.uniform1f(quad.uniform('uTime'), time * settings.evolve);
			gl.uniform1f(quad.uniform('uScale'), settings.scale);
			gl.uniform1f(quad.uniform('uAmount'), settings.amount);
			gl.uniform1f(quad.uniform('uOctaves'), settings.octaves);
			gl.uniform1f(quad.uniform('uRecursion'), settings.recursion ? 2 : 1);
			gl.uniform1f(
				quad.uniform('uView'),
				/** @type {Record<string, number>} */ (VIEWS)[settings.view] ?? 0
			);
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
