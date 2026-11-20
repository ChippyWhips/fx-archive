/**
 * Fluted glass — raw WebGL2.
 *
 * Lifecycle: `create` on mount, `update` on parameter change, `frame` per tick,
 * `destroy` on unmount. In React that is useEffect(…, []) / useEffect(…, [params])
 * / a requestAnimationFrame loop started in that effect / the effect's cleanup.
 * In Svelte it is $effect, an $effect reading the params rune, the same loop,
 * and the effect's teardown return. On a plain page: call create once the canvas
 * is in the DOM, call update from an input listener, drive frame from
 * requestAnimationFrame, and call destroy on unload.
 *
 * A shader because every pixel reads the source from somewhere else, three
 * times, at three refractive indices. That is a gather, and 2D cannot gather.
 */

import { createQuadProgram, createCanvasTexture } from './gl.js';
import { fragmentShader } from './shader.js';
import { drawSource } from './source.js';

export const params = {
	source: {
		type: 'select',
		label: 'Behind the glass',
		group: 'Source',
		options: ['scene', 'grid', 'type'],
		default: 'scene'
	},
	orientation: {
		type: 'select',
		label: 'Flutes run',
		group: 'Glass',
		options: ['vertical', 'horizontal'],
		default: 'vertical'
	},
	count: {
		type: 'range',
		label: 'Flutes across',
		group: 'Glass',
		min: 3,
		max: 60,
		step: 1,
		default: 14
	},
	profile: {
		type: 'select',
		label: 'Profile',
		group: 'Glass',
		options: ['round', 'bevel', 'wave'],
		default: 'round'
	},
	ior: {
		type: 'range',
		label: 'Refractive index',
		group: 'Optics',
		min: 1,
		max: 2,
		step: 0.01,
		default: 1.46,
		help: 'Soda-lime glass is about 1.52. Water is 1.33.'
	},
	depth: {
		type: 'range',
		label: 'Glass thickness',
		group: 'Optics',
		min: 0,
		max: 0.3,
		step: 0.002,
		default: 0.13
	},
	dispersion: {
		type: 'range',
		label: 'Dispersion',
		group: 'Optics',
		min: 0,
		max: 1,
		step: 0.01,
		default: 0.3,
		help: 'Splits the three channels by refractive index, as real glass does.'
	},
	seam: {
		type: 'range',
		label: 'Seam darkness',
		group: 'Optics',
		min: 0,
		max: 1,
		step: 0.01,
		default: 0.45
	},
	pan: {
		type: 'range',
		label: 'Pan',
		group: 'Motion',
		min: 0,
		max: 1,
		step: 0.01,
		default: 0.15,
		help: 'Slides the glass across the scene, which is how it reads in motion.'
	}
};

const PROFILES = { round: 0, bevel: 1, wave: 2 };

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Record<string, any>} initialParams
 */
export function create(canvas, initialParams) {
	const gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
	if (!gl) throw new Error('WebGL2 is not available');

	const quad = createQuadProgram(gl, fragmentShader);
	const texture = createCanvasTexture(gl);

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
			gl.uniform1f(quad.uniform('uCount'), settings.count);
			gl.uniform1f(
				quad.uniform('uProfile'),
				/** @type {Record<string, number>} */ (PROFILES)[settings.profile] ?? 0
			);
			gl.uniform1f(quad.uniform('uIor'), settings.ior);
			gl.uniform1f(quad.uniform('uDepth'), settings.depth);
			gl.uniform1f(quad.uniform('uDispersion'), settings.dispersion);
			gl.uniform1f(quad.uniform('uSeam'), settings.seam);
			gl.uniform1f(quad.uniform('uVertical'), settings.orientation === 'vertical' ? 1 : 0);
			gl.uniform1f(quad.uniform('uPan'), time * settings.pan);
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
