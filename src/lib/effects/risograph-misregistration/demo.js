/**
 * Risograph misregistration — raw WebGL2.
 *
 * Lifecycle: `create` on mount, `update` on parameter change, `frame` per tick,
 * `destroy` on unmount. In React that is useEffect(…, []) / useEffect(…, [params])
 * / a requestAnimationFrame loop started in that effect / the effect's cleanup.
 * In Svelte it is $effect, an $effect reading the params rune, the same loop,
 * and the effect's teardown return. On a plain page: call create once the canvas
 * is in the DOM, call update from an input listener, drive frame from
 * requestAnimationFrame, and call destroy on unload.
 *
 * A shader because every drum needs its own transform, grain and blotching per
 * pixel, and three of those a frame is cheap on the GPU and slow anywhere else.
 */

import { createQuadProgram, createCanvasTexture } from './gl.js';
import { fragmentShader } from './shader.js';
import { drawSource } from './source.js';

export const params = {
	source: {
		type: 'select',
		label: 'Source',
		group: 'Source',
		options: ['poster', 'type', 'tone'],
		default: 'poster'
	},
	drums: {
		type: 'select',
		label: 'Drums',
		group: 'Source',
		options: ['two', 'three'],
		default: 'three'
	},
	offset: {
		type: 'range',
		label: 'Misregistration',
		group: 'Registration',
		min: 0,
		max: 0.03,
		step: 0.0005,
		default: 0.009,
		help: 'Largest shift per drum, as a fraction of the sheet.'
	},
	skew: {
		type: 'range',
		label: 'Skew',
		group: 'Registration',
		min: 0,
		max: 2,
		step: 0.05,
		default: 0.4,
		unit: '°'
	},
	rate: {
		type: 'range',
		label: 'Sheets per second',
		group: 'Registration',
		min: 0,
		max: 8,
		step: 0.5,
		default: 2,
		help: 'Zero holds a single print.'
	},
	grain: {
		type: 'range',
		label: 'Grain',
		group: 'Ink',
		min: 0,
		max: 1,
		step: 0.01,
		default: 0.6
	},
	uneven: {
		type: 'range',
		label: 'Ink unevenness',
		group: 'Ink',
		min: 0,
		max: 1,
		step: 0.01,
		default: 0.4
	},
	ink0: { type: 'colour', label: 'Drum one', group: 'Ink', default: '#ff48b0' },
	ink1: { type: 'colour', label: 'Drum two', group: 'Ink', default: '#0078bf' },
	ink2: { type: 'colour', label: 'Drum three', group: 'Ink', default: '#ffe800' },
	paper: { type: 'colour', label: 'Paper', group: 'Ink', default: '#f4f0e6' }
};

/**
 * @param {string} hex
 * @returns {[number, number, number]}
 */
function toRgb(hex) {
	const value = parseInt(hex.replace('#', ''), 16);
	return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

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

			// A new sheet comes off the machine at this rate, each with its own
			// random registration. The artwork underneath keeps moving regardless.
			const sheet = settings.rate > 0 ? Math.floor(time * settings.rate) : 0;

			gl.viewport(0, 0, canvas.width, canvas.height);
			gl.useProgram(quad.program);
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.uniform1i(quad.uniform('uSource'), 0);
			gl.uniform2f(quad.uniform('uResolution'), canvas.width, canvas.height);
			gl.uniform1f(quad.uniform('uSheet'), sheet);
			gl.uniform1f(quad.uniform('uDrums'), settings.drums === 'two' ? 2 : 3);
			gl.uniform1f(quad.uniform('uOffset'), settings.offset);
			gl.uniform1f(quad.uniform('uSkew'), settings.skew);
			gl.uniform1f(quad.uniform('uGrain'), settings.grain);
			gl.uniform1f(quad.uniform('uUneven'), settings.uneven);
			gl.uniform3f(quad.uniform('uInk0'), ...toRgb(settings.ink0));
			gl.uniform3f(quad.uniform('uInk1'), ...toRgb(settings.ink1));
			gl.uniform3f(quad.uniform('uInk2'), ...toRgb(settings.ink2));
			gl.uniform3f(quad.uniform('uPaper'), ...toRgb(settings.paper));
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
