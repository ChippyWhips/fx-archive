/**
 * Duotone — raw WebGL2.
 *
 * Lifecycle: `create` on mount, `update` on parameter change, `frame` per tick,
 * `destroy` on unmount. In React that is useEffect(…, []) / useEffect(…, [params])
 * / a requestAnimationFrame loop started in that effect / the effect's cleanup.
 * In Svelte it is $effect, an $effect reading the params rune, the same loop,
 * and the effect's teardown return. On a plain page: call create once the canvas
 * is in the DOM, call update from an input listener, drive frame from
 * requestAnimationFrame, and call destroy on unload.
 *
 * A shader because the effect is a per-pixel function of brightness and
 * nothing else. The same few lines work as an SVG filter or a CSS blend stack,
 * noted in the entry, but a shader shows every step.
 */

import { createQuadProgram, createCanvasTexture } from './gl.js';
import { fragmentShader } from './shader.js';
import { drawSource } from './source.js';

export const params = {
	source: {
		type: 'select',
		label: 'Source',
		group: 'Source',
		options: ['scene', 'type', 'colour'],
		default: 'scene'
	},
	mode: {
		type: 'select',
		label: 'Method',
		group: 'Mapping',
		options: ['gradient map', 'two inks'],
		default: 'gradient map'
	},
	contrast: {
		type: 'range',
		label: 'Contrast',
		group: 'Mapping',
		min: 0.5,
		max: 2.5,
		step: 0.05,
		default: 1.25
	},
	midpoint: {
		type: 'range',
		label: 'Midpoint',
		group: 'Mapping',
		min: 0.4,
		max: 2.5,
		step: 0.05,
		default: 1,
		help: 'Below 1 favours the highlight colour, above 1 the shadow.'
	},
	weight: {
		type: 'range',
		label: 'Colour ink weight',
		group: 'Mapping',
		min: 0,
		max: 1,
		step: 0.01,
		default: 0.85,
		help: 'Two inks only.'
	},
	shadow: { type: 'colour', label: 'Shadow', group: 'Colour', default: '#13294b' },
	highlight: { type: 'colour', label: 'Highlight', group: 'Colour', default: '#ff7a59' },
	paper: { type: 'colour', label: 'Paper', group: 'Colour', default: '#f6f2ea' }
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

			gl.viewport(0, 0, canvas.width, canvas.height);
			gl.useProgram(quad.program);
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.uniform1i(quad.uniform('uSource'), 0);
			gl.uniform1f(quad.uniform('uMode'), settings.mode === 'two inks' ? 1 : 0);
			gl.uniform1f(quad.uniform('uContrast'), settings.contrast);
			gl.uniform1f(quad.uniform('uMidpoint'), settings.midpoint);
			gl.uniform1f(quad.uniform('uWeight'), settings.weight);
			gl.uniform3f(quad.uniform('uShadow'), ...toRgb(settings.shadow));
			gl.uniform3f(quad.uniform('uHighlight'), ...toRgb(settings.highlight));
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
