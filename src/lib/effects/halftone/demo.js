/**
 * Halftone — raw WebGL2.
 *
 * Lifecycle: `create` on mount, `update` on parameter change, `frame` per tick,
 * `destroy` on unmount. In React that is useEffect(…, []) / useEffect(…, [params])
 * / a requestAnimationFrame loop started in that effect / the effect's cleanup.
 * In Svelte it is $effect, an $effect reading the params rune, the same loop,
 * and the effect's teardown return. On a plain page: call create once the canvas
 * is in the DOM, call update from an input listener, drive frame from
 * requestAnimationFrame, and call destroy on unload.
 *
 * A shader because the mark edges have to be filtered against the pixel grid.
 * Drawing real dots in 2D gives you the browser's antialiasing, and at print
 * frequencies that is indistinguishable from a bug.
 */

import { createQuadProgram, createCanvasTexture } from './gl.js';
import { fragmentShader } from './shader.js';
import { drawSource } from './source.js';

export const params = {
	source: {
		type: 'select',
		label: 'Source',
		group: 'Source',
		options: ['type', 'tone', 'colour'],
		default: 'tone'
	},
	mode: {
		type: 'select',
		label: 'Screens',
		group: 'Source',
		options: ['single ink', 'cmyk'],
		default: 'single ink'
	},
	frequency: {
		type: 'range',
		label: 'Screen frequency',
		group: 'Screen',
		min: 12,
		max: 140,
		step: 1,
		default: 46,
		help: 'Cells across the frame. The print equivalent is lines per inch.'
	},
	angle: {
		type: 'range',
		label: 'Screen angle',
		group: 'Screen',
		min: 0,
		max: 90,
		step: 0.5,
		default: 45,
		unit: '°',
		help: 'In cmyk this rotates all four screens together, keeping their offsets.'
	},
	shape: {
		type: 'select',
		label: 'Mark',
		group: 'Screen',
		options: ['dot', 'square', 'line'],
		default: 'dot'
	},
	sharp: {
		type: 'range',
		label: 'Edge hardness',
		group: 'Screen',
		min: 0,
		max: 1,
		step: 0.01,
		default: 0.5
	},
	ink: { type: 'colour', label: 'Ink', group: 'Colour', default: '#141414' },
	paper: { type: 'colour', label: 'Paper', group: 'Colour', default: '#f2efe6' }
};

const SHAPES = { dot: 0, square: 1, line: 2 };

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

			gl.viewport(0, 0, canvas.width, canvas.height);
			gl.useProgram(quad.program);
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.uniform1i(quad.uniform('uSource'), 0);
			gl.uniform2f(quad.uniform('uResolution'), canvas.width, canvas.height);
			gl.uniform1f(quad.uniform('uFrequency'), settings.frequency);
			gl.uniform1f(quad.uniform('uAngle'), settings.angle);
			gl.uniform1f(
				quad.uniform('uShape'),
				/** @type {Record<string, number>} */ (SHAPES)[settings.shape] ?? 0
			);
			gl.uniform1f(quad.uniform('uMode'), settings.mode === 'cmyk' ? 1 : 0);
			gl.uniform1f(quad.uniform('uSharp'), settings.sharp);
			gl.uniform3f(quad.uniform('uInk'), ...toRgb(settings.ink));
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
